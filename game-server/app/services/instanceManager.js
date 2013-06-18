var pomelo = require('pomelo');
var utils = require('../util/utils');
var dataApi = require('../util/dataApi');
var consts = require('../consts/consts');
var logger = require('pomelo-logger').getLogger(__filename);
var INSTANCE_SERVER = 'area';

//The instance map, key is instanceId, value is serverId
var instances = {};

//All the instance servers
var instanceServers = [];

var exp = module.exports;

exp.addServers = function(servers){
  for(var i = 0; i < servers.length; i++){
    var server = servers[i];

    if(server.serverType === 'area' && server.instance){
      instanceServers.push(server);
    }
  }
};

exp.removeServers = function(servers){
  for(var i = 0; i < servers.length; i++){
    var server = servers[i];

    if(server.serverType === 'area' && server.instance){
      exp.removeServer(server.id);
    }
  }

  logger.info('remove servers : %j', servers);
};

exp.getInstance = function(args, cb){
  //The key of instance
  var instanceId = args.areaId + '_' + args.id;

  //If the instance exist, return the instance
  if(instances[instanceId]){
    utils.invokeCallback(cb, null, instances[instanceId]);
    return;
  }

  var app = pomelo.app;

  //Allocate a server id
  var serverId = getServerId();

  //rpc invoke
  var params = {
    namespace : 'user',
    service : 'areaRemote',
    method : 'create',
    args : [{
      areaId : args.areaId,
      instanceId : instanceId
    }]
  };

  app.rpcInvoke(serverId, params, function(err, result){
    if(!!err) {
      console.error('create instance error!');
      utils.invokeCallback(cb, err);
      return;
    }

    instances[instanceId] = {
      instanceId : instanceId,
      serverId : serverId
    };

    utils.invokeCallback(cb, null, instances[instanceId]);
  });

};

exp.remove = function(instanceId){
  if(instances[instanceId]) delete instances[instanceId];
};

//Get the server to create the instance
var count = 0;
function getServerId(){
  if(count >= instanceServers.length) count = 0;

  var server = instanceServers[count];

  count++;
  return server.id;
}

function filter(req){
  var playerId = req.playerId;

  return true;
}

exp.removeServer = function(id){
  for(var i = 0; i < instanceServers.length; i++){
    if(instanceServers[i].id === id){
      delete instanceServers[i];
    }
  }
};
