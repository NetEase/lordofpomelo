var fs = require('fs');
var path = require('path');
var child  = require('child_process');
var fileutil = require('./fileutil');
var publisher = require('pomelo-publisher');


/*var srcimageip = '127.0.0.1:81';*/
/*var destimageip = '192.168.145.18:81';*/
/*var desturlip = '127.0.0.1:3015';*/
/*var srcurlip = '192.168.145.45:3015';*/
var conf= __dirname+'/release.conf';
var rel = fs.readFileSync(conf).toString();
/*var tmp = process.cwd();*/
/*var cur = tmp.substring(0,tmp.length-3);*/


/*String.prototype.replaceAll = function (s1, s2) {*/
/*return this.replace(new RegExp(s1, "gm"), s2);*/
/*}*/

/*var repalcefile = ['../public/css/client.css', '../public/js/config/config.js'];*/


/*for (var i =0 ; i<repalcefile.length; i++) {*/
/*var str = fs.readFileSync(repalcefile[i]).toString();*/
/*fs.writeFileSync(repalcefile[i], str.replaceAll(srcimageip, destimageip).replaceAll(srcurlip, desturlip));*/
/*}*/

if (!path.existsSync('../../web-server/public/pub/'))
{
	fileutil.mkdirSync('../../web-server/public/pub/res/');
}
else{
	fileutil.rmdirSync("../../web-server/public/pub/");
	fileutil.mkdirSync('../../web-server/public/pub/res/');
}

//edit conf
/*fs.writeFileSync(conf, rel.replace('*',cur));*/

//package
publisher.packproject.pack(conf);

if(process.argv.length>2 && process.argv[2] == '-r'){
        console.log('********************************');
	fileutil.rmdirSync('../../web-server/public/pub/image');
	fileutil.copySync('../../web-server/public/pub/','../../web-server/public/');
	setTimeout(function(){
			fileutil.rmdirSync('../../web-server/public/css');
			fileutil.rmdirSync('../../web-server/public/js');
			fileutil.rmdirSync('../../web-server/public/animation_json');
			fileutil.rmdirSync('../../web-server/public/pub');
			},5000);
}

