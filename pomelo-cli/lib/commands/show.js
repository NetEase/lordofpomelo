var logger = require('pomelo-logger').getLogger(__filename);
var util = require('../util');
var consts = require('../consts');
var cliff = require('cliff');

module.exports = function(opts) {
	return new Command(opts);
};

module.exports.commandId = 'show';
module.exports.helpCommand = 'help show';

var Command = function(opt) {

}

Command.prototype.handle = function(agent, comd, argv, rl, client, msg) {
	if (!comd) {
		agent.handle(module.exports.helpCommand, msg, rl, client);
		return;
	}

	var Context = agent.getContext();
	var argvs = util.argsFilter(argv);
	var param = "";

	if (argvs.length > 2 && comd !== 'config') {
		agent.handle(module.exports.helpCommand, msg, rl, client);
		return;
	}

	if (argvs.length > 3 && comd === 'config') {
		agent.handle(module.exports.helpCommand, msg, rl, client);
		return;
	}

	if (argvs.length === 3 && comd === 'config') {
		param = argvs[2];
	}

	var user = msg['user'] || 'admin';

	if (Context === 'all' && consts.CONTEXT_COMMAND[comd]) {
		util.log('\n' + consts.COMANDS_CONTEXT_ERROR + '\n');
		rl.prompt();
		return;
	}

	if (!consts.SHOW_COMMAND[comd]) {
		agent.handle(module.exports.helpCommand, msg, rl, client);
		return;
	}
	
	client.request('watchServer', {
		comd: comd,
		param: param,
		context: Context
	}, function(err, data) {
		if (err) console.log(err);
		else util.formatOutput(comd, data);
		rl.prompt();
	});
}