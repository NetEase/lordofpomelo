__resources__["/area.js"] = {meta: {mimetype: "application/javascript"}, data: function(exports, require, module, __filename, __dirname) {
	var Player = require('player');
	var CurPlayer = require('curPlayer');
	var NPC = require('npc');
	var Map = require('map');
	var Mob = require('mob');
	var Item = require('item');
	var Equipment = require('equipment');
	var TimeSync = require('timeSync');
	var ComponentAdder = require('componentAdder');
	var utils = require('utils');

	var logic = require("logic");
	var Level = require('level').Level;
	var TeamConsts = require('consts').Team;
	var pomelo = window.pomelo;
	var isStopped = false;

	var requestAnimFrame = (function() {
		return window.requestAnimationFrame ||
		window.webkitRequestAnimationFrame ||
		window.mozRequestAnimationFrame ||
		window.oRequestAnimationFrame ||
		window.msRequestAnimationFrame ||
		function(/* function FrameRequestCallback */ callback, /* DOMElement Element */ element) {
			window.setTimeout(callback, 1000/60);
		};
	})();

	var logicTickHandler = function(callback) {
		setTimeout(callback, 1000/60);
	};

	var Area = function(opts, map){
		this.playerId = opts.curPlayer.id;
		this.entities = {};
		this.players = {};
		this.map = null;
		this.componentAdder = new ComponentAdder({area: this});

		//this.scene;
		this.skch = opts.skch;
		this.gd = opts.gd;
		this.gv = opts.gv;

		this.isStopped = false;
		this.init(opts, map);
	};

	var pro = Area.prototype;

	/**
	 * Init area, it will init colorbox, entities
	 * @param opts {Object} The data for init area, contains entities in the player view, data for map and data for current player.
	 */
	pro.init = function(opts, map){
		this.initColorBox();

		// width , height should be invoked by map data
		this.map = new Map({map: map, scene:this.scene, pos:{x: 0, y: 0}});
		//Add current player
		this.addEntity(pomelo.player);

		for(var key in opts.entities){
			var array = opts.entities[key];
			for(var i = 0; i < array.length; i++){
				var entity = utils.buildEntity(key, array[i]);
				this.addEntity(entity);
			}
		}

		this.playerId = pomelo.playerId;

		var pos = this.getCurPlayer().getSprite().getPosition();
		this.map.centerTo(pos.x, pos.y);

		var width = parseInt(getComputedStyle(document.getElementById("m-main")).width);
		var height = parseInt(getComputedStyle(document.getElementById("m-main")).height);
		pomelo.notify('area.playerHandler.changeView',{width:width, height:height});

		this.componentAdder.addComponent();
	};

	pro.run = function(){
		setTimeout(function() {
			new TimeSync();
		}, 1000);
		var time = Date.now();
		var tickCount = 0, allCount = 0, frameRate = 0, startTime = time, time2 = time, avgFrame = 0;
		var closure = this;

		var $frameRate = $('#frame-rate');

		function logicTick(){
			var next = Date.now();
			closure.gd.step(next,  next - time);
			tickCount++;
			allCount++;

			var passedTime = next - time2;
			if (passedTime >= 2000) {
				frameRate = Math.round(tickCount*1000/passedTime);
				avgFrame = allCount*1000/(next-startTime);
				tickCount = 0;
				time2 = next;
				$frameRate.html('<p>fps: ' + frameRate + '</p><p>afps: ' + parseInt(avgFrame) + '</p>');
			}
			if(!isStopped){
				time = next;
				logicTickHandler(logicTick);
			}
		}

		function drawTick() {
			closure.gd.draw();
			requestAnimFrame(drawTick);
		}

		logicTick();

		drawTick();
	};

	/**
	 * Get entity from area
	 * @param id {Number} The entity id
	 * @api public
	 */
	pro.getEntity = function(id){
		return this.entities[id];
	};

	/**
	 * Add entity to area
	 * @param entity {Object} The entity add to the area.
	 * @api public
	 */
	pro.addEntity = function(entity){
		if(!entity || !entity.entityId) {
			return false;
		}
		entity.scene = this.scene;
		entity.map = this.map;
		var e;
		switch(entity.type){
			case 'player': {
				entity.walkSpeed = parseInt(entity.walkSpeed);
				if (entity.id == pomelo.playerId) {
					var player = pomelo.player;
					player.scene = this.scene;
					player.map = this.map;
					e = new CurPlayer(player);
				} else {
					e = new Player(entity);
					console.log('AddEntity ~ playerId, teamId = ', entity.id, entity.teamId);
					console.log('AddEntity ~ isCaptain = ', entity.isCaptain);
					if (entity.teamId > TeamConsts.TEAM_ID_NONE) {
						if (entity.isCaptain) {
							e.getSprite().showCaptainFlag(true);
						} else {
							e.getSprite().showTeamMemberFlag(true);
						}
						e.teamId = entity.teamId;
						e.isCaptain = entity.isCaptain;
					}
				}
				this.players[e.id] = e.entityId;
			}
				break;
			case 'npc': {
				e = new NPC(entity);
			}
				break;
			case 'mob': {
				entity.walkSpeed = parseInt(entity.walkSpeed);
				e = new Mob(entity);
			}
				break;
			case 'item': {
				e = new Item(entity);
			}
				break;
			case 'equipment': {
				e = new Equipment(entity);
			}
				break;
			default:
				return false;
		}

		var eNode = e.getSprite().curNode;
		if (!eNode._parent) {
			console.log('this entity curNode de father is null');
			this.scene.addNode(eNode, this.map.node);
		}
		this.entities[entity.entityId] = e;

		this.componentAdder.addComponentTo(e);
		return true;
	};

	/**
	 * Remove entity from area
	 * @param id {Number} The entity id or the entity to remove.
	 * @api public
	 */
	pro.removeEntity = function(id){
		if(!this.entities[id]) {
			return true;
		}

		var e = this.entities[id];
		e.destory();

		delete this.entities[id];
	};

	/**
	 * Return the current player
	 * @api public
	 */
	pro.getCurPlayer = function(){
		return this.getPlayer(this.playerId);
	};

	/**
	 * Get player for given player id
	 * @param playerId {String} Player id
	 * @return {Object} Return the player or null if the player doesn't exist.
	 * @api public
	 */
	pro.getPlayer = function(playerId){
		return this.entities[this.players[playerId]];
	};

	/**
	 * Remove player from area
	 * @param playerId {String} Player id
	 * @api public
	 */
	pro.removePlayer = function(playerId){
		return this.removeEntity(this.players[playerId]);
	};

	/**
	 * Init coloer box environment
	 * @api public
	 */
	pro.initColorBox = function(){
		var logicObj = new logic.Logic();
		this.scene = logicObj.getScene();

		this.gLevel = new Level({
			logic: logicObj
		});

		this.gd.setLevel(this.gLevel);
		var closure = this;

		window.onresize = function(){
			var width = parseInt(getComputedStyle(document.getElementById("m-main")).width);
			var height = parseInt(getComputedStyle(document.getElementById("m-main")).height);
			closure.skch.width = width;
			closure.skch.height = height;
			pomelo.notify('area.playerHandler.changeView',{ width:width, height:height});
		};
	};

	module.exports = Area;
}};
