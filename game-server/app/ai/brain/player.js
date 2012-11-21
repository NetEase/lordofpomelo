var TryAndAdjust = require('../node/tryAndAdjust');
var TryAttack = require('../action/tryAttack');
var TryPick = require('../action/tryPick');
var TryTalkToNpc = require('../action/tryTalkToNpc');
var MoveToTarget = require('../action/moveToTarget');
var bt = require('pomelo-bt');
var Loop = bt.Loop;
var If = bt.If;
var Select = bt.Select;
var consts = require('../../consts/consts');

/**
 * Auto fight brain.
 * Attack the target if have any.
 * Choose the 1st skill in fight skill list or normal attack by defaul.
 */
var Brain = function(blackboard) {
	var attack = genAttackAction(blackboard);
	var pick = genPickAction(blackboard);
	var talkToNpc = genNpcAction(blackboard);

	var action = new Select({
		blackboard: blackboard
	});

	action.addChild(attack);
	action.addChild(pick);
	action.addChild(talkToNpc);

	//composite them together
	this.action = action;
};

var pro = Brain.prototype;

pro.update = function() {
	return this.action.doAction();
};

var genAttackAction = function(blackboard) {
	//try attack and move to target action
	var attack = new TryAndAdjust({
		blackboard: blackboard, 
		adjustAction: new MoveToTarget({
			blackboard: blackboard
		}), 
		tryAction: new TryAttack({
			blackboard: blackboard, 
			getSkillId: function(bb) {
				//return current skill or normal attack by default
				return bb.curCharacter.curSkill || 1;
			}
		})
	});

	//loop attack action
	var checkTarget = function(bb) {
		if(bb.curTarget !== bb.curCharacter.target) {
			// target has change
			bb.curTarget = null;
			return false;
		}

		return !!bb.curTarget;
	};

	var loopAttack = new Loop({
		blackboard: blackboard, 
		child: attack, 
		loopCond: checkTarget
	});

	//if have target then loop attack action
	var haveTarget = function(bb) {
		var character = bb.curCharacter;
		var targetId = character.target;
		var target = bb.area.getEntity(targetId);

		if(!target) {
			// target has disappeared
			character.forgetHater(targetId);
			bb.curTarget = null;
			return false;
		}

		if(target.type === consts.EntityType.MOB || 
			target.type === consts.EntityType.PLAYER) {
			bb.curTarget = targetId;
			return true;
		}
		return false;
	};

	return new If({
		blackboard: blackboard, 
		cond: haveTarget, 
		action: loopAttack
	});
};

var genPickAction = function(blackboard) {
	//try pick and move to target action
	var pick = new TryAndAdjust({
		blackboard: blackboard, 
		adjustAction: new MoveToTarget({
			blackboard: blackboard
		}), 
		tryAction: new TryPick({
			blackboard: blackboard 
		})
	});

	//if have target then pick it
	var haveTarget = function(bb) {
		var character = bb.curCharacter;
		var targetId = character.target;
		var target = bb.area.getEntity(targetId);

		if(!target) {
			// target has disappeared
			character.forgetHater(targetId);
			bb.curTarget = null;
			return false;
		}

		if(consts.isPickable(target)) {
			bb.curTarget = targetId;
			return true;
		}
		return false;
	};

	return new If({
		blackboard: blackboard, 
		cond: haveTarget, 
		action: pick
	});
};

var genNpcAction = function(blackboard) {
	//try talk and move to target action
	var pick = new TryAndAdjust({
		blackboard: blackboard, 
		adjustAction: new MoveToTarget({
			blackboard: blackboard
		}), 
		tryAction: new TryTalkToNpc({
			blackboard: blackboard 
		})
	});

	//if have target then pick it
	var haveTarget = function(bb) {
		var character = bb.curCharacter;
		var targetId = character.target;
		var target = bb.area.getEntity(targetId);

		if(!target) {
			// target has disappeared
			character.forgetHater(targetId);
			bb.curTarget = null;
			return false;
		}

		if(target.type === consts.EntityType.NPC) {
			bb.curTarget = targetId;
			return true;
		}
		return false;
	};

	return new If({
		blackboard: blackboard, 
		cond: haveTarget, 
		action: pick
	});
};

module.exports.clone = function(opts) {
	return new Brain(opts.blackboard);
};

module.exports.name = 'player';
