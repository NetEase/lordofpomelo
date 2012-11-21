__resources__["/taskHandler.js"] = {meta: {mimetype: "application/javascript"}, data: function(exports, require, module, __filename, __dirname) {
	var pomelo = window.pomelo;
	var app = require('app');
	var Task = require('task');
  var dialogPanel = require('dialogPanelView');
	var taskPanelView = require('taskPanelView');

	/**
	 * Execute the task action.
	 */
  function exec(type, params, cb){
    switch (type) {
			case 'getNewTask': 
				getNewTask(params, cb);
				break;
      case 'startTask': 
        startTask(params);
        break;
      case 'handoverTask': 
        handoverTask(params);
        break;
    }
  }

	/**
	 * Get new task action.
	 *
	 * @param {Object} params
	 * @param {Function} callback
	 */
	function getNewTask(params, callback) {
		var playerId = pomelo.playerId;
		pomelo.request('area.taskHandler.getNewTask', {playerId: playerId}, function(result) {
			var tasks = {};
			if (!!result.task) {
				var task = new Task(result.task);
				tasks[task.id] = task;
			}
			callback(tasks);
		});
	};
	
	/**
	 * Start task action.
	 *
	 * @param {Object} params
	 */
  function startTask(params) {
    var	areaId = pomelo.areaId, playerId = pomelo.playerId;
    var taskId = params.taskId;
    pomelo.request('area.taskHandler.startTask', {
      areaId: areaId,
      playerId: playerId,
      taskId: taskId
    }, function(result) {
      app.getCurPlayer().startTask(new Task(result.taskData));
    });
  }

	/**
	 * Hand over task action.
	 *
	 * @param {Object} params
	 */
  function handoverTask(params) {
    var areaId = pomelo.areaId, playerId = pomelo.playerId;
    pomelo.request('area.taskHandler.handoverTask', {
      areaId: areaId,
      playerId: playerId
    }, function(result) {
      var taskIds = result.ids;
      var task = app.getCurPlayer().curTasks[taskIds[0]];
      //dialogPanel.talk({name: task.finishNpcName, word: task.finishTalk});
      app.getCurPlayer().handoverTasks(taskIds);
    });
  }

  exports.exec = exec;
}};
