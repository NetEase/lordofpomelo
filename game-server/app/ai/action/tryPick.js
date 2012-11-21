var bt = require('pomelo-bt');
var BTNode = bt.Node;
var util = require('util');
var consts = require('../../consts/consts');

/**
 * Try pick action.
 * 
 * @param opts {Object} {blackboard: blackboard}
 */
var Action = function(opts) {
	BTNode.call(this, opts.blackboard);
};
util.inherits(Action, BTNode);

module.exports = Action;

var pro = Action.prototype;

/**
 * Try to invoke the pick the item.
 * 
 * @return {Number} bt.RES_SUCCESS if success to pick the item;
 *					bt.RES_FAIL if any fails and set distanceLimit to blackboard stands for beyond the item distance.
 */
pro.doAction = function() {
	var character = this.blackboard.curCharacter;
	var targetId = this.blackboard.curTarget;
	var area = this.blackboard.area;

	var target = area.getEntity(targetId);

	if(!target) {
		// target has disappeared
		this.blackboard.curTarget = null;
		if(targetId === character.target) {
			character.target = null;
		}
		return bt.RES_FAIL;
	}

	if(targetId !== character.target || (target.type !== consts.EntityType.ITEM && target.type !== consts.EntityType.EQUIPMENT)) {
		// if target changed or is not pickable
		this.blackboard.curTarget = null;
		return bt.RES_FAIL;
	}

	var res = character.pickItem(target.entityId);
	if(res.result === consts.Pick.SUCCESS || 
		res.result === consts.Pick.VANISH ||
		res.result === consts.Pick.BAG_FULL) {
		this.blackboard.curTarget = null;
		character.target = null;
		return bt.RES_SUCCESS;
	}

	if(res.result === consts.Pick.NOT_IN_RANGE) {
		this.blackboard.distanceLimit = res.distance;
	}
	
	return bt.RES_FAIL;
};
