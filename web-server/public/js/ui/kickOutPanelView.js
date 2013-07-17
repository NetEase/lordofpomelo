__resources__["/kickOutPanelView.js"] = {
  meta: {
    mimetype: "application/javascript"
  },

  data: function(exports, require, module, __filename, __dirname) {
		var pomelo = window.pomelo;
    var actionHandler = require('kickOutHandler');
    var btns = require('consts').BtnAction4Player;
		var TeamC = require('consts').Team;
    var $panel;

    exports.init = function() {
      $panel = $('#kickOutDialog');
			var self = this;
			$panel.find('.u-close').on('click', function() {
				self.hide();
      });
    };

		exports.hide = function() {
			$panel.hide();
		};

    exports.open = function(kickedPlayerId) {
      var $opt = $panel.find('.wincnt .opt4kickOut');
			var $btnL = $opt.find('.f-fl').unbind();
      var $btnR = $opt.find('.f-fr').unbind();

			console.log('teamId, isCaptain = ', pomelo.teamId, pomelo.isCaptain);
			if (pomelo.teamId > TeamC.TEAM_ID_NONE && pomelo.isCaptain) {
				$btnR.removeClass('disabled');
			} else {
				$btnR.addClass('disabled');
			}

			var self = this;
			$btnL.one('click', function() {
				console.log('click Cancel ...');
				self.hide();
			});

			$btnR.one('click', function() {
				console.log('click KickOut ...');
				if (pomelo.teamId > TeamC.TEAM_ID_NONE && pomelo.isCaptain) {
					var params = {
						teamId: pomelo.teamId,
						kickedPlayerId: kickedPlayerId
					};
					actionHandler.exec(btns.KICK_OUT, params);
					self.hide();
				}
				console.log('KickOut ~ pomelo.teamId, kickedPlayerId = ', pomelo.teamId, kickedPlayerId);
			});

      $panel.show();
    };
  }
};
