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
 * Try to invoke the talk to npc action.
 * 
 * @return {Number} bt.RES_SUCCESS if success to talk to npc;
 *					bt.RES_FAIL if any fails and set distanceLimit to blackboard stands for beyond the npc distance.
 */
pro.doAction = function() {
	var character = this.blackboard.curCharacter;
	var targetId = this.blackboard.curTarget;
	var area = this.blackboard.area;

	var target = area.getEntity(targetId);

	if(!target) {
		// if target has disappeared
		this.blackboard.curTarget = null;
		if(targetId === character.target) {
			character.target = null;
		}
		return bt.RES_FAIL;
	}

	if(target.type !== consts.EntityType.NPC) {
		// target has changed
		this.blackboard.curTarget = null;
		return bt.RES_FAIL;
	}

	var res = target.talk(character);
	if(res.result === consts.NPC.SUCCESS) {
		this.blackboard.curTarget = null;
		character.target = null;
		return bt.RES_SUCCESS;
	}

	if(res.result === consts.NPC.NOT_IN_RANGE) {
		this.blackboard.distanceLimit = res.distance;
	}
	
	return bt.RES_FAIL;
};
