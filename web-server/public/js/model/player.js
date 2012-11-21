__resources__["/player.js"] = {meta: {mimetype: "application/javascript"}, data: function(exports, require, module, __filename, __dirname) {
	/**
	 * Module dependencies 
	 */
	var Character = require('character');
	var EntityType = require('consts').EntityType;

	/**
	 * Initialize a new 'Player' with the given 'opts'.
	 * It is common player, not current player
	 * Player inherits Character
	 *
	 * @param {Object} opts
	 * @api public
	 */
	var Player = function(opts){
		this.id = opts.id;
		this.type = EntityType.PLAYER;
		this.name = opts.name;
		this.target = null;
		Character.call(this, opts);
	};

	/**
	 * Expose 'Player' constructor.
	 */
	module.exports = Player;

	Player.prototype = Object.create(Character.prototype);
}};
