var Entity = require('../../app/domain/entity/entity');
var Character = require('../../app/domain/entity/character');

var entity = new Entity({
	id: 1,
	name: 'x',
	x: 1,
	y: 2
});

console.log('entity is : ' + JSON.stringify(entity));

var character = new Character({
	id:1,
	name: 'kk',
	x: 2,
	y: 3,
	characterId: 2,
	characterName: 'xcc'
});

console.log('character is : ' + JSON.stringify(character));
