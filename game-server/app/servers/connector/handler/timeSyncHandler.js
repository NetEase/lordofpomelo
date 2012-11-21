var consts = require('../../../consts/consts');
var handler = module.exports;

handler.timeSync = function(msg, session, next) {
  next(null, {code: consts.MESSAGE.RES});
};
