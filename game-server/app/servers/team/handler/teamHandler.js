/**
 * Module dependencies
 */

var area = require('../../../domain/area/area');
var messageService = require('../../../domain/messageService');
var userDao = require('../../../dao/userDao');
var logger = require('pomelo-logger').getLogger(__filename);
var pomelo = require('pomelo');
var consts = require('../../../consts/consts');
var dataApi = require('../../../util/dataApi');

var handler = module.exports;

// 全服务器所有队伍容器(teamId:teamObj)
var gTeamObjDict = {};
// 队伍中所能容纳的最大玩家数量
var MAX_MEMBER_NUM = 3;
// 空玩家id
var PLAYER_ID_NONE = 0;
// 全局队伍id
var gTeamId = 1;
// 队伍成员的头衔(普通成员/队长)
var TEAM_TITLE = {
	MEMBER  : 0,
	CAPTAIN : 1,	
};
// 受邀加入队伍玩家的回复
var JOIN_TEAM_REPLY = {
	REJECT : 0,
	ACCEPT : 1,	
};
// 尝试加入队伍时的返回码
var JOIN_TEAM_RET_CODE = {
	OK							: 0,	// 成功加入
	NO_POSITION			: -1,	// 队伍中没有空位置了
	ALREADY_IN_TEAM	: -2,	// 已经在本队伍中了
	IN_OTHER_TEAM		: -3,	// 已经在其他队伍中了
	SYS_ERROR				: -4,	// 系统错误
};
///////////////////////////////////////////////////////
function Team(){
	this.teamId = 0;
	// 队员数量
	this.playerNum = 0;
	// 队长id
	this.captainId = 0;
	this.playerIdArray = new Array(MAX_MEMBER_NUM);
	// 队伍频道, 用于在本队伍范围内推送消息
	this.channel = null;

	var _this = this; 
	// 构造函数
	var init = function()	{
		_this.teamId = ++gTeamId;
		for(var i in _this.playerIdArray) {
			i = PLAYER_ID_NONE;
		}
	};

	init();
}

Team.prototype.createChannel = function(playerId) {
	if(this.channel || this.getPlayerNum() <= 1) {
		return this.channel;
	}
	this.channel = pomelo.app.get('channelService').getChannel('team_' + this.teamId, true);
	if(this.channel) {
		for(var i in this.playerIdArray) {
			if(i != PLAYER_ID_NONE) {
				var player = area.getPlayer(playerId);
				if(!player) {
					continue;
				}
				this.channel.add(player.userId, player.serverId);
			}
		}
		return this.channel;
	}
	return null;
};

Team.prototype.addPlayer2Channel = function(playerId) {
	if(!this.channel) {
		return false;
	}
	var player = area.getPlayer(playerId);
	if(player) {
		this.channel.add(player.userId, player.serverId);
		return true;
	}
	return false;
};

Team.prototype.removePlayerFromChannel = function(playerId) {
	if(!this.channel) {
		return false;
	}
	var player = area.getPlayer(playerId);
	if(player) {
		this.channel.leave(player.userId, player.serverId);
		return true;
	}
	return false;
};

function doAddPlayer(teamObj, playerId) {
	for(var i in teamObj.playerIdArray)
	{
		if(i === PLAYER_ID_NONE)
		{
			i = playerId;
			return true;
		}
	}
	return false;
}

Team.prototype.addPlayer = function(playerId) {
	if(!this.isTeamHasPosition()) {
		return JOIN_TEAM_RET_CODE.NO_POSITION;
	}

	if(this.isPlayerInTeam(playerId)) {
		return JOIN_TEAM_RET_CODE.ALREADY_IN_TEAM;
	}

	var playerObj = area.getPlayer(playerId);
	if(!playerObj) {
		return JOIN_TEAM_RET_CODE.SYS_ERROR;
	}

	// 如果角色已经有队伍了则不能再加入其他队伍
	if(playerObj.teamId != consts.TEAM.TEAM_ID_NONE) {
		return JOIN_TEAM_RET_CODE.IN_OTHER_TEAM;
	}

	if(!doAddPlayer(this, playerId)) {
		return JOIN_TEAM_RET_CODE.SYS_ERROR;
	}

	if(!playerObj.joinTeam(this.teamId)) {
		return JOIN_TEAM_RET_CODE.SYS_ERROR;
	}

	if(!this.isPlayerInTeam(playerId)) {
		return JOIN_TEAM_RET_CODE.SYS_ERROR;
	}

	if(this.channel) {
		this.addPlayer2Channel();
	} else {
		this.createChannel();
	}

	if(this.playerNum < MAX_MEMBER_NUM) {
		this.playerNum++;
	}

	// 通知队伍中每个角色其他角色的信息
	this.pushInfo2Everyone();

	return JOIN_TEAM_RET_CODE.OK;
};

// 设置队长id(角色id)
Team.prototype.setCaptainId = function(captainId) {
	this.captainId = captainId;
};

// 队伍中的队员数量
Team.prototype.getPlayerNum = function() {
	return this.playerNum;
};

// 队伍中是否还有空位
Team.prototype.isTeamHasPosition = function() {
	return this.getPlayerNum() < MAX_MEMBER_NUM;
};

// 队伍中是否有队员
Team.prototype.isTeamHasMember = function() {
	return this.getPlayerNum() > 0;
};

// 获取队伍中首个角色的id
Team.prototype.getFirstPlayerId = function() {
	for(var i in this.playerIdArray)
	{
		if(i != PLAYER_ID_NONE)
			return i;
	}
	return PLAYER_ID_NONE;
};

// 检查某玩家是否在本队伍中
Team.prototype.isPlayerInTeam = function(playerId) {
	for(var i in this.playerIdArray)
	{
		if(i != PLAYER_ID_NONE && i === playerId)
			return true;
	}
	return false;
};

// 向队伍中每个角色推送其他角色的信息
Team.prototype.pushInfo2Everyone = function() {
	for(var i in this.playerIdArray)
	{
		if(i === PLAYER_ID_NONE)
			continue;
		var playerId = i;
		var player = area.getPlayer(playerId);

		var infoObjDict;
		for(var j in this.playerIdArray)
		{
			if(j === PLAYER_ID_NONE || j === playerId)
				continue;
			var tmpPlayer = area.getPlayer(j);
			var infoObj = tmpPlayer.toJSON4Team(this.captainId === j);
			infoObjDict = infoObjDict || {};
			infoObjDict[j] = infoObj;
		}
		if(infoObjDict)
		{
			// use channel
			messageService.pushMessageToPlayer({uid : player.userId, sid : player.serverId}, 'onUpdateTeam', infoObjDict);
		}
	}
	return true;
};

// 向队伍中剩余的角色推送某角色离开队伍的信息
Team.prototype.pushLeaveMsg2Else = function(leavePlayerId) {
	if(!this.channel) {
		return false;
	}
	var msg = {
		leavePlayerId : leavePlayerId
	};
	this.channel.pushMessage('onTeammateLeaveTeam', msg, null);
	return true;
};

// 解散队伍
Team.prototype.disbandTeam = function() {
	// 根据游戏设定, 在某些情况下可能不允许解散队伍
	// return false;
	this.channel.pushMessage('onDisbandTeam', {}, null);
	for(var i in this.playerIdArray)
	{
		if(i === PLAYER_ID_NONE)
			continue;
		var tmpPlayer = area.getPlayer(i);
		tmpPlayer.leaveTeam();
	}
	return true;
};

// 将某玩家踢出本队伍
Team.prototype.removePlayerById = function(playerId) {
	for(var i in this.playerIdArray)
	{
		if(i != PLAYER_ID_NONE && i === playerId) {
			i = PLAYER_ID_NONE;
			break;
		}
	}

	this.removePlayerFromChannel(playerId);
	
	if(this.playerNum > 0) {
		this.playerNum--;
	}

	if(this.isTeamHasMember()) {
		this.pushLeaveMsg2Else(playerId);
	}

	return true;
};

// 向队伍中剩余的角色推送某角色离开队伍的信息
Team.prototype.pushChatMsg2All = function(content) {
	if(!this.channel) {
		return false;
	}
	var msg = {
		content : content,
	};
	this.channel.pushMessage('onChatInTeam', msg, null);
	return true;
};

///////////////////////////////////////////////////////
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

	var result = JOIN_TEAM_RET_CODE.SYS_ERROR;

	if(!player) {
    logger.warn('The request(createTeam) is illegal, the player is null : msg = %j.', msg);
  	next();
		return;
	}

	teamObj = new Team();

	result = teamObj.addPlayer(playerId);
	if(result === JOIN_TEAM_RET_CODE.OK) {
		// 设置队长id
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

	if(playerId != teamObj.captainId) {
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

	if(playerId != teamObj.captainId) {
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

	// 向受邀者发送邀请信息
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

	if(msg.captainId != teamObj.captainId) {
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
		// 向邀请发出者(队长:msg.captainId)推送消息:受邀者拒绝加入队伍
		var msg = {
			reply : false;
		};
		messageService.pushMessageToPlayer({uid : captainObj.userId, sid : captainObj.serverId}, 'onInviteJoinTeamReply', msg);
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
	// 向队长发送申请信息
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

	if(playerId != teamObj.captainId) {
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
	}
	else {
		// 向申请者(msg.applicantId)推送消息:队长拒绝了申请
		var msg = {
			reply : false
		};
		messageService.pushMessageToPlayer({uid : applicant.userId, sid : applicant.serverId}, 'onApplyJoinTeamReply', msg);
	}
  next();
};

// 当有玩家离开队伍时检查成员数量, 如果为0则自动解散
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

	if(playerId != teamObj.captainId) {
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

	// 如果是队长主动离队则将队长转让给下一个队员
	if(playerId === teamObj.captainId) {
		var firstPlayerId = teamObj.getFirstPlayerId();
		if(firstPlayerId != PLAYER_ID_NONE) {
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

	if(playerId != teamObj.captainId) {
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

