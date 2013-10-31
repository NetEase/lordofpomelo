module.exports = {
	updateTask: function(dbclient, val, cb) {
		var sql = 'update Task set taskState = ?, startTime = ?, taskData = ? where id = ?';
		var taskData = val.taskData;
		if (typeof taskData !== 'string') {
			taskData = JSON.stringify(taskData);
		}
		var args = [val.taskState, val.startTime, taskData, val.id];	
		dbclient.query(sql, args, function(err, res) {
			if (err) {
				console.error('write mysql failed! ' + sql + JSON.stringify(val));
			}
      if(!!cb && typeof cb == 'function') {
        cb(!!err);
      }
		});
	}
};
