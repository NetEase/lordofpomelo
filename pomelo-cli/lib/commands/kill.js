var logger = require('pomelo-logger').getLogger(__filename);
var util = require('../util');
var consts = require('../consts');
var cliff = require('cliff');

module.exports = function(opts) {
	return new Command(opts);
};

module.exports.commandId = 'kill';
module.exports.helpCommand = 'help kill';

var Command = function(opt){

}

Command.prototype.handle = function(agent, comd, argv, rl, client, msg){
	rl.question(consts.KILL_QUESTION_INFO, function(answer){
		if(answer === 'yes'){
			client.request(consts.CONSOLE_MODULE, {
				signal: "kill"
			}, function(err, data) {
				if (err) console.log(err);
				rl.prompt();
			});
		} else {
			rl.prompt();
		}
	});
}