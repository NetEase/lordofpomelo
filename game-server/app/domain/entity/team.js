/**
 * Module dependencies
 */
var consts = require('../../consts/consts');
var pomelo = require('pomelo');
var utils = require('../../util/utils');

// max member num in a team
var MAX_MEMBER_NUM = 3;
///////////////////////////////////////////////////////
function Team(teamId){
	this.teamId = 0;
	this.playerNum = 0;
	this.captainId = 0;
	this.playerDataArray = new Array(MAX_MEMBER_NUM);
	// team channel, push msg within the team
	this.channel = null;

	var _this = this; 
	// constructor
	var init = function()	{
		_this.teamId = teamId;
		var arr = _this.playerDataArray;
		for(var i = 0; i < arr.length; ++i) {
			arr[i] = {playerId: consts.TEAM.PLAYER_ID_NONE, areaId: consts.TEAM.AREA_ID_NONE,
				userId: consts.TEAM.USER_ID_NONE, serverId: consts.TEAM.SERVER_ID_NONE,
				playerInfo: consts.TEAM.PLAYER_INFO_NONE};
		}
		_this.createChannel();
	};

	init();
}

Team.prototype.createChannel = function() {
	if(this.channel) {
		return this.channel;
	}
	this.channel = pomelo.app.get('channelService').getChannel('team_' + this.teamId, true);
	if(this.channel) {
		return this.channel;
	}
	return null;
};

Team.prototype.addPlayer2Channel = function(data) {
	if(!this.channel) {
		return false;
	}
	if(data) {
		this.channel.add(data.userId, data.serverId);
		return true;
	}
	return false;
};

Team.prototype.removePlayerFromChannel = function(data) {
	if(!this.channel) {
		return false;
	}
	if(data) {
		this.channel.leave(data.userId, data.serverId);
		return true;
	}
	return false;
};

function doAddPlayer(teamObj, data) {
	utils.myPrint('data = ', data);
	utils.myPrint('playerInfo= ', data.playerInfo);
	var arr = teamObj.playerDataArray;
	for(var i in arr) {
		if(arr[i].playerId === consts.TEAM.PLAYER_ID_NONE && arr[i].areaId === consts.TEAM.AREA_ID_NONE) {
			data.playerInfo.teamId = teamObj.teamId;
			arr[i] = {playerId: data.playerId, areaId: data.areaId,
				userId: data.userId, serverId: data.serverId, playerInfo: data.playerInfo};
			utils.myPrint('arr[i] = ', JSON.stringify(arr[i]));
			return true;
		}
	}
	return false;
}

Team.prototype.addPlayer = function(data) {
	if (!data || typeof data !== 'object') {
		return consts.TEAM.JOIN_TEAM_RET_CODE.SYS_ERROR;
	}
	for (var i in data) {
		if(!data[i] || data[i] <= 0) {
			return consts.TEAM.JOIN_TEAM_RET_CODE.SYS_ERROR;
		}	
	}

	if(!this.isTeamHasPosition()) {
		return consts.TEAM.JOIN_TEAM_RET_CODE.NO_POSITION;
	}

	if(this.isPlayerInTeam(data.playerId)) {
		return consts.TEAM.JOIN_TEAM_RET_CODE.ALREADY_IN_TEAM;
	}

	if(!doAddPlayer(this, data)) {
		return consts.TEAM.JOIN_TEAM_RET_CODE.SYS_ERROR;
	}

	if(!this.isPlayerInTeam(data.playerId)) {
		return consts.TEAM.JOIN_TEAM_RET_CODE.SYS_ERROR;
	}

	if(!this.addPlayer2Channel(data)) {
		return consts.TEAM.JOIN_TEAM_RET_CODE.SYS_ERROR;
	}

	if(this.playerNum < MAX_MEMBER_NUM) {
		this.playerNum++;
	}

	this.updateTeamInfo();

	return consts.TEAM.JOIN_TEAM_RET_CODE.OK;
};

// the captain_id is just a player_id
Team.prototype.setCaptainId = function(captainId) {
	this.captainId = captainId;
};

// is the player the captain of the team
Team.prototype.isCaptainById = function(playerId) {
  return playerId === this.captainId;
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
	var arr = this.playerDataArray;
	for(var i in arr) {
		if(arr[i].playerId !== consts.TEAM.PLAYER_ID_NONE && arr[i].areaId !== consts.TEAM.AREA_ID_NONE) {
			return arr[i].playerId;
		}
	}
	return consts.TEAM.PLAYER_ID_NONE;
};

// check if a player in the team
Team.prototype.isPlayerInTeam = function(playerId) {
	var arr = this.playerDataArray;
	for(var i in arr) {
		if(arr[i].playerId !== consts.TEAM.PLAYER_ID_NONE && arr[i].playerId === playerId) {
			return true;
		}
	}
	return false;
};

// push the team members' info to everyone
Team.prototype.updateTeamInfo = function() {
	var infoObjDict = {};
	var arr = this.playerDataArray;
	for(var i in arr) {
		var playerId = arr[i].playerId;
		if(playerId === consts.TEAM.PLAYER_ID_NONE) {
			continue;
		}
		infoObjDict[playerId] = arr[i].playerInfo;

		utils.myPrint("typeof playerId = ", typeof playerId);
	}

	if(Object.keys(infoObjDict).length > 0) {
		this.channel.pushMessage('onUpdateTeam', infoObjDict, null);
	}
};

// notify the members of the left player
Team.prototype.pushLeaveMsg2All = function(leavePlayerId, cb) {
	var ret = {result: consts.TEAM.OK};
	if(!this.channel) {
		cb(null, ret);
		return;
	}
	var msg = {
		playerId: leavePlayerId
	};
	this.channel.pushMessage('onTeammateLeaveTeam', msg, function(err, _) {
		cb(null, ret);
	});
};

// disband the team
Team.prototype.disbandTeam = function() {
	var playerIdArray = [];
	var arr = this.playerDataArray;
	for(var i in arr) {
		if(arr[i].playerId === consts.TEAM.PLAYER_ID_NONE || arr[i].areaId === consts.TEAM.AREA_ID_NONE) {
			continue;
		}
		playerIdArray.push(arr[i].playerId);
	}
	if (playerIdArray.length > 0) {
		this.channel.pushMessage('onDisbandTeam', playerIdArray, null);
	}

	return {result: consts.TEAM.OK, playerIdArray: playerIdArray};
};

// remove a player from the team
Team.prototype.removePlayer = function(playerId, cb) {
	var arr = this.playerDataArray;
	var tmpData = null;
	for(var i in arr) {
		if(arr[i].playerId !== consts.TEAM.PLAYER_ID_NONE && arr[i].playerId === playerId) {
			tmpData = utils.clone(arr[i]);
			arr[i] = {playerId: consts.TEAM.PLAYER_ID_NONE, areaId: consts.TEAM.AREA_ID_NONE,
				userId: consts.TEAM.USER_ID_NONE, serverId: consts.TEAM.SERVER_ID_NONE,
				playerInfo: consts.TEAM.PLAYER_INFO_NONE};
			break;
		}
	}
	
  if(this.isPlayerInTeam(playerId)) {
		var ret = {result: consts.TEAM.FAILED};
	  utils.invokeCallback(cb, null, ret);
		return;
  }

  var _this = this;
  // async network operation
	this.pushLeaveMsg2All(playerId, function(err, ret) {
	  // if the captain leaves the team, disband the team
	  if (_this.isCaptainById(playerId)) {
			ret = _this.disbandTeam();
			ret.toDisband = true;
	  } else {
			_this.removePlayerFromChannel(tmpData);
	  }

		if(_this.playerNum > 0) {
			_this.playerNum--;
		}

	  utils.invokeCallback(cb, null, ret);
	});
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


Team.prototype.dragMember2gameCopy = function(args, cb) {
	if(!this.channel) {
		return;
	}
	utils.myPrint('3 ~ DragMember2gameCopy ~ args = ', JSON.stringify(args));
	this.channel.pushMessage('onDragMember2gameCopy', args, null);
	utils.invokeCallback(cb);

	return;
};
///////////////////////////////////////////////////////
/**
 * Expose 'Team' constructor.
 */
module.exports = Team;

