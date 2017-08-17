var http = require('http');
var envConfig = require('./app/config/env.json');
var config = require('./app/config/'+envConfig.env+'/config');
var path = __filename.substring(0,__filename.lastIndexOf('/'));
var Robot = require('./lib/robot').Robot;
var cluster = require('cluster');

var robot = new Robot(config);

var run = function(num){
    console.log('runrunrunrunrun!!!!!!');
   for (var i = 0 ;i < num; i++) {
       cluster.fork();
   }
}

var stop = function() {
    for (var id in cluster.workers) {
        cluster.workers[id].process.kill();
    }
}

var startHttp = function() {
    console.log('startHttp!!!!');
    http.createServer(function (req, res) {
        console.log('req.method: ', req.method);
        if (req.method === "GET") {
            var url = require('url').parse(req.url, true);
            console.log('url.pathname: ', url.pathname);
            if (url.pathname === '/') {
                return res.end(JSON.stringify(config) + "\n");
            }  else if (url.pathname === '/set') {
                for (var key in url.query) {
                    config['apps'][key] = (typeof config[key] == 'number') ? +url.query[key] : url.query[key];
                }
                return res.end(JSON.stringify(config) + "\n");
            } else if (url.pathname === '/restart') {
                require('child_process').exec("sudo restart client", function() {});
                return res.end("OK\n");
            }  else if (url.pathname === '/pull') {
                require('child_process').exec("cd /home/ubuntu/hello && git pull ", function() {});
                return res.end("OK\n");
            } else if (url.pathname === '/stop') {
                setTimeout(function(){stop()},1000);
                return res.end("HTTP SERVER CLOSE OK\n");
            } else if (url.pathname === '/start') {
                //代理个数 Per Agent Users
                var num = url.query['num'] || 1;
                console.log('number: ', num);

                run(num);
                return res.end("OK\n" + num);
            }
        }
        res.writeHead(404);
        res.end("<h1>404<h1>\n");
    }).listen(config.master.cwebport);
    console.log(' http server start at port '  + config.master.cwebport);
}

process.on('uncaughtException', function(err) {
  console.error(' Caught exception: ' + err.stack);
  require('fs').writeFileSync('/tmp/log',err.stack,'utf8');
});

if (cluster.isMaster) {
    startHttp();
} else {
    console.log('rundjsakfjsdljfksjdkfjs');
    robot.runAgent(path + envConfig.script);
}

