__resources__["/applyJoinTeamPanelView.js"] = {
  meta: {
    mimetype: "application/javascript"
  },

  data: function(exports, require, module, __filename, __dirname) {
    var app = require('app');
    var actionHandler = require('applyJoinTeamHandler');
    var btns = require('consts').BtnAction4Player;
    var TeamC = require('consts').Team;
    var $panel;

    exports.init = function() {
      $panel = $('#applyJoinTeamDialog');
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
        tmpStr += 'Wanna join our team ...';
        $p.html('<b>' + tmpStr + '</b>');

        $btnL.one('click', function() {
          data.reply = TeamC.JOIN_TEAM_REPLY.REJECT;
          actionHandler.exec(btns.ACCEPT_APPLICANT_JOIN_TEAM, data);
          $panel.hide();
        });

        $btnR.one('click', function() {
          data.reply = TeamC.JOIN_TEAM_REPLY.ACCEPT;
          actionHandler.exec(btns.ACCEPT_APPLICANT_JOIN_TEAM, data);
          $panel.hide();
        });

      }
      $panel.show();
    };
  }
};
