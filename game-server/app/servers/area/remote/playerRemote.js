/**
 * Module dependencies
 */

var utils = require('../../../util/utils');
var userDao = require('../../../dao/userDao');
var bagDao = require('../../../dao/bagDao');
var taskDao = require('../../../dao/taskDao');
var equipmentsDao = require('../../../dao/equipmentsDao');
var area = require('../../../domain/area/area');
var consts = require('../../../consts/consts');
var messageService = require('../../../domain/messageService');
var consts = require('../../../consts/consts');


var exp = module.exports;

/**
 * Player exits. It will persistent player's state in the database. 
 *
 * @param {Object} args
 * @param {Function} cb
 * @api public
 */
exp.playerLeave = function(args, cb){
	var areaId = args.areaId;
	var playerId = args.playerId;
	var player = area.getPlayer(playerId);

	if(!player) {
		utils.invokeCallback(cb);
		return;
	}
	
	if(player.hp == 0){
		player.hp = Math.floor(player.maxHp/2);
	}
	userDao.updatePlayer(player);
	bagDao.update(player.bag);
	equipmentsDao.update(player.equipments);
	tasksUpdate(player.curTasks);
	area.removePlayer(playerId);
	messageService.pushMessage({route: 'onUserLeave', code: consts.MESSAGE.RES, playerId: playerId});
	utils.invokeCallback(cb);
};

// Persistent tasks' data in the database.
var tasksUpdate = function(tasks) {
	for (var id in tasks) {
		var task = tasks[id];
		taskDao.update(task);
	}
};
