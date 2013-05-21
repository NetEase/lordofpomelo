var utils = require('../../../util/utils');
var instancePool = require('../../../domain/area/instancePool');
var exp = module.exports;

exp.create = function(params, cb){
  var result = instancePool.create(params);

  utils.invokeCallback(cb, null, result);
};

exp.close = function(params, cb){
  var id = params.id;
  var result = instancePool.close(id);

  utils.invokeCallback(cb, null, result);
};



