__resources__["/playerHandler.js"] = {meta: {mimetype: "application/javascript"}, data: function(exports, require, module, __filename, __dirname) {
	var pomelo = window.pomelo;
	var btns = require('consts').BtnAction4Player;

	/**
	 * Execute player action
	 */
  function exec(type, params) {
    switch (type) {
			case btns.ATTACK_PLAYER: {
				attackPlayer(params);
				}
				break;

			case btns.APPLY_JOIN_TEAM: {
				applyJoinTeam(params);
				}
				break;

			case btns.INVITE_JOIN_TEAM: {
				inviteJoinTeam(params);
				}
				break;
    }
  }

	/**
	 * Attack player action.
	 */
  function attackPlayer(params) {
		pomelo.notify('area.fightHandler.attack', {targetId: params.targetId});
  }

	/**
	 * Apply join team action.
	 */
  function applyJoinTeam(params) {
    pomelo.notify("area.teamHandler.applyJoinTeam", {teamId: params.targetId});
  }

	/**
	 * Invite join team action.
	 */
  function inviteJoinTeam(params) {
		pomelo.notify("area.teamHandler.applyJoinTeam", {teamId: params.targetId});
  }

  exports.exec = exec;
}};
