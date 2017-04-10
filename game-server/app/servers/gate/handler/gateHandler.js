var Code = require('../../../../../shared/code');
var dispatcher = require('../../../util/dispatcher');
var os = require('os');

/**
 * Gate handler that dispatch user to connectors.
 */
module.exports = function(app) {
	return new Handler(app);
};

var Handler = function(app) {
	this.app = app;
};

Handler.prototype.queryEntry = function(msg, session, next) {
	var uid = msg.uid;
	if(!uid) {
		next(null, {code: Code.FAIL});
		return;
	}

	var connectors = this.app.getServersByType('connector');
	if(!connectors || connectors.length === 0) {
		next(null, {code: Code.GATE.FA_NO_SERVER_AVAILABLE});
		return;
	}

	var res = dispatcher.dispatch(uid, connectors);
	var addr = process.env.LORD_PUB_HOST;

	if (!addr) {
		addr = getPubHost();
	}

	if (!addr) {
		addr = res.pubHost;
	}
	next(null, {code: Code.OK, host: addr, port: res.clientPort});
}
 
function getPubHost() {
	var ifs = os.getNetworkInterfaces();
	for(var i in ifs) {
		var iface = ifs[i];
		for (var j = 0; j < iface.length; ++j) {
			var addr = iface[j].address;
			if ((addr.indexOf('10.') !== 0) &&
				(addr.indexOf('127.') !== 0) &&
				(addr.indexOf('172.1') !== 0) &&
				(addr.indexOf(':') === -1) &&  // ignore ipv6
				(addr.indexOf('192.168.') !== 0)) {
				return addr;
			}
		}
	}
	return null;
};
