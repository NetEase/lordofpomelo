/**
 * Module dependencies
 */
var Entity = require('./entity');
var util = require('util');
var EntityType = require('../../consts/consts').EntityType;
var TraverseNpc = require('../../consts/consts').TraverseNpc;
var TraverseTask = require('../../consts/consts').TraverseTask;
var consts = require('../../consts/consts');
var formula = require('../../consts/formula');
var executeTask = require('./../executeTask');
var messageService = require('../messageService');
var TaskDao = require('../../dao/taskDao');

/**
 * Initialize a new 'Npc' with the given 'opts'.
 * Npc inherits Entity
 *
 * @param {Object} opts
 * @api public
 */
var Npc = function(opts) {
	Entity.call(this, opts);
	this.id = opts.id;
	this.type = EntityType.NPC;
	this.orientation = opts.orientation;
	this.width = opts.width;
	this.height = opts.height;
	this.kindType = opts.kindType;
  this.x = opts.x;
  this.y = opts.y;
  // console.error('NPC ~ x, y = ', this.x, this.y);
};

util.inherits(Npc, Entity);

/**
 * Expose 'Npc' constructor.
 *
 */
module.exports = Npc;


var TALK_RANGE = 100;

/**
 * Talk to player.
 *
 * @param {Player} player
 * @return {Object}
 * @api public
 */
Npc.prototype.talk = function(player) {
  if(!formula.inRange(player, this, TALK_RANGE)) {
    return {result: consts.NPC.NOT_IN_RANGE, distance: TALK_RANGE};
  }

  this.emit('onNPCTalk', {npc: this, player : player});

  return {result: consts.NPC.SUCCESS};
};

/**
 * Check out task and traverse to the target area by the condition
 * in area one, the condition is to kill the boss mob
 * in area two, no condition exists
 *
 * @param {Object} msg
 * @api public
 */
Npc.prototype.traverse = function(route, msg) {
	var player = this.area.getEntity(msg.player);
	//If don't need task test, just change area.
	if (!TraverseTask[msg.kindId]){
		this.changeArea(route, msg);
		return;
	}

	TaskDao.getTaskByIds(player.id, TraverseTask[msg.kindId], function(err, tasks) {
		if (tasks && tasks.length > 0) {
			var task = tasks[0];
			//For test only
			task.taskState = consts.TaskState.COMPLETED;
			if (task.taskState === consts.TaskState.COMPLETED) {
				this.changeArea(route, msg);
			} else {
				messageService.pushMessageToPlayer({uid:player.userId, sid : player.serverId}, route, msg);
			}
		} else {
			messageService.pushMessageToPlayer({uid:player.userId, sid : player.serverId}, route, msg);
		}
	});
};

Npc.prototype.toJSON = function() {
	return {
		entityId: this.entityId,
		kindId: this.kindId,
		x: this.x,
		y: this.y
	};
};

Npc.prototype.changeArea = function(route, msg) {
	var player = this.area.getEntity(msg.player);
	msg.action = 'changeArea';
	msg.params = {target : TraverseNpc[msg.kindId]};
	messageService.pushMessageToPlayer({uid: player.userId, sid: player.serverId}, route, msg);
};
