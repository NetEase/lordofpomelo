var Map = require('../../../domain/map/map');
var dataApi = require('../../../util/dataApi');
var utils = require('../../../util/utils');
var exp = module.exports;

module.exports = function(app){
	return new Remote();
};

var Remote = function(){
	this.maps = {};
	var areasConfig = dataApi.area.all();
	
	for(var key in areasConfig){
		//init map
		var areaConfig = areasConfig[key];
		areaConfig.weightMap = true;
		this.maps[areaConfig.id] = new Map(areaConfig);
	}	
}

Remote.prototype.findPath = function(args, cb){
	var start = args.start;
	var end = args.end;
	var areaId = args.areaId;
	
	var map = this.maps[areaId];
	
	if(!map){
		utils.invokeCallback(cb, 'no map exist');
		return;
	}
	
	var path = map.findPath(start.x, start.y, end.x, end.y);
	
	if(!path){
		utils.invokeCallback(cb, 'find path error!');
	}else{
		utils.invokeCallback(cb, null, path);
	}
};

Remote.prototype.findPathByBatch = function(args, cb){
  var cnt = parseInt(args.cnt);

  var start = new Date().getTime();
  for(var i = 0; i < cnt; i++) {
    this.findPath(args, cb);
  }
  var end = new Date().getTime();

  console.log('start = ', start);
  console.log('end   = ', end);
  utils.myPrint((end - start) / 1000 + " sec \n\n");
};
