/**
 * Module dependencies
 */
var EventEmitter = require('events').EventEmitter;
var util = require('util');

/**
 * Persistent object, it is saved in database
 *
 * @param {Object} opts
 * @api public
 */
var Persistent = function(opts) {
	this.id = opts.id;
	this.type = opts.type;
	EventEmitter.call(this);
};

util.inherits(Persistent, EventEmitter);

module.exports = Persistent;
// Emit the event 'save'
Persistent.prototype.save = function() {
	this.emit('save');
};

