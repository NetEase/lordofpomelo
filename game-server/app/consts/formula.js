var formula = module.exports;
var logger = require('pomelo-logger').getLogger(__filename);

formula.calDamage = function(attacker, target, skill) {
	var atk = attacker.getTotalAttack();
	var def = target.getTotalDefence();
	var mul = Math.sqrt(Math.abs(atk-def))/5 + 1;
	
	mul = atk>def?mul:0.8/mul;
	var defence = 1/Math.pow((target.getTotalDefence()+5)/5, 0.33);
	
	var damage = Math.ceil(attacker.getTotalAttack()*defence*mul*(Math.random()*0.2 + 0.9));
	damage = Math.ceil(skill.getAttackParam() * damage);
	if (damage <= 0) {
		damage = 1;
	}
	if (damage > target.hp) {
		damage = target.hp;
		if(damage == 0){
			logger.error('attack a died mob!!! %j', target);
		}
		
	}
	return Math.round(damage);
};

formula.calMobValue = function(baseValue, level, upgradeParam) {
	baseValue = Number(baseValue);
	var value = Math.round(baseValue +  baseValue * (level - 1) * upgradeParam);
	return value;
};

/**
 * the experience gained by player when kill some mob
 */
formula.calMobExp = function(baseExp, level) {
	return baseExp * level;
};

/**
 * Check the distance between origin and target whether less than the range.
 *
 * @param origin {Object} origin entity
 * @param target {Object} target entity
 * @param range {Number} the range of distance
 */
formula.inRange = function(origin, target, range) {
  var dx = origin.x - target.x;
  var dy = origin.y - target.y;
  return dx * dx + dy * dy <= range * range;
};

formula.distance = function(x1, y1, x2, y2) {
  var dx = x2 - x1;
  var dy = y2 - y1;

  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * convert the date according to format
 * @param {Object} date
 * @param {String} format
 * @param {String} 
 */
formula.timeFormat = function(date) {
	var n = date.getFullYear(); 
	var y = date.getMonth() + 1;
	var r = date.getDate(); 
	var mytime = date.toLocaleTimeString(); 
	var mytimes = n+ "-" + y + "-" + r + " " + mytime;
  return mytimes;
};
