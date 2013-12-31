var fs = require('fs');

var whitelistPath = __dirname + '/../../config/whitelist.json';
var whitelistInterval = 3000;

var self = this;
self.gWhitelist = [];

module.exports.whitelistFunc = function(cb) {
  cb(null, self.gWhitelist);
};

var loadWhitelist = function(filename) {
  delete require.cache[require.resolve(filename)]
  self.gWhitelist = require(filename);
  if(!(self.gWhitelist instanceof Array)) {
    throw new Error(filename + ' should be an array.');
  } else {
    var localIPList = ['127\\.0\\.0\\.1'];
    Array.prototype.push.apply(self.gWhitelist, localIPList);
  }
};

var listener4watch = function(filename) {
  return function(curr, prev) {
    if(curr.mtime.getTime() > prev.mtime.getTime()) {
      loadWhitelist(filename);
      // console.warn('\n', Date(), ': Listener4watch ~  whitelist = ', JSON.stringify(self.gWhitelist));
    }
  };
};

loadWhitelist(whitelistPath);
fs.watchFile(whitelistPath, {persistent: true, interval: whitelistInterval}, listener4watch(whitelistPath));

