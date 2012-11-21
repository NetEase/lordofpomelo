var geometry = require('../../app/util/geometry');
var should = require('should');

describe('geometry test', function(){
	var p1 = {x: 3, y: 3};
	var p2 = {x: 9, y: 9};
	
	var q1 = {x: 2, y: 6};
	var q2 = {x: 10, y: 3};
		
	var polygon = [q1, p2, {x: 7, y: 6}, {x : 8, y : 6}, q2, p1];
	
	geometry.isRectIntersect(p1, p2, q1, q2).should.equal(true);
	
	geometry.isIntersect(p1, p2, q1, q2).should.equal(true);
	geometry.isIntersect({x: 4, y : 4}, {x : 1000000, y :4}, {x : 7, y : 6}, q2).should.equal(true);


	geometry.isIntersect(p1, p2, q1, {x : 9, y : 10}).should.equal(false);
//	
//	//Test is online function
	geometry.isOnline(p1, q1, q2).should.equal(false);
	geometry.isOnline({x: 2, y: 2}, p1, p2).should.equal(false);
	geometry.isOnline({x: 3, y: 3}, p1, p2).should.equal(true);
	geometry.isOnline({x: 4, y: 4.1}, p1, p2).should.equal(false);
	geometry.isOnline({x: 10, y: 10}, p1, p2).should.equal(false);
	
	geometry.isInPolygon({x:4, y:4}, polygon).should.equal(true);
	geometry.isInPolygon({x:4, y:6}, polygon).should.equal(true);
	geometry.isInPolygon({x:2, y:6}, polygon).should.equal(true);
	geometry.isInPolygon({x:2.9, y:3.1}, polygon).should.equal(false);
	geometry.isInPolygon({x:8, y:9}, polygon).should.equal(false);
	geometry.isInPolygon({x:7.5, y:6}, polygon).should.equal(true);
	geometry.isInPolygon({x:8.1, y:6}, polygon).should.equal(false);
});