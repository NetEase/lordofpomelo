(function() {
  var Protocol = window.Protocol;
  var Package = Protocol.Package;
  var Message = Protocol.Message;
  var EventEmitter = window.EventEmitter;

  if (typeof Object.create !== 'function') {
    Object.create = function (o) {
      function F() {}
      F.prototype = o;
      return new F();
    };
  }

  var root = window;
  var pomelo = Object.create(EventEmitter.prototype); // object extend from object
  root.pomelo = pomelo;
  var socket = null;
  var reqId = 0;
  var callbacks = {};
  var handlers = {};
  //Map from request id to route
  var routeMap = {};

  var heartbeatInterval = 5000;
  var heartbeatTimeout = heartbeatInterval * 2;
  var heartbeatId = null;
  var heartbeatTimeoutId = null;

  var handshakeBuffer = {
    'sys':{
      'version':'1.1.1',
      'heartbeat':1
    },
    'user':{
    }
  };

  var initCallback = null;

  pomelo.init = function(params, cb){
    pomelo.params = params;
    params.debug = true;
    initCallback = cb;
    var host = params.host;
    var port = params.port;

    var url = 'ws://' + host;
    if(port) {
      url +=  ':' + port;
    }

    if (!params.type) {
      console.log('init websocket');
      handshakeBuffer.user = params.user;
      this.initWebSocket(url,cb);
    }
  };

  pomelo.initWebSocket = function(url,cb){
    console.log(url);
    var onopen = function(event){
      console.log('[pomeloclient.init] websocket connected!');
      var obj = Package.encode(Package.TYPE_HANDSHAKE, Protocol.strencode(JSON.stringify(handshakeBuffer)));
      send(obj);
    };
    var onmessage = function(event) {
      processPackage(Package.decode(event.data), cb);
    };
    var onerror = function(event) {
      pomelo.emit('io-error', event);
      console.log('socket error %j ',event);
    };
    var onclose = function(event){
      pomelo.emit('close',event);
      console.log('socket close %j ',event);
    };
    socket = new WebSocket(url);
    socket.binaryType = 'arraybuffer';
    socket.onopen = onopen;
    socket.onmessage = onmessage;
    socket.onerror = onerror;
    socket.onclose = onclose;
  };

  pomelo.disconnect = function() {
    if(socket) {
      if(socket.disconnect) socket.disconnect();
      if(socket.close) socket.close();
      console.log('disconnect');
      socket = null;
      }

    if(heartbeatId) {
      clearTimeout(heartbeatId);
      heartbeatId = null;
    }
    if(heartbeatTimeoutId) {
      clearTimeout(heartbeatTimeoutId);
      heartbeatTimeoutId = null;
    }
  };

  pomelo.request = function(route, msg, cb) {
    msg = msg||{};
    route = route || msg.route;
    if(!route) {
      console.log('fail to send request without route.');
      return;
    }

    reqId++;
    sendMessage(reqId, route, msg);

    callbacks[reqId] = cb;
    routeMap[reqId] = route;
  };

  pomelo.notify = function(route, msg) {
    sendMessage(0, route, msg);
  };

  var sendMessage = function(reqId, route, msg) {
    var type = reqId ? Message.TYPE_REQUEST : Message.TYPE_NOTIFY;

    //compress message by protobuf
    var protos = !!pomelo.data.protos?pomelo.data.protos.client:{};
    if(!!protos[route]){
      msg = protobuf.encode(route, msg);
    }else{
      msg = Protocol.strencode(JSON.stringify(msg));
    }


    var compressRoute = 0;
    if(pomelo.dict && pomelo.dict[route]){
      route = pomelo.dict[route];
      compressRoute = 1;
    }

    msg = Message.encode(reqId, type, compressRoute, route, msg);
    var packet = Package.encode(Package.TYPE_DATA, msg);
    send(packet);
  };

  var send = function(packet){
    socket.send(packet.buffer);
  };


  var handler = {};

  var heartbeat = function(data) {
    var obj = Package.encode(Package.TYPE_HEARTBEAT);
    if(heartbeatTimeoutId) {
      clearTimeout(heartbeatTimeoutId);
      heartbeatTimeoutId = null;
    }

    if(heartbeatId) {
      // already in a heartbeat interval
      return;
    }

    heartbeatId = setTimeout(function() {
      heartbeatId = null;
      send(obj);

      heartbeatTimeoutId = setTimeout(function() {
        console.error('server heartbeat timeout');
        pomelo.emit('heartbeat timeout');
        pomelo.disconnect();
      }, heartbeatTimeout);
    }, heartbeatInterval);
  };

  var handshake = function(data){
    var obj = Package.encode(Package.TYPE_HANDSHAKE_ACK);
    data = JSON.parse(Protocol.strdecode(data));

    handshakeInit(data);

    send(obj);
    if(initCallback) {
      initCallback(socket);
      initCallback = null;
    }
  };

  var onData = function(data){
    //probuff decode
    //var msg = Protocol.strdecode(data);
    var msg = Message.decode(data);

    if(msg.id > 0){
      msg.route = routeMap[msg.id];
      delete routeMap[msg.id];
      if(!msg.route){
        return;
      }
    }

    msg.body = deCompose(msg);

    processMessage(pomelo, msg);
  };

  var onKick = function(data) {
    pomelo.emit('onKick');
  };

  handlers[Package.TYPE_HANDSHAKE] = handshake;
  handlers[Package.TYPE_HEARTBEAT] = heartbeat;
  handlers[Package.TYPE_DATA] = onData;
  handlers[Package.TYPE_KICK] = onKick;

  var processPackage = function(msg){
    handlers[msg.type](msg.body);
  };

  var processMessage = function(pomelo, msg) {
    if(!msg){
      console.error('error');
    }
    if(!msg.id) {
      // server push message
      pomelo.emit(msg.route, msg.body);
    }

    //if have a id then find the callback function with the request
    var cb = callbacks[msg.id];

    delete callbacks[msg.id];
    if(typeof cb !== 'function') {
      return;
    }

    cb(msg.body);
    return;
  };

  var processMessageBatch = function(pomelo, msgs) {
    for(var i=0, l=msgs.length; i<l; i++) {
      processMessage(pomelo, msgs[i]);
    }
  };

  var deCompose = function(msg){
    var protos = !!pomelo.data.protos?pomelo.data.protos.server:{};
    var abbrs = pomelo.data.abbrs;
    var route = msg.route;

    //Decompose route from dict
    if(msg.compressRoute) {
      if(!abbrs[route]){
        console.error('illigle msg!');
        return {};
      }

      route = msg.route = abbrs[route];
    }
    if(!!protos[route]){
      return protobuf.decode(route, msg.body);
    }else{
      return JSON.parse(Protocol.strdecode(msg.body));
    }

    return msg;
  };

  var setDict = function(dict) {
    if(!dict){
      return;
    }

    pomelo.dict = dict;
    pomelo.abbrs = {};

    for(var route in dict){
      pomelo.abbrs[dict[route]] = route;
    }
  };

  var initProtos = function(protos){
    if(!protos){return;}

    pomelo.protos = {
      server : protos.server || {},
      client : protos.client || {}
    },

    protobuf.init({encoderProtos: protos.client, decoderProtos: protos.server});
  };

  var handshakeInit = function(data){
    heartbeatInterval = data.sys.heartbeat;       // heartbeat interval
    heartbeatTimeout = heartbeatInterval * 2;     // max heartbeat timeout

    initData(data);

    setDict(data.sys.dict);
    initProtos(data.sys.protos);
  };

  //Initilize data used in pomelo client
  var initData = function(data){
    pomelo.data = pomelo.data || {};
    var dict = data.sys.dict;
    var protos = data.sys.protos;

    //Init compress dict
    if(!!dict){
      pomelo.data.dict = dict;
      pomelo.data.abbrs = {};

      for(var route in dict){
        pomelo.data.abbrs[dict[route]] = route;
      }
    }

    //Init protobuf protos
    if(!!protos){
      pomelo.data.protos = {
        server : protos.server || {},
        client : protos.client || {}
      };
      if(!!protobuf){
        protobuf.init({encoderProtos: protos.client, decoderProtos: protos.server});
      }
    }
  };

  module.exports = pomelo;
})();
