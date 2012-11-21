var taskDao = require('../../app/dao/taskDao');

taskDao.createTask(1006, 10, function(err, task){
		console.error(task);
});

