var util = require('util');
var EventEmitter = require('events').EventEmitter;

var id = 0;

/**
 * The origint zone object
 */
var Zone = function(opts) {
	this.zoneId = id++;
	this.width = opts.width;
	this.height = opts.height;
	this.x = opts.x;
	this.y = opts.y;
  this.area = opts.area;
};

util.inherits(Zone, EventEmitter);

/**
 * Update the zone, the funciton is time driven
 */
Zone.prototype.update = function() {
};

/**
 * Remove an entity from the zone, default function will do nothing
 */
Zone.prototype.remove = function() {
};

module.exports = Zone;
