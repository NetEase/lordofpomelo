var ChannelUtil = module.exports;

var GLOBAL_CHANNEL_NAME = 'pomelo';
var AREA_CHANNEL_PREFIX = 'instance_';

ChannelUtil.getGlobalChannelName = function() {
	return GLOBAL_CHANNEL_NAME;
};

ChannelUtil.getAreaChannelName = function(areaId) {
	return AREA_CHANNEL_PREFIX + areaId;
};