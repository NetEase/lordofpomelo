/**
 * Module dependencies
 */

var utils = require('../../../util/utils');
var userDao = require('../../../dao/userDao');
var bagDao = require('../../../dao/bagDao');
var taskDao = require('../../../dao/taskDao');
var equipmentsDao = require('../../../dao/equipmentsDao');
var consts = require('../../../consts/consts');
var areaService = require('../../../services/areaService');
var consts = require('../../../consts/consts');
var pomelo = require('pomelo');

var exp = module.exports;

/**
 * Player exits. It will persistent player's state in the database.
 *
 * @param {Object} args
 * @param {Function} cb
 * @api public
 */
exp.playerLeave = function(args, cb){
	var playerId = args.playerId;
	var area = pomelo.app.areaManager.getArea(args.instanceId);
	var player = area.getPlayer(playerId);
	var sceneId = player.areaId;

	if(!player) {
		utils.invokeCallback(cb);
		return;
	}

	if(player.hp === 0){
		player.hp = Math.floor(player.maxHp/2);
	}

	//If player is in a instance, move to the scene
	if(area.type !== consts.AreaType.SCENE){
		var pos = areaService.getBornPoint(sceneId);
		player.x = pos.x;
		player.y = pos.y;
	}

	userDao.updatePlayer(player);
	bagDao.update(player.bag);
	equipmentsDao.update(player.equipments);
	tasksUpdate(player.curTasks);
	area.removePlayer(playerId);
	area.channel.pushMessage({route: 'onUserLeave', code: consts.MESSAGE.RES, playerId: playerId});
	utils.invokeCallback(cb);
};

// Persistent tasks' data in the database.
var tasksUpdate = function(tasks) {
	for (var id in tasks) {
		var task = tasks[id];
		taskDao.update(task);
	}
};
