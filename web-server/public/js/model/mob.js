__resources__["/mob.js"] = {meta: {mimetype: "application/javascript"}, data: function(exports, require, module, __filename, __dirname) {
	/**
	 * Module dependencies 
	 */
	var Character = require('character');
	var EntityType = require('consts').EntityType;
	
	/**
	 * Initialize a new 'Mob' with the given 'opts'.
	 * Mob inherits Character
	 *
	 * @param {Object} opts
	 * @api public
	 */
	var Mob = function(opts){
		this.type = EntityType.MOB;

		Character.call(this, opts);
	};
	
	/**
	 * Expose 'Mob' constructor
	 */
	module.exports = Mob;

	Mob.prototype=Object.create(Character.prototype);
}};
