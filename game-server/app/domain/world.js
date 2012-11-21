var dataApi = require('../util/dataApi');
var utils = require('../util/utils');
var area = require('./area/area');
var messageService = require('./messageService');
var pomelo = require('pomelo');
var userDao = require('../dao/userDao');
var taskDao = require('../dao/taskDao');
var logger = require('pomelo-logger').getLogger(__filename);
var Map = require('./map/map');

var maps = {};

var exp = module.exports;

exp.init = function(areasConfig){
	//Init areas
	for(var key in areasConfig){
		//init map
		var areaConfig = areasConfig[key];
		areaConfig.weightMap = false;
		maps[areaConfig.id] = new Map(areaConfig);
	}
};

/**
 * Proxy for map, get born place for given map
 * @api public
 */
exp.getBornPlace = function(areaId){
	return maps[areaId].getBornPlace();
};

/**
 * Proxy for map, get born point for given map
 * @api public
 */
exp.getBornPoint = function(areaId){
	return maps[areaId].getBornPoint();
};

/**
 * Change area, will transfer a player from one area to another
 * @param args {Object} The args for transfer area, the content is {playerId, areaId, target, frontendId}
 * @param cb {funciton} Call back funciton
 * @api public
 */
exp.changeArea = function(args, session, cb) {
	var uid = args.uid;
	var playerId = args.playerId;
	var areaId = args.areaId;
	var target = args.target;
	var player = area.getPlayer(playerId);
	var frontendId = args.frontendId;
	area.removePlayer(playerId);
	//messageService.pushMessage({route:'onUserLeave', code: 200, playerId: playerId});

	var pos = this.getBornPoint(target);

	player.areaId = target;
	player.x = pos.x;
	player.y = pos.y;
	userDao.updatePlayer(player, function(err, success) {
		if(err || !success) {
			err = err || 'update player failed!';
			utils.invokeCallback(cb, err);
		} else {
			session.set('areaId', target);
			session.push('areaId', function(err) {
				if(err){
					logger.error('Change area for session service failed! error is : %j', err.stack);
				}
				utils.invokeCallback(cb, null);
			});
		}
	});
};


