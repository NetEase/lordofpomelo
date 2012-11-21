module.exports = {
  updateFightSkill: function(dbclient, val, cb) {
    var sql = 'update FightSkill set level = ? where id = ?';
    var args = [val.level, val.id];

    dbclient.query(sql, args, function(err, res) {
      if (err) {
        console.error('write mysql failed!　' + sql + ' ' + JSON.stringify(val));
      }
      cb(!!err);
    });
  }

};
