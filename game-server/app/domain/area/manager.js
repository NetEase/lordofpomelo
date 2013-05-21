var exp = module.exports;
var pomelo = require('pomelo');
var utils = require('../../util/utils');
var dataApi = require('../../util/dataApi');
var consts = require('../../consts/consts');

var INSTANCE_ID = 'INSTANCE_';
var INSTANCE_SERVER = 'area';
var id = 1;

var instances = {};
var servers = [];

exp.init = function(opts){
  //Init instance server config
  var areaServers = pomelo.app.servers[INSTANCE_SERVER];
  for(var key in areaServers){
    var server = areaServers[key];
    if(server.instance){
      servers.add(server);
    }
  }

  //Load instance servers
  var areas = dataApi.area.all();
  for(var id in areas){
    var area = areas[id];
    //if(area.type === consts)
  }
};

exp.createInstance = function(msg, session, cb){
  var kindId = msg.kindId;


  var app = pomelo.app;

  //Check if the create request is valid

  var instanceId = INSTANCE_ID + id++;

  //Allocate a server id

  //rpc invoke
  var params = {
    instanceId : instanceId,
    outerId : session.playerId
  };
  app.rpc.area.instanceRemote.create(params, function(err, result){
    if(!!err) utils.invokeCallback(err, result);

    utils.invokeCallback(null, result);
  });
};

exp.remove = function(msg){
  var instanceId = msg.id;
  var serverId = msg.serverId;

  if(instances[instanceId]) delete instances[instanceId];
};

function filter(req){
  var playerId = req.playerId;

  return true;
}
