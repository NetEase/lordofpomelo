// var Client = require('mysql').Client;
var dataApi = require('./dataApi');
var Token = require('./token.js');
var session = require('./json/session.json');
var async = require('async');

var ids = [1001, 1007, 1020, 1022, 1024, 1025, 1026, 1027, 1028, 1029, 1030, 1031];


/**
 * session.json file format
 *
 *{
	*  "secret": "yourselfkey", 
	*  "expire": -1
  *}
 *
 */
queryHero = function (client, username, cb) {
    var users = [];

    var sql = "SELECT * FROM User where User.name = ?";
    var args = [username];
    client.query(sql, args, function selectCb(error, results) {
        if (!!error) {
            console.log('queryHero Error: ' + error.message);
            return cb(null, users);
        }
        if (!!results && results.length) {
            for (var i = 0; i < results.length; i++) {
                var uid = results[i]['id'];
                var token = Token.create(uid, Date.now(), session.secret);
                var user = {
                    uid: results[i]['id'],
                    token: token,
                    username: results[i]['name'],
                    passwd: results[i]['passwd'] || 'pomelo'
                };
                users.push(user);
            }
        }
        cb(error, users);
    });
};

/**
 *
 * @param client
 * * @param username 用户昵称
 * @param cb
 */
genHero = function (client, username, next) {
    var sql = 'SELECT max(`id`) as maxid FROM User where 1 = ? ';
    var args = [1];

    console.log('genHero: ', sql, args);

    var beginId, userId;

    async.waterfall([
        function (cb) {
            client.query(sql, args, function (error, results) {
                if(!error && !!results){
                    beginId = results[0].maxid;
                }
                cb(error);
            });
        },
        function (cb) {
            var sql = "insert into User(`name`,`password`,`loginCount`,`from`,`lastLoginTime`) values(?,?,?,?,?);";
            var loginTime = Date.now();
            var args = [username, 'pomelo', 1, 'robot', loginTime];

            console.log('sql: ', sql);
            console.log('args: ', args);

            client.query(sql, args, function (err, res) {
                if (!!err) {
                    console.error('create User error %j', err);
                    return cb('createError');
                } else {
                    userId = res.insertId;
                }
                cb(err);
            });
        },
        function (cb) {
            var roleId = ids[Math.round(Math.random() * 11)];
            createPlayer(client, userId, 'pomelo' + userId, roleId, function (err) {
                cb(err);
            });
        }
    ],function (err) {
        next(err);
    });
};


createPlayer = function (client, uid, name, roleId, next) {
    var sql = 'insert into Player(`userId`, `kindId`, `kindName`, `name`, `country`, `rank`, `level`, `experience`, `attackValue`, `defenceValue`, `hitRate`, `dodgeRate`, `walkSpeed`, `attackSpeed`, `hp`, `mp`, `maxHp`, `maxMp`, `areaId`, `x`, `y`, `skillPoint`) values(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)';

    var role = dataApi.role.findById(roleId);
    var character = dataApi.character.findById(roleId);
    var x = 1230 + Math.round(Math.random() * 30);
    var y = 1165 + Math.round(Math.random() * 30);
    var areaId = 1;
    role.country = 1;

    var args = [uid, roleId, role.name, name, role.country, 1, 1, 0, character.attackValue, character.defenceValue, character.hitRate, character.dodgeRate, character.walkSpeed, character.attackSpeed, character.hp, character.mp, character.hp, character.mp, areaId, x, y, 1];
    var playerId;

    async.waterfall([
        function (cb) {
            client.query(sql, args, function (err, res) {
                if (!!err) {
                    console.error('create player failed! %j ', err);
                } else {
                    console.warn(' genate palery ok ' + name);
                    playerId = res.insertId;
                }
                cb(err);
            });
        },
        function (cb) {
            genBag(client, playerId, function (err) {
                cb(err);
            });
        },
        function (cb) {
            genEquipment(client, playerId,function (err) {
                cb(err);
            });
        },
        function (cb) {
            genSkill(client, playerId, function (err) {
                cb(err);
            });
        }
    ],function (err) {
        next(err);
    });
};

genBag = function (client, playerId,cb) {
    var sql = 'insert into Bag (`playerId`, `items`, `itemCount`) values(?, ?, ?)';
    var args = [playerId, '{}', 20];
    client.query(sql, args, function (err, res) {
        if (err) {
            logger.error('create bag for bagDao failed! ' + err.stack);
        } else {
            console.warn(' genate bag ok ' + playerId);
        }
        cb(err);
    });
};

genEquipment = function (client, playerId,cb) {
    var sql = 'insert into Equipments(`playerId`) values(?)';
    var args = [playerId];
    client.query(sql, args, function (err, res) {
        if (err) {
            logger.error('create equipments for equipmentDao failed! ' + err.stack);
        } else {
            console.error(' genate equit ok ' + playerId);
        }
        cb(err);
    });
};

genSkill = function (client, playerId, cb) {
    var sql = 'insert into FightSkill (playerId, skillId, level, type ) values (?, ?, ?, ?)';
    var args = [playerId, 1, 1, 'attack'];
    client.query(sql, args, function (err, res) {
        if (err) {
            console.error(err.message);
        } else {
            console.error(' genate skill ok ' + playerId);

        }
        cb(err);
    });
}

exports.queryHero = queryHero;
exports.genHero = genHero;
