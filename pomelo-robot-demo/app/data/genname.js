var config = require('../config/config');
var mysql =config['dev'].mysql;
var Client = require('mysql').Client;
var client = new Client();
client.host = mysql.host;
client.user = mysql.user;
client.password = mysql.password;
client.database = mysql.database;

function genChinese(){
	var end  = Math.random()*5;
	var result = '';
  for (var j = 0;j<end;j++) {
	   var i = Math.random() * 1000 + 20100;
     result = result + String.fromCharCode(i);
	}
	return result;
}

updateName = function(client,limit,offset,cb){
    var tokens = [];
    var sql = "SELECT User.* FROM User,Player where User.id = Player.userId  and User.name like 'pomelo%' order by User.id asc limit ? offset ? ";
    var args = [parseInt(limit),parseInt(offset)];
    client.query(sql,args,function selectCb(error, results, fields) {
        if (!!error) {
            console.log('queryHero Error: ' + error.message);
        }
        for (var i = 0;i<results.length;i++) {
      	    var uid = results[i]['id'];
    	      tokens.push(uid);
				};
				cb(null,tokens);
    });
};

updateName(client,10,0,function(error,data){
				for (var id in data) {
					var namesql= "select * from Player where name = ? ";
					var name = genChinese();
					(function(_name,id) {
					client.query(namesql,[_name],function(error,nrs){
						  console.log(_name + " " + nrs.length);
							if (nrs.length<=0) {
								var upsql = "Update Player set name = ? where userId = ? ";
								client.query(upsql,[_name,data[id]],function(error,ss){})
						}
					});
				})(name,id);
	};
});
