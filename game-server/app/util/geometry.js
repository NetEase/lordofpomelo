var logger = require('pomelo-logger').getLogger(__filename);

var exp = module.exports;

/**
 * Test if the pos is in the polygon
 * @param pos {Object} Point position.
 * @param polygon {Array} Test polygon, the polyon is an array of point, by the order on polygon
 * @return {Boolean}
 * @api public
 */
exp.isInPolygon = function(pos, polygon) {
	var p = {x : 10000000, y : pos.y};
	var count = 0;
	
	for(var i = 0; i < polygon.length; i++) {
		var p1 = polygon[i];
		var p2 = polygon[(i + 1) % polygon.length];
		
		if(this.isOnline(pos, p1, p2)) {
			return true;
		}
		
		if(p1.y !== p2.y) {
			if(this.isOnline(p1, pos, p)) {
				if(p1.y > p2.y) {
					count++;
					continue;
				}
			}else if(this.isOnline(p2, pos, p)) {
				if(p2.y > p1.y) {
					count++;
					continue;
				}
			}else if(this.isIntersect(pos, p, p1, p2)) {
				count++;
				continue;
			}
		}
	}
	
	if(count % 2 === 1) {
		return true;
	}
		
	return false;
};

/**
 * Test if the pos in on the line ends of p1 and p2
 * @param pos {Object} The position of the test point.
 * @param p1 {Object} Line's end point.
 * @param p2 {Object} Lines's another end point
 * @return {Boolean} If the point is on the line
 * @api public
 */
exp.isOnline = function (pos, p1, p2) {
	var v1 = {x : pos.x - p1.x, y : pos.y - p1.y};
	var v2 = {x : p2.x - p1.x, y : p2.y - p1.y};
	
	if((v1.x*v2.y - v2.x*v1.y) === 0) {
		if(pos.y >= Math.min(p1.y, p2.y) && pos.y <= Math.max(p1.y, p2.y) &&
			pos.x >= Math.min(p1.x, p2.x) && pos.x <= Math.max(p1.x, p2.x)) {
			return true;
		}
		
		return false;
	}
	
	return false;	
};

/**
 * Test if the given two line is intersect
 * @param p1 {Object} An end point of the first line.
 * @param p2 {Object} Another end point of the first line.
 * @param q1 {Object} An end point of the second line.
 * @param q2 {Object} An end point of the first line.
 * @return {Boolean} If the two rectangle is intersect
 * @api public
 */
exp.isIntersect = function(p1, p2, q1, q2) {
	if( !this.isRectIntersect(p1, p2, q1, q2)) {
		return false;
	}
	
	var v1 = {x: (p1.x - q1.x), y : (p1.y - q1.y)};
	var v2 = {x: (q2.x - q1.x), y : (q2.y - q1.y)};
	var v3 = {x: (p2.x - q1.x), y : (p2.y - q1.y)};
	
	if(this.vecCross(v1, v2) * this.vecCross(v2, v3) > 0) {
		return true;
	}
	
	return false;
};

/**
 * Test if the given two rectangle is intersect
 * @param p1 {Object} The point with the smallest x and y in rect1.
 * @param p2 {Object} The point with the biggest x and y in rect1.
 * @param q1 {Object} The point with the biggest x and y in rect2.
 * @param q2 {Object} The point with the biggest x and y in rect2.
 * @return {Boolean} If the two rectangle is intersect
 * @api public
 */
exp.isRectIntersect = function(p1, p2, q1, q2) {
	var minP = {x: p1.x<p2.x?p1.x:p2.x, y : p1.y<p2.y?p1.y:p2.y};
	var maxP = {x: p1.x>p2.x?p1.x:p2.x, y : p1.y>p2.y?p1.y:p2.y};
	var minQ = {x: q1.x<q2.x?q1.x:q2.x, y : q1.y<q2.y?q1.y:q2.y};
	var maxQ = {x: q1.x>q2.x?q1.x:q2.x, y : q1.y>q2.y?q1.y:q2.y};
	
	
	var minx = Math.max(minP.x, minQ.x);
	var miny = Math.max(minP.y, minQ.y);
	var maxx = Math.min(maxP.x, maxQ.x);
	var maxy = Math.min(maxP.y, maxQ.y);
	
	return !(minx > maxx || miny > maxy);
};

/**
 * Test if the two vector is intersect, the start point is (0,0)
 * @param v1 {Object} Vector 1's end point.
 * @param v2 {Object} Vector 2's end point.
 * @return 
 */
exp.vecCross = function(v1, v2) {
	return v1.x * v2.y - v2.x * v1.y;
};