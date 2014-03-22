__resources__["/noEntityNode.js"] = {meta: {mimetype: "application/javascript"}, data: function(exports, require, module, __filename, __dirname) {
	/**
	* Module dependencies.
	*/
	var model = require('model');
	var EntityType = require('consts').EntityType;
	var animate = require('animate');
	var app = require('app');
  var imageUrl = require('config').IMAGE_URL;
	var	NoEntityNode = module.exports;
	/**
	* Create nameNode with a text model.
	*
	* @param {Object} data
	* @api public
	*/
	NoEntityNode.createNameNode = function(data) {
		var name;
		var font = 'Arial Bold';
		var fill = 'rgb(255,0,0)';
		switch(data.type) {
			case EntityType.PLAYER: 
			name = data.name + ' - ' + data.level;
			break;
			case EntityType.MOB:
			name = data.englishName + ' - ' + data.level;
			font = '';
			break;
			case EntityType.NPC:
			name = data.englishName;
			break;
			default:
			name = data.englishName + ' - ' + data.heroLevel;
			font = '';
		}

		var nameModel = new model.TextModel({
			text: name,
			fill: fill, 
			font: font, 
			height: 14
		});

		nameModel.set('ratioAnchorPoint', {
			x: 0.5,
			y:0.5
		});

		var nameNode = data.scene.createNode({
			model: nameModel
		});

		return nameNode;
	};

	/**
	 * Create bloodbarNodes, which contain redBar and darkBar
	 *
	 * @param {Object} data
	 * @return {Object}
	 * @api public
	 */
	NoEntityNode.createBloodbarNodes = function(data) {
		var redModel = new model.RectModel({
			x: 0,
			y: 0,
			width: 45,
			height: 6,
			fill: 'rgb(255,0,0)',
			stroke:'rgb(255,0,0)'
		});

		var darkModel = new model.RectModel({
			x: 0,
			y: 0,
			width: 45,
			height: 6,
			fill: 'rgb(0,0,0)',
			stroke:'rgb(0,0,0)'
		});

		var redBloodBarNode = data.scene.createNode({
			model: redModel
		});

		var darkBloodBarNode = data.scene.createNode({
			model: darkModel
		});

		return {redBloodBarNode: redBloodBarNode, darkBloodBarNode: darkBloodBarNode};
	};

	/**
	 * Create team member flag node
	 *
	 * @param {Object} data
	 * @return {Object}
	 * @api public
	 */
	NoEntityNode.createTeamMemberFlagNode = function(data) {
		var resMgr = app.getResMgr();
		var flagImg = resMgr.loadImage(imageUrl + 'team/memberFlag.png');
		var flagModel = new model.ImageModel({
			image: flagImg
		});
		var flagNode = data.scene.createNode({
			model: flagModel
		});

		return flagNode;
	};

	/**
	 * Create captain flag node
	 *
	 * @param {Object} data
	 * @return {Object}
	 * @api public
	 */
	NoEntityNode.createCaptainFlagNode = function(data) {
		var resMgr = app.getResMgr();
		var flagImg = resMgr.loadImage(imageUrl + 'team/captainFlag.png');
		var flagModel = new model.ImageModel({
			image: flagImg
		});
		var flagNode = data.scene.createNode({
			model: flagModel
		});

		return flagNode;
	};

	/**
	 * Give the hint if the bag is full.
	 */
	NoEntityNode.hintOfBag = function(data) {
		var text = 'the bag is full!';
		var hintModel = new model.TextModel({
			text: text,
			fill:'rgb(255,0,0)',
			height: 10,
			font: 'Arial Bold'
		}); 
		hintModel.set('ratioAnchorPoint', {
			x: 0.5,
			y: 0.5
		});
		var hintNode = data.scene.createNode({
			model: hintModel
		});
		var scaleAni = new animate.ScaleTo(
			[0, {x: 1, y: 1}, 'linear'],
			[1000, {x: 2, y: 2}, 'sine'],
			[2000, {x: 2.5, y: 2.5},'linear']
			); 
		var rotAni = new animate.RotateTo(
			[0, 0, 'sine'],
			[2000, 2.0 * Math.PI, 'sine'],
			[4000, 0 * Math.PI]
			);
		var paraAni = new animate.ParallelAnimation({
			animations: [scaleAni, rotAni] 
		});
		hintNode.exec('addAnimation', scaleAni);
		return hintNode;
	};
}};
