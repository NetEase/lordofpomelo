__resources__["/teamPanelView.js"] = {
  meta: {
    mimetype: "application/javascript"
  },

  data: function(exports, require, module, __filename, __dirname) {
    var app = require('app');
    var pomelo = window.pomelo;
    var actionHandler = require('teamHandler');
    var btns = require('consts').BtnAction4Player;
    var TeamC = require('consts').Team;
    var mainPanel = require('mainPanelView');
    var $panel;

    exports.init = function() {
      $panel = $('#teamDialog');
      var self = this;
      $panel.find('.u-close').on('click', function() {
        self.hide();
      });
    };

    exports.hide = function() {
      $panel.fadeOut(200);
      mainPanel.removeNavSelect();
    };

    exports.show = function() {
      var $teamName = $panel.find('.wincnt .teamName');
      var $opt = $panel.find('.wincnt .opt4team');
      var $btnL = $opt.find('.f-fl').unbind();
      var $btnM = $opt.find('.f-fm').unbind();
      var $btnR = $opt.find('.f-fr').unbind();
      var noneName = 'None';

      var tmpName = (pomelo.teamName && pomelo.teamName !== TeamC.DEFAULT_NAME) ? pomelo.teamName : noneName;
      $teamName.text('TeamName: ' + tmpName);
      if (tmpName === noneName) {
        $teamName.hide();
      } else {
        $teamName.show();
      }

      console.log('teamId, isCaptain = ', pomelo.teamId, pomelo.isCaptain);
      if (pomelo.teamId > TeamC.TEAM_ID_NONE) {
        $btnL.addClass('disabled');
        $btnM.removeClass('disabled');
        if (pomelo.isCaptain) {
          $btnR.removeClass('disabled');
        } else {
          $btnR.addClass('disabled');
        }
      } else {
        $btnL.removeClass('disabled');
        $btnM.addClass('disabled');
        $btnR.addClass('disabled');
      }

      var self = this;
      $btnL.one('click', function() {
        console.log('click createTeam ...');
        if (!pomelo.teamId || pomelo.teamId === TeamC.TEAM_ID_NONE) {
          actionHandler.exec(btns.CREATE_TEAM);
          self.hide();
        }
      });

      $btnM.one('click', function() {
        console.log('click leaveTeam ...');
        if (pomelo.teamId > TeamC.TEAM_ID_NONE) {
          var params = {
            playerId: pomelo.playerId,
            teamId: pomelo.teamId
          };
          actionHandler.exec(btns.LEAVE_TEAM, params);
          self.hide();
        }
        console.log('leaveTeam ~ pomelo.teamId = ', pomelo.teamId);
      });

      $btnR.one('click', function() {
        console.log('click disbandTeam ...');
        if (pomelo.teamId > TeamC.TEAM_ID_NONE && pomelo.isCaptain) {
          var params = {
            playerId: pomelo.playerId,
            teamId: pomelo.teamId
          };
          actionHandler.exec(btns.DISBAND_TEAM, params);
          self.hide();
        }
        console.log('disbandTeam ~ pomelo.teamId = ', pomelo.teamId);
      });

      $panel.show();
    };
  }
};
