/**
 * Module dependencies
 */
var messageService = require('../../../domain/messageService');
var logger = require('pomelo-logger').getLogger(__filename);
var consts = require('../../../consts/consts');
var utils = require('../../../util/utils');
var dataApi = require('../../../util/dataApi');


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
		logger.warn('The request(createTeam) is illegal, the player is already in a team : msg = %j.', msg);
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

	utils.myPrint('playerId, IsInTeamInstance = ', playerId, player.isInTeamInstance);
	if (player.isInTeamInstance) {
		next();
		return;
	}

	if (!player.isCaptain) {
		logger.warn('The request(disbandTeam) is illegal, the player is not the captain : msg = %j.', msg);
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
	var captainId = session.get('playerId');
	var captainObj = area.getPlayer(captainId);

	if(!captainObj) {
		logger.warn('The request(inviteJoinTeam) is illegal, the player is null : msg = %j.', msg);
		next();
		return;
	}

	var inviteeObj = area.getPlayer(msg.inviteeId);
	if(!inviteeObj) {
		logger.warn('The request(inviteJoinTeam) is illegal, the invitee is null : msg = %j.', msg);
		next();
		return;
	}

	// send invitation to the invitee
	var args = {captainId: captainId, teamId: msg.teamId};
	this.app.rpc.manager.teamRemote.inviteJoinTeam(session, args, function(err, ret) {
			var result = ret.result;
			utils.myPrint("result = ", result);
			if(result === consts.TEAM.OK) {
				var captainInfo = captainObj.toJSON4Team();
				messageService.pushMessageToPlayer({uid : inviteeObj.userId, sid : inviteeObj.serverId},
					'onInviteJoinTeam', captainInfo);
			}
		});
	next();
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
	var inviteeId = session.get('playerId');
	var inviteeObj = area.getPlayer(inviteeId);

	if(!inviteeObj) {
		logger.warn('The request(inviteJoinTeamReply) is illegal, the player is null : msg = %j.', msg);
		next();
		return;
	}

	var captainObj = area.getPlayer(msg.captainId);
	if(!captainObj) {
		logger.warn('The request(inviteJoinTeamReply) is illegal, the captain is null : msg = %j.', msg);
		next();
		return;
	}

	if (msg.teamId !== captainObj.teamId) {
		logger.warn('The request(inviteJoinTeamReply) is illegal, the teamId is wrong : msg = %j.', msg);
		next();
		return;
	}

	var result = consts.TEAM.JOIN_TEAM_RET_CODE.SYS_ERROR;
	if(msg.reply === consts.TEAM.JOIN_TEAM_REPLY.ACCEPT) {
		var inviteeInfo = inviteeObj.toJSON4Team();
		var args = {captainId: msg.captainId, teamId: msg.teamId,
			playerId: inviteeId, areaId: area.areaId,
			userId: inviteeObj.userId, serverId: inviteeObj.serverId, playerInfo: inviteeInfo};
		this.app.rpc.manager.teamRemote.acceptInviteJoinTeam(session, args, function(err, ret) {
			utils.myPrint('AcceptInviteJoinTeam ~ ret = ', JSON.stringify(ret));
			result = ret.result;
			if(result === consts.TEAM.JOIN_TEAM_RET_CODE.OK) {
				if(!inviteeObj.joinTeam(msg.teamId)) {
					result = consts.TEAM.JOIN_TEAM_RET_CODE.SYS_ERROR;
					messageService.pushMessageToPlayer({uid: captainObj.userId, sid: captainObj.serverId},
						'onInviteJoinTeamReply', {reply: result});
				}
				utils.myPrint('invitee teamId = ', inviteeObj.teamId);
			} else {
				messageService.pushMessageToPlayer({uid: captainObj.userId, sid: captainObj.serverId},
					'onInviteJoinTeamReply', {reply: result});
			}
		});
	} else {
		// push msg to the inviter(the captain) that the invitee reject to join the team
		messageService.pushMessageToPlayer({uid: captainObj.userId, sid: captainObj.serverId},
			'onInviteJoinTeamReply', {reply: result});
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
	utils.myPrint('ApplyJoinTeam ~ msg = ', JSON.stringify(msg));
	var area = session.area;
	var applicantId = session.get('playerId');
	var applicantObj = area.getPlayer(applicantId);

	if(!applicantObj) {
		logger.warn('The request(applyJoinTeam) is illegal, the player is null : msg = %j.', msg);
		next();
		return;
	}

	if(applicantObj.isInTeam()) {
		next();
		return;
	}

	var captainObj = area.getPlayer(msg.captainId);
	if(!captainObj) {
		logger.warn('The request(applyJoinTeam) is illegal, the captain is null : msg = %j.', msg);
		next();
		return;
	}

	if(captainObj.teamId !== msg.teamId) {
		logger.warn('The request(applyJoinTeam) is illegal, the teamId is wrong : msg = %j.', msg);
		next();
		return;
	}
	// send the application to the captain
	var args = {applicantId: applicantId, teamId: msg.teamId};
	this.app.rpc.manager.teamRemote.applyJoinTeam(session, args, function(err, ret) {
			var result = ret.result;
			utils.myPrint("result = ", result);
			if(result === consts.TEAM.OK) {
				var applicantInfo = applicantObj.toJSON4Team();
				messageService.pushMessageToPlayer({uid: captainObj.userId, sid: captainObj.serverId}, 'onApplyJoinTeam', applicantInfo);
			}
		});
	next();
};

/**
 * Notify: captain reply the application, and push msg to the team members(accept) or only the applicant(reject)
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

	if (!player.isCaptain || player.teamId !== msg.teamId) {
		logger.warn('The request(applyJoinTeamReply) is illegal, the teamId is wrong : msg = %j.', msg);
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
		var result = consts.TEAM.JOIN_TEAM_RET_CODE.SYS_ERROR;
		var applicantInfo = applicant.toJSON4Team();
		var args = {captainId: playerId, teamId: msg.teamId,
			playerId: msg.applicantId, areaId: area.areaId,
			userId: applicant.userId, serverId: applicant.serverId, playerInfo: applicantInfo};
		this.app.rpc.manager.teamRemote.acceptApplicantJoinTeam(session, args, function(err, ret) {
			utils.myPrint('ApplyJoinTeamReply ~ ret = ', JSON.stringify(ret));
			result = ret.result;
			if(result === consts.TEAM.JOIN_TEAM_RET_CODE.OK) {
				if(!applicant.joinTeam(msg.teamId)) {
					result = consts.TEAM.JOIN_TEAM_RET_CODE.SYS_ERROR;
					messageService.pushMessageToPlayer({uid: applicant.userId, sid: applicant.serverId},
						'onApplyJoinTeamReply', {reply: result});
				}
				utils.myPrint('applicant teamId = ', applicant.teamId);
			} else {
				messageService.pushMessageToPlayer({uid: applicant.userId, sid: applicant.serverId},
					'onApplyJoinTeamReply', {reply: ret.result});
			}
		});
	} else {
		// push tmpMsg to the applicant that the captain rejected
		messageService.pushMessageToPlayer({uid: applicant.userId, sid: applicant.serverId},
			'onApplyJoinTeamReply', {reply: consts.TEAM.JOIN_TEAM_REPLY.REJECT});
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

	utils.myPrint('playerId, IsInTeamInstance = ', playerId, player.isInTeamInstance);
	if (player.isInTeamInstance) {
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

