__resources__["/timeSync.js"] = {meta: {mimetype: "application/javascript"}, data: function(exports, require, module, __filename, __dirname) {

	/**
	 * Module dependencies 
	 */

	var pomelo = window.pomelo;
	var app = require('app');
	var delayTime = 0;
	var TIME_OUT = 60 * 1000; 
		
	var timeSync = function() {
		getDelayTime();
		setInterval(function() {
			getDelayTime();
		}, TIME_OUT);
	};

	var getDelayTime = function() {
		var beforeTime = new Date().getTime();
		pomelo.request('connector.timeSyncHandler.timeSync',{clientTime: beforeTime},function(result) {
			if (result.code === 200) {
				var afterTime = new Date().getTime();
				delayTime = (afterTime - beforeTime)/2;	
				app.setDelayTime(delayTime);
			}
		});
	};

	module.exports = timeSync;
}};
