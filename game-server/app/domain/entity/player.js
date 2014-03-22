/**
 * Module dependencies
 */
var util = require('util');
var dataApi = require('../../util/dataApi');
var formula = require('../../consts/formula');
var consts = require('../../consts/consts');
var EntityType = require('../../consts/consts').EntityType;
var TaskType = require('../../consts/consts').TaskType;
var TaskState = require('../../consts/consts').TaskState;
var Character = require('./character');
var fightskillDao = require('../../dao/fightskillDao');
var taskDao = require('../../dao/taskDao');
var fightskill = require('./../fightskill');
var logger = require('pomelo-logger').getLogger(__filename);
var pomelo = require('pomelo');
var utils = require('../../util/utils');
var underscore = require('underscore');

/**
 * Initialize a new 'Player' with the given 'opts'.
 * Player inherits Character
 *
 * @param {Object} opts
 * @api public
 */
var Player = function(opts) {
  Character.call(this, opts);
  this.id = Number(opts.id);
  this.type = EntityType.PLAYER;
  this.userId = opts.userId;
  this.name = opts.name;
  this.equipments = opts.equipments;
  this.bag = opts.bag;
  this.skillPoint = opts.skillPoint || 0;
  var _exp = dataApi.experience.findById(this.level+1);
  if (!!_exp) {
    this.nextLevelExp = dataApi.experience.findById(this.level+1).exp;
  } else {
    this.nextLevelExp = 999999999;
  }
  this.roleData = dataApi.role.findById(this.kindId);
  this.curTasks = opts.curTasks;
  this.range = opts.range || 2;
  // player's team id, default 0(not in any team).
  this.teamId = consts.TEAM.TEAM_ID_NONE;
  // is the team captain, default false
  this.isCaptain = consts.TEAM.NO;
  // game copy flag
  this.isInTeamInstance = false;
  this.instanceId = 0;

  this.setTotalAttackAndDefence();
};

util.inherits(Player, Character);

/**
 * Expose 'Player' constructor.
 */
module.exports = Player;

//emit the event 'died' after it is died
Player.prototype.afterDied = function() {
  this.emit('died', this);
};

//Add experience add Drop out items after it kills mob
Player.prototype.afterKill = function(target) {
  var items = null;
  if (target.type === EntityType.MOB) {
    this.addExperience(target.getKillExp(this.level));
    items = target.dropItems(this);
  }

  return items;
};

//Add experience
Player.prototype.addExperience = function(exp) {
  this.experience += exp;
  if (this.experience >= this.nextLevelExp) {
    this.upgrade();
  }
  this.save();
};

/**
 * Upgrade and update the player's state
 * when it upgrades, the state such as hp, mp, defenceValue etc will be update
 * emit the event 'upgrade'
 *
 * @api public
 */
Player.prototype.upgrade = function() {
  while (this.experience >= this.nextLevelExp) {
    //logger.error('player.upgrade ' + this.experience + ' nextLevelExp: ' + this.nextLevelExp);
    this._upgrade();
  }
  this.emit('upgrade');
};

// update team member info
Player.prototype.updateTeamMemberInfo = function() {
  if (this.teamId > consts.TEAM.TEAM_ID_NONE) {
    utils.myPrint('UpdateTeamMemberInfo is running ...');
    var memberInfo = this.toJSON4TeamMember();
    memberInfo.needNotifyElse = true;
    pomelo.app.rpc.manager.teamRemote.updateMemberInfo(null, memberInfo,
      function(err, ret) {
      });
  }
};

//Upgrade, update player's state
Player.prototype._upgrade = function() {
  this.level += 1;
  this.maxHp += Math.round(this.characterData.upgradeParam * this.characterData.hp);
  this.maxMp += Math.round(this.characterData.upgradeParam * this.characterData.mp);
  this.hp = this.maxHp;
  this.mp = this.maxMp;
  this.attackValue += Math.round(this.characterData.upgradeParam * this.characterData.attackValue);
  this.defenceValue += Math.round(this.characterData.upgradeParam * this.characterData.defenceValue);
  this.experience -= this.nextLevelExp;
  this.skillPoint += 1;
  this.nextLevelExp = dataApi.experience.findById(this.level+1).exp;
  this.setTotalAttackAndDefence();
  this.updateTeamMemberInfo();
};

Player.prototype.setTotalAttackAndDefence = function() {
  var attack = 0, defence = 0;

  for (var key in this.equipments) {
    if(!this.equipments.isEquipment(key)) {
      continue;
    }
    var equip = dataApi.equipment.findById(this.equipments[key]);
    if (!!equip) {
      attack += Number(equip.attackValue);
      defence += Number(equip.defenceValue);
    }
  }

  //logger.error('defence :%j, %j', this.getDefenceValue() , defence);
  this.totalAttackValue = this.getAttackValue() + attack;
  this.totalDefenceValue = this.getDefenceValue() + defence;
};

/**
 * Equip equipment.
 *
 * @param {String} kind
 * @param {Number} equipId
 * @api public
 */
Player.prototype.equip = function(kind, equipId) {
  var index = -1;
  var curEqId = this.equipments.get(kind);
  this.equipments.equip(kind, equipId);

  if (curEqId > 0) {
    index = this.bag.addItem({id: curEqId, type: 'equipment'});
  }
  this.setTotalAttackAndDefence();

  return index;
};

/**
 * Unequip equipment by kind.
 *
 * @param {Number} kind
 * @api public
 */
Player.prototype.unEquip = function(kind) {
  this.equipments.unEquip(kind);
  this.setTotalAttackAndDefence();
};

/**
 * Use Item and update player's state: hp and mp,
 *
 * @param {Number} index
 * @return {Boolean}
 * @api public
 */
Player.prototype.useItem = function(index) {
  var item = this.bag.get(index);
  if (!item || item.type !== 'item') {
    return false;
  }
  var itm = dataApi.item.findById(item.id);
  if (itm) {
    this.recoverHp(itm.hp);
    this.recoverMp(itm.mp);
    this.updateTeamMemberInfo();
  }
  this.bag.removeItem(index);
  return true;
};

/**
 * Learn a new skill.
 *
 * @param {Number} skillId
 * @param {Function} callback
 * @return {Blooean}
 * @api public
 */
Player.prototype.learnSkill = function(skillId, callback) {
  var skillData = dataApi.fightskill.findById(skillId);
  if (this.level < skillData.playerLevel || !!this.fightSkills[skillId]) {
    return false;
  }
  var fightSkill = fightskill.create({skillId: skillId, level: 1, playerId: this.id, type:'attack'});
  this.fightSkills[skillId] = fightSkill;
  fightskillDao.add(fightSkill, callback);
  return true;
};

/**
 * Upgrade the existing skill.
 *
 * @param {Number} skillId
 * @return {Boolean}
 * @api public
 */
Player.prototype.upgradeSkill = function(skillId) {
  var fightSkill = this.fightSkills[skillId];

  if (!fightSkill || this.skillPoint <= 0 || this.level < fightSkill.skillData.playerLevel * 1 + fightSkill.level * 5) {
    return false;
  }
  fightSkill.level += 1;
  this.skillPoint--;
  fightskillDao.update(fightSkill);
  return true;
};

/**
 * Pick item.
 * It exists some results: NOT_IN_RANGE, VANISH, BAG_FULL, SUCCESS
 *
 * @param {Number} entityId
 * @return {Object}
 * @api public
 */
Player.prototype.pickItem = function(entityId) {
  var item = this.area.getEntity(entityId);

  var result = {player : this, item : item};

  if(!item) {
    result.result = consts.Pick.VANISH;
    this.emit('pickItem', result);
    return result;
  }

  // TODO: remove magic pick distance 200
  if(!formula.inRange(this, item, 200)) {
    result.distance = 200;
    result.result = consts.Pick.NOT_IN_RANGE;
    return result;
  }

  var index = this.bag.addItem({id: item.kindId, type: item.type});
  if (index < 1) {
    result.result = consts.Pick.BAG_FULL;
    this.emit('pickItem', result);
    return result;
  }

  result.index = index;
  result.result = consts.Pick.SUCCESS;
  this.emit('pickItem', result);
  return result;
};

// Emit the event 'save'.
Player.prototype.save = function() {
  this.emit('save');
};

/**
 * Start task.
 * Start task after accept a task, and update the task' state, such as taskState, taskData, startTime
 *
 * @param {Task} task, new task to be implement
 * @api public
 */
Player.prototype.startTask = function(task) {
  task.taskState = TaskState.NOT_COMPLETED;
  task.taskData = {
    'mobKilled': 0,
    'playerKilled': 0
  };
  task.startTime = formula.timeFormat(new Date());
  task.save();
  var id = task.id;
  this.curTasks[id] = task;
};

/**
 * Handover task.
 * Handover task after curTask is completed, and upgrade the tasks' state
 *
 * @param {Array} taskIds
 * @api public
 */
Player.prototype.handOverTask = function(taskIds) {
  var length = taskIds.length;
  for (var i = 0; i < length; i++) {
    var id = taskIds[i];
    var task = this.curTasks[id];
    task.taskState = TaskState.COMPLETED;
    task.save();
    // delete this.curTasks[id];
  }
};

/**
 * Recover hp if not in fight state
 *
 */
Player.prototype.recover = function(lastTick){
  var time = Date.now();

  if(!this.isRecover){
    this.revocerWaitTime -= 100;
  }

  this.hp += (time - lastTick)/ this.maxHp;
  if(this.hp >= this.maxHp){
    this.hp = this.maxHp;
    this.isRecover = false;
  }
  this.updateTeamMemberInfo();
};

//Complete task and tasks' state.
Player.prototype.completeTask = function(taskId) {
  var task = this.curTasks[taskId];
  task.taskState = TaskState.COMPLETED_NOT_DELIVERY;
  task.save();
};

//Convert player' state to json and return
Player.prototype.strip = function() {
  return {
    id: this.id,
    entityId: this.entityId,
    name: this.name,
    kindId: this.kindId,
    kindName: this.kindName,
    type: this.type,
    x: Math.floor(this.x),
    y: Math.floor(this.y),
    hp: this.hp,
    mp: this.mp,
    maxHp: this.maxHp,
    maxMp: this.maxMp,
    level: this.level,
    experience: this.experience,
    attackValue: this.attackValue,
    defenceValue: this.defenceValue,
    walkSpeed: this.walkSpeed,
    attackSpeed: this.attackSpeed,
    areaId: this.areaId,
    hitRate: this.hitRate,
    dodgeRate: this.dodgeRate,
    nextLevelExp: this.nextLevelExp,
    skillPoint: this.skillPoint,
    teamId: this.teamId,
    isCaptain: this.isCaptain
  };
};

/**
 * Get the whole information of player, contains tasks, bag, equipments information.
 *
 *	@return {Object}
 *	@api public
 */
Player.prototype.getInfo = function() {
  var playerData = this.strip();
  playerData.bag = this.bag.getData();
  playerData.equipments = this.equipments;
  playerData.fightSkills = this.getFightSkillData();
  playerData.curTasks = this._getCurTasksInfo();

  return playerData;
};

//Check out the haters and judge the entity given is hated or not
Player.prototype.isHate = function(entityId) {
  return !!this.haters[entityId];
};

/**
 * Increase hate points for the entity.
 * @param {Number} entityId
 * @param {Number} points
 * @api public
 */
Player.prototype.increaseHateFor = function(entityId, points) {
  points = points || 1;
  if(!!this.haters[entityId]) {
    this.haters[entityId] += points;
  } else {
    this.haters[entityId] = points;
  }
};

//Get the most hater
Player.prototype.getMostHater = function() {
  var entityId = 0, hate = 0;
  for(var id in this.haters) {
    if(this.haters[id] > hate) {
      entityId = id;
      hate = this.haters[id];
    }
  }

  if(entityId <= 0) {
    return null;
  }
  return this.area.getEntity(entityId);
};

// Forget the hater
Player.prototype.forgetHater = function(entityId) {
  if(!!this.haters[entityId]) {
    delete this.haters[entityId];
    if(this.target === entityId) {
      this.target =	null;
    }
  }
};

/**
 * Add cb to each hater.
 *
 * @param {Function} cb
 * @api public
 */
Player.prototype.forEachHater = function(cb) {
  for(var id in this.haters) {
    var hater = this.area.getEntity(id);
    if(hater) {
      cb(hater);
    } else {
      this.forgetHater(id);
    }
  }
};

Player.prototype.setEquipments = function(equipments){
  this.equipments = equipments;
  this.setTotalAttackAndDefence();
};

/**
 * Get part of curTasks information.
 * It aims to be passed to client
 * @return {Object}
 * @api private
 */
Player.prototype._getCurTasksInfo = function() {
  var reTasks = [];
  if (this.curTasks) {
    for(var id in this.curTasks) {
      var task = this.curTasks[id];
      var cc = underscore.pairs(task.completeCondition)[0];
      reTasks.push({
        acceptTalk: task.acceptTalk,
        workTalk: task.workTalk,
        finishTalk: task.finishTalk,
        item: task.item,
        name: task.name,
        id: task.id,
        exp: task.exp,
        taskData: JSON.stringify(task.taskData),
        taskState: task.taskState,
        completeCondition: JSON.stringify(task.completeCondition)
      });
    }
  }
  return reTasks;
};

/**
 * Parse String to json.
 * It covers object' method
 *
 * @param {String} data
 * @return {Object}
 * @api public
 */
Player.prototype.toJSON = function() {
  return {
    id: this.id,
    entityId: this.entityId,
    name: this.name,
    kindId: this.kindId,
    kindName: this.kindName,
    type: this.type,
    x: this.x,
    y: this.y,
    hp: this.hp,
    mp: this.mp,
    maxHp: this.maxHp,
    maxMp: this.maxMp,
    level: this.level,
    walkSpeed: this.walkSpeed,
    areaId: this.areaId,
    range: this.range,
    teamId: this.teamId,
    isCaptain: this.isCaptain
  };
};

/**
 * Parse String to json for joining a team.
 *
 * @return {Object}
 * @api public
 */
Player.prototype.toJSON4Team = function() {
  return {
    id: this.id,
    name: this.name,
    level: this.level,
    teamId: this.teamId
  };
};

/**
 * Parse String to json for team member.
 *
 * @return {Object}
 * @api public
 */
Player.prototype.toJSON4TeamMember = function() {
  return {
    playerId: this.id,
    areaId: this.areaId,
    playerData: {
      name: this.name,
      kindId: this.kindId,
      hp: this.hp,
      mp: this.mp,
      maxHp: this.maxHp,
      maxMp: this.maxMp,
      level: this.level,
      teamId: this.teamId,
      isCaptain: this.isCaptain,
      instanceId: this.instanceId // game copy id
    }
  };
};

// player joins a team
Player.prototype.joinTeam = function(teamId) {
  if(!teamId || teamId === consts.TEAM.TEAM_ID_NONE) {
    return false;
  }
  this.teamId = teamId;
  return true;
};

// player leaves the team
Player.prototype.leaveTeam = function() {
  if(this.teamId === consts.TEAM.TEAM_ID_NONE) {
    return false;
  }
  this.teamId = consts.TEAM.TEAM_ID_NONE;
  return true;
};

// check if player in a team
Player.prototype.isInTeam = function() {
  return (this.teamId !== consts.TEAM.TEAM_ID_NONE);
};

