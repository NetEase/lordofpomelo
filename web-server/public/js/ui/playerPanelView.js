__resources__["/playerPanelView.js"] = {
  meta: {
    mimetype: "application/javascript"
  },

  data: function(exports, require, module, __filename, __dirname) {

    var mainPanel = require('mainPanelView');
    var config = require('config');
    var dataApi = require('dataApi');
    var app = require('app');
    var pomelo = window.pomelo;
    var $panel;

    var init = function() {
      $panel = $('#playerPanel');

      //tab
      tabInit();

      initPlayerInfo();

      initSkillPanel();
      //close
      $panel.find('.u-close').on('click', function() {
        hide();
        mainPanel.removeNavSelect();
      });

    };

    var show = function() {
      $panel.show();
    };

    var hide = function() {
      $panel.fadeOut(200);
    };

    // tab events bind
    var tabInit = function() {
      var $tab1 = $panel.find('.m-tab .itm1');
      var $tab2 = $panel.find('.m-tab .itm2');
      var $zj = $panel.find('.layercnt.zj');
      var $jn = $panel.find('.layercnt.jn');

      $tab1.on('click', function() {
        if ($tab1.hasClass('selected')) {
          return;
        }

        $tab2.removeClass('selected');
        $jn.hide();

        $tab1.addClass('selected');
        $zj.show();
      });

      $tab2.on('click', function() {
        if ($tab2.hasClass('selected')) {
          return;
        }

        $tab1.removeClass('selected');
        $zj.hide();

        $tab2.addClass('selected');
        $jn.show();
      });
    };

    // init player info
    var initPlayerInfo = function() {
      var player = app.getCurPlayer();
      setAvatar(player.characterData.id);
      setName(player.name);
      setLevel(player.level);
      setCareer(player.characterData.englishName);
      setHpBar(player.hp, player.maxHp);
      setMpBar(player.mp, player.maxMp);
      setAttack(player.getTotalAttack());
      setDefence(player.getTotalDefence());
      setHitRate(player.hitRate);
      setDodgeRate(player.dodgeRate);
      setWalkSpeed(player.walkSpeed);
      setAttackSpeed(player.attackSpeed);
    };

    var setAvatar = function(characterId) {
      $panel.find('.face img').attr('src', config.IMAGE_URL + 'character/' + characterId + '.png');
    };

    var setName = function(name) {
      $panel.find('.name .f-fl').text(name);
    };

    var setLevel = function(level) {
      $panel.find('.name .val').eq(0).html(level);
      mainPanel.setLevel(level);
    };

    var setCareer = function(career) {
      $panel.find('.name .val').eq(1).html(career);
    };

    var setHpBar = function(hp, maxHp) {
      var $levbar = $panel.find('.level .levbar').eq(0);
      $levbar.find('.num').html(hp + ' / ' + maxHp);
      $levbar.find('.bar').css('width', (hp * 100 / maxHp) + '%');
      //mainPanel.setHpBar((hp * 100 / maxHp) + '%');
    };

    var setMpBar = function(mp, maxMp) {
      var $levbar = $panel.find('.level .levbar').eq(1);
      $levbar.find('.num').html(mp + ' / ' + maxMp);
      $levbar.find('.bar').css('width', (mp * 100 / maxMp) + '%');
    };

    var setDefence = function(val) {
      $panel.find('.detail p span.val').eq(1).html(val);
    };

    var setAttack = function(val) {
      $panel.find('.detail p span.val').eq(0).html(val);
    };

    var setHitRate = function(val) {
      $panel.find('.detail p span.val').eq(2).html(val);
    };

    var setDodgeRate = function(val) {
      $panel.find('.detail p span.val').eq(3).html(val);
    };

    var setWalkSpeed = function(val) {
      $panel.find('.detail p span.val').eq(4).html(val);
    };

    var setAttackSpeed = function(val) {
      $panel.find('.detail p span.val').eq(5).html(val);
    };

    var initSkillPanel = function() {
      var skills = dataApi.fightskill.all();
      var $container = $panel.find('.jn ul.m-wlst1');

      var initSkillList = function(skills) {
        var skillIds = Object.keys(skills);
        skillIds.shift();
        var html = '';
        var playSkill = app.getCurPlayer().fightSkills;
        skillIds.forEach(function(k, i) {
          var skill = skills[k];
          var pskill = playSkill[k];
          var level = pskill ? pskill.level : 0;
          html += '\
          <li data-id="' + k + '">\
            <img src="' + config.IMAGE_URL + 'skill/item_' + skill.imageUrl + '.jpg" alt="">\
            <span class="name">'+ skill.name +'</span><span class="num">' + level + '</span>\
          </li>';
        });

        $container.html(html);
      };

      initSkillList(skills);

      var $side = $panel.find('.jn .wxdetl');

      var sideInfo = function(skill) {
        $side.find('.show').html('<img src="' + config.IMAGE_URL + 'skill/item_' + skill.imageUrl + '.jpg" width="60">');
        $side.find('.name').html(skill.name);
        var $p = $side.find('.detl .u-ttvl');
        var sk = app.getCurPlayer().fightSkills[skill.id];
        var level = 0, needLevel = Number(skill.playerLevel);
        if (sk) {
          level = sk.level;
          needLevel = needLevel + sk.level * 5;
        }

        $p.eq(0).find('span').eq(1).html(level);
        $p.eq(1).find('span').eq(1).html('Hero Level: ' + needLevel);
        $p.eq(3).find('span').eq(1).html(skill.desc);
        $side.find('.opt .u-btn1').html(sk ? 'Upgrade' : 'Learn');
        $side.data('skill', skill);
      };

      sideInfo(skills[2]);

      var $li = $container.find('li').off().on('click', function() {
        $li.filter('.selected').removeClass('selected');
        var $this =  $(this).addClass('selected');
        sideInfo(skills[$this.data('id')]);
      });
      $li.eq(0).addClass('selected');

      $side.find('.opt .u-btn1').off().on('click', function() {
        var skill = $side.data('skill');
        var player = app.getCurPlayer();
        var psk = player.fightSkills[skill.id];
        var needLevel = skill.playerLevel * 1 + (psk ? psk.level * 5 : 0);

        if (player.level < needLevel) {
          window.alert("Hero's level is not enough!");
          return;
        } else if (player.skillPoint < 1) {
          window.alert("Hero's skill point is not enough!");
          return;
        }

        if (!psk) {
          pomelo.request('area.playerHandler.learnSkill', {skillId: skill.id}, function(data) {
            if (data.status) {
              player.fightSkills[skill.id] = data.skill;
              var $sli = $li.filter('.selected');
              $sli.find('span.num').html(1);
              var id = $sli.data('id');
              sideInfo(skills[id]);
              mainPanel.initSkillPanel();
            }
          });
        } else if(psk && psk.level > 0) {
          pomelo.request('area.playerHandler.upgradeSkill', {skillId: skill.id}, function(data) {
            if (data.status) {
              var level = player.fightSkills[skill.id].level + 1;
              player.fightSkills[skill.id].level = level;
              player.skillPoint -= 1;
              var $sli = $li.filter('.selected');
              $sli.find('span.num').html(level);
              var id = $sli.data('id');
              sideInfo(skills[id]);
              mainPanel.initSkillPanel();
            }
          });
        }
      });

    };

    //var set
    module.exports = {
      init: init,
      show: show,
      hide: hide,
      setAttack: setAttack,
      setAttackSpeed: setAttackSpeed,
      setAvatar: setAvatar,
      setCareer: setCareer,
      setDefence: setDefence,
      setDodgeRate: setDodgeRate,
      setHitRate: setHitRate,
      setHpBar: setHpBar,
      setMpBar: setMpBar,
      setLevel: setLevel,
      setName: setName,
      setWalkSpeed: setWalkSpeed,
      resetPlayerInfo: initPlayerInfo
    };
  }
};

