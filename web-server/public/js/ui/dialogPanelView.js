
__resources__["/dialogPanelView.js"] = {
  meta: {
    mimetype: "application/javascript"
  },

  data: function(exports, require, module, __filename, __dirname) {
    var app = require('app');
    var actionHandler = require('npcHandler');
    var btns = require('consts').buttonContent;
    var $panel;

    exports.init = function() {
      $panel = $('#dialog');
      $panel.find('.u-close').on('click', function() {
        $panel.hide();
      });
    };

    /**
     * @params 
     *  {
     *    name: 'name',
     *    word: 'word ..',
     *    button: {},
     *    action: fn,
     *    params: {}
     *  }
     **/
    exports.talk = function(data) {
      if (!data.word) {
        return;
      }
      var $p = $panel.find('.wincnt p');
      var $opt = $panel.find('.wincnt .opt');
      //var btn = data.btn.split(',');
      var $btn1 = $opt.find('.f-fl').off();
      var $btn2 = $opt.find('.f-fr').off();
      $p.html('<b>' + data.name + '：</b> ' + data.word);

      if (data.button) {
        $btn1.html(btns[data.button.left]);
        $btn2.html(btns[data.button.right]);
      } else {
        $btn1.html(btns['NO']);
        $btn2.html(btns['YES']);
      }

      $btn1.one('click', function() {
        $panel.hide();
      });
      $btn2.one('click', function() {
        if (data.action) {
          actionHandler.exec(data.action, data.params);
        } else {
          $panel.hide();
        }
      });
      $panel.show();
    };

    exports.open = function(data) {
      var $p = $panel.find('.wincnt p');
      var $opt = $panel.find('.wincnt .opt');
      var $btn1 = $opt.find('.f-fl').unbind();
      var $btn2 = $opt.find('.f-fr').unbind();
      var npc = app.getCurArea().getEntity(data.npc);

      if (data.npcword) {
				if (npc.kindId === 3008 && data.action) {
					$p.html('<b>' + npc.englishName + '：</b> ' + data.npcword.split(';')[0]);
				} else if (npc.kindId === 3008 && !data.action) {
					$p.html('<b>' + npc.englishName + '：</b> ' + data.npcword.split(';')[1]);
				} else {
					$p.html('<b>' + npc.englishName + '：</b> ' + data.npcword);
				}

        if (data.button) {
          $btn1.html(btns[data.button.left]);
          $btn2.html(btns[data.button.right]);
        } else {
          $btn1.html(btns['no']);
          $btn2.html(btns['yes']);
        }

        $btn1.one('click', function() {
          $panel.hide();
        });

        $btn2.one('click', function() {
          if (data.myword) {
            $p.html('<b>' + app.getCurPlayer().name + '：</b> ' + data.myword);
            $btn2.one('click', function() {
              if (data.action) {
                //TODO action
                actionHandler.exec(data.action, data.params);
              }
              $panel.hide();
            });
          } else if(data.action) {
            //TODO action
            actionHandler.exec(data.action, data.params);
            $panel.hide();
          } else {
            $panel.hide();
          }
        });
      }
      $panel.show();
    };
  }
};
