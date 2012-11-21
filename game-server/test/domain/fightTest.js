var should = require('should');
var dataApi = require('../../app/util/dataApi');
var Player = require('../../app/domain/entity/player');
var Mob = require('../../app/domain/entity/mob');
var Bag = require('../../app/domain/bag');
var fightskill = require('../../app/domain/fightskill');
var Equipment = require('../../app/domain/entity/equipment');
var world = require('../../app/domain/world');
var consts = require('../../app/consts/consts');

var app = {
	sync: {
		exec: function(action, data) {
			console.log(' app sync: ' + action + ' data: ' + JSON.stringify(data));
		}
	}
};

var pomelo = require('pomelo');

pomelo.setApp(app);

world.init();

var attacker = new Player({
	entityId: 1,
	name: 'xcc',
	x: 300,
	y: 500,
	orientation: 1,
	kindId: '1001',
	characterName: '神天兵',
	hp: 100,
	mp:30,
	maxHp: 100,
	maxMp: 30,
	gender: 'M',
	career: '剑客',
	country: '人',
	rank: 1,
	level: 2,
	experience: 40,
	attackValue: 30,
	defenceValue: 20,
	hitRate: 90,
	dodgeRate: 10,
	speed: 1,
	attackSpeed: 1,
	areaId: 1
});

var bag = new Bag({
	id: 1,
	playerId: 1,
	itemCount: 30,
	items: {1:{id:1,type:'weapon'}, 2:{id:63, type:'armor'}}
});

var weapon = dataApi.equipment.findById('1');
weapon.kindId = weapon.id;
var armor = dataApi.equipment.findById(62);
armor.kindId = armor.id;

var equipments = {
	entityId: 1,
	playerId: 1,
	weapon: new Equipment(weapon),
	armor: new Equipment(armor)
};

var fightSkills = [
	fightskill.create({id:1, skillId:1, level:1, playerId:1, type:'attack'}),
	fightskill.create({id:2, skillId:2, level:1, playerId:1, type:'attack'}),
	fightskill.create({id:3, skillId:3, level:1, playerId:1, type:'attackBuff'}),
	fightskill.create({id:4, skillId:4, level:1, playerId:1, type:'buff'})
];

attacker.bag = bag;
attacker.equipments = equipments;
attacker.addFightSkills(fightSkills);

var target = new Mob({
	entityId: 2,
	name: 'guarder',
	x: 310,
	y: 490,
	orientation: 5,
	kindId: '1010',
	characterName: '护卫',
	spawningX: 400,
	spawningY: 400,
	level: 2,
	armorLevel: 2,
	weaponLevel: 0,
	areaId: 1
});

target.addFightSkills(fightSkills);

describe('fight logic test', function() {
	it('player attack test 1', function(){
		var result = attacker.attack(target, 1);
		result.result.should.equal(consts.AttackResult.SUCCESS);
		result.damage.should.equal(9);
	});

	it('player attack test 2', function(){
		var result = attacker.attack(target, 2);
		result.result.should.equal(consts.AttackResult.SUCCESS);
		result.damage.should.equal(14);
	});

	it('player attack test 3', function(){
		var result = attacker.attack(target, 3);
		result.result.should.equal(consts.AttackResult.SUCCESS);
		result.damage.should.equal(18);
	});

	it('player attack test 4', function(){
		var result = attacker.attack(target, 4);
		result.result.should.equal(consts.AttackResult.SUCCESS);
	});

	it('drop item test', function(){
		var result = target.dropItems(attacker);
		var entityId = result[0].entityId;
		process.nextTick(function() {
			attacker.pickItem(entityId);
		});
	});
});

