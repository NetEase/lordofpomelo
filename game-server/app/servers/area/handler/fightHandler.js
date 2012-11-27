/**
 * Module dependencies
 */
var handler = module.exports;
var consts = require('../../../consts/consts');
var area = require('../../../domain/area/area');
var timer = require('../../../domain/area/timer');
var logger = require('pomelo-logger').getLogger(__filename);
var Fightskill = require('../../../util/dataApi').fightskill;
var Code = require('../../../../../shared/code');
/**
 * Action of attack.
 * Handle the request from client, and response result to client
 * if error, the code is consts.MESSAGE.ERR. Or the code is consts.MESSAGE.RES
 *
 * @param {Object} msg
 * @param {Object} session
 * @api public
 */
handler.attack = function(msg, session, next) {
	var player = area.getPlayer(session.get('playerId'));
	var target = area.getEntity(msg.targetId);
	
	if(!target || !player || (player.target === target.entityId) || (player.entityId === target.entityId) || target.died){
		next();
		return;
	}
	
	timer.abortAction('move', player.entityId);
	player.target = target.entityId;
	
	next();
};

/**
 * Player attacks his target with the skill.
 * Handle the request from client, and response result to client
 * if target exists, move to player.attack, or return.
 *
 * @param {Object} msg
 * @param {Object} session
 * @api public
 */
handler.useSkill = function(msg, session, next) {
	var playerId = msg.playerId;
	var skillId = msg.skillId;
	var player = area.getPlayer(msg.playerId);
	var target = area.getEntity(player.target);
	if (!target || (target.type != consts.EntityType.PLAYER && target.type != consts.EntityType.MOB)) {
		next();
		return;
	}
	
	next();
	player.attack(target, skillId);
};


