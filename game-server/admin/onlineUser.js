/**
 * Created by lixiaodong on 17/3/4.
 */
'use strict';

var PomeloAdmin = require('pomelo-admin');

/**
* 获取在线人数
* @param data
* @param callback
*/
function onlineUser(data, callback) {
   console.log("获取在线人数" + JSON.stringify(data));
   var jsonData = {};
   var client = new PomeloAdmin.adminClient({username: data.username, password: data.password});
   client.connect('game-admin', data.host, data.port, function (errConnect, msgConnect) {
       if (errConnect) {
           jsonData.code = 1;
           jsonData.message = '连接游戏服务器失败' + data.host + ":" + data.port;
           console.log(JSON.stringify(errConnect));
           callback(jsonData);
           client.socket.disconnect();
       } else {
           //console.log('连接游戏服务器成功' + data.host + ":" + data.port);
           client.request('onlineUser', null, function (errRequest, msgRequest) {
               if (errRequest) {
                   jsonData.code = 1;
                   jsonData.message = '获取在线人数失败';
               } else {
                   jsonData.code = 0;
                   jsonData.data = msgRequest;
               }
               console.log(JSON.stringify(jsonData));
               callback(jsonData);
               client.socket.disconnect();
               process.exit(0);
           });
       }
   });
}

var data = {
    username:   'admin',
    password:   'admin',
    host:   '127.0.0.1',
    port:   3005
}

onlineUser(data, function (data) {
})

