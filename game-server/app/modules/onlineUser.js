/*!
 * Pomelo -- consoleModule onlineUser 
 * Copyright(c) 2012 fantasyni <fantasyni@163.com>
 * MIT Licensed
 */
// var logger = require('pomelo-logger').getLogger(__filename);
// var utils = require('../util/utils');
//
// module.exports = function(opts) {
// 	return new Module(opts);
// };
//
// module.exports.moduleId = 'onlineUser';
//
// var Module = function(opts) {
// 	opts = opts || {};
// 	this.app = opts.app;
// 	this.type = opts.type || 'pull';
// 	this.interval = opts.interval || 30;
// };
//
// Module.prototype.monitorHandler = function(agent, msg) {
// 	var connectionService = this.app.components.__connection__;
// 	if(!connectionService) {
// 		logger.error('not support connection: %j', agent.id);
// 		return;
// 	}
// 	var info = connectionService.getStatisticsInfo();
// 	agent.notify(module.exports.moduleId, info);
// };
//
// Module.prototype.masterHandler = function(agent, msg) {
// 	if(!msg) {
// 		// pull interval callback
// 		var list = agent.typeMap['connector'];
// 		if(!list || list.length === 0) {
// 			return;
// 		}
// 		agent.notifyByType('connector', module.exports.moduleId);
// 		return;
// 	}
//
// 	var data = agent.get(module.exports.moduleId);
// 	if(!data) {
// 		data = {};
// 		agent.set(module.exports.moduleId, data);
// 	}
//
// 	data[msg.serverId] = msg;
// };
//
// Module.prototype.clientHandler = function(agent, msg, cb) {
//     utils.invokeCallback(cb, null, agent.get(module.exports.moduleId));
// };

var async = require('async');

module.exports = function (opts) {
    return new Module(opts);
};

module.exports.moduleId = 'onlineUser';

var Module = function (opts) {
    opts = opts || {};
    this.app = opts.app;
};

Module.prototype.monitorHandler = function (agent, msg, cb) {
    var app = this.app;

    var connection = app.components.__connection__;
    if (!connection) {
        cb({
            serverId: agent.id,
            body    : 'error'
        });
        return;
    }

    var connectionService = this.app.components.__connection__;
	if(!connectionService) {
		// logger.error('not support connection: %j', agent.id);
		return;
	}
    var info = connectionService.getStatisticsInfo();
    console.log('serverId: ' ,agent.id, ' info: ', info);
    cb(null, {
        serverId: agent.id,
        body    : info
    });
};

Module.prototype.clientHandler = function (agent, msg, cb) {
    var app = this.app;
    var servers = app.getServersByType('connector');
    var onLineUser = {};
    if(servers){
        async.mapSeries(servers,function(server,callback){
            agent.request(server.id, module.exports.moduleId, msg, function(err,info){
                if(err){
                    cb(null,{body : 'err'});
                    return;
                }
                delete info.body.loginedList;
                onLineUser[server.id] = info.body;
                callback();
            });
        },function(err,res){
            console.log('onLineUser: ', onLineUser);
            cb(null,{
                body : onLineUser
            });
        });
    }else{
        cb(null,{boyd : onLineUser});
    }
};