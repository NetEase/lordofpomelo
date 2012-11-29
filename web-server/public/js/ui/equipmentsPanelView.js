__resources__["/equipmentsPanelView.js"] = {
  meta: {
    mimetype: "application/javascript"
  },

  data: function(exports, require, module, __filename, __dirname) {

    var config = require('config');
    var dataApi = require('dataApi');
    var app = require('app');
    var pomelo = window.pomelo;
    var $equip, $list;

    var init = function() {
      var $panel = $('#playerPanel');
      $equip = $panel.find('.zj .weapon .wtype');
      $list = $panel.find('.zj .weapon .wroom');

      $equip.find('.name1').addClass('weapon');
      $equip.find('.name2').addClass('necklace');
      $equip.find('.name3').addClass('helmet');
      $equip.find('.name4').addClass('armor');
      $equip.find('.name5').addClass('belt');
      $equip.find('.name6').addClass('legguard');
      $equip.find('.name7').addClass('shoes');
      $equip.find('.name8').addClass('ring');
      $equip.find('.name9').addClass('amulet');

      initEquipmentPanel();

    };

    var initEquipmentPanel = function() {
      var equipments = app.getCurPlayer().equipments;
      var kinds = ['weapon', 'necklace', 'helmet', 'armor', 'belt', 'shoes', 'ring', 'legguard', 'amulet'];

      kinds.forEach(function(kind) {
        equip(kind, equipments[kind]);
      });
    };

    var equip = function(kind, id) {
      if (!id) {
        return;
      }
      var $dom = $equip.find('li span.' + kind);
      var $li = $dom.parent();
      $li.data({kind: kind, id: id});
      var item = dataApi.equipment.findById(id);
      $dom.html('<img src="' + config.IMAGE_URL + 'equipment/item_' + item.imgId + '.png" width="53">');
      var hover = '\
        <div class="m-detllay">\
          <div class="wrap">\
            <h4 class="f-cb"><span class="f-fl s-fc11"> ' + item.englishName + '</span><span class="f-fr">' + item.kind + '</span></h4>\
            <p class="s-fc6">Level: <span> ' + (item.heroLevel || '1') + '</span></p>\
            <p>Color: <span> '+ item.color +'</span></p>\
            <p>Attack: <span class="s-fc9"> + '+ item.attackValue +'</span></p>\
            <p>Defence: <span class="s-fc5"> + '+ item.defenceValue +'</span></p>\
            <p>Price: <span> ' + item.price + ' </span></p>\
            <p class="s-fc6 opts"><a class="unequip f-dn">Put in Bag</a><a class="drop">Drop</a></p>\
          </div>\
        </div>';

      $li.append(hover);
      $li.find('.m-detllay .opts a').on('click', function() {
        var $a = $(this);
        var $li = $a.parents('li');
        var kind = $li.data('kind');
        var player = app.getCurPlayer();

        if ($a.hasClass('unequip')) {
          if (player.bag.isFull()) {
            alert('The bag is full!');
          } else {
            pomelo.request('area.equipHandler.unEquip', { type: kind, putInBag: true}, function(data) {
              if (data.status) {
                player.bag.addItem({id: player.equipments[kind], type: 'equipment'}, data.bagIndex);
                player.equipments.unEquip(kind);
              }
            });
          }
        } else if ($a.hasClass('drop')) {
          pomelo.request('area.equipHandler.unEquip', {type: kind}, function(data) {
            if (data.status) {
              player.equipments.unEquip(kind);
            } else {
              console.log('unequip fail from server!');
            }
          });
        }
      });
    };

    var unEquip = function(kind) {
      var $dom = $equip.find('li span.' + kind).html('');
      $dom.parent().find('.m-detllay').remove();
    };

    //var set
    module.exports = {
      init: init,
      equip: equip,
      unEquip: unEquip
    };
  }
};

