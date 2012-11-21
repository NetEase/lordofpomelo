__resources__["/equipment.js"] = {meta: {mimetype: "application/javascript"}, data: function(exports, require, module, __filename, __dirname) {

	/**
	 * Module dependencies 
	 */
	var Entity = require('entity');
	var EntityType = require('consts').EntityType;

	/**
	 * Initialize a new 'Equipment' with the given 'opts'.
	 * Equipment inherits Entity
	 *
	 * @param {Object} opts
	 * @api public
	 */
	var Equipment = function (opts) {
		this.type = EntityType.EQUIPMENT;
		this.name = opts.name;
		this.kind = opts.kind;
		this.attackValue = opts.attackValue;
		this.defenceValue = opts.defenceValue;
		this.price = opts.price;
		this.color = opts.color;
		this.heroLevel = opts.heroLevel;
		this.playerId = opts.playerId;
		this.imgId = opts.imgId;
		Entity.call(this, opts);
	};


	Equipment.prototype = Object.create(Entity.prototype);

	 /**
	 * Expose 'Equipment' constructor.
	 */
	module.exports = Equipment;
}};
