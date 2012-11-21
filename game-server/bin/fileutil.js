var fs = require('fs');

exports = module.exports;
 
exports.rmdirSync = (function(){
    function iterator(url,dirs){
        var stat = fs.statSync(url);
        if(stat.isDirectory()){
            dirs.unshift(url);
            inner(url,dirs);
        }else if(stat.isFile()){
            fs.unlinkSync(url);
        }
    }
    function inner(path,dirs){
        var arr = fs.readdirSync(path);
        for(var i = 0, el ; el = arr[i++];){
            iterator(path+"/"+el,dirs);
        }
    }
    return function(dir,cb){
        cb = cb || function(){};
        var dirs = [];
 
        try{
            iterator(dir,dirs);
            for(var i = 0, el ; el = dirs[i++];){
                fs.rmdirSync(el);
            }
            cb()
        }catch(e){
            e.code === "ENOENT" ? cb() : cb(e);
        }
    }
})();

/**
 * mkdir
 *
 * @param {String} path
 * @param {Number} mode
 * @param {Function} cb
 */
exports.mkdirSync = function mkdir(url, mode, cb) {
    var path = require("path"), arr = url.split("/");
    mode = mode || 0755;
    cb = cb || function () {
    };
    if (arr[0] == ".") {
        arr.shift();
    }
    if (arr[0] == "..") {
        arr.splice(0, 2, arr[0] + "/" + arr[1]);
    }
    if(arr[0] == ""){
          arr[0] = "/";
    }
    function inner(cur) {
        if (!path.existsSync(cur)) {
            fs.mkdirSync(cur, mode);
        }
        if (arr.length) {
            inner(cur + "/" + arr.shift());
        }
        else {
            cb();
        }
    }

    arr.length && inner(arr.shift());
    console.log('   \x1b[36mmakedir\x1b[0m : ' + url);
}

/**
 * @param {String} origin
 * @param {String} target
 */
exports.copySync = function copy (origin, target) {
    if (!fs.existsSync(origin)) {
        console.log(origin + 'is not exist......');
    }

    if (!fs.existsSync(target)) {
        exports.mkdirSync(target, 0);
        console.log('   \x1b[36mmakedir\x1b[0m : ' + target);
    }

    fs.readdir(origin, function (err, datalist) {
        if (err) return;

        for (var i = 0; i < datalist.length; i++) {
            var oCurrent = origin + '/' + datalist[i];
            var tCurrent = target + '/' + datalist[i];

            if (fs.statSync(oCurrent).isFile()) {
                fs.writeFileSync(tCurrent, fs.readFileSync(oCurrent, ''), '');
                console.log('   \x1b[36mcreatefile\x1b[0m : ' + oCurrent);
            }

            else if (fs.statSync(oCurrent).isDirectory()) {
                copy(oCurrent, tCurrent);
            }
        }
    });
}
