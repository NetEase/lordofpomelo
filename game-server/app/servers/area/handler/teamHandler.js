/**
 * Module dependencies
 */
var messageService = require('../../../domain/messageService');
var logger = require('pomelo-logger').getLogger(__filename);
var consts = require('../../../consts/consts');
var utils = require('../../../util/utils');


module.exports = function(app) {
	return new Handler(app);
};

var Handler = function(app) {
	this.app = app;
};

/**
 * Player create a team, and response the result information : success(1)/failed(0)
 *
 * @param {Object} msg
 * @param {Object} session
 * @param {Function} next
 * @api public
 */
Handler.prototype.createTeam = function(msg, session, next) {
	var area = session.area;
	var playerId = session.get('playerId');
	utils.myPrint('Handler ~ createTeam is running ... ~ playerId = ', playerId);
	var player = area.getPlayer(playerId);

	if(!player) {
		logger.warn('The request(createTeam) is illegal, the player is null : msg = %j.', msg);
		next();
		return;
	}

	// if the player is already in a team, can't create team
	if(player.teamId !== consts.TEAM.TEAM_ID_NONE) {
		next();
		return;
	}

	var result = consts.TEAM.JOIN_TEAM_RET_CODE.SYS_ERROR;
	var playerInfo = player.toJSON4Team();
	var args = {playerId: playerId, areaId: area.areaId,
		userId: player.userId, serverId: player.serverId, playerInfo: playerInfo};
		this.app.rpc.manager.teamRemote.createTeam(session, args,
		function(err, ret) {
			utils.myPrint("ret.result = ", ret.result);
			utils.myPrint("typeof ret.result = ", typeof ret.result);
			result = ret.result;
			var teamId = ret.teamId;
			utils.myPrint("result = ", result);
			utils.myPrint("teamId = ", teamId);
			if(result === consts.TEAM.JOIN_TEAM_RET_CODE.OK && teamId > consts.TEAM.TEAM_ID_NONE) {
				if(!player.joinTeam(teamId)) {
					result = consts.TEAM.JOIN_TEAM_RET_CODE.SYS_ERROR;
				}
			}
			utils.myPrint("player.teamId = ", player.teamId);
			if(result === consts.TEAM.JOIN_TEAM_RET_CODE.OK && player.teamId > consts.TEAM.TEAM_ID_NONE) {
				player.isCaptain = consts.TEAM.YES;
				var ignoreList = {};
				messageService.pushMessageByAOI(area,
					{
						route: 'onTeamCaptainStatusChange',
						playerId: playerId,
						teamId: player.teamId,
						isCaptain: player.isCaptain
					},
					{x: player.x, y: player.y}, ignoreList);
			}

		 next();
		});
};

/**
 * Captain disband the team, and response the result information : success(1)/failed(0)
 *
 * @param {Object} msg
 * @param {Object} session
 * @param {Function} next
 * @api public
 */
Handler.prototype.disbandTeam = function(msg, session, next) {
	var area = session.area;
	var playerId = session.get('playerId');
	var player = area.getPlayer(playerId);

	var result = consts.TEAM.FAILED;

	if(!player) {
		logger.warn('The request(disbandTeam) is illegal, the player is null : msg = %j.', msg);
		next();
		return;
	}

	if(player.teamId <= consts.TEAM.TEAM_ID_NONE || msg.teamId !== player.teamId) {
		logger.warn('The request(disbandTeam) is illegal, the teamId is wrong : msg = %j.', msg);
		next();
		return;
	}

	var args = {playerId: playerId, teamId: player.teamId};
	this.app.rpc.manager.teamRemote.disbandTeamById(session, args,
		function(err, ret) {
			result = ret.result;
			utils.myPrint("1 ~ result = ", result);
			utils.myPrint("playerIdArray = ", ret.playerIdArray);
			if(result === consts.TEAM.OK) {
				for (var i in ret.playerIdArray) {
					var tmpPlayerId = ret.playerIdArray[i];
					var tmpPlayer = area.getPlayer(tmpPlayerId);
					if (!tmpPlayer || !tmpPlayer.leaveTeam()) {
						result = consts.TEAM.FAILED;
					}
					utils.myPrint("tmpPlayer.teamId = ", tmpPlayer.teamId);
				}
				if (player.isCaptain) {
					player.isCaptain = consts.TEAM.NO;
					var ignoreList = {};
					messageService.pushMessageByAOI(area,
						{
							route: 'onTeamCaptainStatusChange',
							playerId: playerId,
							teamId: player.teamId,
							isCaptain: player.isCaptain
						},
						{x: player.x, y: player.y}, ignoreList);
				}
			}
		});

	next();
};

/**
 * Notify: Captain invite a player to join the team, and push invitation to the invitee
 *
 * @param {Object} msg
 * @param {Object} session
 * @param {Function} next
 * @api public
 */
Handler.prototype.inviteJoinTeam = function(msg, session, next) {
	var area = session.area;
	var playerId = session.get('playerId');
	var player = area.getPlayer(playerId);

	var result = false;

	if(!player) {
		logger.warn('The request(inviteJoinTeam) is illegal, the player is null : msg = %j.', msg);
		next();
		return;
	}

	// var teamObj = this.app.rpc.manager.teamRemote.getTeamById(player.teamId);
	var teamObj = null;
	if(!teamObj) {
		logger.warn('The request(inviteJoinTeam) is illegal, the team is null : msg = %j.', msg);
		next();
		return;
	}

	if(!teamObj.isCaptainById(playerId)) {
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

	var infoObj = player.toJSON4Team();

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
Handler.prototype.inviteJoinTeamReply = function(msg, session, next) {
	var area = session.area;
	var playerId = session.get('playerId');
	var player = area.getPlayer(playerId);

	if(!player) {
		logger.warn('The request(inviteJoinTeamReply) is illegal, the player is null : msg = %j.', msg);
		next();
		return;
	}

	// var teamObj = this.app.rpc.manager.teamRemote.getTeamById(msg.teamId);
	var teamObj = null;
	if(!teamObj) {
		logger.warn('The request(inviteJoinTeamReply) is illegal, the team is null : msg = %j.', msg);
		next();
		return;
	}

	if(!teamObj.isCaptainById(msg.captainId)) {
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

	if(msg.reply === consts.TEAM.JOIN_TEAM_REPLY.ACCEPT) {
		var result = teamObj.addPlayer(player, area);
		next();
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
Handler.prototype.applyJoinTeam = function(msg, session, next) {
	var area = session.area;
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

	// var teamObj = this.app.rpc.manager.teamRemote.getTeamById(msg.teamId);
	var teamObj = null;
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
Handler.prototype.applyJoinTeamReply = function(msg, session, next) {
	var area = session.area;
	var playerId = session.get('playerId');
	var player = area.getPlayer(playerId);

	if(!player) {
		logger.warn('The request(applyJoinTeamReply) is illegal, the player is null : msg = %j.', msg);
		next();
		return;
	}

	// var teamObj = this.app.rpc.manager.teamRemote.getTeamById(msg.teamId);
	var teamObj = null;
	if(!teamObj) {
		logger.warn('The request(applyJoinTeamReply) is illegal, the team is null : msg = %j.', msg);
		next();
		return;
	}

	if(!teamObj.isCaptainById(playerId)) {
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

	if(msg.reply === consts.TEAM.JOIN_TEAM_REPLY.ACCEPT) {
		var result = teamObj.addPlayer(applicant, area);
		next();
	} else {
		// push tmpMsg to the applicant that the capatain rejected
		var tmpMsg = {
			reply : false
		};
		messageService.pushMessageToPlayer({uid : applicant.userId, sid : applicant.serverId}, 'onApplyJoinTeamReply', tmpMsg);
	}
	next();
};

/**
 * Captain kicks a team member, and push info to the kicked member and other members
 *
 * @param {Object} msg
 * @param {Object} session
 * @param {Function} next
 * @api public
 */
Handler.prototype.kickOutOfTeam = function(msg, session, next) {
	var area = session.area;
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

	// var teamObj = this.app.rpc.manager.teamRemote.getTeamById(msg.teamId);
	var teamObj = null;
	if(!teamObj) {
		logger.warn('The request(kickOutOfTeam) is illegal, the team is null : msg = %j.', msg);
		next();
		return;
	}

	if(!teamObj.isCaptainById(playerId)) {
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

	kickedPlayer.leaveTeam();

	teamObj.removePlayer(kickedPlayer);
	// this.app.rpc.manager.teamRemote.try2DisbandTeam(teamObj);

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
Handler.prototype.leaveTeam = function(msg, session, next) {
	var area = session.area;
	var playerId = session.get('playerId');
	var player = area.getPlayer(playerId);

	if(!player) {
		logger.warn('The request(leaveTeam) is illegal, the player is null: msg = %j.', msg);
		next();
		return;
	}

	var result = consts.TEAM.FAILED;

	utils.myPrint("player.teamId = ", player.teamId);
	utils.myPrint("typeof player.teamId = ", typeof player.teamId);

	utils.myPrint("msg.teamId = ", msg.teamId);
	utils.myPrint("typeof msg.teamId = ", typeof msg.teamId);

	if(player.teamId <= consts.TEAM.TEAM_ID_NONE || player.teamId !== msg.teamId) {
		logger.warn('The request(leaveTeam) is illegal, the teamId is wrong: msg = %j.', msg);
		next();
		return;
	}

	var args = {playerId: playerId, teamId: player.teamId};
	this.app.rpc.manager.teamRemote.leaveTeamById(session, args,
		function(err, ret) {
			result = ret.result;
			utils.myPrint("1 ~ result = ", result);
			if(result === consts.TEAM.OK && !player.leaveTeam()) {
				result = consts.TEAM.FAILED;
			}
			if (player.isCaptain) {
				player.isCaptain = consts.TEAM.NO;
				var ignoreList = {};
				messageService.pushMessageByAOI(area,
					{
						route: 'onTeamCaptainStatusChange',
						playerId: playerId,
						teamId: player.teamId,
						isCaptain: player.isCaptain
					},
					{x: player.x, y: player.y}, ignoreList);
			}
			utils.myPrint("teamId = ", player.teamId);
			// for disbanding the team
			if(result === consts.TEAM.OK && !!ret.playerIdArray && ret.playerIdArray.length > 0) {
				for (var i in ret.playerIdArray) {
					var tmpPlayerId = ret.playerIdArray[i];
					var tmpPlayer = area.getPlayer(tmpPlayerId);
					if (!tmpPlayer || !tmpPlayer.leaveTeam()) {
						result = consts.TEAM.FAILED;
					}
					utils.myPrint("tmpPlayerId = ", tmpPlayerId);
					utils.myPrint("tmpPlayer.teamId = ", tmpPlayer.teamId);
				}
			}
		});

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
Handler.prototype.depute2Member = function(msg, session, next) {
	var area = session.area;
	var playerId = session.get('playerId');
	var player = area.getPlayer(playerId);

	if(!player) {
		logger.warn('The request(depute2Member) is illegal, the player is null : msg = %j.', msg);
		next();
		return;
	}

	// var teamObj = this.app.rpc.manager.teamRemote.getTeamById(msg.teamId);
	var teamObj = null;
	if(!teamObj) {
		logger.warn('The request(depute2Member) is illegal, the team is null : msg = %j.', msg);
		next();
		return;
	}

	if(!teamObj.isCaptainById(playerId)) {
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
Handler.prototype.chatInTeam = function(msg, session, next) {
	var area = session.area;
	var playerId = session.get('playerId');
	var player = area.getPlayer(playerId);

	if(!player) {
		logger.warn('The request(chatInTeam) is illegal, the player is null : msg = %j.', msg);
		next();
		return;
	}

	// var teamObj = this.app.rpc.manager.teamRemote.getTeamById(msg.teamId);
	var teamObj = null;
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

/**
 * Player join the first team, and response the result information : success(1)/failed(0)
 *
 * @param {Object} msg
 * @param {Object} session
 * @param {Function} next
 * @api public
 */
Handler.prototype.joinFirstTeam = function(msg, session, next) {
	var area = session.area;
	var playerId = session.get('playerId');
	utils.myPrint('Handler ~ joinFirstTeam is running ... ~ playerId = ', playerId);
	var player = area.getPlayer(playerId);

	if(!player) {
		logger.warn('The request(joinFirstTeam) is illegal, the player is null : msg = %j.', msg);
		next();
		return;
	}


	// if the player is already in a team, can't join other
	if(player.teamId !== consts.TEAM.TEAM_ID_NONE) {
		logger.warn('The request(joinFirstTeam) is illegal, the player is already in a team : msg = %j.', msg);
		next();
		return;
	}

	var result = consts.TEAM.JOIN_TEAM_RET_CODE.SYS_ERROR;
	var playerInfo = player.toJSON4Team();
	var args = {playerId: playerId, areaId: area.areaId,
		userId: player.userId, serverId: player.serverId, playerInfo: playerInfo};
	this.app.rpc.manager.teamRemote.joinFirstTeam(session, args,
		function(err, ret) {
			result = ret.result;
			var teamId = ret.teamId;
			utils.myPrint("result = ", result);
			utils.myPrint("teamId = ", teamId);
			if(result === consts.TEAM.JOIN_TEAM_RET_CODE.OK && teamId > consts.TEAM.TEAM_ID_NONE) {
				if(!player.joinTeam(teamId)) {
					result = consts.TEAM.JOIN_TEAM_RET_CODE.SYS_ERROR;
				}
			}
			utils.myPrint("player.teamId = ", player.teamId);
		});
	next();
};

