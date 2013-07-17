__resources__["/kickOutHandler.js"] = {meta: {mimetype: "application/javascript"}, data: function(exports, require, module, __filename, __dirname) {
	var pomelo = window.pomelo;
	var btns = require('consts').BtnAction4Player;

	/**
	 * Execute player action
	 */
  function exec(type, params) {
    switch (type) {
			case btns.KICK_OUT: {
				kickOut(params);
				}
				break;
    }
  }

	/**
	 * kick out action.
	 */
  function kickOut(params) {
		pomelo.notify("area.teamHandler.kickOut", params);
  }

  exports.exec = exec;
}};
