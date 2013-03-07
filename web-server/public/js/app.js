__resources__["/app.js"] = {meta: {mimetype: "application/javascript"}, data: function(exports, require, module, __filename, __dirname) {
	var switchManager = require('switchManager');	// page switch manager
	var ui = require('ui');
	var Area = require('area');
	var ResMgr = require('resmgr').ResMgr;
	var ObjectPoolManager = require('objectPoolManager');
	var chat = require('chat');
	var view = require("view");
	var director = require('director');
	var helper = require("helper");
	var pomelo = window.pomelo;

	var inited = false;
	var skch = null;
	var gd = null;
	var gv = null;
	var area = null;
	var resMgr = null;
	var poolManager = null;
	var delayTime = null;

	/**
	 * Init client ara
	 * @param data {Object} The data for init area
	 */
	function init(data) {
		var map = data.map;
		pomelo.player = data.curPlayer;
		switchManager.selectView('gamePanel');
		if(inited){
			configData(data);
			area = new Area(data, map);
		}else{
			initColorBox();
			configData(data);
			area = new Area(data, map);

			area.run();
			chat.init();

			inited = true;
		}
    ui.init();
	}

	/**
	 * Init color box, it will init the skch, gv, gd
	 * @api private
	 */
	function initColorBox(){
		if(!skch){
			var width = parseInt(getComputedStyle(document.getElementById("m-main")).width);
			var height = parseInt(getComputedStyle(document.getElementById("m-main")).height);
			skch = helper.createSketchpad(width, height, document.getElementById("m-main"));
			skch.cmpSprites = cmpSprites;
		}

		gv = new view.HonestView(skch);
		gv.showUnloadedImage(false);
		gd = director.director({
			view: gv
		});
	}

	function getArea() {
		return area;
	}

	/**
	 * Get current player
	 */
	function getCurPlayer() {
		return getArea().getCurPlayer();
	}

	function getResMgr(){
		if(!resMgr){
			resMgr = new ResMgr();
		}

		return resMgr;
	}

	function getObjectPoolManager() {
		if (!poolManager) {
			poolManager = new ObjectPoolManager();
		}
		return poolManager;

	}

	function setDelayTime(time) {
		delayTime = time;
	}

	function getDelayTime() {
		return delayTime;
	}

	/**
	 * Reconfig the init data for area
	 * @param data {Object} The init data for area
	 * @api private
	 */
	function configData(data){
		data.skch = skch;
		data.gd = gd;
		data.gv = gv;
	}

	var cmpSprites = function(s1, s2) {
		var m1 = s1.exec('matrix');
		var m2 = s2.exec('matrix');
		var dz = m1.tz - m2.tz;
		if(dz === 0) {
			var dy = m1.ty - m2.ty;
			if(dy === 0) {
				return m1.tx - m2.tx;
			}
			return dy;
		}
		return dz;
	};

	exports.init = init;
	exports.getResMgr = getResMgr;
	exports.getObjectPoolManager = getObjectPoolManager;
	exports.setDelayTime = setDelayTime;
	exports.getDelayTime = getDelayTime;
	exports.getCurArea = getArea;
	exports.getCurPlayer = getCurPlayer;
}};
