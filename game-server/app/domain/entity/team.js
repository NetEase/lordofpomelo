/**
 * Module dependencies
 */
var consts = require('../../consts/consts');
var pomelo = require('pomelo');
var area = require('./../area/area');
var messageService = require('../messageService');

// max member num in a team
var MAX_MEMBER_NUM = 3;
///////////////////////////////////////////////////////
function Team(teamId){
	this.teamId = 0;
	this.playerNum = 0;
	this.captainId = 0;
	this.playerIdArray = new Array(MAX_MEMBER_NUM);
	// team channel, push msg within the team
	this.channel = null;

	var _this = this; 
	// constructor
	var init = function()	{
		_this.teamId = teamId;
		for(var i in _this.playerIdArray) {
			i = consts.TEAM.PLAYER_ID_NONE;
		}
	};

	init();
}

Team.prototype.createChannel = function(playerId) {
	if(this.channel) {
		return this.channel;
	}
	this.channel = pomelo.app.get('channelService').getChannel('team_' + this.teamId, true);
	if(this.channel) {
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
	for(var i in teamObj.playerIdArray) {
		if(i === consts.TEAM.PLAYER_ID_NONE) {
			i = playerId;
			return true;
		}
	}
	return false;
}

Team.prototype.addPlayer = function(playerId) {
	if(!this.isTeamHasPosition()) {
		return consts.TEAM.JOIN_TEAM_RET_CODE.NO_POSITION;
	}

	if(this.isPlayerInTeam(playerId)) {
		return consts.TEAM.JOIN_TEAM_RET_CODE.ALREADY_IN_TEAM;
	}

	var playerObj = area.getPlayer(playerId);
	if(!playerObj) {
		return consts.TEAM.JOIN_TEAM_RET_CODE.SYS_ERROR;
	}

	// if the player is already in a team, can't join other
	if(playerObj.teamId !== consts.TEAM.TEAM_ID_NONE) {
		return consts.TEAM.JOIN_TEAM_RET_CODE.IN_OTHER_TEAM;
	}

	if(!doAddPlayer(this, playerId)) {
		return consts.TEAM.JOIN_TEAM_RET_CODE.SYS_ERROR;
	}

	if(!playerObj.joinTeam(this.teamId)) {
		return consts.TEAM.JOIN_TEAM_RET_CODE.SYS_ERROR;
	}

	if(!this.isPlayerInTeam(playerId)) {
		return consts.TEAM.JOIN_TEAM_RET_CODE.SYS_ERROR;
	}

	if(!this.createChannel()) {
		return consts.TEAM.JOIN_TEAM_RET_CODE.SYS_ERROR;
	}

	if(!this.addPlayer2Channel()) {
		return consts.TEAM.JOIN_TEAM_RET_CODE.SYS_ERROR;
	}

	if(this.playerNum < MAX_MEMBER_NUM) {
		this.playerNum++;
	}

	this.pushInfo2Everyone();

	return consts.TEAM.JOIN_TEAM_RET_CODE.OK;
};

// the captain_id is just a player_id
Team.prototype.setCaptainId = function(captainId) {
	this.captainId = captainId;
};

// player num in the team
Team.prototype.getPlayerNum = function() {
	return this.playerNum;
};

// is there a empty position in the team
Team.prototype.isTeamHasPosition = function() {
	return this.getPlayerNum() < MAX_MEMBER_NUM;
};

// is there any member in the team
Team.prototype.isTeamHasMember = function() {
	return this.getPlayerNum() > 0;
};

// the first real player_id in the team
Team.prototype.getFirstPlayerId = function() {
	for(var i in this.playerIdArray) {
		if(i !== consts.TEAM.PLAYER_ID_NONE) {
			return i;
		}
	}
	return consts.TEAM.PLAYER_ID_NONE;
};

// check if a player in the team
Team.prototype.isPlayerInTeam = function(playerId) {
	for(var i in this.playerIdArray) {
		if(i !== consts.TEAM.PLAYER_ID_NONE && i === playerId) {
			return true;
		}
	}
	return false;
};

// push the team members' info to everyone
Team.prototype.pushInfo2Everyone = function() {
	var infoObjDict = {};
	for(var i in this.playerIdArray) {
		if(i === consts.TEAM.PLAYER_ID_NONE) {
			continue;
		}
		var player = area.getPlayer(i);
		if(!player) {
			continue;
		}

		var infoObj = player.toJSON4Team(this.captainId === i);
		infoObjDict[i] = infoObj;
	}

	if(Object.keys(infoObjDict).length > 0) {
		this.channel.pushMessage('onUpdateTeam', infoObjDict, null);
	}
};

// notify the rest of team members of the left player
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

// disband the team
Team.prototype.disbandTeam = function() {
	// under some conditions, the team can't be disbanded
	// return false;
	this.channel.pushMessage('onDisbandTeam', {}, null);
	for(var i in this.playerIdArray) {
		if(i === consts.TEAM.PLAYER_ID_NONE) {
			continue;
		}
		var tmpPlayer = area.getPlayer(i);
		tmpPlayer.leaveTeam();
	}
	return true;
};

// remove a player from the team
Team.prototype.removePlayerById = function(playerId) {
	for(var i in this.playerIdArray) {
		if(i !== consts.TEAM.PLAYER_ID_NONE && i === playerId) {
			i = consts.TEAM.PLAYER_ID_NONE;
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

// push msg to all of the team members 
Team.prototype.pushChatMsg2All = function(content) {
	if(!this.channel) {
		return false;
	}
	var msg = {
		content : content
	};
	this.channel.pushMessage('onChatInTeam', msg, null);
	return true;
};

///////////////////////////////////////////////////////
/**
 * Expose 'Team' constructor.
 */
module.exports = Team;

