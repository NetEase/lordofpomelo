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
var area = require('../area/area');
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

  this.emit('onNPCTalk', {npc: this.entityId, player : player.entityId});
  
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
Npc.prototype.traverse = function(msg) {
	var player = area.getEntity(msg.player);
	//If don't need task test, just change area.
	if (!TraverseTask[msg.kindId]){
		changeArea(msg);
		return;
	}
	TaskDao.getTaskByIds(player.id, TraverseTask[msg.kindId], function(err, tasks) {
		if (tasks && tasks.length > 0) {
			var task = tasks[0];
			//For test only
			task.taskState = consts.TaskState.COMPLETED;
			if (task.taskState === consts.TaskState.COMPLETED) {
				changeArea(msg);
			} else {
				messageService.pushMessageToPlayer({uid:player.userId, sid : player.serverId},msg);
			}
		} else {
			messageService.pushMessageToPlayer({uid:player.userId, sid : player.serverId},msg);
		}
	});
};

var changeArea = function(msg) {
	var player = area.getEntity(msg.player);
	msg.action = 'changeArea';
	msg.params = {target : TraverseNpc[msg.kindId]};
	messageService.pushMessageToPlayer({uid: player.userId, sid: player.serverId}, msg);
};
