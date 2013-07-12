__resources__["/playerDialogPanelView.js"] = {
  meta: {
    mimetype: "application/javascript"
  },

  data: function(exports, require, module, __filename, __dirname) {
    var actionHandler = require('playerHandler');
    var btns = require('consts').BtnAction4Player;
    var TeamC = require('consts').Team;
    var $panel;

    exports.init = function() {
      $panel = $('#playerDialog');
      $panel.find('.u-close').on('click', function() {
        $panel.hide();
      });
    };

    exports.open = function(data) {
      var $opt = $panel.find('.wincnt .opt4player');
      var $btnL = $opt.find('.f-fl').unbind();
      var $btnM = $opt.find('.f-fm').unbind();
      var $btnR = $opt.find('.f-fr').unbind();

      console.log('data = ', JSON.stringify(data));
      // Attack
      var flag4btnL = data.myTeamId && data.myTeamId > TeamC.TEAM_ID_NONE &&
        data.myTeamId === data.targetTeamId;
      if (!flag4btnL) {
        $btnL.removeClass('disabled');
      } else {
        $btnL.addClass('disabled');
      }

      // Apply
      var flag4btnM = (!data.myTeamId || data.myTeamId === TeamC.TEAM_ID_NONE) &&
        data.targetTeamId && data.targetTeamId > TeamC.TEAM_ID_NONE && data.targetIsCaptain;
      if (flag4btnM) {
        $btnM.removeClass('disabled');
      } else {
        $btnM.addClass('disabled');
      }

      // Invite
      var flag4btnR = data.myTeamId && data.myTeamId > TeamC.TEAM_ID_NONE &&
        data.myIsCaptain && (!data.targetTeamId || data.targetTeamId === TeamC.TEAM_ID_NONE);
      if (flag4btnR) {
        $btnR.removeClass('disabled');
      } else {
        $btnR.addClass('disabled');
      }

      $btnL.one('click', function() {
        console.log('click Attack ...');
        if (!flag4btnL) {
          actionHandler.exec(btns.ATTACK_PLAYER, data);
          $panel.hide();
        }
      });

      $btnM.one('click', function() {
        console.log('click Apply ...');
        if (flag4btnM) {
          actionHandler.exec(btns.APPLY_JOIN_TEAM, data);
          $panel.hide();
        }
      });

      $btnR.one('click', function() {
        console.log('click Invite ...');
        if (flag4btnR) {
          actionHandler.exec(btns.INVITE_JOIN_TEAM, data);
          $panel.hide();
        }
      });

      $panel.show();
    };
  }
};
