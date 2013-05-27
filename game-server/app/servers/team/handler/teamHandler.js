/**
 * Module dependencies
 */

var area = require('../../../domain/area/area');
var Team = require('../../../domain/entity/team');
var messageService = require('../../../domain/messageService');
var userDao = require('../../../dao/userDao');
var logger = require('pomelo-logger').getLogger(__filename);
var pomelo = require('pomelo');
var consts = require('../../../consts/consts');
var dataApi = require('../../../util/dataApi');

var handler = module.exports;

// global team container(teamId:teamObj)
var gTeamObjDict = {};
// global team id
var gTeamId = 1;
// team member title(member/captain)
var TEAM_TITLE = {
	MEMBER  : 0,
	CAPTAIN : 1,	
};
// player's replying code
var JOIN_TEAM_REPLY = {
	REJECT : 0,
	ACCEPT : 1,	
};
/**
 * Player create a team, and response the result information : success(1)/failed(0)
 *
 * @param {Object} msg
 * @param {Object} session
 * @param {Function} next
 * @api public
 */
handler.createTeam = function(msg, session, next) {
	var playerId = session.get('playerId');
	var player = area.getPlayer(playerId);

	var result = consts.TEAM.JOIN_TEAM_RET_CODE.SYS_ERROR;

	if(!player) {
    logger.warn('The request(createTeam) is illegal, the player is null : msg = %j.', msg);
		next();
		return;
	}

	var teamObj = new Team(++gTeamId);

	result = teamObj.addPlayer(playerId);
	if(result === consts.TEAM.JOIN_TEAM_RET_CODE.OK) {
		teamObj.setCaptainId(playerId);
		gTeamObjDict[teamObj.teamId] = teamObj;
	}

  next(null, {result : result});
};

/**
 * Captain disband the team, and response the result information : success(1)/failed(0)
 *
 * @param {Object} msg
 * @param {Object} session
 * @param {Function} next
 * @api public
 */
handler.disbandTeam = function(msg, session, next) {
	var playerId = session.get('playerId');
	var player = area.getPlayer(playerId);

	var result = false;

	if(!player) {
    logger.warn('The request(disbandTeam) is illegal, the player is null : msg = %j.', msg);
		next();
		return;
	}

  var teamObj = gTeamObjDict[msg.teamId];
	if(!teamObj) {
    logger.warn('The request(disbandTeam) is illegal, the team is null : msg = %j.', msg);
		next(null, {result : result});
		return;
	}

	if(playerId !== teamObj.captainId) {
    logger.warn('The request(disbandTeam) is illegal, the player is not the captain : msg = %j.', msg);
		next(null, {result : result});
		return;
	}

	result = teamObj.disbandTeam();
	if(result) {
		delete gTeamObjDict[msg.teamId];
	}

  next(null, {result : result});
};

/**
 * Notify: Captain invite a player to join the team, and push invitation to the invitee
 *
 * @param {Object} msg
 * @param {Object} session
 * @param {Function} next
 * @api public
 */
handler.inviteJoinTeam = function(msg, session, next) {
	var playerId = session.get('playerId');
	var player = area.getPlayer(playerId);

	var result = false;

	if(!player) {
    logger.warn('The request(inviteJoinTeam) is illegal, the player is null : msg = %j.', msg);
		next();
		return;
	}

	var teamObj = gTeamObjDict[player.teamId];
	if(!teamObj) {
    logger.warn('The request(inviteJoinTeam) is illegal, the team is null : msg = %j.', msg);
		next();
		return;
	}

	if(playerId !== teamObj.captainId) {
    logger.warn('The request(inviteJoinTeam) is illegal, the player is not the captain : msg = %j.', msg);
		next();
		return;
	}

	if(!teamObj.isTeamHasPosition()) {
		next();
		return;
	}

	var invitee = area.getPlayer(msg.inviteeId);
	if(!invitee) {
    logger.warn('The request(inviteJoinTeam) is illegal, the invitee is null : msg = %j.', msg);
		next();
		return;
	}

	var infoObj = player.toJSON4Team(true);

	// send invitation to the invitee
	messageService.pushMessageToPlayer({uid : invitee.userId, sid : invitee.serverId}, 'onInviteJoinTeam', infoObj);
};

/**
 * Request: invitee reply to join the team's captain, response the result, and push msg to the team members
 *
 * @param {Object} msg
 * @param {Object} session
 * @param {Function} next
 * @api public
 */
handler.inviteJoinTeamReply = function(msg, session, next) {
	var playerId = session.get('playerId');
	var player = area.getPlayer(playerId);

	if(!player) {
    logger.warn('The request(inviteJoinTeamReply) is illegal, the player is null : msg = %j.', msg);
		next();
		return;
	}

	var teamObj = gTeamObjDict[msg.teamId];
	if(!teamObj) {
    logger.warn('The request(inviteJoinTeamReply) is illegal, the team is null : msg = %j.', msg);
		next();
		return;
	}

	if(msg.captainId !== teamObj.captainId) {
    logger.warn('The request(inviteJoinTeamReply) is illegal, the player is not the captain : msg = %j.', msg);
		next();
		return;
	}

	var captainObj = area.getPlayer(msg.captainId);
	if(!captainObj) {
    logger.warn('The request(inviteJoinTeamReply) is illegal, the captain is null : msg = %j.', msg);
		next();
		return;
	}

	if(msg.reply === JOIN_TEAM_REPLY.ACCEPT) {
		var result = teamObj.addPlayer(playerId);
		next(null, {result : result});
	} else {
		// push tmpMsg to the inviter(the captain) that the invitee reject to join the team
		var tmpMsg = {
			reply : false
		};
		messageService.pushMessageToPlayer({uid : captainObj.userId, sid : captainObj.serverId}, 'onInviteJoinTeamReply', tmpMsg);
	}
  next();
};

/**
 * Notify: applicant apply to join the team, and push the application to the captain
 *
 * @param {Object} msg
 * @param {Object} session
 * @param {Function} next
 * @api public
 */
handler.applyJoinTeam = function(msg, session, next) {
	var playerId = session.get('playerId');
	var player = area.getPlayer(playerId);

	if(!player) {
    logger.warn('The request(applyJoinTeam) is illegal, the player is null : msg = %j.', msg);
		next();
		return;
	}

	if(player.isInTeam()) {
		next();
		return;
	}

	var teamObj = gTeamObjDict[msg.teamId];
	if(!teamObj) {
    logger.warn('The request(applyJoinTeam) is illegal, the team is null : msg = %j.', msg);
		next();
		return;
	}

	if(!teamObj.isTeamHasPosition()) {
		next();
		return;
	}

	var captainObj = area.getPlayer(teamObj.captainId);
	if(!captainObj) {
    logger.warn('The request(applyJoinTeam) is illegal, the captain is null : msg = %j.', msg);
		next();
		return;
	}

	var infoObj = player.toJSON4Team();
	// send the application to the captain
	messageService.pushMessageToPlayer({uid : captainObj.userId, sid : captainObj.serverId}, 'onApplyJoinTeam', infoObj);
  next();
};
	
/**
 * Notify: captain replys the application, and push msg to the team members(accept) or only the applicant(reject)
 *
 * @param {Object} msg
 * @param {Object} session
 * @param {Function} next
 * @api public
 */
handler.applyJoinTeamReply = function(msg, session, next) {
	var playerId = session.get('playerId');
	var player = area.getPlayer(playerId);

	if(!player) {
    logger.warn('The request(applyJoinTeamReply) is illegal, the player is null : msg = %j.', msg);
		next();
		return;
	}

	var teamObj = gTeamObjDict[msg.teamId];
	if(!teamObj) {
    logger.warn('The request(applyJoinTeamReply) is illegal, the team is null : msg = %j.', msg);
		next();
		return;
	}

	if(playerId !== teamObj.captainId) {
    logger.warn('The request(applyJoinTeamReply) is illegal, the player is not the captain : msg = %j.', msg);
		next();
		return;
	}

	var applicant = area.getPlayer(msg.applicantId);
	if(!applicant) {
    logger.warn('The request(applyJoinTeamReply) is illegal, the applicant is null : msg = %j.', msg);
		next();
		return;
	}

	if(applicant.isInTeam()) {
		next();
		return;
	}

	if(msg.reply === JOIN_TEAM_REPLY.ACCEPT) {
		var result = teamObj.addPlayer(msg.applicantId);
		next(null, {result : result});
	} else {
		// push tmpMsg to the applicant that the capatain rejected
		var tmpMsg = {
			reply : false
		};
		messageService.pushMessageToPlayer({uid : applicant.userId, sid : applicant.serverId}, 'onApplyJoinTeamReply', tmpMsg);
	}
  next();
};

// check member num when a member leaves the team,
// if there is no member in the team,
// disband the team automatically
function try2DisbandTeam(teamObj) {
	if(!teamObj.isTeamHasMember()) {
		delete gTeamObjDict[teamObj.teamId];
	}
}

/**
 * Captain kicks a team member, and push info to the kicked member and other members
 *
 * @param {Object} msg
 * @param {Object} session
 * @param {Function} next
 * @api public
 */
handler.kickOutOfTeam = function(msg, session, next) {
	var playerId = session.get('playerId');
	var player = area.getPlayer(playerId);

	if(!player) {
    logger.warn('The request(kickOutOfTeam) is illegal, the player is null : msg = %j.', msg);
		next();
		return;
	}

	if(playerId === msg.kickedPlayerId) {
		next();
		return;
	}

  var teamObj = gTeamObjDict[msg.teamId];
	if(!teamObj) {
    logger.warn('The request(kickOutOfTeam) is illegal, the team is null : msg = %j.', msg);
		next();
		return;
	}

	if(playerId !== teamObj.captainId) {
    logger.warn('The request(kickOutOfTeam) is illegal, the player is not the captain : msg = %j.', msg);
		next();
		return;
	}

	var kickedPlayer = area.getPlayer(msg.kickedPlayerId);
	if(!kickedPlayer) {
    logger.warn('The request(kickOutOfTeam) is illegal, the kicked player is null : msg = %j.', msg);
		next();
		return;
	}

	if(!teamObj.isPlayerInTeam(msg.kickedPlayerId)) {
		next();
		return;
	}

	kickedPlayer.leaveTeam(true);

	teamObj.removePlayerById(msg.kickedPlayerId);
	try2DisbandTeam(teamObj);

  next();
};

/**
 * member leave the team voluntarily, and push info to other members
 *
 * @param {Object} msg
 * @param {Object} session
 * @param {Function} next
 * @api public
 */
handler.leaveTeam = function(msg, session, next) {
	var playerId = session.get('playerId');
	var player = area.getPlayer(playerId);

	if(!player) {
    logger.warn('The request(leaveTeam) is illegal, the player is null : msg = %j.', msg);
		next();
		return;
	}

  var teamObj = gTeamObjDict[msg.teamId];
	if(!teamObj) {
    logger.warn('The request(leaveTeam) is illegal, the team is null : msg = %j.', msg);
		next();
		return;
	}

	if(!teamObj.isPlayerInTeam(msg.kickedPlayerId)) {
		next();
		return;
	}

	player.leaveTeam(true, true);

	teamObj.removePlayerById(playerId);

	// if the captain leaves the team,
	// depute the captain to the next member
	if(playerId === teamObj.captainId) {
		var firstPlayerId = teamObj.getFirstPlayerId();
		if(firstPlayerId !== consts.TEAM.PLAYER_ID_NONE) {
			teamObj.setCaptainId(firstPlayerId);
		}
	}

	try2DisbandTeam(teamObj);

  next();
};

/**
 * Captain deputes to a member, and push info to all 
 *
 * @param {Object} msg
 * @param {Object} session
 * @param {Function} next
 * @api public
 */
handler.depute2Member = function(msg, session, next) {
	var playerId = session.get('playerId');
	var player = area.getPlayer(playerId);

	if(!player) {
    logger.warn('The request(depute2Member) is illegal, the player is null : msg = %j.', msg);
		next();
		return;
	}

  var teamObj = gTeamObjDict[msg.teamId];
	if(!teamObj) {
    logger.warn('The request(depute2Member) is illegal, the team is null : msg = %j.', msg);
		next();
		return;
	}

	if(playerId !== teamObj.captainId) {
    logger.warn('The request(depute2Member) is illegal, the player is not the captain : msg = %j.', msg);
		next();
		return;
	}

	if(!teamObj.isPlayerInTeam(msg.memberId)) {
		next();
		return;
	}

	teamObj.setCaptainId(msg.memberId);

  next();
};

/**
 * members chat in the team, and push content to other members
 *
 * @param {Object} msg
 * @param {Object} session
 * @param {Function} next
 * @api public
 */
handler.chatInTeam = function(msg, session, next) {
	var playerId = session.get('playerId');
	var player = area.getPlayer(playerId);

	if(!player) {
    logger.warn('The request(chatInTeam) is illegal, the player is null : msg = %j.', msg);
		next();
		return;
	}

  var teamObj = gTeamObjDict[msg.teamId];
	if(!teamObj) {
    logger.warn('The request(chatInTeam) is illegal, the team is null : msg = %j.', msg);
		next();
		return;
	}

	if(!teamObj.isPlayerInTeam(playerId)) {
    logger.warn('The request(chatInTeam) is illegal, the player is not int team : msg = %j.', msg);
		next();
		return;
	}

	teamObj.pushChatMsg2All(msg.content);

  next();
};

