__resources__["/task.js"] = {meta: {mimetype: "application/javascript"}, data: function(exports, require, module, __filename, __dirname) {
	/**
	 * Module dependencies.
	 */
	var EventEmitter = window.EventEmitter;

	/**
	 * Initialize a new 'Task' with the given 'opts'
	 *
	 * @param {Object} opts
	 * @api public
	 */
	var Task = function(opts){
		this.id = opts.id;
		this.taskState = opts.taskState;
		this.taskData = opts.taskData;
		this.name = opts.name;
		this.acceptTalk = opts.acceptTalk;
		this.workTalk = opts.workTalk;
		this.finishTalk = opts.finishTalk;
		this.exp = opts.exp;
		this.item = opts.item;
		this.completeCondition = opts.completeCondition;

		EventEmitter.call(this, opts);
	};

	/**
	 * Expose 'Task' constructor.
	 */
	module.exports = Task;

	Task.prototype=Object.create(EventEmitter.prototype);

	/**
	 * Set taskState.
	 *
	 * @param {Number} state
	 * @api public
	 */
	Task.prototype.setState = function(state) {
		this.taskState = state;
		this.emit('change:state');
	};
}};
