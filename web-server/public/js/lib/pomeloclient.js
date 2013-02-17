(function() {
  var isArray = Array.isArray;

  var root = this;

  function EventEmitter() {
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports.EventEmitter = EventEmitter;
  } else {
    root = window;
    root.EventEmitter = EventEmitter;
  }

  // By default EventEmitters will print a warning if more than
  // 10 listeners are added to it. This is a useful default which
  // helps finding memory leaks.
  //
  // Obviously not all Emitters should be limited to 10. This function allows
  // that to be increased. Set to zero for unlimited.
  var defaultMaxListeners = 10;
  EventEmitter.prototype.setMaxListeners = function(n) {
    if (!this._events) this._events = {};
    this._maxListeners = n;
  };

  EventEmitter.prototype.emit = function() {
    var type = arguments[0];
    // If there is no 'error' event listener then throw.
    if (type === 'error') {
      if (!this._events || !this._events.error ||
        (isArray(this._events.error) && !this._events.error.length))
      {
        if (this.domain) {
          var er = arguments[1];
          er.domain_emitter = this;
          er.domain = this.domain;
          er.domain_thrown = false;
          this.domain.emit('error', er);
          return false;
        }

        if (arguments[1] instanceof Error) {
            throw arguments[1]; // Unhandled 'error' event
          } else {
            throw new Error("Uncaught, unspecified 'error' event.");
          }
          return false;
        }
      }

      if (!this._events) return false;
      var handler = this._events[type];
      if (!handler) return false;

      if (typeof handler == 'function') {
        if (this.domain) {
          this.domain.enter();
        }
        switch (arguments.length) {
        // fast cases
        case 1:
        handler.call(this);
        break;
        case 2:
        handler.call(this, arguments[1]);
        break;
        case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
        // slower
        default:
        var l = arguments.length;
        var args = new Array(l - 1);
        for (var i = 1; i < l; i++) args[i - 1] = arguments[i];
          handler.apply(this, args);
      }
      if (this.domain) {
        this.domain.exit();
      }
      return true;
    } else if (isArray(handler)) {
      if (this.domain) {
        this.domain.enter();
      }
      var l = arguments.length;
      var args = new Array(l - 1);
      for (var i = 1; i < l; i++) args[i - 1] = arguments[i];

        var listeners = handler.slice();
      for (var i = 0, l = listeners.length; i < l; i++) {
        listeners[i].apply(this, args);
      }
      if (this.domain) {
        this.domain.exit();
      }
      return true;

    } else {
      return false;
    }
  };

  EventEmitter.prototype.addListener = function(type, listener) {
    if ('function' !== typeof listener) {
      throw new Error('addListener only takes instances of Function');
    }

    if (!this._events) this._events = {};

    // To avoid recursion in the case that type == "newListeners"! Before
    // adding it to the listeners, first emit "newListeners".
    this.emit('newListener', type, typeof listener.listener === 'function' ?
      listener.listener : listener);

    if (!this._events[type]) {
      // Optimize the case of one listener. Don't need the extra array object.
      this._events[type] = listener;
    } else if (isArray(this._events[type])) {

      // If we've already got an array, just append.
      this._events[type].push(listener);

    } else {
      // Adding the second element, need to change to array.
      this._events[type] = [this._events[type], listener];
    }

    // Check for listener leak
    if (isArray(this._events[type]) && !this._events[type].warned) {
      var m;
      if (this._maxListeners !== undefined) {
        m = this._maxListeners;
      } else {
        m = defaultMaxListeners;
      }

      if (m && m > 0 && this._events[type].length > m) {
        this._events[type].warned = true;
        console.error('(node) warning: possible EventEmitter memory ' +
          'leak detected. %d listeners added. ' +
          'Use emitter.setMaxListeners() to increase limit.',
          this._events[type].length);
        console.trace();
      }
    }

    return this;
  };

  EventEmitter.prototype.on = EventEmitter.prototype.addListener;

  EventEmitter.prototype.once = function(type, listener) {
    if ('function' !== typeof listener) {
      throw new Error('.once only takes instances of Function');
    }

    var self = this;
    function g() {
      self.removeListener(type, g);
      listener.apply(this, arguments);
    }

    g.listener = listener;
    self.on(type, g);

    return this;
  };

  EventEmitter.prototype.removeListener = function(type, listener) {
    if ('function' !== typeof listener) {
      throw new Error('removeListener only takes instances of Function');
    }

    // does not use listeners(), so no side effect of creating _events[type]
    if (!this._events || !this._events[type]) return this;

    var list = this._events[type];

    if (isArray(list)) {
      var position = -1;
      for (var i = 0, length = list.length; i < length; i++) {
        if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener))
        {
          position = i;
          break;
        }
      }

      if (position < 0) return this;
      list.splice(position, 1);
    } else if (list === listener ||
      (list.listener && list.listener === listener))
    {
      delete this._events[type];
    }

    return this;
  };

  EventEmitter.prototype.removeAllListeners = function(type) {
    if (arguments.length === 0) {
      this._events = {};
      return this;
    }

    var events = this._events && this._events[type];
    if (!events) return this;

    if (isArray(events)) {
      events.splice(0);
    } else {
      this._events[type] = null;
    }

    return this;
  };

  EventEmitter.prototype.listeners = function(type) {
    if (!this._events) this._events = {};
    if (!this._events[type]) this._events[type] = [];
    if (!isArray(this._events[type])) {
      this._events[type] = [this._events[type]];
    }
    return this._events[type];
  };
})();

(function() {
  var Protocol = window.Protocol;
  var EventEmitter = window.EventEmitter;

  var PKG_HANDSHAKE = 1;    // handshake package
  var PKG_HANDSHAKE_ACK = 2;    // handshake ack package
  var PKG_HEARTBEAT = 3;    // heartbeat package
  var PKG_DATA = 4;         // data package

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

  var handshakeBuffer = {
    'sys':{
      'version':'1.1.1',
      'heartbeat':1
    },'user':{
    }
  }


  pomelo.init = function(params, cb){
    pomelo.params = params;
    params.debug = true;
    pomelo.cb = cb;
    var host = params.host;
    var port = params.port;

    var url = 'ws://' + host;
    if(port) {
      url +=  ':' + port;
    }
    console.log(url);
    if (!params.type) {
      handshakeBuffer.user = params.user;
      this.initWebSocket(url,cb);
    }
  };

  pomelo.initSocketIO = function(url,cb){

    socket = io.connect(url, {'force new connection': true, reconnect: false});
    socket.on('connect', function(){
      console.log('[pomeloclient.init] websocket connected!');
      if (!!cb) { cb(socket);}
    });

    socket.on('reconnect', function() {
      console.log('reconnect');
    });

    socket.on('message', function(data){
      if(typeof data === 'string') {
        data = JSON.parse(data);
      }
      if(data instanceof Array) {
        processMessageBatch(pomelo, data);
      } else {
        processMessage(pomelo, data);
      }
    });

    socket.on('error', function(err) {
      pomelo.emit('io-error', err);
      console.log(err);
    });

    socket.on('disconnect', function(reason) {
      pomelo.emit('disconnect', reason);
    });

  };


  pomelo.initWebSocket = function(url,cb){

    var onopen = function(event){
      console.log('[pomeloclient.init] websocket connected!');
      var obj = Protocol.encode(PKG_HANDSHAKE,Protocol.strencode(JSON.stringify(handshakeBuffer)));
      send(obj);
    };
    var onmessage = function(event){
      var msg = Protocol.decode(event.data);
      processMsg(msg,cb);
    };
    var onerror = function(event) {
      pomelo.emit('io-error', event);
      console.log('socket error %j ',event);
    };
    var onclose = function(event){
      pomelo.emit('close',event);
      console.log('socket close %j ',event);
    }
    socket = new WebSocket(url);
    socket.binaryType = 'arraybuffer';
    socket.onopen = onopen;
    socket.onmessage = onmessage;
    socket.onerror = onerror;
    socket.onclose = onclose;
  }

  pomelo.disconnect = function() {
    if(socket) {
      !!socket.disconnect && socket.disconnect();
      !!socket.close && socket.close();
      console.log('disconnect');
      socket = null;
    }
  };

  pomelo.request = function(route, msg, cb) {
    route = route || msg.route;
    if(!route) {
      console.log('fail to send request without route.');
      return;
    }
    msg = filter(msg);
    reqId++;
    callbacks[reqId] = cb;
    sendMessage(reqId, route, msg);
  };

  pomelo.notify = function(route, msg) {
    sendMessage(0, route, msg);
  };

  var sendMessage = function(reqId, route, msg) {
    var flag = 0;
    if(!!pomelo.dict && !!pomelo.dict[route]){
      route = pomelo.dict[route];
      flag = flag|0x01;
    }
    var packet = Protocol.encode(PKG_DATA,Protocol.body.encode(reqId, flag, route, Protocol.strencode(JSON.stringify(msg))));
    send(packet);
  };

  var send = function(packet){
    socket.send(packet.buffer);
  };


  var handler = {};

  var heartbeat = function(data){
    var obj = Protocol.encode(PKG_HEARTBEAT,Protocol.strencode(''));
    setTimeout(function(){
      send(obj);
    },pomelo.heartbeat);
  };

  var handshake = function(data){
    var obj = Protocol.encode(PKG_HANDSHAKE_ACK,Protocol.strencode(''));
    data = JSON.parse(Protocol.strdecode(data));

    handshakeInit(data);

    send(obj);
    if (!!pomelo.cb) {
      pomelo.cb(socket);
    }
  };

  var ondata = function(data){
    //probuff decode
    //var msg = Protocol.strdecode(data);
    var msg = Protocol.body.decode(data);

    msg.body = deCompose(msg);

    if(!msg){
      console.error('error');
    }
    processMessage(pomelo, msg);
  };

  handler[PKG_HANDSHAKE] = handshake;
  handler[PKG_HEARTBEAT] = heartbeat;
  handler[PKG_DATA] = ondata;

  var processMsg = function(msg){
    handler[msg.flag].apply(null,[msg.buffer]);
  };

  var processMessage = function(pomelo, msg) {
    if(!msg){
      console.error('error');
    }
    if(!msg.id) {
      // server push message
      if(!msg.route){
        console.log('route : %j', msg);
      }
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

  var filter = function(msg) {
    msg.timestamp = Date.now();
    return msg;
  };

  var deCompose = function(msg){
    var protos = !!pomelo.protos?pomelo.protos.server:{};
    var abbrs = pomelo.abbrs;
    var route = msg.route;

    //Decompose route from dict
    if((msg.flag&0x01)===1){
      if(!abbrs[route]){
        console.error('illigle msg!');
        return {};
      }

      route = msg.route = abbrs[route];
    }
    if(!!protos[route]){
      return protobuf.decode(route, msg.buffer);
    }else{
      return JSON.parse(Protocol.strdecode(msg.buffer));
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
    pomelo.heartbeat = data.sys.heartbeat-1000 || 5000;

    setDict(data.sys.dict);

    initProtos(data.sys.protos);
  };
})();
