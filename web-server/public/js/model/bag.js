__resources__["/bag.js"] = {meta: {mimetype: "application/javascript"}, data: function(exports, require, module, __filename, __dirname) {
	var EventEmitter = window.EventEmitter;

	/**
	 * Initialize a new 'Bag' with the given 'opts'
	 * Bag inherits Persistent
	 *
	 * @param {Object} opts
	 * @api public
	 */
	var Bag = function(opts) {
		EventEmitter.call(this);
		this.itemCount = opts.itemCount;
		this.items = opts.items;
		this.usedCount = Object.keys(this.items).length;
	};

	Bag.prototype = Object.create(EventEmitter.prototype);
	var pro = Bag.prototype;
	
/**
 * add item
 *
 * @param {obj} item {id: 123, type: 'item'}
 * @return {Boolean}
 * @api public
 */
	pro.addItem = function(item, index) {
		var status = false;

		if (index < 1 || !item || !item.id || !item.type || !item.type.match(/item|equipment/)) {
			return status;
		}

		this.items[index] = item;
		this.usedCount += 1;
		
		this.emit('addItem', index, item);
		return index;
	};

/**
 * remove item
 *
 * @param {number} index
 * @return {Boolean}
 * @api public
 */
	pro.removeItem = function(index) {
		var status = false;
		if	(this.items[index]) {
			delete this.items[index];
			this.usedCount -= 1;
			this.emit('removeItem', index);	
			status = true;
		}
		return status;
	};
 
	pro.isFull = function() {
		return this.itemCount === this.usedCount;
	};

	module.exports = Bag;
}};
