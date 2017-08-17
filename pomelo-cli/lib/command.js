var consts = require('./consts');
var util = require('./util');
var cliff = require('cliff');
var fs = require('fs');

var Command = function() {
	this.commands = {};
	this.init();
	this.Context = 'all';
}

module.exports = function(){
	return new Command();
}

Command.prototype.init = function() {
	var self = this;
	fs.readdirSync(__dirname + '/commands').forEach(function(filename) {
		if (/\.js$/.test(filename)) {
			var name = filename.substr(0, filename.lastIndexOf('.'));
			var _command = require('./commands/' + name);
			self.commands[name] = _command;
		}
	});
}

Command.prototype.handle = function(argv, msg, rl, client){
	var self = this;
	var argvs = util.argsFilter(argv);
	var comd = argvs[0];
	var comd1 = argvs[1] || "";

	comd1 = comd1.trim();
	var m = this.commands[comd];
	if(m){
		var _command = m();
		_command.handle(self, comd1, argv, rl, client, msg);
	} else {
		util.errorHandle(argv, rl);
	}
}

Command.prototype.quit = function(rl){
	rl.emit('close');
}

Command.prototype.kill = function(rl, client){
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

Command.prototype.getContext = function(){
	return this.Context;
}

Command.prototype.setContext = function(context){
	this.Context = context;
}
