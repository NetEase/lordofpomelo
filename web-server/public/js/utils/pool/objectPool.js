__resources__["/objectPool.js"] = {meta: {mimetype: "application/javascript"}, data: function(exports, require, module, __filename, __dirname) {

	/**
	 * Initialize 'objectPool' with the given 'opts'
	 * ObjectPool maintains a number of objects with the same information
	 */
	var ObjectPool = function(opts) {
		this.getNewObject = opts.getNewObject; //the callback function is called when new object is required
		this.destoryObject = opts.destoryObject;// the callback function is called when object is disposed
		this.initCount = opts.initCount || 5;
		this.enlargeCount = opts.enlargeCount || 2;
		this.index = 0;
		this.maxCount = 15;
		this.pool = [];//contains all the objects

		this._initialize();
	};

	/**
	 * Get item from objectPool.
	 *
	 * @return {Object}
	 * @api public
	 */

	ObjectPool.prototype.getObject = function() {
		if (this.index > 0) {
			return this.pool[--this.index];
		}
		if (this.pool.length > this.maxCount) {
			return null;
		}
		for(var i = 0; i < this.enlargeCount; i++) {
			this.pool.unshift(this.getNewObject());
		}
		this.index = this.enlargeCount;
		return this.getObject();
	};

	/**
	 * Return item to objectPool.
	 *
	 * @api public
	 */

	ObjectPool.prototype.returnObject = function(object) {

		if (this.index >= this.pool.length) {
			return;
		}
		this.pool[this.index++] = object;
	};

	/**
	 * Destory objectPool
	 *
	 * @api public
	 */

	ObjectPool.prototype.destory = function() {
		var n = this.pool.length;
		for (var i = 0; i < n; i++) {
			this.destoryObject(this.pool[i]);
		}
		this.pool = null;
		this.getNewObject = null;
		this.destoryObject = null;
	};

	/*
	 * Initialize the object pool with function getNewObject
	 *
	 * @api private
	 */

	ObjectPool.prototype._initialize = function() {
		if (!this.getNewObject) {
			return;
		}
		for (var i = 0; i < this.initCount; i++) {
			this.pool[i] = this.getNewObject();
		}
		this.index = this.initCount;
	};

	module.exports = ObjectPool;

}};
