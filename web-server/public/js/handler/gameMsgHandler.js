__resources__["/gameMsgHandler.js"] = {meta: {mimetype: "application/javascript"}, data: function(exports, require, module, __filename, __dirname) {

	var pomelo = window.pomelo;
	var app = require('app');
	var AttackResult = require('consts').AttackResult;
	var mainPanel = require('mainPanelView');
	var dialogPanel = require('dialogPanelView');
	var EntityType = require('consts').EntityType;
	var SkillEffect = require('skillEffect');
	var utils = require('utils');
	var clientManager = require('clientManager');

	exports.init = init;

	function init() {
		/**
		 * Handle change area message
		 * @param  data {Object} The message
		 */
		pomelo.on('onChangeArea', function(data) {
			if(!data.success) {
				return;
			}
			clientManager.loadResource({jsonLoad: false}, function() {
				pomelo.areaId = data.target;
				pomelo.request("area.playerHandler.enterScene",{uid:pomelo.uid, playerId: pomelo.playerId, areaId: pomelo.areaId}, function(msg) {
					app.init(msg.data);
				});	
			});
		});

		/**
		 * Handle add entities message
		 * @param data {Object} The message, contains entities to add
		 */
		pomelo.on('addEntities', function(data){
			var entities = data.entities;
			var area = app.getCurArea();
			
//			for(var id in entities){
//				console.log('add entity : ' + entities[id].entityId);
//			}
			if(!area) {
				return;
			}
			for(var i = 0; i < entities.length; i++){
				var entity = area.getEntity(entities[i].entityId);
				if(!entity){
					area.addEntity(entities[i]);
				}
			}
		});

		/**
		 * Handle remove entities message
		 * @param data {Object} The message, contains entitiy ids to remove
		 */
		pomelo.on('removeEntities', function(data){
			var entities = data.entities;
			var area = app.getCurArea();
			var player = area.getCurPlayer();
			for(var i = 0; i < entities.length; i++){
				if(entities[i] !== player.entityId) {
//					/console.log('remove entity : ' + entities[i]);
					area.removeEntity(entities[i]);
				}
			}
		});

		/**
		 * Handle move  message
		 * @param data {Object} The message, contains move information
		 */

		pomelo.on('onMove', function(data){
			var path = data.path;
			var character = app.getCurArea().getEntity(data.entityId);
			if(!character){
				console.log('no character exist for move!' + data.entityId);
				return;
			}

			var sprite = character.getSprite();
			var totalDistance = utils.totalDistance(path);
			var needTime = Math.floor(totalDistance / sprite.getSpeed() * 1000 - app.getDelayTime());
			var speed = totalDistance/needTime * 1000;
			sprite.movePath(path, speed);
		});

		pomelo.on('onPathCheckout', function(data) {
			var player = app.getCurArea().getEntity(data.entityId);
			var serverPosition = data.position;
			var clientposition = player.getSprite().getPosition();
			var realDistance = utils.distance(serverPosition.x, serverPosition.y, clientposition.x, clientposition.y);
			var distanceLimit = 100;

			if (realDistance > distanceLimit) {
				player.getSprite().translateTo(serverPosition.x, serverPosition.y);	
			}
		});

		/**
		 * Handle player upgrade message
		 * @param data {Object} The message, contains the info for player upgrade
		 */
		pomelo.on('onUpgrade' , function(data) {
			var playerData = data.player;
			var area = app.getCurArea();
			var player = area.getPlayer(playerData.id);
			player.upgrade(playerData);
			player.getSprite().upgrade();
		});

		/**
		 * Handle update task data message
		 * @param data {Object} The message, contains the info for update task
		 */
		pomelo.on('onUpdateTaskData', function(data) {
			var reData = data.taskData;
			app.getCurPlayer().updateTaskData(reData);
		});

		/**
		 * Handle task complete message
		 * @param data {Object} The message, contains the info for complete task
		 */
		pomelo.on('onTaskCompleted', function(data) {
			var tasks = app.getCurPlayer().curTasks;
			var completeTask = tasks[data.taskId];
			completeTask.setState(1);
			mainPanel.notify('The task has been completed！');
		});

		/**
		 * Handle remove item message
		 * @param data {Object} The message, contains the info for remove item
		 */
		pomelo.on('onRemoveItem', function(data){
			app.getCurArea().removeEntity(data.entityId);
		});

		/**
		 * Handle pick item message
		 * @param data {Object} The message, contains the info for pick item
		 */
		pomelo.on('onPickItem', function(data) {
			var area = app.getCurArea();
			var player = area.getEntity(data.player);
			var item = area.getEntity(data.item);
			//Only add item for current player
			if (player.entityId === area.getCurPlayer().entityId && !!item) {
				player.bag.addItem({id: item.kindId, type: item.type}, data.index);
			}
			area.removeEntity(data.item);
		});

		/**
		 * Handle npc talk message
		 * @param data {Object} The message, contains the info for npc talk
		 */
		pomelo.on('onNPCTalk', function(data){
			var npc = app.getCurArea().getEntity(data.npc);
			var curPlayer = app.getCurPlayer();
			var dir = {
				x1: curPlayer.getPosition().x,
				y1: curPlayer.getPosition().y,
				x2: npc.getPosition().x,
				y2: npc.getPosition().y
			};
			curPlayer.getSprite().stand(dir);
			dialogPanel.open(data);
		});

		/**
		 * Handle checkout task message
		 * @param data {Object} The message, contains the info for check out task
		 */
		pomelo.on('onCheckoutTask', function(data) {
			dialogPanel.open(data);
		});

		/**
		 * the order of attack, whose result contains success, killed and not_in_range
		 * @param {Object} data  contains attacter, target, result ect.
		 */
		pomelo.on('onAttack', function(data){
			var area = app.getCurArea();
			var skillId = data.skillId;
			var attacker = area.getEntity(data.attacker);
			var target = area.getEntity(data.target);

			if(!attacker || !target){
				//console.log('attacker or target not exist ! attacker: ' + data.attacker + ', target : ' + data.target);
				return;
			}

			var attackerSprite = attacker.getSprite();
			var targetSprite = target.getSprite();
			var attackerPos = data.attackerPos || attackerSprite.getPosition();
			var targetPos = targetSprite.getPosition();
			var resultData = data.result;
			var result = resultData.result;
			var skillEffectParams = {
				id: skillId,
				player: attacker,
				position: {x: targetPos.x - attackerPos.x, y: targetPos.y - attackerPos.y}
			};
			if(skillId > 1) {
				mainPanel.skillBox[skillId].start();
			}
			var params ={
				attacker: attacker,
				attackerSprite: attackerSprite,
				target: target,
				targetSprite: targetSprite,
				attackerPos: attackerPos,
				targetPos: targetPos,
				resultData: resultData,
				skillEffectParams: skillEffectParams,
				experience: data.exp
			};
			if (result === AttackResult.SUCCESS) {
				successAction(params);
			} else if (result === AttackResult.KILLED) {
				killedAction(params);
			} else if (result === AttackResult.NOT_IN_RANGE) {
				targetSprite.stand({x1: attackerPos.x, x2:attackerPos.y, y1: targetPos.x, y2: targetPos.y});
			}
			uiUpdate();
		});

		/**
		 * when player revives, it works
		 * @param {Object} data
		 */
		pomelo.on('onRevive', function(data) {
			var area = app.getCurArea();
			var player = area.getEntity(data.entitrId);
			if (!player) {
				area.addEntity(data.entity);				
				player = area.getEntity(data.entityId);
			}
			if (!player) {
				console.log('!player:', data);
			}
			player.died = false;
			player.set('hp', data.hp);
			var sprite = player.getSprite();
			sprite.revive(data);
			if (player.entityId === app.getCurPlayer().entityId) {
				area.map.centerTo(data.x, data.y);
				mainPanel.reviveMaskHide();
			}
		});
	}	

	/**
	 * the action invokes when the result is success
	 * @param {Object} data
	 */
	var successAction = function(data) {
		new SkillEffect(data.skillEffectParams).createEffectAni();
		data.attackerSprite.translateTo(data.attackerPos.x, data.attackerPos.y);
		var dir = {x1: data.attackerPos.x, y1: data.attackerPos.y, x2: data.targetPos.x, y2: data.targetPos.y};
		data.targetSprite.createNumberNodes(data.resultData.damage);
		data.attackerSprite.attack(dir, 'noKilled', function() {
		});
		data.target.update({damage: data.resultData.damage});
		data.attacker.update({mpUse: data.resultData.mpUse});
		data.targetSprite.reduceBlood();
	};

	/**
	 * the action invokes when the result is killed
	 * @param {Object} data 
	 */
	var killedAction = function(data) {
		if (!!data.target.died) {
			return;
		}
		if (app.getCurPlayer().entityId == data.target.entityId) {
			console.log('curPlayer died~~~~~~~~~~~~~~~!');
		}
		data.target.died = true;
		if (data.target.type === EntityType.MOB) {
			data.target = null;
		}
		new SkillEffect(data.skillEffectParams).createEffectAni();
		var attackerSprite = data.attackerSprite;
		var attackerPos = data.attackerPos;
		attackerSprite.translateTo(attackerPos.x, attackerPos.y);
		data.targetSprite.zeroBlood();
		if (data.attacker.type === EntityType.PLAYER) {
			data.attacker.update({mpUse: data.resultData.mpUse, experience: data.experience });
		}
		var dir = {x1: data.attackerPos.x, y1: data.attackerPos.y, x2: data.targetPos.x, y2: data.targetPos.y};
		data.targetSprite.createNumberNodes(data.resultData.damage);
		data.attackerSprite.attack(dir, 'killed', function() {
		});
		data.targetSprite.died({x1: data.targetPos.x, y1: data.targetPos.y, x2: data.attackerPos.x, y2: data.attackerPos.y}, function(){
		var items = data.resultData.items;
			if (!!items) {
				for (var i = 0; i < items.length; i ++) {
					app.getCurArea().addEntity(items[i]);
				}
			 }
		}); 
	};

	var uiUpdate = function() {
		var player = app.getCurPlayer();
		player.emit('change:hp');
		player.emit('change:maxHp');
		player.emit('change:mp');
		player.emit('change:maxMp');
		player.emit('change:experience');
	};
}};
