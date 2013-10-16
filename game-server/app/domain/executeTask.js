/**
 * Module dependencies
 */
var consts = require('../consts/consts');
var messageService = require('./messageService');
var taskData = require('../util/dataApi').task;
var taskDao = require('../dao/taskDao');
var logger = require('pomelo-logger').getLogger(__filename);
var async = require('async');

/**
 * Expose 'executeTask'.
 */
var executeTask = module.exports;

/**
 * Update taskData.
 * when the player kills mob or player, it invokes.
 * if this action occurs in the player's curTask timeLimit, the curTask's taskData will be updated.
 *
 * @param {Player} player, the player of this action
 * @param {Character} killed, the killed character(mob/player)
 * @api public
 */
executeTask.updateTaskData = function(player, killed) {
  if (player.type === consts.EntityType.MOB) {return;}
	var tasks = player.curTasks;
	var reData = null;
	for (var id in tasks) {
		var task = tasks[id];
		if (typeof task === 'undefined' || task.taskState >= consts.TaskState.COMPLETED_NOT_DELIVERY)	{
			continue;
		}
		var taskDesc = task.desc.split(';');
		var taskType = task.type;
		var killedNum = task.completeCondition[taskDesc[1]];
		if (taskType === consts.TaskType.KILL_MOB && killed.type === consts.EntityType.MOB && killed.kindId === parseInt(taskDesc[1])) {
			task.taskData.mobKilled += 1;
			reData = reData || {};
			reData[id] = task.taskData;
			task.save();
			player.curTasks[id] = task;
			if (player.curTasks[id].taskData.mobKilled >= killedNum) {
				isCompleted(player, id);
			}
		} else if (taskType === consts.TaskType.KILL_PLAYER && killed.type === consts.EntityType.PLAYER && killed.level >= player.level) {
			task.taskData.playerKilled += 1;
			reData = reData || {};
			reData[id] = task.taskData;
			task.save();
			player.curTasks[id] = task;
			if (player.curTasks[id].taskData.playerKilled >= killedNum) {
				isCompleted(player, id);
			}
		}
	}
	if (!!reData) {
	  messageService.pushMessageToPlayer({uid:player.userId, sid : player.serverId}, 'onUpdateTaskData', reData);
	}
};

/**
 * PushMessage to client when the curTask is completed
 *
 * @param {Object} player
 * @param {Number} taskId
 * @api private
 */
var isCompleted = function(player, taskId) {
		player.completeTask(taskId);
    messageService.pushMessageToPlayer({uid:player.userId, sid : player.serverId}, 'onTaskCompleted', {
		 taskId: taskId
	 });
};

