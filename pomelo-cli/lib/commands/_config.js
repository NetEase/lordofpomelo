var logger = require('pomelo-logger').getLogger(__filename);
var util = require('../util');
var consts = require('../consts');
var cliff = require('cliff');

module.exports = function(opts) {
	return new Command(opts);
};

module.exports.commandId = 'config';
module.exports.helpCommand = 'help config';

var Command = function(opt) {

}

Command.prototype.handle = function(agent, comd, argv, rl, client, msg) {
	if (!comd) {
		agent.handle(module.exports.helpCommand, msg, rl, client);
		return;
	}
	var Context = agent.getContext();
	var argvs = util.argsFilter(argv);

	if (argvs.length > 2) {
		agent.handle(module.exports.helpCommand, msg, rl, client);
		return;
	}

	var user = msg['user'] || 'admin';

	if (Context === 'all') {
		util.log('\n' + consts.COMANDS_CONTEXT_ERROR + '\n');
		rl.prompt();
		return;
	}

	client.request('watchServer', {
		comd: module.exports.commandId,
		param: comd,
		context: Context
	}, function(err, data) {
		if (err) console.log(err);
		else util.log('\n' + cliff.inspect(data) + '\n');
		rl.prompt();
	});
}