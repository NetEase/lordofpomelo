/**
 * Module dependencies
 */
 var util = require('util');
 var dataApi = require('../util/dataApi');
 var formula = require('../consts/formula');
 var consts = require('../consts/consts');
 var buff = require('./buff');
 var Persistent = require('./persistent');
 var logger = require('pomelo-logger').getLogger(__filename);

/**
 * Action of attack, attacker consume mp while target reduce.
 *
 * @param {Character} attacker
 * @param {Character} target
 * @param {Object} skill
 * @return {Object}
 * @api public
 */
var attack = function(attacker, target, skill) {
	if (attacker.entityId === target.entityId) {
		return {result: consts.AttackResult.ERROR};
	}
	//If missed
//	var missRate = attacker.hitRate * (1 - target.dodgeRag/100) / 100;
//	if(Math.random() < missRate){
//			return {result: consts.AttackResult.MISS, damage: 0, mpUse: skill.skillData.mp};
//	}

	var damageValue = formula.calDamage(attacker, target, skill);
	target.hit(attacker, damageValue);
	attacker.reduceMp(skill.skillData.mp);
	if (!!target.save) {
		target.save();
	}
	if (!!attacker.save) {
		attacker.save();
	}

	//If normal attack, use attack speed
	if(skill.skillId == 1){
		skill.coolDownTime = Date.now() + Number(skill.skillData.cooltime/attacker.attackSpeed*1000);
	}else{
		skill.coolDownTime = Date.now() + Number(skill.skillData.cooltime)*1000;
	}

	if (target.died) {
		var items = attacker.afterKill(target);
		return {result: consts.AttackResult.KILLED, damage: damageValue, mpUse: skill.skillData.mp, items: items};
	} else{
		return {result: consts.AttackResult.SUCCESS, damage: damageValue, mpUse: skill.skillData.mp};
	}
};

/**
 * Add buff to Character, attacker or target
 */
var addBuff = function(attacker, target, buff) {
	if (buff.target === 'attacker' && !attacker.died) {
		buff.use(attacker);
	} else if (buff.target === 'target' && !target.died) {
		buff.use(target);
	}
	return {result: consts.AttackResult.SUCCESS};
};

/**
 * Initialize a new 'FightSkill' with the given 'opts'.
 *
 * @param {Object} opts
 * @api public
 *
 */
var FightSkill = function(opts) {
	Persistent.call(this, opts);
	this.skillId = opts.skillId;
	this.level = opts.level;
	this.playerId = opts.playerId;
	this.skillData = dataApi.fightskill.findById(this.skillId);
	this.name = this.skillData.name;
	this.coolDownTime = 0;
};

util.inherits(FightSkill, Persistent);


/**
 * Check out fightskill for attacker.
 *
 * @param {Character} attacker
 * @param {Character} target
 * @return {Object}  NOT_IN_RANGE, NOT_COOLDOWN, NO_ENOUGH_MP
 */
FightSkill.prototype.judge = function(attacker, target) {
	if (!formula.inRange(attacker, target, this.skillData.distance)){
		return {result: consts.AttackResult.NOT_IN_RANGE, distance: this.skillData.distance};
	}
	if (this.coolDownTime > Date.now()) {
		return {result: consts.AttackResult.NOT_COOLDOWN};
	}
	if (this.mp < this.mp) {
		return {result: consts.AttackResult.NO_ENOUGH_MP};
	}
	return {result: consts.AttackResult.SUCCESS};
};


//Get upgradePlayerLevel
FightSkill.prototype.getUpgradePlayerLevel = function(){
	var upgradePlayerLevel = this.skillData.upgradePlayerLevel;
	return (this.level-1)*upgradePlayerLevel + this.skillData.playerLevel;
};

//Get attackParam
FightSkill.prototype.getAttackParam = function(){
	var value = this.skillData.attackParam*1 + (this.level-1)*this.skillData.upgradeParam;
	return value;
};

var AttackSkill = function(opts) {
	FightSkill.call(this, opts);
};
util.inherits(AttackSkill, FightSkill);

// Attack
AttackSkill.prototype.use = function(attacker, target) {
	var judgeResult = this.judge(attacker, target);
	if (judgeResult.result !== consts.AttackResult.SUCCESS){
		return judgeResult;
	}
	return attack(attacker, target, this);
};

var BuffSkill = function(opts) {
	FightSkill.call(this, opts);
	this.buff = opts.buff;
};

util.inherits(BuffSkill, FightSkill);

BuffSkill.prototype.use = function(attacker, target) {
	return addBuff(attacker, target, this.buff);
};

// both attack and buff
var AttackBuffSkill = function(opts) {
	FightSkill.call(this, opts);
	this.attackParam = opts.attackParam;
	this.buff = opts.buff;
};
util.inherits(AttackBuffSkill, FightSkill);

AttackBuffSkill.prototype.use = function(attacker, target) {
	var attackResult = attack(attacker, target, this);
	return attackResult;
};

// like BuffSkill, excep init on startup, and timeout is 0
var PassiveSkill = function(opts) {
	BuffSkill.call(this, opts);
};

util.inherits(PassiveSkill, BuffSkill);

var CommonAttackSkill = function(opts) {
	AttackSkill.call(this, opts);
};

util.inherits(CommonAttackSkill, AttackSkill);

/**
 * Create skill
 *
 * @param {Object}
 * @api public
 */
var create = function(skill) {
	var curBuff = buff.create(skill);
	skill.buff = curBuff;
	if (skill.type === 'attack'){
		return new AttackSkill(skill);
	} else if (skill.type === 'buff'){
		return new BuffSkill(skill);
	} else if (skill.type === 'attackBuff'){
		return new AttackBuffSkill(skill);
	} else if (skill.type === 'passive') {
		return new PassiveSkill(skill);
	}
	throw new Error('error skill type in create skill: ' + skill);
};

 module.exports.create = create;
 module.exports.FightSkill = FightSkill;
 module.exports.AttackSkill = AttackSkill;
 module.exports.BuffSkill = BuffSkill;
 module.exports.PassiveSkill = PassiveSkill;
 module.exports.AttackBuffSkill = AttackBuffSkill;
