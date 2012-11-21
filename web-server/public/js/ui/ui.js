__resources__["/ui.js"] = {
  meta: {mimetype: "application/javascript"},

  data: function(exports, require, module, __filename, __dirname) {

    var mainPanel = require('mainPanelView');
    var playerPanel = require('playerPanelView');
    var bagPanel = require('bagPanelView');
    var taskPanel = require('taskPanelView');
    var equipmentsPanel = require('equipmentsPanelView');
    var app = require('app');

    exports.init = function() {
      mainPanel.init();

      // ui binding
      var player = app.getCurPlayer();

      player.removeAllListeners();

      player.on('change:hp', function() {
        mainPanel.setHpBar(player.hp, player.maxHp);
        playerPanel.setHpBar(player.hp, player.maxHp);
      });

      player.on('change:mp', function() {
        mainPanel.setMpBar(player.mp, player.maxMp);
        playerPanel.setMpBar(player.mp, player.maxMp);
      });

      player.on('change:experience', function() {
        mainPanel.setExp(player.experience, player.nextLevelExp);
      });

      player.on('change:nextLevelExp', function() {
        mainPanel.setExp(0, player.nextLevelExp);
        setTimeout(function() {
          mainPanel.setExp(player.experience, player.nextLevelExp);
        }, 100);
      });

      player.on('change:level', function() {
        mainPanel.setLevel(player.level);
        playerPanel.setLevel(player.level);
      });

      player.on('change:attackValue', function() {
        playerPanel.setAttack(player.getTotalAttack());
      });

      player.on('change:defenceValue', function() {
        playerPanel.setDefence(player.getTotalDefence());
      });

      player.on('change:hitRate', function() {
        playerPanel.setHitRate(player.hitRate);
      });

      player.on('change:dodgeRate', function() {
        playerPanel.setDodgeRate(player.dodgeRate);
      });

      player.on('change:walkSpeed', function() {
        playerPanel.setWalkSpeed(player.walkSpeed);
      });

      player.on('change:attackSpeed', function() {
        playerPanel.setAttackSpeed(player.attackSpeed);
      });

      player.on('change:curTasks', function() {
        taskPanel.initList();
      });

      var bag = player.bag;
      bag.on('addItem', function(index, item) {
        bagPanel.addItem(index, item);
        bagPanel.setCount();
      });

      bag.on('removeItem', function(index) {
        bagPanel.removeItem(index);
        bagPanel.setCount();
      });

      var equipments = player.equipments;
      equipments.on('equip', function(kind) {
        equipmentsPanel.equip(kind, equipments[kind]);
        player.emit('change:attackValue');
        player.emit('change:defenceValue');
      });

      equipments.on('unEquip', function(kind) {
        equipmentsPanel.unEquip(kind);
        player.emit('change:attackValue');
        player.emit('change:defenceValue');
      });
    };
}};
