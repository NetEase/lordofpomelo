var logger = require('pomelo-logger').getLogger(__filename);
var pomelo = require('pomelo');
var equipApi = require('../util/dataApi').equipment;
var Equipments = require('../domain/equipments');
var utils = require('../util/utils');

var equipmentsDao = module.exports;

/**
 * Create equipment
 *
 * @param {Number} playerId Player id. 
 * @param {function} cb Callback function
 */
equipmentsDao.createEquipments = function (playerId, cb) {
	var sql = 'insert into Equipments (playerId) values (?)';
	var args = [playerId];

	pomelo.app.get('dbclient').insert(sql, args, function(err, res) {
		if (err) {
			logger.error('create equipments for equipmentDao failed! ' + err.stack);
			utils.invokeCallback(cb, err, null);
		} else {
			var equip = new Equipments({ id: res.insertId });
			utils.invokeCallback(cb, null, equip);
		}
	});
};

/**
 * Get player's equipment by playerId
 *
 * @param {Number} playerId 
 * @param {funciton} cb 
 */
equipmentsDao.getEquipmentsByPlayerId = function(playerId, cb) {
	var sql = 'select * from Equipments where playerId = ?';
	var args = [playerId];

	pomelo.app.get('dbclient').query(sql, args, function(err, res) {
		if (err) {
			logger.error('get equipments by playerId for equipmentsDao failed! ' + err.stack);
			utils.invokeCallback(cb, err, null);
		} else {
			if (res && res.length === 1) {
				var result = res[0];
				var equips = new Equipments(result);
				utils.invokeCallback(cb, null, equips);
			} else {
				logger.error('equipments not exist!! ' );
				utils.invokeCallback(cb, new Error('equipments not exist '));
			}
		}
	});
};

/**
 * Updata equipment
 * @param {Object} val Update params, in a object.
 * @param {function} cb
 */
equipmentsDao.update = function(val, cb) {
	var sql = 'update Equipments set weapon = ?, armor = ?, helmet = ?, necklace = ?, ring = ?, belt = ?, amulet = ?, legguard = ?, shoes = ?	where id = ?';
	var args = [val.weapon, val.armor, val.helmet, val.necklace, val.ring, val.belt, val.amulet, val.legguard, val.shoes, val.id];

	pomelo.app.get('dbclient').query(sql, args, function(err, res) {
		utils.invokeCallback(cb, err, res);
	});
};

/**
 * destroy equipment
 *
 * @param {number} playerId
 * @param {function} cb
 */
equipmentsDao.destroy = function(playerId, cb) {
	var sql = 'delete from Equipments where playerId = ?';
	var args = [playerId];

	pomelo.app.get('dbclient').query(sql, args, function(err, res) {
		utils.invokeCallback(cb, err, res);
	});
};