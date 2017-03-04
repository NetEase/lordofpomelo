var cwd = process.cwd();
var userManager = require(cwd + '/app/script/user');
var utils = require(cwd + '/app/script/utils');
var moveStat = require(cwd + '/app/script/statistic').moveStat;
var attackStat = require(cwd + '/app/script/statistic').attackStat;
var areaStat = require(cwd + '/app/script/statistic').areaStat;
var queryHero = require(cwd + '/app/data/mysql').queryHero;
var genHero = require(cwd + '/app/data/mysql').genHero;
var envConfig = require(cwd + '/app/config/env.json');
var config = require(cwd + '/app/config/' + envConfig.env + '/config');

var util = require('util');
var mysql = require('mysql');
var Pomelo = require("pomelo-nodejsclient-websocket");
var RES_OK = 200;

// pomelo.player = null;
// pomelo.uid = null;

var client = mysql.createConnection({
    "host": "127.0.0.1",
    "port": "3306",
    "database": "Pomelo",
    "user": "root",
    "password": "123456"
});

var START = 'start';
var END = 'end';
var DirectionNum = 8;

var EntityType = {
    PLAYER: 'player',
    NPC: 'npc',
    MOB: 'mob',
    EQUIPMENT: 'equipment',
    ITEM: 'item'
};

var ActFlagType = {
    ENTRY: 0,
    ENTER_SCENE: 1,
    ATTACK: 2,
    MOVE: 3,
    PICK_ITEM: 4
};

function monitor(type, name, reqId) {
    if (typeof actor !== 'undefined') {
        actor.emit(type, name, reqId);
    } else {
        console.error(Array.prototype.slice.call(arguments, 0));
    }
}

var prefix = 'pomelo';

var username = prefix + userManager.update();
console.warn('username: ',username);

var async = require('async');
var pomelo = new Pomelo();

//Per Agent Users 会执行当前文件的次数

function simulateRealPlayer() {
    var playerInfo, create = false;
    async.waterfall([
        function (cb) {
            queryHero(client, username, function(err, data){
                if(!err && !!data && data.length){
                    playerInfo = data[0];
                }
                cb(err);
            });
        },
        function (cb) {
            if(!!playerInfo){
                cb();
            } else {
                create = true;
                console.warn('create user !!!');
                genHero(client,username,function (err) {
                   cb(err);
                });
            }
        },
        function (cb) {
            if(create){
                queryHero(client,uid, function (err,data) {
                    if(!err && !!data && data.length){
                        playerInfo = data[0];
                    }
                    cb(err);
                });
            } else {
                cb();
            }
        }
    ],function (err) {
        if(!!err){
            console.error('query user info error: ',err);
        }
        console.log('playerInfo: ',playerInfo);

        monitor(START, 'enterScene', ActFlagType.ENTER_SCENE);
        client.end();
        queryEntry(playerInfo);
    });
}


function queryEntry(user) {
    var result = {};
    var gatePort = 3014;

    async.waterfall([
        function (cb) {
            pomelo.init({host: '127.0.0.1', port: gatePort}, function (err) {
                cb(err);
            });
        },
        function (cb) {
            pomelo.request('gate.gateHandler.queryEntry', {uid: user.uid}, function (err, data) {
                pomelo.disconnect();

                if(!!data){
                    result = data;
                }
                if (data.code === 2001) {
                    console.log('Servers error!');
                    return;
                }

                cb();
            });
        },
        function (cb) {
            console.log('Start entry~~~~~host: ',result.host, ' port: ', result.port, ' name: ', user.name);
            entry(result.host, result.port, user.token, function (err,code) {
                cb(err);
            })
        }
    ],function () {

    });
}

function entry(host, port, token, callback) {
    var entryData;

    var code ;
    async.waterfall([
        function (cb) {
            pomelo.init({host: host, port: port}, function (err) {
                // console.warn('entry init error:',err);
                monitor(START, 'entry', ActFlagType.ENTRY);
                cb(err);
            });
        },
        function (cb) {
            pomelo.request('connector.entryHandler.entry', {token: token}, function (err,data) {
                monitor(END, 'entry', ActFlagType.ENTRY);
                code = data.code;

                if (data.code == 1001) {
                    console.log('Login fail!');
                    return;
                } else if (data.code == 1003) {
                    console.log('Username not exists!');
                    return;
                }

                if (data.code != 200) {
                    console.log('Login Fail!');
                    return;
                }
                entryData = data;
                cb();
            });
        },
        function (cb) {
            afterLogin(entryData);
            cb();
        }
    ],function (err) {
        callback(err,code);
    });
}

function afterLogin(data) {
    pomelo.player = null;
    pomelo.players = {};
    pomelo.entities = {};
    pomelo.isDead = false;
    pomelo.lastAttack = null;

    var fightedMap = {};

    pomelo.on('onKick', function () {
        console.log('You have been kicked offline for the same account login in other place.');
    });

    pomelo.on('disconnect', function (reason) {
        console.log('disconnect invoke!' + reason);
    });

    var msgTempate = {scope: 'D41313', content: 'Kill ~'};
    /**
     * 处理登录请求
     */
    var login = function (data) {
        var player = data.player;
        if (player.id <= 0) {
            console.error("User is invalid! data = %j", data);
        } else {
            pomelo.uid = player.userId;
            pomelo.player = player;
            msgTempate.uid = pomelo.uid;
            msgTempate.playerId = pomelo.player.id;
            msgTempate.from = pomelo.player.name;
            msgTempate.areaId = pomelo.player.areaId;
        }
    };

    login(data);
    enterScene();

    function enterScene() {
        var msg = {uid: pomelo.uid, playerId: pomelo.player.id, areaId: pomelo.player.areaId};
        monitor(START, 'enterScene', ActFlagType.ENTER_SCENE);
        pomelo.request("area.playerHandler.enterScene", msg, enterSceneCallback);
        console.log('1 ~ EnterScene ~ areaId = %d, playerId = %d, name = %s', pomelo.player.areaId, pomelo.player.id, pomelo.player.name);
    }

    function enterSceneCallback(err,data) {
        monitor(END, 'enterScene', ActFlagType.ENTER_SCENE);
        pomelo.player = data.curPlayer;
        pomelo.addEntity(pomelo.player);

        for (var key in data.entities) {
            if (key !== EntityType.NPC) {
                var array = data.entities[key];
                for (var i = 0; i < array.length; i++) {
                    var entity = array[i];
                    entity.type = key;
                    pomelo.addEntity(entity);
                }
            }
        }

        var actRandom = Math.floor(Math.random() * 2 + 1);
        var intervalTime = Math.floor(Math.random() * 3000 + 2000);
        if (actRandom === 1) {
            setInterval(function () {
                moveEvent();
            }, intervalTime);
            console.log('2 ~ EnterSceneRes ~ areaId = %d, playerId = %d, mover = %s, intervalTime = %d',
                pomelo.player.areaId, pomelo.player.id, pomelo.player.name, intervalTime);
        } else {
            setInterval(function () {
                attackEvent();
            }, intervalTime);
            console.log('2 ~ EnterSceneRes ~ areaId = %d, playerId = %d, fighter = %s, intervalTime = %d',
                pomelo.player.areaId, pomelo.player.id, pomelo.player.name, intervalTime);
        }


    }

    function sendChat() {
        pomelo.request('chat.chatHandler.send', msgTempate, okRes);
    }

    /**
     * 处理用户离开请求
     */
    pomelo.removePlayer = function (playerId) {
        var entityId = this.players[playerId];
        if (!!entityId) {
            this.removeEntity(entityId);
        }
    };

    pomelo.on('onUserLeave', function (data) {
        var playerId = data.playerId;
        this.removePlayer(playerId);
    });

    /**
     * 处理用户攻击请求
     */
    pomelo.on('onAttack', function (data) {
        if (data.result.result === 2) {
            var attackId = parseInt(data.attacker);
            var targetId = parseInt(data.target);
            var selfId = parseInt(pomelo.player.entityId);
            if (attackId === selfId || targetId === selfId) {
                if (targetId !== selfId) {
                    clearAttack();
                    pomelo.isDead = false;
                    this.removeEntity(targetId);
                } else {
                    pomelo.isDead = true;
                    clearAttack();
                }
            } else {
                if (!!pomelo.lastAttAck && targetId === pomelo.lastAttAck.entityId) {
                    clearAttack();
                }
                this.removeEntity(targetId);
            }
        }
    });

    pomelo.on('onRevive', function (data) {
        if (data.entityId === pomelo.player.entityId) {
            pomelo.isDead = false;
            clearAttack();
        } else {
            this.addEntity(data.entity);
        }
    });

    pomelo.on('onUpgrade', function (data) {
        msgTempate.content = 'Upgrade to ' + data.player.level + '!';
        sendChat();
    });

    pomelo.on('onDropItems', function (data) {
        var items = data.dropItems;
        var length = items.length;
        for (var i = 0; i < length; i++) {
            this.addEntity(items[i]);
        }
    });

    pomelo.on('onMove', function (data) {
        // console.log("OnMove ~ data = %j", data);
        var entity = pomelo.entities[data.entityId];
        if (!entity) {
            return;
        }
        if (data.entityId === pomelo.player.entityId) {
            var path = data.path[1];
            pomelo.player.x = path.x;
            pomelo.player.y = path.y;
            // console.log('self %j move to x=%j, y=%j', pomelo.uid, path.x, path.y);
        }
    });

    var moveDirection = Math.floor(Math.random() * DirectionNum + 1);

    function getPath() {
        var FIX_SPACE = Math.floor(Math.random() * pomelo.player.walkSpeed + 1);
        var startX = pomelo.player.x;
        var startY = pomelo.player.y;
        var endX = startX;
        var endY = startY;
        moveDirection = (++moveDirection % DirectionNum) ? moveDirection : 1;
        switch (moveDirection) {
            case 1:
                endX += FIX_SPACE;
                break;
            case 2:
                endX += FIX_SPACE;
                endY += FIX_SPACE;
                break;
            case 3:
                endY += FIX_SPACE;
                break;
            case 4:
                endX -= FIX_SPACE;
                endY += FIX_SPACE;
                break;
            case 5:
                endX -= FIX_SPACE;
                break;
            case 6:
                endX -= FIX_SPACE;
                endY -= FIX_SPACE;
                break;
            case 7:
                endY -= FIX_SPACE;
                break;
            case DirectionNum:
            default:
                endX += FIX_SPACE;
                endY -= FIX_SPACE;
                break;
        }
        var path = [{x: startX, y: startY}, {x: endX, y: endY}];
        return path;
    }

    function getFirstFight() {
        var entities = pomelo.entities;
        var keyArray = Object.keys(entities);
        var len = keyArray.length;
        // console.log('entities.length = ', len);
        var randomNum = Math.floor(Math.random() * len);
        // console.log('randomNum = ', randomNum)
        var entity = entities[keyArray[randomNum]];
        // console.log('entity = ', entity)
        if (!entity) {
            for (var i = 0; i < entities.length; i++) {
                console.log('i = %j, entities[i] = %j', i, entities[i]);
            }
        }
        return entity;
    }

    function okRes(err,data) {

    }

    function moveEvent() {
        if (!!pomelo.isDead) {
            return;
        }
        var paths = getPath();
        var msg = {path: paths};
        monitor('incr', 'moveReq');
        monitor(START, 'move', ActFlagType.MOVE);
        pomelo.request('area.playerHandler.move', msg, function (err,data) {
            monitor(END, 'move', ActFlagType.MOVE);
            if (data.code !== RES_OK) {
                console.error('wrong path! %s %j : %d~%s, in area %d',
                    Date(), msg, pomelo.player.id, pomelo.player.name, pomelo.player.areaId);
                return;
            }
            pomelo.player.x = paths[1].x;
            pomelo.player.y = paths[1].y;

            if (!moveStat.idDict[pomelo.player.id]) {
                moveStat.idDict[pomelo.player.id] = true;
                moveStat.total++;
            }
            console.log('Total mover num = %j', moveStat.total);

            areaStat.idDict[pomelo.player.areaId] = areaStat.idDict[pomelo.player.areaId] || {};
            var tmpDict = areaStat.idDict[pomelo.player.areaId];
            if (!tmpDict[pomelo.player.id]) {
                tmpDict[pomelo.player.id] = true;
                tmpDict.total = tmpDict.total || 0;
                tmpDict.total++;
            }
            console.log('In area = %j, total mover num = %j\n', pomelo.player.areaId, tmpDict.total);

            console.log('%s : %d~%s is moving, in area %d, pos(%d, %d)',
                Date(), pomelo.player.id, pomelo.player.name,
                pomelo.player.areaId, pomelo.player.x, pomelo.player.y);
        });
    };

    function attackEvent() {
        if (!pomelo.player.entityId || !!pomelo.isDead) {
            return;
        }
        var entity = pomelo.lastAttAck;
        if (!!entity) {
            doAttack(entity);
            var count = fightedMap[entity.entityId] || 1;
            fightedMap[entity.entityId] = count + 1;
            if (count >= 10) {
                delete fightedMap[entity.entityId];
                clearAttack();
            }
        } else {
            doAttack(getFirstFight());
        }
    }

    function doAttack(entity) {
        if (!entity) {
            return;
        }
        if (entity.type === EntityType.MOB || entity.type === EntityType.PLAYER) {
            if (entity.died) {
                return;
            }
            pomelo.lastAttAck = entity;

            var attackId = entity.entityId;
            var route = 'area.fightHandler.attack';
            var msg = {targetId: attackId};
            monitor('incr', 'attackReq');
            monitor(START, 'attack', ActFlagType.ATTACK);
            // pomelo.notify(route, msg);
            pomelo.request(route, msg, function (err,data) {
                monitor(END, 'attack', ActFlagType.ATTACK);
                console.log('\nTotal attacker num = %j', attackStat.total);
            });

            if (!attackStat.idDict[pomelo.player.id]) {
                attackStat.idDict[pomelo.player.id] = true;
                attackStat.total++;
            }
            // console.log('\nTotal attacker num = %j', attackStat.total);

            areaStat.idDict[pomelo.player.areaId] = areaStat.idDict[pomelo.player.areaId] || {};
            var tmpDict = areaStat.idDict[pomelo.player.areaId];
            if (!tmpDict[pomelo.player.id]) {
                tmpDict[pomelo.player.id] = true;
                tmpDict.total = tmpDict.total || 0;
                tmpDict.total++;
            }
            console.log('In area = %j, total attacker num = %j\n', pomelo.player.areaId, tmpDict.total);

            console.log('%s : %d~%s attack %d, in area %d, pos(%d, %d)',
                Date(), pomelo.player.id, pomelo.player.name, entity.entityId,
                pomelo.player.areaId, pomelo.player.x, pomelo.player.y);
        } else if (entity.type === EntityType.ITEM || entity.type === EntityType.EQUIPMENT) {
            var route = 'area.playerHandler.pickItem';
            var attackId = entity.entityId;
            // var msg = { areaId:pomelo.player.areaId, playerId:pomelo.player.id, targetId:attackId};
            var msg = {areaId: pomelo.player.areaId, playerId: pomelo.player.id, targetId: attackId};
            monitor(START, 'pickItem', ActFlagType.PICK_ITEM);
            pomelo.request(route, msg, function (err,data) {
                monitor(END, 'pickItem', ActFlagType.PICK_ITEM);
            });
        }
    }

    pomelo.on('onPickItem', function (data) {
        clearAttack();
        this.removeEntity(data.item);
        var item = pomelo.entities[data.item];
        if (!!item && data.player === pomelo.player.entityId) {
            msgTempate.content = 'I got a ' + item.kindName;
            sendChat(msgTempate);
        }
        if (item) {
            delete item;
        }
    });

    pomelo.on('onRemoveItem', function (data) {
        clearAttack();
        delete pomelo.entities[data.entityId];
    });

    ///////////////////////////////////////////////////////////////////
    pomelo.on('onAddEntities', function (data) {
        var entities = data;
        for (var key in entities) {
            var array = entities[key];
            for (var i = 0; i < array.length; i++) {
                var entity = array[i];
                entity.type = key;
                this.addEntity(entity);
                /*
                 if(!this.getEntity(array[i].entityId)) {
                 var entity = array[i];
                 entity.type = key;
                 this.addEntity(entity);
                 }else{
                 console.warn('add exist entity!');
                 }
                 */
            }
        }
    });

    /**
     * Handle remove entities message
     * @param data {Object} The message, contains entitiy ids to remove
     */
    pomelo.on('onRemoveEntities', function (data) {
        var entities = data.entities;
        for (var i = 0; i < entities.length; i++) {
            if (entities[i] !== pomelo.player.entityId) {
                this.removeEntity(entities[i]);
            }
        }
    });

    pomelo.getEntity = function (id) {
        return this.entities[id];
    };

    //添加实体
    pomelo.addEntity = function (entity) {
        if (!entity || !entity.entityId) {
            return false;
        }
        switch (entity.type) {
            case EntityType.PLAYER: {
                if (!!entity.id) {
                    pomelo.players[entity.id] = entity.entityId;
                    pomelo.entities[entity.entityId] = {
                        entityId: entity.entityId,
                        playerId: entity.id,
                        type: entity.type
                    };
                    return true;
                }
            }
                break;
            case EntityType.MOB:
            case EntityType.ITEM:
            case EntityType.EQUIPMENT: {
                pomelo.entities[entity.entityId] = {entityId: entity.entityId, type: entity.type};
                return true;
            }
                break;
        }
        return false;
    };

    /**
     * Remove entity from area
     * @param id {Number} The entity id or the entity to remove.
     * @api public
     */
    pomelo.removeEntity = function (id) {
        if (!pomelo.entities[id]) {
            return false;
        }

        delete pomelo.entities[id];
    };

    ////////////////////////////////////////////////////////////////////////

    function clearAttack() {
        pomelo.lastAttAck = null;
    }

};

//创建机器人数据
// function createRobotPlayer() {
//     var max = 1000;
//     genHero(client, prefix, max, function (err,users) {
//
//     });
// }

// 第一次使用 要生成机器人数据
// createRobotPlayer();

simulateRealPlayer();
