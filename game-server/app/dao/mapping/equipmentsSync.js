module.exports = {
  updateEquipments: function(dbclient, val, cb) {
    var sql = 'update Equipments set weapon = ?, armor = ?, helmet = ?, necklace = ?, ring = ?, belt = ?, amulet = ?, legguard = ?, shoes = ?  where id = ?';
    var args = [val.weapon, val.armor, val.helmet, val.necklace, val.ring, val.belt, val.amulet, val.legguard, val.shoes, val.id];

    dbclient.query(sql, args, function(err, res) {
      if (err) {
        console.error('write mysql failed!　' + sql + ' ' + JSON.stringify(val));
      }
      if(!!cb && typeof cb == 'function') {
        cb(!!err);
      }
    });
  }

};
