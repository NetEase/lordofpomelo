var pomelo = require('pomelo');
var logger = require('pomelo-logger').getLogger(__filename);
var userDao = require('../../../dao/userDao');
var equipDao = require('../../../dao/equipmentsDao');
var bagDao = require('../../../dao/bagDao');
var consts = require('../../../consts/consts');
var channelUtil = require('../../../util/channelUtil');
var utils = require('../../../util/utils');
var async = require('async');

module.exports = function(app) {
	return new Handler(app);
};

var Handler = function(app) {
	this.app = app;
};

Handler.prototype.createPlayer = function(msg, session, next) {
	var uid = session.uid, roleId = msg.roleId, name = msg.name;
	var self = this;

	userDao.getPlayerByName(name, function(err, player) {
		if (player) {
			next(null, {code: consts.MESSAGE.ERR});
			return;
		}

		userDao.createPlayer(uid, name, roleId, function(err, player){
			if(err) {
				logger.error('[register] fail to invoke createPlayer for ' + err.stack);
				next(null, {code: consts.MESSAGE.ERR, error:err});
				return;
			}else{
				async.parallel([
				function(callback) {
					equipDao.createEquipments(player.id, callback);
				},
				function(callback) {
					bagDao.createBag(player.id, callback);
				},
				function(callback) {
					player.learnSkill(1, callback);
				}],
				function(err, results) {
					if (err) {
						logger.error('learn skill error with player: ' + JSON.stringify(player.strip()) + ' stack: ' + err.stack);
						next(null, {code: consts.MESSAGE.ERR, error:err});
						return;
					}
					afterLogin(self.app, msg, session, {id: uid}, player.strip(), next);
				});
			}
		});
	});
};

var afterLogin = function (app, msg, session, user, player, next) {
	async.waterfall([
		function(cb) {
			session.bind(user.id, cb);
		}, 
		function(cb) {
			session.set('username', user.name);
			session.set('areaId', player.areaId);
      session.set('serverId', app.get('areaIdMap')[player.areaId]);
			session.set('playername', player.name);
			session.set('playerId', player.id);
			session.on('closed', onUserLeave);
			session.pushAll(cb);
		}, 
		function(cb) {
			app.rpc.chat.chatRemote.add(session, user.id, player.name, channelUtil.getGlobalChannelName(), cb);
		}
	], 
	function(err) {
		if(err) {
			logger.error('fail to select role, ' + err.stack);
			next(null, {code: consts.MESSAGE.ERR});
			return;
		}
		next(null, {code: consts.MESSAGE.RES, user: user, player: player});
	});
};

var onUserLeave = function (session, reason) {
	if(!session || !session.uid) {
		return;
	}

	utils.myPrint('2 ~ OnUserLeave is running ...');
	var rpc= pomelo.app.rpc;
	rpc.area.playerRemote.playerLeave(session, {playerId: session.get('playerId'), areaId: session.get('areaId')}, null);
	rpc.chat.chatRemote.kick(session, session.uid, null);
};
