__resources__["/mainPanelView.js"] = {
  meta: {
    mimetype: "application/javascript"
  },

  data: function(exports, require, module, __filename, __dirname) {
    var playerPanel = require('playerPanelView');
    var bagPanel = require('bagPanelView');
    var equipmentsPanel = require('equipmentsPanelView');
    var taskPanel = require('taskPanelView');
    var dialogPanel = require('dialogPanelView');
    var config = require('config');
    var app = require('app');
    var pomelo = window.pomelo;
    // bottom nav li
    var $li;
    // hp bar
    var $hpBar;
    // mp bar
    var $mpBar;
    // level
    var $level;
    // experience value
    var $exp, $expBar;
    var inited = false;

    var init = function() {
      if (inited) {
        return;
      }
      inited = true;

      $hpBar = $('#mainPanel .m-player .u-levbar span.outer');
      $mpBar = $('#mainPanel .m-player .u-levbar-1 span.outer');
      $level = $('#mainPanel .m-player .name span').eq(1);
      $exp = $('#mainPanel .m-asset .pos6 span');
      $expBar = $('#mainPanel .m-asset .icon-ll');
      $li = $('.m-nav li');

      initNav();

      var player = app.getCurPlayer();
      $('#mainPanel .avatar img').attr('src', config.IMAGE_URL + 'character/' + player.characterData.id + '/60.png');
      $('#mainPanel .m-player .name span').eq(0).text(player.name);
      setLevel(player.level);
      setHpBar(player.hp, player.maxHp);
      setMpBar(player.mp, player.maxMp);
      setExp(player.experience, player.nextLevelExp);

      initSkillPanel(player.fightSkills);
      bindHotkeys();
      playerPanel.init();
      equipmentsPanel.init();
      bagPanel.init();
      taskPanel.init();
      dialogPanel.init();

    };

    //init bottom nav events bind
    var initNav = function() {
      $li.on('click', function() {
        var $this = $(this);
        if ($this.hasClass('selected')) {
          return;
        }

        $li.filter('.selected').trigger('selected', false);

        $this.trigger('selected', true);
      });

      $li.on('selected', function(e, selected) {
        var $this = $(this);
        var panel;
        $this.toggleClass('selected', selected);

        if ($this.hasClass('itm01')) {
          panel = playerPanel;
        } else if ($this.hasClass('itm02')) {
          panel = bagPanel;
        } else if ($this.hasClass('itm03')) {
          panel = taskPanel;
        }

        if (panel) {
          //!!selected ? panel.show() : panel.hide();
          panel[!!selected ? 'show' : 'hide'].call(panel);
        }
      });
    };

    var closeAllPanel = function() {
      playerPanel.hide();
      bagPanel.hide();
      taskPanel.hide();
      removeNavSelect();
    };

    //remove bottom nav selected class
    var removeNavSelect = function() {
      $li.filter('.selected').removeClass('selected');
    };

    // set hp
    var setHpBar = function(hp, maxHp) {
      $hpBar.css('width', (hp * 100 / maxHp) + '%');
    };

    // set mp
    var setMpBar = function(mp, maxMp) {
      $mpBar.css('width', (mp * 100 / maxMp) + '%');
    };

    // set level
    var setLevel = function(level) {
      $level.html(level);
    };

    // set Experience
    var setExp = function(val, val2) {
      $exp.html(val + "/" + val2);

      if (val >= val2) {
        $expBar.css('width',  '100%');
      } else {
        if (val === 0) {
          $expBar.hide().css('width',  '1%');
        } else {
          $expBar.show().css('width',  (val * 100 / val2) + '%');
        }
      }
    };

    var bindHotkeys = function() {
      //var code = {"0": 48, "1": 49, "2": 50, "3": 51, "4": 52, "5": 53, "6": 54, "7": 55, "8": 56, "9": 57};
      var $li = $('#mainPanel .m-skill li');
      $('body').on('keypress', function(e) {
        if (e.target.tagName === 'INPUT') {
          return;
        }

        var key = e.keyCode;
        if (key > 48 && key <= 57) {
          $li.eq(key - 49).trigger('click');
        } else if (key === 48) {
          $li.eq(9).trigger('click');
        }
      });
    };

    // init skill panel
    var skillBox = {};
    var initSkillPanel = function() {
      var skills = app.getCurPlayer().fightSkills;
      var $li = $('#mainPanel .m-skill li');
      var i, sk, $cli;
      for (i in skills) {
        if (i > 1) {
          sk = skills[i].skillData; 
          $cli = $li.eq(i - 2).data('skillId', sk.id).html('<img src="' + config.IMAGE_URL + 'skill/' + sk.imageUrl + '.jpg" alt="" title="' + sk.name + ' 等级:' + skills[i].level + '&#10;' + sk.desc +'"><span class="num">'+ skills[i].level +'</span>');
          skillBox[sk.id] = new SkillCD(sk.id, $cli, sk.cooltime *1000, function(skillId) {
            pomelo.notify("area.fightHandler.useSkill",{ skillId: skillId, playerId: pomelo.playerId});
          });
        }
      }
    };

    var SkillCD = function(id, $box, time, action) {
      this.id = id;
      this.$box = $box;
      this.$box.addClass('skill-box');
      //var $img = $box.children('img');
      //var r = 20.8;
      this.inCD = false;
      for (var i = 0; i < 4; i++ ) {
        this.$box.append('<div class="cover layer' + i + '"></div>');
      }
      this.$cover = this.$box.children('.cover').css({'-webkit-transition': 'All ' + (time/8) + 'ms linear'});
      this.l0 = this.$cover.eq(0);
      this.l1 = this.$cover.eq(1);
      this.l2 = this.$cover.eq(2);
      this.l3 = this.$cover.eq(3);

      var self = this;
      this.$box.on('click', function() {
        if (action) {
          action(self.id);
        }
      });
    };

    SkillCD.prototype.start = function() {
      if (this.inCD) {
        return;
      }

      this.inCD = true;
      this.resetCover();
      var self = this;
      setTimeout(function() {
        self.draw();
      }, 0);
    };

    SkillCD.prototype.resetCover = function() {
      this.l0.css({height: '0', width: '0', 'border-left-width': '0', 'border-bottom-width':  '20px'});
      this.l1.css({height: '0', width: '0', 'border-top-width': '0', 'border-left-width': '20px'});
      this.l2.css({height: '0', width: '20px', 'border-right-width': '0', 'border-top-width': '20px'});
      this.l3.css({height: '20px', width: '0', 'border-bottom-width': '0', 'border-right-width': '20px'});
      this.$cover.show();
    };

    SkillCD.prototype.draw = function() {
      var setTransition = function($dom, css, count, callback) {
        $dom.on('webkitTransitionEnd', function(e) {
          count --;
          if (count === 0) {
            $dom.off('webkitTransitionEnd');
            callback.call(this);
          }
        }).css(css);
      };

      var l0 = this.l0;
      var l1 = this.l1;
      var l2 = this.l2;
      var l3 = this.l3;
      var self = this;

      setTransition(l0, {'border-left-width': "20px"}, 1, function() {
        setTransition(l0, {height: '20px', 'border-bottom-width': "0px"}, 2, function() {
          setTransition(l1, {'border-top-width': "20px"}, 1, function() {
            setTransition(l1, {width: '20px', 'border-left-width': "0px"}, 2, function() {
              setTransition(l2, {width: '0px', 'border-right-width': "20px"}, 2, function() {
                setTransition(l2, {height: '20px', 'border-top-width': "0px"}, 2, function() {
                  setTransition(l3, {height: '0px', 'border-bottom-width': "20px"}, 2, function() {
                    setTransition(l3, {width: '20px', 'border-right-width': "0px"}, 2, function() {
                      self.inCD = false;
                      self.$cover.hide();
                    });
                  });
                });
              });
            });
          });
        }); 
      });
    };


    exports.reviveMaskShow = function(time) {
      $('#game-mask').show();
    };

    exports.reviveMaskHide = function(time) {
      $('#game-mask').hide();
    };

    exports.notify = function(msg) {
      var $notice = $('#notice');
      $notice.children('p').html(msg);
      $notice.animate({top: '28px'}, 700, function(){
        setTimeout(function(){
          $notice.animate({opacity: '0'}, 800, function() {
            $notice.css({top: '-52px'}).css({'opacity': '0.75'});
          });
        }, 3000);
      });
    };


    exports.init = init;
    exports.removeNavSelect = removeNavSelect;
    exports.closeAllPanel = closeAllPanel;
    exports.setHpBar = setHpBar;
    exports.setMpBar = setMpBar;
    exports.setLevel = setLevel;
    exports.setExp = setExp;
    exports.initSkillPanel = initSkillPanel;
    exports.skillBox = skillBox;

  }
};

