__resources__["/applyJoinTeamHandler.js"] = {meta: {mimetype: "application/javascript"}, data: function(exports, require, module, __filename, __dirname) {
  var pomelo = window.pomelo;
  var btns = require('consts').BtnAction4Player;

  /**
   * Execute player action
   */
  function exec(type, params) {
    switch (type) {
      case btns.ACCEPT_APPLICANT_JOIN_TEAM: {
        applyJoinTeamReply(params);
      }
        break;
    }
  }

  /**
   * Apply join team action.
   */
  function applyJoinTeamReply(params) {
    pomelo.notify("area.teamHandler.applyJoinTeamReply",
      {teamId: params.teamId, applicantId: params.id, reply: params.reply});
  }

  exports.exec = exec;
}};
