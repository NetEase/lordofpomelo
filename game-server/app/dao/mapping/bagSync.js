module.exports = {
  updateBag: function (dbclient, val, cb) {
    var sql = 'update Bag set items = ? where id = ?';
    var items = val.items;
    if (typeof items !== 'string') {
      items = JSON.stringify(items);
    }
    var args = [items, val.id];

    dbclient.query(sql, args, function (err, res) {
      if (err) {
        console.error('write mysql failed!　' + sql + ' ' + JSON.stringify(val));
      }
      if(!!cb && typeof cb == 'function') {
        cb(!!err);
      }
    });
  }
};
