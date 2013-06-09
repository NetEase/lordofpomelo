var utils = require('../../../util/utils');
var teamManager = require('../../../services/teamManager');

module.exports = function(){
  return new TeamRemote();
};

var TeamRemote = function(){
};

// can a player create a game copy
TeamRemote.prototype.canCreateGameCopy = function(args, cb){
  var playerId = args.playerId;
  var teamId = args.teamId;

	var result = false;
  var teamObj = teamManager.getTeamById(teamId);
  if(teamObj) {
    result = teamObj.isCaptainById(playerId);
	}

  utils.invokeCallback(cb, null, result);
};

// create a new team
TeamRemote.prototype.createTeam = function(args, cb) {
  utils.myPrint('TeamRemote ~ createTeam is running ...typeof args = ', typeof args);
  utils.myPrint('args = ', args);
  utils.myPrint('playerInfo = ', JSON.stringify(args.playerInfo));
	var ret = teamManager.createTeam(args);

  utils.invokeCallback(cb, null, ret);
};

// player trys to join first team
TeamRemote.prototype.joinFirstTeam = function(args, cb){
  utils.myPrint('JoinFirstTeam is running ... args = ', JSON.stringify(args));
  var ret = teamManager.joinFirstTeam(args);

  utils.myPrint('JoinFirstTeam is running ... ret = ', JSON.stringify(ret));
  utils.invokeCallback(cb, null, ret);
};

// disband a team
TeamRemote.prototype.disbandTeamById = function(args, cb){
  var playerId = args.playerId;
  var teamId = args.teamId;
  var ret = teamManager.disbandTeamById(playerId, teamId);

  utils.myPrint('TeamRemote ~ disbandTeamById is running ... dataArray = ', ret.dataArray);
  utils.invokeCallback(cb, null, ret);
};

// leave a team
TeamRemote.prototype.leaveTeamById = function(args, cb){
  var playerId = args.playerId;
  var teamId = args.teamId;
  teamManager.leaveTeamById(playerId, teamId, cb);

  /*
  var ret = teamManager.leaveTeamById(playerId, teamId, cb);
  utils.myPrint('TeamRemote ~ leaveTeamById is running ... ret = ', JSON.stringify(ret));
  utils.invokeCallback(cb, null, ret);
  */
};
