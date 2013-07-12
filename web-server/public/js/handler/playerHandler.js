__resources__["/playerHandler.js"] = {meta: {mimetype: "application/javascript"}, data: function(exports, require, module, __filename, __dirname) {
  var pomelo = window.pomelo;
  var btns = require('consts').BtnAction4Player;
  var TeamC = require('consts').Team;

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
    console.log('ApplyJoinTeam ~ params = ', params);
    console.log('ApplyJoinTeam ~ targetTeamId = ', params.targetTeamId);
    console.log('ApplyJoinTeam ~ targetIsCaptain = ', params.targetIsCaptain);
    if (params.targetTeamId > TeamC.TEAM_ID_NONE && params.targetIsCaptain) {
      pomelo.notify("area.teamHandler.applyJoinTeam",
        {captainId: params.targetPlayerId, teamId: params.targetTeamId});
    }
  }

  /**
   * Invite join team action.
   */
  function inviteJoinTeam(params) {
    console.log('InviteJoinTeam ~ params = ', params);
    console.log('InviteJoinTeam ~ myTeamId = ', params.myTeamId);
    console.log('InviteJoinTeam ~ myIsCaptain = ', params.myIsCaptain);
    if (params.myTeamId > TeamC.TEAM_ID_NONE && params.myIsCaptain) {
      pomelo.notify("area.teamHandler.inviteJoinTeam",
        {inviteeId: params.targetPlayerId, teamId: params.myTeamId});
    }
  }

  exports.exec = exec;
}};
