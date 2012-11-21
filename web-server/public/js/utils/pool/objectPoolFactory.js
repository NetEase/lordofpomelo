__resources__["/objectPoolFactory.js"] = {meta: {mimetype: "application/javascript"}, data: function(exports, require, module, __filename, __dirname) {

	/**
	 * Module dependencies
	 *
	 */
	var ObjectPool = require('objectPool');
	var Animation = require('animation');
	var getPoolName = require('utils').getPoolName;
	var app = require('app');

	/**
	 * The factory of creating objectPool.
	 */
	var ObjectPoolFactory = function() {
		this.name = ['LeftStand', 'RightStand', 'LeftWalk', 'RightWalk', 'LeftAttack', 'RightAttack', 'LeftDie', 'RightDie'];
		this.flipxs = [true, false];
	};

	module.exports = ObjectPoolFactory;

	/**
	 * Create pools for each kindId and add the created pool to objectPoolManager.pools 
	 *
	 * @param {Number} kindId
	 * @param {String} type
	 * @api public
	 */
	ObjectPoolFactory.prototype.createPools = function(kindId, type) {
		var name = this.name, flipxs = this.flipxs;

		for (var i = 0; i < name.length; i++) {
			for (var j = 0; j < flipxs.length; j++) {
				var animationName = name[i];
				var flipx = flipxs[j];
				var objectPool = createPool(kindId, type, animationName, flipx);
				var poolName = getPoolName(kindId, animationName, flipx);
				app.getObjectPoolManager().addPool(poolName, objectPool);
			}
		}
	};
		
	/**
	 * Create object pool.
	 *
	 * @return {ObjectPool}
	 * @api private
	 */
	var createPool = function(kindId, type, name, flipx) {
		var getAniamtion = function() {
			return new Animation({
				kindId: kindId,
				type: type,
				name: name,
				flipx: flipx
			}).create(); 
		};
		return new ObjectPool({
			getNewObject: getAniamtion
		});	
	};
}};
