__resources__["/curPlayer.js"] = {meta: {mimetype: "application/javascript"}, data: function(exports, require, module, __filename, __dirname) {
  /**
   * Module dependencies
   */
  var Player = require('player');
  var Bag = require('bag');
  var Equipments = require('equipments');
  var dataApi = require('dataApi');
  var Task = require('task');
  var taskHandler = require('taskHandler');

  /**
   * Initialize a new 'CurPlayer' with the given 'opts'.
   * curPlayer inherits Player
   * It is current player
   *
   * @param {Object} opts
   * @api public
   */
  var CurPlayer = function(opts){
    Player.call(this, opts);

    console.log('curPlayer ~ this.kindId = ', this.kindId);
    this.characterData = dataApi.character.findById(this.kindId);
    this.bag = new Bag(opts.bag);
    this.skillPoint = opts.skillPoint || 0;

    this.experience = opts.experience;
    this.attackValue = opts.attackValue;
    this.defenceValue = opts.defenceValue;
    this.hitRate = opts.hitRate;
    this.dodgeRate = opts.dodgeRate;
    this.attackSpeed = opts.attackSpeed;

    this.equipments = new Equipments(opts.equipments);
    this.fightSkills = {};
    this.nextLevelExp = opts.nextLevelExp;
    this.curTasks = getCurTasksInfo(opts.curTasks||[]);

    //Init fight skills
    for(var i = 0; i < opts.fightSkills.length; i++){
      var fs = opts.fightSkills[i];
      this.fightSkills[fs.id] = fs;
    }
  };

  /**
   * Expose 'CurPlayer' constructor.
   */
  module.exports = CurPlayer;

  CurPlayer.prototype = Object.create(Player.prototype);

  /**
   * Get curTasks' information.
   *
   * @param {Array} data
   * @return {Object} task list
   * @api private
   */

  var getCurTasksInfo = function(data) {
    var curTasks = {}, length = data.length;
    for (var i = 0; i < length; i ++) {
      var task = new Task(data[i]);
      curTasks[task.id] = task;
    }
    return curTasks;
  };

  CurPlayer.prototype.getTasks = function(cb) {
    var self = this;
    for(var key in self.curTasks) {
      cb(self.curTasks);
      return;
    }
    taskHandler.exec('getNewTask', {}, cb);
  };

  //Add item to bag
  CurPlayer.prototype.addItem = function(item){
    this.bag.addItem(item);
  };

  //Remove item from bag
  CurPlayer.prototype.dropItem = function(index) {
    this.bag.removeItem(index);
  };

  /**
   * Use Item and update player's state: hp and mp,
   *
   * @param {Number} index
   * @api public
   */

  CurPlayer.prototype.useItem = function(index) {
    var item = this.bag.items[index];

    if (item && item.type === 'item') {
      item = dataApi.item.findById(item.id);
      if (item.hp > 0) {
        this.recoverHp(item.hp);
      }

      if (item.mp > 0) {
        this.recoverMp(item.mp);
      }

      this.bag.removeItem(index);
      this.getSprite().reduceBlood();
    }
  };

  //Get weaponAttack value.
  CurPlayer.prototype.getWeaponAttack = function() {
    var attack = 0;

    for(var key in this.equipments){
      var equip = dataApi.equipment.findById(this.equipments[key]);
      if(!!equip){
        attack += Number(equip.attackValue);
      }
    }

    return attack;
  };

  //Get armorDefence value.
  CurPlayer.prototype.getArmorDefence = function() {
    var defence = 0;

    for(var key in this.equipments){
      var equip = dataApi.equipment.findById(this.equipments[key]);
      if(!!equip){
        defence += Number(equip.defenceValue);
      }
    }

    return defence;
  };

  /**
   * Start task.
   * Add a new task to the task list, and emit the event 'change:curTasks'
   *
   * @param {Task} task, new task to be implement
   * @api public
   */
  CurPlayer.prototype.startTask = function(task) {
    this.curTasks[task.id] = task;
    this.emit('change:curTasks');
  };

  /**
   * Handover tasks.
   * Handover tasks after curTask is completed, and emit the event 'change:curTasks'
   *
   * @param {Array} ids
   * @api public
   */
  CurPlayer.prototype.handoverTasks = function(ids) {
    if (!ids || ids.length < 1) {
      return;
    }
    var length = ids.length;
    for (var i = 0; i < length; i ++) {
      var id = ids[i];
      delete this.curTasks[id];
    }
    this.emit('change:curTasks');
  };

  //Get total attack value
  CurPlayer.prototype.getTotalAttack = function() {
    return this.getWeaponAttack() + this.attackValue;
  };

  //Get total defence value
  CurPlayer.prototype.getTotalDefence = function() {
    return this.getArmorDefence() + this.defenceValue;
  };

  //Update player's data
  CurPlayer.prototype.update = function(msg) {
    var damage = msg.damage || 0;
    var mpUse = msg.mpUse || 0;
    this.set('hp', this.hp - damage);
    this.set('mp', this.mp - mpUse);

    if (msg.experience){
      this.set('experience', msg.experience);
    }
  };

  //Update task's data
  CurPlayer.prototype.updateTaskData = function(data) {
    var tasks = this.curTasks;
    for( var id in data) {
      var task = tasks[id];
      task.taskData = data[id];
    }
    this.emit('change:curTasks');
  };

  /**
   * Upgrade and update the player's state
   * when it upgrades, the state such as hp, mp, defenceValue etc will be update
   *
   * @api public
   */
  CurPlayer.prototype.upgrade = function(msg) {
    this.setMaxMp(msg.maxMp);
    this.setMaxHp(msg.maxHp);
    this.set('level', msg.level);
    this.set('experience', msg.experience);
    this.set('attackValue', msg.attackValue);
    this.set('defenceValue', msg.defenceValue);
    this.set('walkSpeed', msg.walkSpeed);
    this.set('attackSpeed', msg.attackSpeed);
    this.set('nextLevelExp', msg.nextLevelExp);
  };
}};
