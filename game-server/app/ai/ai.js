var AiManager = require('./service/aiManager');
var BrainService = require('./service/brainService');
var fs = require('fs');
var path = require('path');

var exp = module.exports;

exp.createManager = function(opts) {
	var brainService = new BrainService();
	fs.readdirSync(__dirname + '/brain').forEach(function(filename){
		if (!/\.js$/.test(filename)) {
			return;
		}
		var name = path.basename(filename, '.js');
		var brain = require('./brain/' + name);
		brainService.registerBrain(brain.name||name, brain);
	});

	opts = opts || {};
	opts.brainService = brainService;
	return new AiManager(opts);
};
