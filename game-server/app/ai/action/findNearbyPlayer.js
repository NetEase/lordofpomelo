var bt = require('pomelo-bt');

var Action = function(opts) {
	this.blackboard = opts.blackboard;
};

module.exports = Action;

var pro = Action.prototype;

/**
 * Find the near by player and hates the player.
 *
 * @return {Number} bt.RES_SUCCESS if find a player and hates him;
 *					bt.RES_FAIL if no player nearby.
 */
pro.doAction = function() {
	var character = this.blackboard.curCharacter;
	if(character.target || character.haters.length) {
		//have a target already
		return bt.RES_SUCCESS;
	}
 
	var area = this.blackboard.area;
	//TODO: remove magic range: 300
	var players = area.getEntitiesByPos({x: character.x, y: character.y}, ['player'], 300); 
	if(players && players.length) {
		//TODO: remove magic hate point: 5
		character.increaseHateFor(players[0].enitityId, 5);
		return bt.RES_SUCCESS;
	}
	//TODO: implements reset logic
	return bt.RES_FAIL;
};

module.exports.create = function() {
	return Action;
};
