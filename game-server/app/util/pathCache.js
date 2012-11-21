var PriorityQueue = require('pomelo-collection').priorityQueue;
var id = 0;

/**
 * The cache for pathfinding
 */
var PathCache = function(opts) {
	this.id = id++;
	this.limit = opts.limit||30000;
	this.size = 0;
	this.queue = new PriorityQueue(comparator);
	this.cache = {};
};

var pro = PathCache.prototype;

/**
 * Get a path from cache
 * @param x1, y1 {Number} Start point of path
 * @param x2, y2 {Number} End point of path
 * @return {Object} The path in cache or null if no path exist in cache.
 * @api public
 */
pro.getPath = function(x1, y1, x2, y2) {
	var key = this.genKey(x1, y1, x2, y2);
	
	if(!!this.cache[key]) {
		return this.cache[key];
	}
		
	return null;
};

/**
 * Generate key for given path, for a path can be identified by start and end point, we use then to construct the key
 * @param x1, y1 {Number} Start point of path
 * @param x2, y2 {Number} End point of path
 * @return {String} The path's key
 * @api public
 */
pro.genKey = function(x1, y1, x2, y2) {
	return x1 + '_' + y1 + '_' + x2 + '_' + y2;
};

/**
 * Add a path to cache
 * @param x1, y1 {Number} Start point of path
 * @param x2, y2 {Number} End point of path
 * @param path {Object} The path to add
 * @api public
 */
pro.addPath = function(x1, y1, x2, y2, path) {
	var key = this.genKey(x1, y1, x2, y2);
		
	if(!!this.cache[key]) {
		this.cache[key] = path;
		this.cache[key].update = true;
		this.cache[key].time = Date.now();
	} else if(this.size < this.limit) {
		this.queue.offer({
			time : Date.now(),
			key : key
		});
		
		this.cache[key] = path;
		this.size++;
	} else if(this.size === this.limit) {
		var delKey = this.queue.pop().key;
		while(this.cache[delKey].update === true) {
			this.queue.offer({
				time : this.cache[delKey].time,
				key : delKey
			});
			
			delKey = this.queue.pop();
		}
		
		delete this.cache[delKey];
		
		this.queue.offer({
			time : Date.now(),
			key : key
		});
		
		this.cache[key] = path;
	}
};

var comparator = function(a, b) {
	return a.time < b.time;
};

module.exports = PathCache;
