
__resources__["/componentAdder.js"] = {meta: {mimetype: "application/javascript"}, data: function(exports, require, module, __filename, __dirname) {

 var MouseButtonEventComponent = require('component').MouseButtonEventComponent;
 var HoverEventComponent = require('component').HoverEventComponent;
 var clientManager = require('clientManager');

	/**
	 * add component to entity, such as mouseButtonEventComponent
	 */
	var ComponentAdder = function(opts){
		var area = opts.area;
		this.addComponent = function(){
			addClickComponent(area);
		};

		this.addComponentTo = function(entity) {
			addComponentToEntity(area, entity);
		};
	};

	/**
	 * add clickComponet to map
	 */
	var addClickComponent = function(area) {
		var clickComponentPlayer = new MouseButtonEventComponent({
			pipe: area.gLevel.sysPipe(),
			decider: area.scene.queryDecider('mouseButtonDecider'),
			callback: move.bind(null, area)
		});

		area.map.node.addComponent('mouseButtonEventComponent', clickComponentPlayer);
	};

	var move = function(area, event) {
		var player = area.getCurPlayer();
		var sprite = player.getSprite();
		if (event.type === 'mousePressed'){
			var endX = Math.floor(event.mouseX - sprite.getMapPosition().x);
			var endY = Math.floor(event.mouseY - sprite.getMapPosition().y);
			var startX = Math.floor(sprite.getPosition().x);
			var startY = Math.floor(sprite.getPosition().y);
			var moveMessage = {
				startX: startX,
				startY: startY,
				endX: endX,
				endY: endY,
				playerId: player.id,
				areaId: area.id,
				speed: sprite.entity.walkSpeed
			};
			clientManager.move(moveMessage);
		}
	};

	/**
	 * add mouseClick component to entity
	 */
	var addComponentToEntity = function(area, entity) {
		//add mouseButtonEvent to entities
		var clickComponentEntity = new MouseButtonEventComponent({
			pipe: area.gLevel.sysPipe(),
			decider: area.scene.queryDecider('mouseButtonDecider'),
			callback: launchAi
		});
		var node = entity.getSprite().curNode;
		node.addComponent('mouseButtonEventComponent', clickComponentEntity);
		//add HoverEventComponent to entities
		var hoverEventComponent = new HoverEventComponent({
			pipe: area.gLevel.sysPipe(),
			decider: area.scene.queryDecider('hoverDecider'),
			callback: hover
		});
		node.addComponent('hoverEventComponent', hoverEventComponent);
	};

	/**
	 * Mouse hover handlerFunction
	 */
	var hover = function(event) {
		var type = event.type;
		var c = $('canvas');
		if (type == 'mouseOver') {
			c.css('cursor', 'pointer');
		} else {
			c.css('cursor', 'default');
		}
	};

	/**
	 * Mouse click handlerFunction
	 */
	var launchAi = function (event, node) {
		var id = node.id;
		if (event.type === 'mouseClicked') {
			clientManager.launchAi({id: id});
		}
	};

	module.exports = ComponentAdder;
}};

