/**
 * Module dependencies
 */
var Item = require('./entity/item');
var Equipment = require('./entity/equipment');
var dataApi = require('../util/dataApi');
var messageService = require('./messageService');

/**
 * Expose 'taskReward'
 */
var taskReward = module.exports;

/**
 * Player get rewards after task is completed.
 * the rewards contain equipments and exprience, according to table of figure
 *
 * @param {Player} player
 * @param {Array} ids
 * @api public
 */
taskReward.reward = function(area, player, ids) {
	if (ids.length < 1) {
		return;
	}

	var i, l;
	var tasks = player.curTasks;
	var pos = player.getState();
	var totalItems = [], totalExp = 0;

	for (i = 0, l=ids.length; i < l; i++) {
		var id = ids[i];
		var task = tasks[id];
		var items = task.item.split(';');
		var exp = task.exp;
		for (var j = 0; j < items.length; j++) {
			totalItems.push(items[j]);
		}
		totalExp += exp;
	}

	var equipments = this._rewardItem(totalItems, pos);
	this._rewardExp(player, totalExp);

	for (i = 0, l=equipments.length; i < l; i ++) {
		area.addEntity(equipments[i]);
	}

	messageService.pushMessageToPlayer({uid:player.userId, sid : player.serverId}, 'onDropItems', equipments);
};

/**
 * Rewards of equipments.
 *
 * @param {Array} items
 * @param {Object} pos
 * @return {Object}
 * @api private
 */
taskReward._rewardItem = function(items, pos) {
	var length = items.length;
	var equipments = [];
	if (length > 0) {
		for (var i = 0; i < length; i++) {
			var itemId = items[i];
			var itemData = dataApi.equipment.findById(itemId);
			var equipment = new Equipment({
				kindId: itemData.id,
				x: pos.x + Math.random() * 50,
				y: pos.y + Math.random() * 50,
				kindName: itemData.name,
				name: itemData.name,
				desc: itemData.desc,
				kind: itemData.kind,
				attackValue: itemData.attackValue,
				defenceValue: itemData.defenceValue,
				price: itemData.price,
				color: itemData.color,
				imgId: itemData.imgId,
				heroLevel: itemData.heroLevel,
				playerId: itemData.playerId
			});
			equipments.push(equipment);
		}
		return equipments;
	}
};

/**
 * Rewards of exprience.
 *
 * @param {Player} player
 * @param {Number} exprience
 * @api private
 */
taskReward._rewardExp = function(player, exprience) {
	player.addExperience(exprience);
};

