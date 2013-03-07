__resources__["/item.js"] = {meta: {mimetype: "application/javascript"}, data: function(exports, require, module, __filename, __dirname) {
	/**
	 * Module dependencies 
	 */
	var EntityType = require('consts').EntityType;
	var Entity = require('entity');
	
	/**
	 * Initialize a new 'Item' with the given 'opts'.
	 * Item inherits Entity
	 *
	 * @param {Object} opts
	 * @api public
	 */
	var Item = function (opts) {
		this.type = EntityType.ITEM;
		this.name = opts.name;
		this.desc = opts.desc;
		this.kind = opts.kind; 
		this.hp = opts.hp;
		this.mp = opts.mp;
		this.price = opts.price;
		this.heroLevel = opts.heroLevel;
		this.imgId = opts.imgId;
		Entity.call(this, opts);	
	};
	
	Item.prototype = Object.create(Entity.prototype);
	
	/**
	 * Expose 'Item' constructor.
	 */
	module.exports = Item;
}};
