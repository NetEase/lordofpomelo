var utils = require('../../../util/utils');

module.exports = function(){
	return new TeamRemote();
};

var TeamRemote = function(){
}

TeamRemote.prototype.canCreateGameCopy = function(args, cb){
	var playerId = args.playerId;
	
	// TODO
	// utils.invokeCallback(cb, null, tmpArgs);
};

