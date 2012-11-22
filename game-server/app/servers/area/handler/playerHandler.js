/**
 * Module dependencies
 */

var area = require('../../../domain/area/area');
var messageService = require('../../../domain/messageService');
var timer = require('../../../domain/area/timer');
var world = require('../../../domain/world');
var userDao = require('../../../dao/userDao');
var Move = require('../../../domain/action/move');
var actionManager = require('../../../domain/action/actionManager');
var logger = require('pomelo-logger').getLogger(__filename);
var pomelo = require('pomelo');
var consts = require('../../../consts/consts');
var dataApi = require('../../../util/dataApi');
var channelUtil = require('../../../util/channelUtil');

var handler = module.exports;

/**
 * Player enter scene, and response the related information such as
 * playerInfo, areaInfo and mapData to client.
 *
 * @param {Object} msg
 * @param {Object} session
 * @param {Function} next
 * @api public
 */
handler.enterScene = function(msg, session, next) {
  var playerId = session.get('playerId');
  var areaId = session.get('areaId');
  userDao.getPlayerAllInfo(playerId, function(err, player) {
    if (err || !player) {
      logger.error('Get user for userDao failed! ' + err.stack);
      next(new Error('fail to get user from dao'), {
        route: msg.route,
        code: consts.MESSAGE.ERR
      });

      return;
    }

    player.serverId = session.frontendId;

    pomelo.app.rpc.chat.chatRemote.add(session, session.uid,  
    player.name, channelUtil.getAreaChannelName(areaId), null);
		var map = area.map();
		
		if(!map.isReachable(player.x, player.y)){
			var pos = map.getBornPoint();	
			player.x = pos.x;
			player.y = pos.y;
		}
		
		next(null, {
			code: consts.MESSAGE.RES,
			data: {
				area: area.getAreaInfo({x: player.x, y: player.y}, player.range), 
        curPlayer: player.getInfo(),
				mapData: {
					mapWeight: map.width,
					mapHeight: map.height,
					tileW : map.tileW,
					tileH : map.tileH,
					weightMap: map.weightMap
				}
			}
		});
		
		if (!area.addEntity(player)) {
      logger.error("Add player to area faild! areaId : " + player.areaId);
//      next(new Error('fail to add user into area'), {
//        route: msg.route,
//        code: consts.MESSAGE.ERR
//      });
//      return;
    }
    
  });
};

/**
 * Change player's view.
 *
 * @param {Object} msg
 * @param {Object} session
 * @param {Function} next
 * @api public
 */
handler.changeView = function(msg, session, next){
	var playerId = session.get('playerId');
	var width = msg.width;
	var height = msg.height;

	var radius = width>height ? width : height;

	var range = Math.ceil(radius / 600);
	var player = area.getPlayer(playerId);

	if(range < 0 || !player){
		next(new Error('invalid range or player'));
		return;
	}

	if(player.range !== range){
    timer.updateWatcher({id:player.entityId, type:player.type}, player, player, player.range, range);
		player.range = range;
	}

	next();
};

/**
 * Player moves. Player requests move with the given movePath.  
 * Handle the request from client, and response result to client
 *
 * @param {Object} msg
 * @param {Object} session
 * @param {Function} next
 * @api public
 */
handler.move = function(msg, session, next) {
  var path = msg.path;
  var playerId = session.get('playerId');
  var player = area.getPlayer(playerId);
  var speed = player.walkSpeed;

  player.target = null;

  if(!area.map().verifyPath(path)){
    logger.warn('The path is illigle!! The path is: %j', msg.path);
    next(null, {
      route: msg.route,
      code: consts.MESSAGE.ERR
    });

    return;
  }

	/**
	var startTime = new Date().getTime();
	while(new Date().getTime() < 5 * 1000 + startTime) {

	}
	*/

  var action = new Move({
    entity: player,
    path: path,
    speed: speed
  });

	var ignoreList = {};
	ignoreList[player.userId] = true;
  if (timer.addAction(action)) {
			player.isMoving = true;
			//Update state
			if(player.x != path[0].x || player.y != path[0].y){
				  timer.updateObject({id:player.entityId, type:consts.EntityType.PLAYER}, {x : player.x, y : player.y}, path[0]);
  				timer.updateWatcher({id:player.entityId, type:consts.EntityType.PLAYER}, {x : player.x, y : player.y}, path[0], player.range, player.range);
			}  	
  	
      messageService.pushMessageByAOI({
      route: 'onMove',
      entityId: player.entityId,
      path: path,
      speed: speed
    }, path[0], ignoreList);
    next(null, {
      route: msg.route,
      code: consts.MESSAGE.RES
    });
    next();
  }
};

//drop equipment or item
handler.dropItem = function(msg, session, next) {
  var player = area.getPlayer(session.get('playerId'));

  player.bag.removeItem(msg.index);

  next(null, {status: true});
};

//add equipment or item
handler.addItem = function(msg, session, next) {
  var player = area.getPlayer(session.get('playerId'));

  var bagIndex = player.bag.addItem(msg.item);

  next(null, {bagIndex: bagIndex});
};

//Change area
handler.changeArea = function(msg, session, next) {
	var areaId = msg.areaId;
	var target = msg.target;

	var req = {
    areaId: areaId, 
    target: target, 
    uid: session.uid, 
    playerId: session.get('playerId'), 
    frontendId: session.frontendId
  };

	world.changeArea(req, session, function(err) {
		next(null, {areaId: areaId, target: target, success: true});
	});
};

//Use item
handler.useItem = function(msg, session, next) {
  var player = area.getPlayer(session.get('playerId'));

  var status = player.useItem(msg.index);

  next(null, {code: consts.MESSAGE.RES, status: status});
};

handler.npcTalk = function(msg, session, next) {
  var player = area.getPlayer(session.get('playerId'));
  player.target = msg.targetId;
  next(null, {
    route: msg.route,
    code: consts.MESSAGE.RES
  });
  next();
};

/**
 * Player pick up item. 
 * Handle the request from client, and set player's target
 * 
 * @param {Object} msg
 * @param {Object} session
 * @param {Function} next
 * @api public
 */

handler.pickItem = function(msg, session, next) {
  var player = area.getPlayer(session.get('playerId'));
  var target = area.getEntity(msg.targetId);
  if(!player || !target || (target.type !== consts.EntityType.ITEM && target.type !== consts.EntityType.EQUIPMENT)){
    next(null, {
      route: msg.route,
      code: consts.MESSAGE.ERR
    });
    return;
  }

  player.target = target.entityId;
  next();
};

//Player  learn skill
handler.learnSkill = function(msg, session, next) {
  var player = area.getPlayer(session.get('playerId'));
  var status = player.learnSkill(msg.skillId);

  next(null, {status: status, skill: player.fightSkills[msg.skillId]});
};

//Player upgrade skill
handler.upgradeSkill = function(msg, session, next) {
  var player = area.getPlayer(session.get('playerId'));
  var status = player.upgradeSkill(msg.skillId);

  next(null, {status: status});
};
