var logger = require('pomelo-logger').getLogger(__filename);
var util = require('../util');
var consts = require('../consts');
var cliff = require('cliff');

module.exports = function(opts) {
	return new Command(opts);
};

module.exports.commandId = 'stop';
module.exports.helpCommand = 'help stop';

var Command = function(opt) {

}

Command.prototype.handle = function(agent, comd, argv, rl, client, msg) {
	if (!comd) {
		agent.handle(module.exports.helpCommand, msg, rl, client);
		return;
	}

	var Context = agent.getContext();
	var argvs = util.argsFilter(argv);

	var ids = [];
	if (comd !== 'all') {
		ids = argvs.slice(1);
	}

	rl.question(consts.STOP_QUESTION_INFO, function(answer) {
		if (answer === 'yes') {
			client.request(consts.CONSOLE_MODULE, {
				signal: "stop",
				ids: ids
			}, function(err, data) {
				if (err) console.log(err);
				else util.formatOutput(comd, data);
				rl.prompt();
			});
		} else {
			rl.prompt();
		}
	});
}