var bt = require('pomelo-bt');
var BTNode = bt.Node;
var util = require('util');
var formula = require('../../consts/formula');
var consts = require('../../consts/consts');

var Action = function(opts) {
	BTNode.call(this, opts.blackboard);
};
util.inherits(Action, BTNode);

module.exports = Action;

var pro = Action.prototype;

/**
 * Move the character to the target.
 *
 * @return {Number} bt.RES_SUCCESS if the character already next to the target;
 *					bt.RES_WAIT if the character need to move to the target;
 *					bt.RES_FAIL if any fails
 */
pro.doAction = function() {
	var character = this.blackboard.curCharacter;
	var targetId = this.blackboard.curTarget;
	var distance = this.blackboard.distanceLimit || 200;
	var target = this.blackboard.area.getEntity(targetId);

	if(!target) {
		// target has disappeared or died
		character.forgetHater(targetId);
		return bt.RES_FAIL;
	}

	if(targetId !== character.target) {
		//target has changed
		this.blackboard.curTarget = null;
		this.blackboard.distanceLimit = 0;
		this.blackboard.targetPos = null;
		this.blackboard.moved = false;
		return bt.RES_FAIL;
	}

	if(formula.inRange(character, target, distance)) {
		this.blackboard.area.timer.abortAction('move', character.entityId);
		this.blackboard.distanceLimit = 0;
		this.blackboard.moved = false;
		return bt.RES_SUCCESS;
	}

	if(character.type === consts.EntityType.MOB) {
		if(Math.abs(character.x - character.spawnX) > 500 ||
			Math.abs(character.y - character.spawnY) > 500) {
			//we move too far and it is time to turn back
			character.forgetHater(targetId);
			this.blackboard.moved = false;
			return bt.RES_FAIL;
		}
	}


	var targetPos = this.blackboard.targetPos;
	var closure = this;

	if(!this.blackboard.moved){
		character.move(target.x, target.y, false, function(err, result){
			if(err || result === false){
				closure.blackboard.moved = false;
				character.target = null;
			}
		});

		this.blackboard.targetPos = {x: target.x, y : target.y};
		this.blackboard.moved = true;
	} else if(targetPos && (targetPos.x !== target.x || targetPos.y !== target.y)) {
		var dis1 = formula.distance(targetPos.x, targetPos.y, target.x, target.y);
		var dis2 = formula.distance(character.x, character.y, target.x, target.y);

		//target position has changed
		if(((dis1 * 3 > dis2) && (dis1 < distance)) || !this.blackboard.moved){
			targetPos.x = target.x;
			targetPos.y = target.y;

			character.move(target.x, target.y, false, function(err, result){
				if(err || result === false){
					closure.blackboard.moved = false;
					character.target = null;
				}
			});
		}
	}
	return bt.RES_WAIT;
};

module.exports.create = function() {
	return Action;
};
