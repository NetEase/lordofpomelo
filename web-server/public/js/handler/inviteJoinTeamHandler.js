__resources__["/inviteJoinTeamHandler.js"] = {meta: {mimetype: "application/javascript"}, data: function(exports, require, module, __filename, __dirname) {
  var pomelo = window.pomelo;
  var btns = require('consts').BtnAction4Player;

  /**
   * Execute player action
   */
  function exec(type, params) {
    switch (type) {
      case btns.ACCEPT_JOIN_INVITER_TEAM: {
        inviteJoinTeamReply(params);
      }
        break;
    }
  }

  /**
   * Invite join team action.
   */
  function inviteJoinTeamReply(params) {
    pomelo.notify("area.teamHandler.inviteJoinTeamReply",
      {teamId: params.teamId, captainId: params.id, reply: params.reply});
  }

  exports.exec = exec;
}};
