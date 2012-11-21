var TryAndAdjust = require('../node/tryAndAdjust');
var TryAttack = require('../action/tryAttack');
var MoveToTarget = require('../action/moveToTarget');
//var FindNearbyPlayer = require('../action/findNearbyPlayer');
var Patrol = require('../action/patrol');
var bt = require('pomelo-bt');
var Loop = bt.Loop;
var If = bt.If;
var Select = bt.Select;
var consts = require('../../consts/consts');

/**
 * Tiger brain.
 * Attack the target if have any.
 * Find the nearby target if have no target.
 * Begin to patrol if nothing to do.
 */
var Brain = function(blackboard) {
	this.blackboard = blackboard;
	//try attack and move to target action
	var attack = new TryAndAdjust({
		blackboard: blackboard, 
		adjustAction: new MoveToTarget({
			blackboard: blackboard
		}), 
		tryAction: new TryAttack({
			blackboard: blackboard, 
			getSkillId: function(bb) {
				return 1; //normal attack
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

		if(target.type === consts.EntityType.PLAYER) {
			bb.curTarget = targetId;
			return true;
		}
		return false;
	};

	var attackIfHaveTarget = new If({
		blackboard: blackboard, 
		cond: haveTarget, 
		action: loopAttack
	});

	//find nearby target action
	//var findTarget = new FindNearbyPlayer({blackboard: blackboard});
	//patrol action
	var patrol = new Patrol({blackboard: blackboard});

	//composite them together
	this.action = new Select({
		blackboard: blackboard
	});

	this.action.addChild(attackIfHaveTarget);
	//this.action.addChild(findTarget);
	this.action.addChild(patrol);
};

var pro = Brain.prototype;

pro.update = function() {
	return this.action.doAction();
};

module.exports.clone = function(opts) {
	return new Brain(opts.blackboard);
};

module.exports.name = 'tiger';
