var crc = require('crc');

module.exports.dispatch = function(uid, connectors) {
	var index = Math.abs(crc.crc32(Number(uid))) % connectors.length;
	return connectors[index];
};
