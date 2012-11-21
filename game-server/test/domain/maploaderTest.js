var should = require('should');
var maploader = require('../../app/domain/map/maploader');

var test = function(){
	var path = process.cwd() + '/config/map/jiangnanyewai.xml';
	
	var map = maploader.buildMap(path, function(err, map){
		should.not.exist(err);
		should.exist(map);
		console.error(map);
	});
}

test();