__resources__["/loginMsgHandler.js"] = {meta: {mimetype: "application/javascript"}, data: function(exports, require, module, __filename, __dirname) {

	var app = require('app');
	var switchManager = require('switchManager');
	var pomelo = window.pomelo;

	exports.init = init;

	function init(){
		/**
		 * Handle kick out messge, occours when the current player is kicked out
		 */
		pomelo.on('onKick', function() {
			location.reload();
			//switchManager.selectView("loginPanel");
		});

		/**
		 * Handle disconect message, occours when the client is disconnect with servers
		 * @param reason {Object} The disconnect reason
		 */
		pomelo.on('disconnect', function(reason) {
			location.reload();
			//switchManager.selectView("loginPanel");
		});

		/**
		 * Handle user leave message, occours when players leave the area
		 * @param data {Object} Contains the playerId to leave the area.
		 */
		pomelo.on('onUserLeave', function(data){
			var area = app.getCurArea();
			var playerId = data.playerId;
			area.removePlayer(playerId);
		});

	}
}};
