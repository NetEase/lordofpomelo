var id = 1;

/**
 * Action class, used to excute the action in server
 */
var Action = function(opts){
	this.data = opts.data;
	this.id = opts.id || id++;
	this.type = opts.type || 'defaultAction';
	
	this.finished = false;
	this.aborted = false;
	this.singleton = false || opts.singleton;
};

/**
 * Update interface, default update will do nothing, every tick the update will be invoked
 * @api public
 */
Action.prototype.update = function(){
};

module.exports = Action;
