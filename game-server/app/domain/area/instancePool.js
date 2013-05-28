var Instance = require('./instance');
var dataApi = require('../../util/dataApi');
var Map = require('../map/map');
var pomelo = require('pomelo');

var logger = require('pomelo-logger').getLogger(__filename);

var exp = module.exports;

var instances;
var intervel;
var maps = {};

exp.init = function(opts){
  instances = {};
  intervel = opts.intervel||60000;

  setInterval(check, intervel);
};

exp.create = function(params){
  var id = params.instanceId;
  var areaId = params.areaId;

  if(instances[id]) return false;

  //get area map
  var opts = dataApi.area.findById(areaId);
  if(!maps[areaId]){
    maps[areaId] = new Map(opts);
  }
  opts.map = maps[areaId];

  //Create instance
  var instance = new Instance(opts);

  instances[id] = instance;

  instance.start();
  return true;
};

exp.remove = function(params){
  var id = params.id;
  if(!instances[id]) return false;

  var instance = instances[id];
  instance.close();
  delete instances[id];

  return true;
};

exp.getArea = function(instanceId){
  return instances[instanceId].area;
};

function check(){
  var app = pomelo.app;
  for(var id in instances){
    var instance = instances[id];

    if(!instance.isAlive()){
      app.rpc.manager.instanceRemote.remove(null, id, onClose);
    }
  }
}

function onClose(err, id){
  if(!err){
    instances[id].close();
    delete instances[id];
    logger.info('remove instance : %j', id);
  }else{
    logger.warn('remove instance error! id : %j, err : %j', id, err);
  }
}

