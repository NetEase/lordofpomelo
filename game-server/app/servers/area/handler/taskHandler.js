/**
 * Module dependencies
 */

var dataApi = require('../../../util/dataApi');
var consts = require('../../../consts/consts');
var taskDao = require('../../../dao/taskDao');
var logger = require('pomelo-logger').getLogger(__filename);
var taskReward = require('../../../domain/taskReward');
var pomelo = require('pomelo');
var underscore = require('underscore');

/**
 * Expose 'Entity' constructor
 */

var handler = module.exports;

/**
 * Create and start task.
 * Handle the request from client, and response result to client
 *
 * @param {Object} msg
 * @param {Object} session
 * @param {Function} next
 * @api public
 */

handler.startTask = function(msg, session, next) {
	var playerId = msg.playerId, taskId = msg.taskId;
	var player = session.area.getPlayer(playerId);
	var curTasks = player.curTasks;
	//check out the curTasks, if curTasks exist, return.
	for (var _ in curTasks) {
		if (!!curTasks[taskId])
		return;
	}
	taskDao.createTask(playerId, taskId, function(err,task) {
		if (!!err) {
			logger.error('createTask failed');
		} else {
		player.startTask(task);
		var taskData = {
			acceptTalk: task.acceptTalk,
			workTalk: task.workTalk,
			finishTalk: task.finishTalk,
			item: task.item,
			name: task.name,
			id: task.id,
			type: task.type,
			exp: task.exp,
			taskData: task.taskData,
			taskState: task.taskState,
			completeCondition: task.completeCondition
		};
		next(null, {
			code: consts.MESSAGE.RES,
			taskData: taskData
		});
		}
	});
};


/**
 * Handover task and give reward to the player.
 * Handle the request from client, and response result to client
 *
 * @param {Object} msg
 * @param {Object} session
 * @param {Function} next
 * @api public
 */

handler.handoverTask = function(msg, session, next) {
	var playerId = msg.playerId;
	var player = session.area.getPlayer(playerId);
	var tasks = player.curTasks;
	var taskIds = [];
	for (var id in tasks) {
		var task = tasks[id];
		if (task.taskState === consts.TaskState.COMPLETED_NOT_DELIVERY) {
			taskIds.push(id);
		}
	}
	taskReward.reward(session.area, player, taskIds);
	player.handOverTask(taskIds);
	next(null, {
		code: consts.MESSAGE.RES,
		ids: taskIds
	});
};

/**
 * Get history tasks of the player.
 * Handle the request from client, and response result to client
 *
 * @param {object} msg
 * @param {object} session
 * @param {function} next
 * @api public
 */
handler.getHistoryTasks = function(msg, session, next) {
	var playerId = msg.playerId;
	taskDao.getTaskByPlayId(playerId, function(err,tasks) {
		if (err) {
			logger.error('getHistoryTasks failed!');
			next(new Error('fail to get history tasks'));
		} else {
			var length = tasks.length;
			var reTasks = [];
			for (var i = 0; i < length; i++) {
				var task = tasks[i];
				reTasks.push({
					acceptTalk: task.acceptTalk,
					item: task.item,
					name: task.name,
					id: task.id,
					exp: task.exp,
					taskData: task.taskData,
					taskState: task.taskState
				});
			}
			next(null, {
				code: consts.MESSAGE.RES,
				route: 'onGetHistoryTasks',
				reTasks: reTasks
			});
		}
	});
};

/**
 * Get new Task for the player.
 *
 * @param {object} msg
 * @param {object} session
 * @param {function} next
 * @api public
 */

handler.getNewTask = function(msg, session, next) {
  var player = session.area.getPlayer(msg.playerId);
  var tasks = player.curTasks;
  if(!underscore.isEmpty(tasks)) {
    var keysList = underscore.keys(tasks);
    keysList = underscore.filter(keysList, function(tmpId) {
      var tmpTask = tasks[tmpId];
      if(tmpTask.taskState <= consts.TaskState.COMPLETED_NOT_DELIVERY) {
        return true;
      } else {
        return false;
      }
    });
    if(keysList.length > 0) {
      var maxId = underscore.max(keysList);
      var task = dataApi.task.findById(tasks[maxId].kindId);
      if(!task) {
        logger.error('getNewTask failed!');
        next(new Error('fail to getNewTask!'));
      } else {
        next(null, {
          code: consts.MESSAGE.RES,
          task: task
        });
      }
      return;
    }
  }

	var id = 0;
	taskDao.getTaskByPlayId(msg.playerId, function(err, tasks) {
		if (!!err) {
			logger.error('getNewTask failed!');
			next(new Error('fail to getNewTask!'));
		//do not start task
		} else {
			var length = tasks.length;
			if (length > 0) {
				for (var i = 0; i < length; i++) {
					if (parseInt(tasks[i].kindId) > id) {
						id = parseInt(tasks[i].kindId);
					}
				}
			}
			var task = dataApi.task.findById(++id);
			next(null, {
				code: consts.MESSAGE.RES,
				task: task
			});
		}
	});
};
