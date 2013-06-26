var messageService = require('./../messageService');
var api = require('../../util/dataApi');
var Move = require('./../action/move');
var consts = require('../../consts/consts');
var Revive = require('./../action/revive');
var executeTask = require('./../executeTask');
var EntityType = require('../../consts/consts').EntityType;
var logger = require('pomelo-logger').getLogger(__filename);

var exp = module.exports;

/**
 * Register event handler for character
 */
exp.addEventForCharacter = function(character) {
	/**
	 * Move event handler
	 */
	character.on('move', function(args){
		var character = args.character;
		var area = character.area;
		var speed = character.walkSpeed;
		var paths = args.paths;
		var action = new Move({
			entity: character,
			path: paths.path,
			speed: speed
		});

		//Add move action to action manager
		if(area.timer.addAction(action)){
			messageService.pushMessageByAOI(area, {
				route: 'onMove',
				entityId: character.entityId,
				path: paths.path,
				speed: speed
			}, {x:character.x, y:character.y});
		}
	});

	/**
	 * Attack event handler, the event handler will handle the attack result
	 */
	character.on('attack', function(args){
		var result = args.result;
		var attacker = args.attacker;
		var target = args.target;
		var area = target.area;
		var timer = area.timer;
		var attackerPos = {x: attacker.x, y: attacker.y};

		//Print an error when attacker or target not exist, this should not happened!
		if(!target || !attacker){
			logger.error('args : %j, attacker : %j, target : %j', args, attacker, target);
			return;
		}
		var msg = {
			route : 'onAttack',
			attacker : attacker.entityId,
			target : target.entityId,
			result: args.result,
			skillId: args.skillId
		};

		//If the attack killed the target, then do the clean up work
		if(result.result === consts.AttackResult.KILLED){
			executeTask.updateTaskData(attacker, target);
			if(target.type === EntityType.MOB){
				area.removeEntity(target.entityId);
				msg.exp = attacker.experience;
				for(var id in result.items){
					area.addEntity(result.items[id]);
				}
			} else {
				//clear the target and make the mobs forget him if player die
				target.target = null;
				target.forEachEnemy(function(hater) {
					hater.forgetHater(target.entityId);
				});
				target.clearHaters();

				target.died = true;

				//Abort the move action of the player
				timer.abortAllAction(target.entityId);

				//Add revive action
				timer.addAction(new Revive({
					entity : target,
					reviveTime : consts.PLAYER.reviveTime,
					map : area.map
				}));

				msg.reviveTime = consts.PLAYER.reviveTime;

				target.save();
			}

			attacker.target = null;
			messageService.pushMessageByAOI(area, msg, attackerPos);
		} else if(result.result === consts.AttackResult.SUCCESS) {
			if (!target) {
				logger.error('[onattack] attack result: target is null!	attackerId: ' + attacker.entityId + '	targetId: ' + target.entityId +' result: ' + result);
				return;
			}
			if(target.type === EntityType.MOB) {
				timer.enterAI(target.entityId);
			}
			messageService.pushMessageByAOI(area, msg, attackerPos);
		}
	});
};