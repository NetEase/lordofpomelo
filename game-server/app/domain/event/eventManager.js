var EntityType = require('../../consts/consts').EntityType;
var pomelo = require('pomelo');
var npcEvent = require('./npcEvent');
var characterEvent = require('./characterEvent');
var playerEvent = require('./playerEvent');

var exp = module.exports;

/**
 * Listen event for entity
 */
exp.addEvent = function(entity){
	switch(entity.type){
		case EntityType.PLAYER :
			playerEvent.addEventForPlayer(entity);
			characterEvent.addEventForCharacter(entity);
			addSaveEvent(entity);
			break;
		case EntityType.MOB :
			characterEvent.addEventForCharacter(entity);
			break;
		case EntityType.NPC :
			npcEvent.addEventForNPC(entity);
			break;
	}
};

/**
 * Add save event for player
 * @param {Object} player The player to add save event for.
 */
function addSaveEvent(player) {
	var app = pomelo.app;
	player.on('save', function() {
		app.get('sync').exec('playerSync.updatePlayer', player.id, player.strip());
	});

	player.bag.on('save', function() {
		app.get('sync').exec('bagSync.updateBag', player.bag.id, player.bag);
	});

	player.equipments.on('save', function() {
		app.get('sync').exec('equipmentsSync.updateEquipments', player.equipments.id, player.equipments);
	});
}

