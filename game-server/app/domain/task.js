/**
 * Module dependencies
 */

var util = require('util');
var Persistent = require('./persistent');
var TaskState = require('../consts/consts').TaskState; 
var taskData = require('../util/dataApi').task;

/**
 * Initialize a new 'Task' with the given 'opts'.
 * Task inherits Persistent
 *
 * @param {Object} opts
 * @api public
 */

var Task = function(opts) {
	this.id = opts.id;
	this.playerId = opts.playerId;
	this.kindId = opts.kindId;
	this.taskState = opts.taskState;
	this.startTime = opts.startTime;
	this.taskData = this._parseJson(opts.taskData);

	this._initTaskInfo();
};
util.inherits(Task, Persistent);

/**
 * Expose 'Task' constructor
 */

module.exports = Task;

/**
 * Init task information form taskList.
 *
 * @api private
 */

Task.prototype._initTaskInfo = function() {
	var info = taskData.findById(this.kindId);
	if (!!info) {
		this.name = info.name;
		this.heroLevel = info.heroLevel;
		this.desc = info.desc;
		this.acceptTalk = info.acceptTalk;
		this.workTalk = info.workTalk;
		this.finishTalk = info.finishTalk;
		this.exp = info.exp;
		this.item = info.item;
		this.timeLimit = info.timeLimit;
		this.type = info.type;
		this.completeCondition = this._parseJson(info.completeCondition);
	}
};

/**
 * Parse String to json.
 *
 * @param {String} data
 * @return {Object}
 * @api private
 */

Task.prototype._parseJson = function(data) {
	if (typeof data === 'undefined') {
		data = {};
	} else {
		data = JSON.parse(data);
	}
	return data;
};
