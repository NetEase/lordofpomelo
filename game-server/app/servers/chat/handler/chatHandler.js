var Event = require('../../../consts/consts').Event;
var Code = require('../../../../../shared/code');
var SCOPE = {PRI:'279106', AREA:'F7A900', ALL:'D41313'};
var channelUtil = require('../../../util/channelUtil');
var logger = require('pomelo-logger').getLogger(__filename);

module.exports = function(app) {
	return new ChannelHandler(app, app.get('chatService'));
};

var ChannelHandler = function(app, chatService) {
	this.app = app;
	this.chatService = chatService;
};

function setContent(str) {
	str = str.replace(/<\/?[^>]*>/g,''); 
	str = str.replace(/[ | ]*\n/g,'\n'); 
	return str.replace(/\n[\s| | ]*\r/g,'\n'); 
}

ChannelHandler.prototype.send = function(msg, session, next) {
	var scope, content, message, channelName, uid, code;
	uid = session.uid;
	scope = msg.scope;
	channelName = getChannelName(msg);
  msg.content = setContent(msg.content);
	content = {uid: uid, content: msg.content, scope: scope, kind: msg.kind || 0, from: msg.from};
	message = {route: Event.chat, msg: content};
  var self = this;
	if (scope !== SCOPE.PRI) {
		this.chatService.pushByChannel(channelName, message, function(err, res) {
			if(err) {
				logger.error(err.stack);
				code = Code.FAIL;
			} else if(res){
				code = res;
			} else {
				code = Code.OK;
			}

			next(null, {code: code});
		});
	} else {
		this.chatService.pushByPlayerName(msg.toName, message, function(err, res) {
			if(err) {
				logger.error(err.stack);
				code = Code.FAIL;
			} else if(res){
				code = res;
			} else {
				code = Code.OK;
			}
			next(null, {code: code});
		});
	}
};

var getChannelName = function(msg){
	var scope = msg.scope;
	if (scope === SCOPE.AREA) {
		return channelUtil.getAreaChannelName(msg.areaId);
	} 
	return channelUtil.getGlobalChannelName();
};
