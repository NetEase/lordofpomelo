__resources__["/sprite.js"] = {meta: {mimetype: "application/javascript"}, data: function(exports, require, module, __filename, __dirname) {
	/**
	 * Module dependencies.
	 */
	var animate = require('animate');
	var model = require('model');
	var imgAndJsonUrl = require('config').IMAGE_URL;
	var consts = require('consts');
	var aniOrientation = consts.aniOrientation;
	var EntityType = consts.EntityType;
	var NodeCoordinate = consts.NodeCoordinate;
	var utils = require('utils');
	var noEntityNode = require('noEntityNode');
	var mainPanel = require('mainPanelView');
	var Animation = require('animation');
	var ObjectPoolFactory = require('objectPoolFactory');
	var app = require('app');
	var pomelo = window.pomelo;

	/**
	 * Initialize a new 'Sprite' with the given 'opts'.
	 * the sprite of entity, each entity own one sprite, sprite own only node, the node can have many animations
	 *
	 * @param {object} opts  instante the object sprite
	 * @api public
	 */
	var Sprite = function(opts) {
		this.entity = opts;
		this.mapNode = this.entity.map.node; 
		this.curNode = null;
		this.bloodbarNode = null;
		// team captain/member flag
		this.captainFlagNode = null;
		this.teamMemberFlagNode = null;

		this.moveAnimation = null;
		this.attackAnimation = null;
		this.diedAnimation = null;
		this.standAnimation = null;
		this.standFrameLoop = null;
		this.walkAnimation = null;
		this.walkFrameLoop = null;
		this._init();
	};

	/**
	 * Expose 'Sprite' constructor.
	 */
	module.exports = Sprite;

	/**
	 * Init the node and animation according to entity's type.
	 *
	 * @api private
	 */
	Sprite.prototype._init = function() {
		var startAin = 'Stand';
		var type = this.entity.type;
		if (type === EntityType.PLAYER || type === EntityType.MOB) {
			this._initDynamictNode(aniOrientation.LEFT_DOWN + startAin);
		} else if (type === EntityType.NPC || type === EntityType.ITEM || type === EntityType.EQUIPMENT) {
			this._initStaticNode();
		}
	};

	/**
	 * Init static Node. static node is static and contains npc, item, and equipment node.
	 *
	 * @api private
	 */
	Sprite.prototype._initStaticNode = function() {
		var ResMgr = app.getResMgr();
		var x = this.entity.x, y = this.entity.y;
		var staticImg = null;
		switch(this.entity.type) {
			case EntityType.NPC: 
			staticImg =  ResMgr.loadImage(imgAndJsonUrl + 'npc/' + this.entity.kindId + '.png');
			break;
			case EntityType.ITEM:
			staticImg = ResMgr.loadImage(imgAndJsonUrl + 'item/item_' + this.entity.imgId + '.png');
			break;
			case EntityType.EQUIPMENT:
			staticImg = ResMgr.loadImage(imgAndJsonUrl + 'equipment/item_' + this.entity.imgId + '.png');
			break;
		}
		var staticModel = new model.ImageModel({
			image: staticImg		
		});
		staticModel.set('ratioAnchorPoint', {
			x: 0.5,
			y: 0.5
		});
		var staticNode = this.entity.scene.createNode({
			model: staticModel
		});
		staticNode.id = this.entity.entityId;
		this.entity.scene.addNode(staticNode, this.mapNode);
		staticNode.exec('translate', x, y, NodeCoordinate.NPC_NODE);
		var nameNode = noEntityNode.createNameNode(this.entity);
		nameNode.exec('translate', -5, -60, NodeCoordinate.NPC_NODE);
		this.entity.scene.addNode(nameNode, staticNode);
		this.curNode = staticNode;
	};

	/**
	 * Init dynamic Node. dynamic node is not static and contains player, mob node.
	 *
	 * @param {String} name, animation orientation
	 * @api private
	 */
	Sprite.prototype._initDynamictNode = function(name) {
		var frameNode = this.entity.scene.createNode({});
		frameNode.id = this.entity.entityId;
		this.entity.scene.addNode(frameNode, this.mapNode);
		var position = this.getPosition();
		var x = position.x, y = position.y;
		if (this.curNode) {
			this.mapNode.removeChild(this.curNode);
		} else {
			x = this.entity.x;
			y = this.entity.y;
		}
		if (this.isCurPlayer) {
			frameNode.exec('translate', x, y, NodeCoordinate.CURPLAY_NODE);
		} else {
			frameNode.exec('translate', x, y, NodeCoordinate.MOB_NODE);
		}

		this.curNode = frameNode;
		this.nameNode = noEntityNode.createNameNode(this.entity);
		this.entity.scene.addNode(this.nameNode, frameNode);
		if (this.entity.type === EntityType.PLAYER || this.entity.type === EntityType.MOB) {
			var bloodbarNodes = noEntityNode.createBloodbarNodes({scene: this.entity.scene});
			this.bloodbarNode = bloodbarNodes.redBloodBarNode;
			var darkBloodBarNode = bloodbarNodes.darkBloodBarNode;
			this.entity.scene.addNode(this.bloodbarNode, frameNode);
			this.entity.scene.addNode(darkBloodBarNode, frameNode);
			this.captainFlagNode = noEntityNode.createCaptainFlagNode({scene: this.entity.scene});
			this.teamMemberFlagNode = noEntityNode.createTeamMemberFlagNode({scene: this.entity.scene});
			this.entity.scene.addNode(this.captainFlagNode, frameNode);
			this.entity.scene.addNode(this.teamMemberFlagNode, frameNode);
			var json = new Animation({
				kindId: this.entity.kindId,
				type: this.entity.type,
				name: name
			}).getJsonData();
			var height = json.height - 30;
			if (this.entity.kindId === consts.SpecialCharacter.Angle) {
				height =json.height;
			}
			this.bloodbarNode.exec('translate', -26, -height, NodeCoordinate.RED_BLOOD_NODE);
			darkBloodBarNode.exec('translate', -26, -height, NodeCoordinate.BLACK_BLOOD_NODE);
			this.nameNode.exec('translate',0 ,-(height + 10), NodeCoordinate.NAME_NODE);
			this.captainFlagNode.exec('translate', -26, -height+10, NodeCoordinate.CAPTAIN_FLAG_NODE);
			this.teamMemberFlagNode.exec('translate', -26, -height+10, NodeCoordinate.TEAM_MEMBER_FLAG_NODE);
			this.showCaptainFlag(false);
			this.showTeamMemberFlag(false);
			this.reduceBlood();
		}
		if (this.entity.kindId === consts.SpecialCharacter.Angle) {
			this.curNode.exec('scale', {x: 1.2, y: 1.2});
		}
		this.curNode.name = this.entity.kindName + ';' + this.entity.name + ';' + this.entity.type;
		this._initStand();
	};

	//Update entity' name.
	Sprite.prototype.updateName = function() {
		var name = this.entity.name + '-' + this.entity.level;
		this.nameNode.model.text = name; 
	};

	/**
	 * Action makes up animation.
	 * 
	 * @param {Object} dir, orientation of action
	 * @param {String} actionName, the name of action
	 * @param {Function} cb
	 * @api private
	 */
	Sprite.prototype._action = function(dir, actionName, callback) {
		if(!this.curNode) {
			console.log(this.entity.entityId);
			return;
		}
		if (typeof(dir) === 'undefined') {
			dir = {x1:0, y1: 0, x2:1, y2: 1};
		}
		var dr = utils.calculateDirection(dir.x1, dir.y1, dir.x2, dir.y2);
		//var orientation = dr.orientation;
		//var flipX = dr.flipX;
		if (!!this.curNode) {
			var name = dr + actionName;
			var poolName = utils.getPoolName(this.entity.kindId, name);
			var pool = app.getObjectPoolManager().getPool(poolName);
			var actionAnimation = null;
			if (this.entity.type === EntityType.PLAYER || this.entity.type === EntityType.MOB) {
				actionAnimation = this.getAnimationFromPool(this.entity.kindId, name);
			} else {
				/**
				actionAnimation = new Animation({
					kindId: this.entity.kindId,
					type: this.entity.type,
					name: name
				}).create();
				*/
			}
			var actionModel = actionAnimation.target();
			actionModel.set('ratioAnchorPoint' ,{
				x: 0.5,
				y: 0.8
			});
			this.curNode.setModel(actionModel);
			var self = this;
			if (actionName === 'Walk' || actionName === 'Stand') {
				var loopAnimation = animate.times(actionAnimation, Infinity);
				this.curNode.exec('addAnimation', loopAnimation);
				return {
					actionAnimation: actionAnimation,
					loopAnimation: loopAnimation
				};
			} 
			actionAnimation.onFrameEnd = function(t, dt) {
				if (self.curNode && actionAnimation.isDone()) {
					if (!!callback) {
						callback();
					}
					if (!!pool) {
						pool.returnObject(actionAnimation);
						actionAnimation = null;
					}
				}
			};
			this.curNode.exec('addAnimation', actionAnimation);
			return {
				actionAnimation: actionAnimation
			};
		}
	};

	//Get animation from objectPool.
	Sprite.prototype.getAnimationFromPool = function(kindId, name) {
		var returnObject;
		var poolName = utils.getPoolName(kindId, name);
		var pool = app.getObjectPoolManager().getPool(poolName);
		if (!pool) {
			new ObjectPoolFactory().createPools(kindId, this.entity.type);
			pool = app.getObjectPoolManager().getPool(poolName);
		}
		returnObject = pool.getObject();
		if (!returnObject) {
			returnObject = new Animation({
				kindId: this.entity.kindId,
				type: this.entity.type,
				name: name
			}).create();
		}
		return returnObject;
	};

	//Walk animation, one of four basic animations.
	Sprite.prototype.walk = function(dir) {
		this.stopWholeAnimations();
		var result = this._action(dir, 'Walk');
		this.walkAnimation = result.actionAnimation;
		this.walkFrameLoop = result.loopAnimation;
	};

	//Stop walkAnimation
	Sprite.prototype.stopWalk = function() {
		if (!this.curNode || !this.walkAnimation || !this.walkFrameLoop) {
			return;
		}
		this.returnAnimation(this.walkAnimation);
		this.removeAnimation(this.walkAnimation);
		this.removeAnimation(this.walkFrameLoop);
		this.removeAnimation(this.moveAnimation);
		this.moveAnimation = null;
		this.walkAnimation = null;
		this.walkFrameLoop = null;
	};

	Sprite.prototype.stopDied = function() {
		if (!this.curNode && !this.diedAnimation) {
			this.returnAnimation(this.diedAnimation);
			this.removeAnimation(this.diedAnimation);
			this.diedAnimation = null;
		} 
	};

	//Stand animation, one of four basic animation.
	Sprite.prototype.stand = function(dir) {
		this.stopWholeAnimations();
		this._initStand(dir);
	};

	//Initialized animation
	Sprite.prototype._initStand = function(dir) {  
		var result = this._action(dir, 'Stand');
		this.standAnimation = result.actionAnimation;
		this.standFrameLoop = result.loopAnimation;
	};

	//Stop standAnimation
	Sprite.prototype.stopStand = function() {
		if (!this.curNode || !this.standAnimation || !this.standFrameLoop) {
			return;
		}
		this.returnAnimation(this.standAnimation);
		this.removeAnimation(this.standAnimation);
		this.removeAnimation(this.standFrameLoop);
		this.standAnimation = null;
		this.standFrameLoop = null;
	};

	//Return animation to pool
	Sprite.prototype.returnAnimation = function(animation) {
		if (!!animation) {
			animation.prepare();
			var poolName = utils.getPoolName(this.entity.kindId, animation.name);
			var pool = app.getObjectPoolManager().getPool(poolName);
			if (!!pool) {
				pool.returnObject(animation);
			}
		}
	};

	/**
	 * StopWholeAnimations, contains stopMove, stopStand, stopAttack
	 * the all animations will be freezed
	 *
	 * @api public
	 */
	Sprite.prototype.stopWholeAnimations = function() {
		this.stopMove();
		this.stopStand();
		this.stopAttack();
		this.stopDied();
	};

	//Attack animation, a basic animaiton
	Sprite.prototype.attack = function(dir, killFlag, callback) {
		this.stopWholeAnimations();
		var self = this;
		var attackAnimation = self._action(dir, 'Attack').actionAnimation;
		attackAnimation.onFrameEnd = function(t, dt) {
			if (attackAnimation.isDone() && self.entity.type === EntityType.PLAYER && killFlag === 'killed') {
				self.stand(dir);
				callback();
			}
		};
		//attackAnimation.regCB(0.5, function() {
			//callback();
		//});
		this.attackAnimation = attackAnimation;
	};

	// show/hide the team member flag
	Sprite.prototype.showTeamMemberFlag = function(isShow) {
		isShow = isShow || false;
		var x = isShow ? 1 : 0;
		this.teamMemberFlagNode.exec('scale', {x: x, y: 1});
	};

	// show/hide the team captain flag
	Sprite.prototype.showCaptainFlag = function(isShow) {
		isShow = isShow || false;
		var x = isShow ? 1 : 0;
		this.captainFlagNode.exec('scale', {x: x, y: 1});
	};

	//Update the bloodbarNode state
	Sprite.prototype.reduceBlood = function() {
		var curHp = this.entity.hp;
		var maxHp = this.entity.maxHp;
		var sx = curHp / maxHp;
		if (sx < 0) {
			sx =0;
		}
		this.bloodbarNode.exec('scale', {x: sx, y: 1});
	};

	//When the entity died, which blood become zero
	Sprite.prototype.zeroBlood = function() {
		this.bloodbarNode.exec('scale', {x: 0, y:1});
	};

	/**
	 * Player upgrade animation. It is parallelAnimation.
	 *
	 * @api public
	 */
	Sprite.prototype.upgrade = function() {
		this.nameNode.model().text = this.entity.name + ' - ' + this.entity.level;
		var text = 'Upgraded!';
		var gradeModel = new model.TextModel({
			text: text,
			fill: 'rgb(255,0,0)',
			height: 20,
			font: 'Arial Bold'
		});
		gradeModel.set('ratioAnchorPoint', {
			x: 0.5,
			y: 0.5
		});
		var gradeNode = this.entity.scene.createNode({
			model: gradeModel
		});
		var scaleAni = new animate.ScaleTo(
			[0, {x: 1, y: 1}, 'linear'],
			[1000, {x: 2, y: 2}, 'sine'],
			[2000, {x: 3, y: 3},'linear'],
			[3000, {x: 4, y: 4}, 'sine'],
			[4000, {x: 2, y: 2}]
			); 
		var rotAni = new animate.RotateTo(
			[0, 0, 'sine'],
			[2000, 2.0 * Math.PI, 'sine'],
			[4000, 0 * Math.PI]
			);
		var paraAni = new animate.ParallelAnimation({
			animations: [scaleAni, rotAni] 
		});
		gradeNode.exec('addAnimation', paraAni);
		this.entity.scene.addNode(gradeNode, this.curNode);
		gradeNode.exec('translate', 0 , -80, NodeCoordinate.UPDATE_NODE);
		this.bloodbarNode.exec('scale', {x: 1, y: 1});
		var self = this;
		setTimeout(function(){
			self.curNode.removeChild(gradeNode);
			self.stand();
		},5000);
	};

	/**
	 * Give the hint if the bag is full.
	 */
	Sprite.prototype.hintOfBag = function() {
		var hintNode = noEntityNode.hintOfBag(this.entity);

		this.entity.scene.addNode(hintNode, this.curNode);
		hintNode.exec('translate', 0, -120, NodeCoordinate.UPDATE_NODE);
		var self = this;
		setTimeout(function(){
			self.curNode.removeChild(hintNode);
		}, 3000);
	};

	//Stop attackAnimation
	Sprite.prototype.stopAttack = function() {
		if (!this.curNode || !this.attackAnimation) {
			return;
		}
		//this.attackAnimation.cancelCB(0.5);
		this.returnAnimation(this.attackAnimation);
		this.removeAnimation(this.attackAnimation);
		this.attackAnimation = null;
	};

  /**
   * Died animation, a basic animaiton.
	 * If player, update it's position and destory
   *
   * @param {Object} dir  direction which has two point, point1 adn point2
	 * @api public
	 */
	Sprite.prototype.died = function(dir, callback) {
		this.stopWholeAnimations();
		var self = this;
		// mask show
		if (self.entity.entityId === app.getCurPlayer().entityId) {
			mainPanel.closeAllPanel();
			mainPanel.reviveMaskShow();
		}
		var result = self._action(dir, 'Dead',function() {
			if (self.entity.type === EntityType.PLAYER) {
				var pos = self.getPosition();
				self.entity.x = pos.x;
				self.entity.y = pos.y;
			} 
			if (!self.isCurPlayer) {
				app.getCurArea().removeEntity(self.entity.entityId);
			} else {
				self.destory();
			}
			callback();
		});
		this.diedAnimation = result.actionAnimation;
	};

  /**
   * Make the sprite move around with the path.
   *
   * @param path {Array} array of points that describe a path
	 * @api public
	 */
	Sprite.prototype.movePath = function(path, speed) {
		if (!speed) {
			speed = this.getSpeed();
		}
		if(!this.curNode) {
			return;
		}
		if(!path || path.length <= 1) {
			console.error('invalid path: ' + path);
			return;
		}

		this.stopWholeAnimations();
		this.clearPath();

		this.curPath = path;
		this.leftDistance = utils.totalDistance(path);
		if(!this.leftDistance) {
			return;
		}
		this.leftTime = Math.floor(this.leftDistance / speed * 1000);
		// a magic accelerate...
		if(this.leftTime > 10000) {
			this.leftTime -= 200;
		}

		this._movePathStep(1);
	};

	Sprite.prototype.getSpeed = function() {
		return this.entity.walkSpeed;
	};

	/**
	 * Stop move and clear current moving path
	 */
	Sprite.prototype.clearPath = function() {
		this.stopMove();
		this.curPath = null;
		this.leftDistance = 0;
		this.leftTime = 0;
	};

	/**
	 * Move the path step.
	 * Stand and clear current path if move finish
	 *
	 * @param index {Number} index of step in the path
	 */
	Sprite.prototype._movePathStep = function(index) {
		if(!this._checkPathStep(index)) {
			return;
		}

		if(index === 0) {
			index = 1;
		}

		var start = this.curPath[index - 1];
		var end = this.curPath[index];
		var distance = utils.distance(start.x, start.y, end.x, end.y);
		var time = Math.floor(this.leftTime * distance / this.leftDistance) || 1;
		var self = this;

		this._move(start.x, start.y, end.x, end.y, time, function(dt) {
			index++;
			self.leftDistance -= distance;
			self.leftTime -= dt;
			if(self.leftTime <= 0) {
				self.leftTime = 1;
			}

			if(self._checkPathStep(index)) {
				self._movePathStep(index); 
				return;
			}
			self.stopWholeAnimations();
			self.clearPath();
			self.stand({x1: start.x, y1: start.y, x2: end.x, y2: end.y});
		});
	};

	Sprite.prototype._move = function(sx, sy, ex, ey, time, cb) {
		this.stopMove();
		this.moveAnimation = new animate.MoveTo(
			[0, {x: sx, y: sy}, 'linear'],
			[time, {x: ex, y: ey}, 'linear']
		);
		this.walk({x1: sx, y1: sy, x2: ex, y2: ey});
		this.moveAnimation.regCB(1, function() {
			utils.invokeCallback(cb, Date.now() - startTime);
		});

		if(this.isCurPlayer()) {
			this.entity.map.moveBackground({x: ex, y: ey}, time);
		}

		var startTime = Date.now();
		this.curNode.exec('addAnimation', this.moveAnimation);
	};

	Sprite.prototype._checkPathStep = function(index) {
		return this.leftDistance > 0 && this.curPath && index < this.curPath.length;
	};

	Sprite.prototype.isMove = function() {
		return (!!this.moveAnimation) && (!this.moveAnimation.isDone());
	};

	Sprite.prototype.isAttack = function() {
		return (!!this.attackAnimation) && (!this.attackAnimation.isDone());
	};

	//remove the animation of the curNode
	Sprite.prototype.removeAnimation = function(animation) {
		if (!!animation && !!this.curNode) {
			this.curNode.exec('removeAnimation', animation.identifier);
		}
		animation = null;
	};

	//Stop moveAnimation
	Sprite.prototype.stopMove = function() {
		this.walkName = null;
		if(this.isCurPlayer()) {
			this.entity.map.stopMove();
		}
		this.removeAnimation(this.moveAnimation);
		this.stopWalk();
	};

	/**
	 * Number animation. Create numberNode by the damage, move and remove those nodes.
	 *
	 * @param {String/Number} damage
	 * @api public
	 */
	Sprite.prototype.createNumberNodes = function(damage) {
		damage = parseInt(damage, 10);
		if (damage < 1) {
			damage = 1;
		}
		var number = [];
		while(damage !== 0) {
			number.push(damage%10);
			damage = Math.floor(damage/10);
		}
		var numberNodes = [];
		var ResMgr = app.getResMgr();
		for (var i = number.length-1; i>=0; i--) {
			var img = ResMgr.loadImage(imgAndJsonUrl + 'number/number_'+number[i]+'.png');
			var numberModel = new model.ImageModel({
				image: img
			});
			var numberNode = this.entity.scene.createNode({
				model: numberModel
			});
			numberNodes.push(numberNode);
		}
		var flagImg = ResMgr.loadImage(imgAndJsonUrl+ 'number/number_minus.png');
		var flagModel = new model.ImageModel({
			image: flagImg
		});
		var flagNode = this.entity.scene.createNode({
			model:flagModel
		});
		var x = -50;
		var y = -(this.curNode.model()._h + 50);
		this.entity.scene.addNode(flagNode, this.curNode);
		flagNode.exec('translate', x, y, NodeCoordinate.NUMBER_NODE);
		this.numberMoveTo(flagNode, x, y);
		for (var j = 0; j< numberNodes.length; j++) {
			x += 20 ;
			this.entity.scene.addNode(numberNodes[j], this.curNode);
			numberNodes[j].exec('translate', x, y , NodeCoordinate.NUMBER_NODE);
			this.numberMoveTo(numberNodes[j], x, y);
		}
	};

	//Number nodes moveAnimation
	Sprite.prototype.numberMoveTo = function(node, x, y) {
		var randomDist = 10;
		var ma = new animate.MoveTo(
			[0, {x: x, y: y}, 'linear'],
			[350, {x: x + randomDist, y: y - randomDist}, 'linear']
			);
		var self = this;
		ma.onFrameEnd = function(t, dt) {
			if (self.curNode && ma.isDone()) {
				self.curNode.removeChild(node);
			}
		};
		node.exec('addAnimation', ma);
	};

	// Get sprite position
	Sprite.prototype.getPosition = function() {
		if (this.curNode) {
			return this.curNode._component.matrix._matrix._position;
		} else {
			return {
				x: 0,
				y: 0,
				z: 0
			};
		}
	};

	//Get map position
	Sprite.prototype.getMapPosition = function() {
		if (this.curNode && this.curNode._parent) {
			return this.curNode._parent._component.matrix._matrix._position;
		} else {
			return {
				x: 0,
				y: 0,
				z: 0
			};
		}
	};

	/**
	 * Destory node, when the entity is killed or disappear, it's node and all the animations should be removed.
	 *
	 * @api public
	 */
	Sprite.prototype.destory = function() {
		this.stopWholeAnimations();
		if (!!this.curNode) {
			this.mapNode.removeChild(this.curNode);
			if (this.entity.type !== EntityType.PLAYER) {
				this.curNode = null;
			}
		}
	};

	/**
	 * Revive entity, add it's node to mapNode, recover it' animation
	 *
	 * @param {Object} data revive position
	 * @api public
	 */

	Sprite.prototype.revive = function(data, callback) {
		if (!this.mapNode) {
			console.log('mapNode no exist!');
		}
		this.entity.scene.addNode(this.curNode, this.mapNode);
		this.reduceBlood();
		this.translateTo(data.x, data.y);
		this.stand();
		callback();
	};

	//Check out the curPlayer
	Sprite.prototype.isCurPlayer = function() {
		return !!this.entity && this.entity.entityId === app.getCurArea().getCurPlayer().entityId;
	};

	//Translate to another position
	Sprite.prototype.translateTo = function(x, y) {
		this.curNode.exec('translate', x, y, NodeCoordinate.PLAYER_NODE);
	};
}};

