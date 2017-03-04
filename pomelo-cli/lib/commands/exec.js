var logger = require('pomelo-logger').getLogger(__filename);
var util = require('../util');
var consts = require('../consts');
var cliff = require('cliff');
var fs = require('fs');

module.exports = function(opts) {
	return new Command(opts);
};

module.exports.commandId = 'exec';
module.exports.helpCommand = 'help exec';

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

	if(argvs.length >2){
		agent.handle(module.exports.helpCommand, msg, rl, client);
		return;
	}

	var file = null;
	if(comd[0] !== '/'){
		comd = process.cwd() + '/' + comd;
	}

	try{
		file = fs.readFileSync(comd).toString();
	}catch(e){
		util.log(consts.COMANDS_EXEC_ERROR);
		rl.prompt();
		return;
	}

	client.request('scripts', {
		command: 'run',
		serverId: Context,
		script: file
	}, function(err, msg) {
		if (err) console.log(err);
		else {
			try{
				msg = JSON.parse(msg);
				util.formatOutput(module.exports.commandId, msg);	
			}catch(e){
				util.log('\n' + msg + '\n');
			}
		}
		rl.prompt();
	});
}
