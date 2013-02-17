__resources__["/npc.js"] = {meta: {mimetype: "application/javascript"}, data: function(exports, require, module, __filename, __dirname) {
	/**
	 * Module dependencies
	 */
	var Entity = require('entity');
	var EntityType = require('consts').EntityType;

	/**
	 * Initialize a new 'Npc' with the given 'opts'.
	 * Npc inherits Entity
	 *
	 * @param {Object} opts
	 * @api public
	 */
	var Npc = function (opts){
		this.type = EntityType.NPC;
		Entity.call(this, opts);
	};

	Npc.prototype = Object.create(Entity.prototype);

	/**
	 * Expose 'Npc' constructor.
	 */
	module.exports = Npc;
}};
