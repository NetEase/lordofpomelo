var logger = require('pomelo-logger').getLogger(__filename);
var util = require('../util');
var consts = require('../consts');

module.exports = function(opts) {
	return new Command(opts);
};

module.exports.commandId = 'run';
module.exports.helpCommand = 'help run';

var Command = function(opt){

}

Command.prototype.handle = function(agent, comd, argv, rl, client, msg){
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

	if(argvs.length < 2){
		agent.handle(module.exports.helpCommand, msg, rl, client);
		return;
	}

	client.request('watchServer', {
		comd: module.exports.commandId,
		param: comd,
		context: Context
	}, function(err, data) {
		if (err) console.log(err);
		else util.formatOutput(module.exports.commandId, data);
		rl.prompt();
	});
}