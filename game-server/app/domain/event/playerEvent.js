var consts = require('../../consts/consts');
var messageService = require('./../messageService');
var logger = require('pomelo-logger').getLogger(__filename);

var exp = module.exports;

/**
 * Handle player event
 */
exp.addEventForPlayer = function (player){
	/**
	 * Handler upgrade event for player, the message will be pushed only to the one who upgrade
	 */
	player.on('upgrade', function() {
		logger.debug('event.onUpgrade: ' + player.level + ' id: ' + player.id);
		var uid = {uid:player.userId, sid : player.serverId};
		messageService.pushMessageToPlayer(uid, 'onUpgrade', player.strip());
	});

	/**
	 * Handle pick item event for player, it will invoked when player pick item success
	 */
	player.on('pickItem', function(args){
		if(args.result !== consts.Pick.SUCCESS){
			logger.debug('Pick Item error! Result : ' + args.result);
			return;
		}

		var item = args.item;
		var player = args.player;

		player.area.removeEntity(item.entityId);
		messageService.pushMessageByAOI(player.area, {route: 'onPickItem', player: player.entityId, item: item.entityId, index: args.index}, {x: item.x, y: item.y});
	});
};
