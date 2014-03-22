var Area = require('./area');
var Map = require('../map/map');

var exp = module.exports;

var area = null;

exp.init = function(opts){
  if(!area) {
    opts.weightMap = true;
    opts.map = new Map(opts);
    area = new Area(opts);
  }
};

exp.getArea = function(){
  return area;
};
