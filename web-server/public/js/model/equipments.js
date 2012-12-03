__resources__["/equipments.js"] = {meta: { mimetype: "application/javascript" },data: function(exports, require, module, __filename, __dirname) {
	/**
	 * Module dependencies 
	 */ 
	var EventEmitter = window.EventEmitter;

	/**
	 * Initialize a new 'Equipments' with the given 'opts'.
	 * Equipments inherits Persistent 
	 *
	 * @param {Object} opts
	 * @api public
	 */
	var Equipments = function(opts) {
		EventEmitter.call(this);
		this.weapon = opts.weapon;
		this.armor = opts.armor;
		this.helmet = opts.helmet;
		this.necklace = opts.necklace;
		this.ring = opts.ring;
		this.belt = opts.belt;
		this.shoes = opts.shoes;
		this.legguard = opts.legguard || 0;
		this.amulet = opts.amulet || 0;
	};

	Equipments.prototype = Object.create(EventEmitter.prototype);

  var dict = {
    '武器': 'weapon',
    '项链': 'necklace',
    '头盔': 'helmet',
    '护甲': 'armor' ,
    '腰带': 'belt',
    '护腿': 'legguard',
    '护符': 'amulet',
    '鞋': 'shoes',
    '戒指': 'ring'
  };

  var convertType = function (type) {
		if (/[\u4e00-\u9fa5]/.test(type)) {
			type = dict[type];
		} else {
			type = type.toLowerCase();
		}

		return type;
	};

	//Get equipment by type
	Equipments.prototype.get = function(type) {
		return this[convertType(type)];
	};

	//Equip equipment by type and id
	Equipments.prototype.equip = function(type, id) {
		type = convertType(type);
		if (this[type] != id) {
			this[type] = id;
			this.emit('equip', type);
		}
	};

	//Unequip equipment by type
	Equipments.prototype.unEquip = function(type) {
		type = convertType(type);
		this[type] = 0;
		this.emit('unEquip', type);
	};

	module.exports = Equipments;
}};
