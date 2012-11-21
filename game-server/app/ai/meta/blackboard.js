var Blackboard = function(opts) {
	this.manager = opts.manager;
	this.area = opts.area;
	this.curCharacter = opts.curCharacter;
};

var pro = Blackboard.prototype;

module.exports.create = function(opts) {
	return new Blackboard(opts);
};
