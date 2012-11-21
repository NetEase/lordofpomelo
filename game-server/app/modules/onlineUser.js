/*!
 * Pomelo -- consoleModule onlineUser 
 * Copyright(c) 2012 fantasyni <fantasyni@163.com>
 * MIT Licensed
 */
var logger = require('pomelo-logger').getLogger(__filename);
var utils = require('../util/utils');

module.exports = function(opts) {
	return new Module(opts);
};

module.exports.moduleId = 'onlineUser';

var Module = function(opts) {
	opts = opts || {};
	this.app = opts.app;
	this.type = opts.type || 'pull';
	this.interval = opts.interval || 5;
};

Module.prototype.monitorHandler = function(agent, msg) {
	var connectionService = this.app.components.__connection__;
	if(!connectionService) {
		logger.error('not support connection: %j', agent.id);
		return;
	}
	agent.notify(module.exports.moduleId, connectionService.getStatisticsInfo());
};

Module.prototype.masterHandler = function(agent, msg) {
	if(!msg) {
		// pull interval callback
		var list = agent.typeMap['connector'];
		if(!list || list.length === 0) {
			return;
		}
		agent.notifyByType('connector', module.exports.moduleId);
		return;
	}

	var data = agent.get(module.exports.moduleId);
	if(!data) {
		data = {};
		agent.set(module.exports.moduleId, data);
	}

	data[msg.serverId] = msg;
};

Module.prototype.clientHandler = function(agent, msg, cb) {
	utils.invokeCallback(cb, null, agent.get(module.exports.moduleId));
};
