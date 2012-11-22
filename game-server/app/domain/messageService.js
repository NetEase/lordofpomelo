var pomelo = require('pomelo');
var area = require('./area/area');
var timer = require('./area/timer');
var logger = require('pomelo-logger').getLogger(__filename);
var EntityType = require('../consts/consts').EntityType;

var exp = module.exports;

exp.pushMessage = function (msg, cb) {
  area.channel().pushMessage(msg, errHandler);
};

exp.pushMessageByUids = function (msg, uids) {
	pomelo.app.get('channelService').pushMessageByUids(msg, uids, errHandler);
};

exp.pushMessageToPlayer = function (route, msg) {
  var uids = [route];
  exp.pushMessageByUids(msg, uids, errHandler);
};

exp.pushMessageByAOI = function (msg, pos, ignoreList) {
  var uids = timer.getWatcherUids(pos, [EntityType.PLAYER], ignoreList);

  if (uids.length > 0) {
      exp.pushMessageByUids(msg, uids);
  }
};

function errHandler(err, fails){
	if(!!err){
		logger.error('Push Message error! %j', err.stack);
	}
	if(!!fails && fails.length > 0){
		for(var i = 0; i < fails.length; i++){
			area.removePlayerByUid(fails[i]);
		}
	}
}