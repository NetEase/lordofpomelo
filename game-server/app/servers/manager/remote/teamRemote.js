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

  utils.invokeCallback(cb, null, {result : result});
};

TeamRemote.prototype.createTeam = function(args, cb) {
	var playerId = args.playerId;
  utils.myPrint('TeamRemote ~ createTeam is running ...typeof args = ', typeof args);
  utils.myPrint('args = ', args);
	var ret = teamManager.createTeam(playerId);

  utils.invokeCallback(cb, ret);
};