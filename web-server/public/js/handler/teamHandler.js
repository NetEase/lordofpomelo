__resources__["/teamHandler.js"] = {meta: {mimetype: "application/javascript"}, data: function(exports, require, module, __filename, __dirname) {
  var pomelo = window.pomelo;
  var btns = require('consts').BtnAction4Player;

  /**
   * Execute player action
   */
  function exec(type, params) {
    switch (type) {
      case btns.CREATE_TEAM: {
        createTeam();
      }
        break;

      case btns.LEAVE_TEAM: {
        leaveTeam(params);
      }
        break;

      case btns.DISBAND_TEAM: {
        disbandTeam(params);
      }
        break;
    }
  }

  /**
   * Create team action.
   */
  function createTeam() {
    pomelo.notify("area.teamHandler.createTeam");
  }

  /**
   * Leave team action.
   */
  function leaveTeam(params) {
    pomelo.notify("area.teamHandler.leaveTeam", params);
  }

  /**
   * Disband team action.
   */
  function disbandTeam(params) {
    pomelo.notify("area.teamHandler.disbandTeam", params);
  }

  exports.exec = exec;
}};
