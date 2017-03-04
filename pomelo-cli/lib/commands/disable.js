var logger = require('pomelo-logger').getLogger(__filename);
var util = require('../util');
var consts = require('../consts');
var cliff = require('cliff');

module.exports = function(opts) {
	return new Command(opts);
};

module.exports.commandId = 'disable';
module.exports.helpCommand = 'help disable';

var Command = function(opt) {

}

Command.prototype.handle = function(agent, comd, argv, rl, client, msg) {
	if (!comd) {
		agent.handle(module.exports.helpCommand, msg, rl, client);
		return;
	}

	var Context = agent.getContext();
	if (Context === 'all') {
		util.log('\n' + consts.COMANDS_CONTEXT_ERROR + '\n');
		rl.prompt();
		return;
	}
	
	var argvs = util.argsFilter(argv);

	if (argvs.length > 3) {
		agent.handle(module.exports.helpCommand, msg, rl, client);
		return;
	}

	var param = argvs[2];

	if (comd === 'module') {
		client.command(module.exports.commandId, param, null, function(err, data) {
			if (err) console.log(err);
			else {
				if(data === 1){
					util.log('\ncommand ' + argv + ' ok\n');
				}	else {
					util.log('\ncommand ' + argv + ' bad\n');
				}
			}
			rl.prompt();
		});
	} else if (comd === 'app') {
		client.request('watchServer', {
			comd: module.exports.commandId,
			param: param,
			context: Context
		}, function(err, data) {
			if (err) console.log(err);
			else util.log('\n' + data + '\n');
			rl.prompt();
		});
	} else {
		agent.handle(module.exports.helpCommand, msg, rl, client);
	}
}