__resources__["/playerDialogPanelView.js"] = {
  meta: {
    mimetype: "application/javascript"
  },

  data: function(exports, require, module, __filename, __dirname) {
    var app = require('app');
    var actionHandler = require('playerHandler');
    var btns = require('consts').BtnAction4Player;
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

			$btnL.one('click', function() {
				actionHandler.exec(btns.ATTACK_PLAYER, data);
				$panel.hide();
			});

			$btnM.one('click', function() {
				actionHandler.exec(btns.APPLY_JOIN_TEAM, data);
				$panel.hide();
			});

			$btnR.one('click', function() {
				actionHandler.exec(btns.INVITE_JOIN_TEAM, data);
				$panel.hide();
			});

      $panel.show();
    };
  }
};
