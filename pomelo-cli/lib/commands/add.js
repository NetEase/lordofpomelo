var logger = require('pomelo-logger').getLogger(__filename);
var util = require('../util');
var consts = require('../consts');
var cliff = require('cliff');

module.exports = function(opts) {
	return new Command(opts);
};

module.exports.commandId = 'add';
module.exports.helpCommand = 'help add';

var Command = function(opt) {

}

Command.prototype.handle = function(agent, comd, argv, rl, client, msg) {
	if (!comd) {
		agent.handle(module.exports.helpCommand, msg, rl, client);
		return;
	}

	var argvs = util.argsFilter(argv);

	rl.question(consts.ADD_QUESTION_INFO, function(answer) {
		if (answer === 'yes') {
			client.request(consts.CONSOLE_MODULE, {
				signal: 'add',
				args: argvs.slice(1)
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