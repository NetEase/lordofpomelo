var crc = require('crc');

module.exports.dispatch = function(uid, connectors) {
	var index = Number(uid) % connectors.length;
	return connectors[index];
};
