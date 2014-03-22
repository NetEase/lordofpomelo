__resources__["/inviteJoinTeamPanelView.js"] = {
  meta: {
    mimetype: "application/javascript"
  },

  data: function(exports, require, module, __filename, __dirname) {
    var app = require('app');
    var actionHandler = require('inviteJoinTeamHandler');
    var btns = require('consts').BtnAction4Player;
    var TeamC = require('consts').Team;
    var $panel;

    exports.init = function() {
      $panel = $('#inviteJoinTeamDialog');
      $panel.find('.u-close').on('click', function() {
        $panel.hide();
      });
    };

    exports.open = function(data) {
      var $p = $panel.find('.wincnt p');
      var $opt = $panel.find('.wincnt .opt');
      var $btnL = $opt.find('.f-fl').unbind();
      var $btnR = $opt.find('.f-fr').unbind();
      if (data) {
        var tmpStr = '';
        for (var k in data) {
          if (k !== 'teamId') {
            tmpStr += k + ':' + data[k] + '  $  ';
          }
        }
        tmpStr += 'Wanna invite you to join team ...';
        $p.html('<b>' + tmpStr + '</b>');

        $btnL.one('click', function() {
          data.reply = TeamC.JOIN_TEAM_REPLY.REJECT;
          actionHandler.exec(btns.ACCEPT_JOIN_INVITER_TEAM, data);
          $panel.hide();
        });

        $btnR.one('click', function() {
          data.reply = TeamC.JOIN_TEAM_REPLY.ACCEPT;
          actionHandler.exec(btns.ACCEPT_JOIN_INVITER_TEAM, data);
          $panel.hide();
        });

      }
      $panel.show();
    };
  }
};
