var logger = require('pomelo-logger').getLogger(__filename);
var area = require('../../../domain/area/area');

module.exports = function() {
	return new Filter();
};

var Filter = function() {
};

/**
 * Area filter
 */
Filter.prototype.before = function(msg, session, next){
	var player = area.getPlayer(session.get('playerId'));
	
	if(!player){
		var route = msg.__route__;
		
		if(route.search(/^area\.resourceHandler/i) == 0 || route.search(/enterScene$/i) >= 0){
			next();
			return;
		}else{
			next(new Error('No player exist!'));
			return;
		}
	}
	
	if(player.died){
		next(new Error("You can't move a dead man!!!"));
		return;
	}
	
	next();
};