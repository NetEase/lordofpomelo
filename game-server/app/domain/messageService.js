var pomelo = require('pomelo');
var area = require('./area/area');
var timer = require('./area/timer');
var EntityType = require('../consts/consts').EntityType;

var exp = module.exports;

exp.pushMessage = function (msg, cb) {
    area.channel().pushMessage(msg, cb);
};

exp.pushMessageByUids = function (msg, uids, cb) {
    pomelo.app.get('channelService').pushMessageByUids(msg, uids, cb);
};

exp.pushMessageToPlayer = function (route, msg, cb) {
    var uids = [route];
    exp.pushMessageByUids(msg, uids, cb);
};

exp.pushMessageByAOI = function (msg, pos, ignoreList) {
    var uids = timer.getWatcherUids(pos, [EntityType.PLAYER], ignoreList);

    if (uids.length > 0) {
        exp.pushMessageByUids(msg, uids);
    }
};
