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

