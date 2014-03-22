/**
 * task Dao, provide many function to operate dataBase
 */
var pomelo = require('pomelo');
var logger = require('pomelo-logger').getLogger(__filename);
var taskDao = module.exports;
var Task = require('../domain/task');
var consts = require('../consts/consts');
var taskApi = require('../util/dataApi').task;
var utils = require('../util/utils');

/**
 * get task by playerId 
 * @param {Number} playerId
 * @param {Function} cb
 */
taskDao.getTaskByPlayId = function(playerId, cb) {
	var sql = 'select * from Task where playerId = ?';
	var args = [playerId];
	pomelo.app.get('dbclient').query(sql, args, function(err,res) {
		if (err) {
			logger.error('get tasks by playerId for taskDao failed!' + err.stack);
			utils.invokeCallback(cb, err);
		} else {
			var length = res.length;
			var tasks = [];
			for (var i = 0; i < length; i ++) {
				var task = createNewTask(res[i]);
				tasks.push(task);
			}
			utils.invokeCallback(cb, null, tasks);
		} 
	});
};

/**
 * get curTask by playerId
 * @param {Number} playerId
 * @param {Function} cb
 */
taskDao.getCurTasksByPlayId = function(playerId, cb) {
	var sql = 'select * from Task where playerId = ?';
	var args = [playerId];
	pomelo.app.get('dbclient').query(sql, args, function(err,res) {
		if (err) {
			logger.error('get tasks by playerId for taskDao failed!' + err.stack);
			utils.invokeCallback(cb, err);
		} else {
			var length = res.length;
			var tasks = {};
			for (var i = 0; i < length; i ++) {
				var task = createNewTask(res[i]);
				if (task.taskState === consts.TaskState.NOT_COMPLETED || task.taskState === consts.TaskState.COMPLETED_NOT_DELIVERY){
					tasks[task.id] = task;
				}
			}
			utils.invokeCallback(cb, null, tasks);
		} 
	});
};

var checkTasks = function(tasks, playerId, res, cb) {
	for (var key in tasks) {
		utils.invokeCallback(cb, null, tasks);
		return;
	}
	if (res.length === 0) {
		taskDao.createTask(playerId, 1, function(err, task) {
			tasks[task.id] = task;
			utils.invokeCallback(cb, null, task);
		});
	}
};

/**
 * get task by playerId and kindId
 * @param {Number} playerId
 * @param {Number} kindId Task's kindId.
 * @param {Function} cb
 */
taskDao.getTaskByIds = function(playerId, kindId, cb) {
	var sql = 'select * from Task where playerId = ? and kindId = ?';
	var args = [playerId, kindId];
	pomelo.app.get('dbclient').query(sql, args, function(err, res) {
		if (!!err) {
			logger.error('get task by playerId and kindId for taskDao failed!' + err.stack);
			utils.invokeCallback(cb, err);
		} else {
			if (res && res.length > 0) {
				var length = res.length;
				var tasks = [];
				for (var i = 0; i < length; i++) {
					var task = createNewTask(res[i]);
					tasks.push(task);
				}
				utils.invokeCallback(cb, null, tasks);
			} else {
				utils.invokeCallback(cb);
			}
		}
	});
};


/**
 * create Task
 * @param {Number} playerId
 * @param {Number} kindId Task's kindId.
 * @param {Function} cb
 */
taskDao.createTask = function(playerId, kindId, cb) {
	var sql = 'insert into Task (playerId, kindId) values (?, ?)';
	var args = [playerId, kindId];
	pomelo.app.get('dbclient').insert(sql, args, function(err, res) {
		if (!!err) {
			logger.error('create task for taskDao failed! '+ err.stack);
			utils.invokeCallback(cb, err);
		} else {
			var taskData = {
				id: res.insertId,
				playerId: playerId,
				kindId: kindId
			};
			var task = createNewTask(taskData);
			utils.invokeCallback(cb, null, task);
		}
	});
};

// save the player's task data immediately
taskDao.tasksUpdate = function(tasks) {
  for (var id in tasks) {
    var task = tasks[id];
    this.update(task);
  }
};

/**
 * update task for id
 * @param {Object} val The update parameters
 * @param {Function} cb
 */
taskDao.update = function(val, cb) {
	var sql = 'update Task set taskState = ?, startTime = ?, taskData = ? where id = ?';
	var taskData = val.taskData;
	if (typeof taskData !== 'string') {
		taskData = JSON.stringify(taskData);
	}
	var args = [val.taskState, val.startTime, taskData, val.id];	
	pomelo.app.get('dbclient').query(sql, args, function(err, res) {
		if (!!err) {
			logger.error('update task for taskDao failed!' + err.stack);
			utils.invokeCallback(cb, err);
		} else {
			utils.invokeCallback(cb, null, res);
		}
	});
};

/**
 * destroy task 
 * @param {Number} playerId
 * @param {function} cb
 */
taskDao.destroy = function(playerId, cb) {
	var sql = 'delete from Task where playerId = ?';
	var args = [playerId];
	pomelo.app.get('dbclient').query(sql, args, function(err, res) {
		if (!!err) {
			logger.error('destroy task for taskDao failed' + err.stack);
			utils.invokeCallback(cb, err);
		} else {
			utils.invokeCallback(cb, null, res);
		}
	});
};

/**
 * new task and set event of 'save'
 * @param {Object} taskInfo
 * @return {Object} task
 */
var createNewTask = function(taskInfo) {
	var task = new Task(taskInfo);
	var app = pomelo.app;
	task.on('save', function() {
		app.get('sync').exec('taskSync.updateTask', task.id, task);	
	});
	return task;
};
