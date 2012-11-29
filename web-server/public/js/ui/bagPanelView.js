__resources__["/bagPanelView.js"] = {
  meta: {
    mimetype: "application/javascript"
  },

  data: function(exports, require, module, __filename, __dirname) {
    var mainPanel = require('mainPanelView');
    var config = require('config');
    var dataApi = require('dataApi');
    var app = require('app');
    var pomelo = window.pomelo;
    var $panel;

    exports.init = function() {
      $panel = $('#bagPanel');

      initData();

      // close
      $panel.find('.u-close').on('click', function() {
        exports.hide();
        mainPanel.removeNavSelect();
      });
    };

    exports.show = function() {
      $panel.show();
    };

    exports.hide = function() {
      $panel.fadeOut(200);
    };

    var initData = function() {
      var $ul = $panel.find('.bb1 .packcnt ul');
      var bag = app.getCurPlayer().bag;
      var totalCount = bag.itemCount;
      var li = '';
      for (var i = 0; i < 36; i ++) {
        li += '<li '+ (i < totalCount ? '' : 'class="locked"') +'><span class="lock"></span></li>';
      }
      $ul.html(li);
      var items = bag.items;
      var j, item;
      for (j in items) {
        item = items[j];
        addItem(j, item);
      }
      _setCount();
    };

    var _setCount = function() {
      var bag = app.getCurPlayer().bag;
      $panel.find('.opt .vl').html((bag.itemCount - bag.usedCount) + ' / ' + bag.itemCount);
    };

    var _addItem = function($li, index, item) {
      var html;
      if (item.type === 'equipment') {
        item = dataApi.equipment.findById(item.id);
        html = '\
          <img src="'+ config.IMAGE_URL + 'equipment/item_' + item.imgId + '.png" width="50">\
          <div class="m-detllay">\
            <div class="wrap">\
              <h4 class="f-cb"><span class="f-fl s-fc11"> ' + item.englishName + '</span><span class="f-fr">' + item.kind + '</span></h4>\
              <p class="s-fc6">Level: <span> ' + (item.heroLevel || '1') + '</span></p>\
              <p>Color: <span> '+ item.color +'</span></p>\
              <p>Attack: <span class="s-fc9"> + '+ item.attackValue +'</span></p>\
              <p>Defence: <span class="s-fc5"> + '+ item.defenceValue +'</span></p>\
              <p>Price: <span> ' + item.price + ' </span></p>\
              <p class="s-fc6 opts"><a class="equip">Equip</a><a class="drop">Drop</a></p>\
            </div>\
          </div>';
        } else if (item.type === 'item') {
          item = dataApi.item.findById(item.id);
          html = '\
            <img src="' + config.IMAGE_URL +  'item/item_' + item.imgId + '.png" width="50">\
            <div class="m-detllay">\
              <div class="wrap">\
                <h4 class="f-cb"><span class="f-fl s-fc11"> ' + item.englishName + '</span><span class="f-fr">' + item.kind + '</span></h4>\
                <p class="s-fc6">Level: <span> ' + (item.heroLevel || '1') + '</span></p>\
                <p title="'+ item.englishDesc +'">Describe：<span> '+ item.englishDesc +'</span></p>\
                <p>HP Recover: <span class="s-fc9"> + '+ item.hp +'</span></p>\
                <p>MP Recover：<span class="s-fc5"> + '+ item.mp +'</span></p>\
                <p>Price：<span> ' + item.price + ' </span></p>\
                <p class="s-fc6 opts"><a class="use">Use</a><a class="drop">Drop</a></p>\
              </div>\
            </div>';
        }
      
        $li.html(html).data('index', index).find('p.s-fc6.opts a').on('click', function() {
          var $this = $(this);
          var $li = $this.parents('li');
          var index = $li.data('index');
          if ($this.hasClass('drop')) {
            pomelo.request('area.playerHandler.dropItem',{index: index }, function(data) {
              if (data.status) {
                app.getCurPlayer().dropItem(index);
              } else {
                console.log('drop fail');
              }
            });
          } else if ($this.hasClass('equip')) {
            var player = app.getCurPlayer();
            var itm = player.bag.items[index];
            var eq =  dataApi.equipment.findById(itm.id);
            if (player.level < eq.heroLevel) {
              window.alert("Hero's level is not enough!");
            } else {
              pomelo.request('area.equipHandler.equip', {index: index}, function(data) {
                //console.log(data);
                if (data.status) {
                  var curEqId = player.equipments.get(eq.kind);
                  player.equipments.equip(eq.kind, eq.id);
                  player.bag.removeItem(index);
                  player.bag.addItem({id: curEqId, type: 'equipment'}, data.bagIndex);
                } else {
                  console.log('equip fail!');
                }
              });
            }
          } else if ($this.hasClass('use')) {
            pomelo.request('area.playerHandler.useItem', {index: index }, function(data) {
              if (data.status) {
                var player = app.getCurPlayer();
                player.useItem(index);
              } else {
                console.log('useItem fail');
              }
            });
          }
        });
    };

    var addItem = function(index, item) {
      var $li1 = $panel.find('.bb1 .packcnt li');
      _addItem($li1.eq(index - 1), index, item);
      if (item.type === 'equipment') {
        var $li2 = $('#playerPanel .zj .weapon .wroom li.blank').eq(0).addClass('index' + index).removeClass('blank');
        _addItem($li2, index, item);
      }
    };

    var removeItem = function(index) {
      var $li = $panel.find('.bb1 .packcnt li');
      $li.eq(index - 1).html('');
      var $li2 = $('#playerPanel .zj .weapon .wroom li.index' + index);
      //$li2.eq(index - 1).html('');
      $li2.html('').removeClass('index' + index).addClass('blank');
    };

    exports.addItem = addItem;
    exports.removeItem = removeItem;
    exports.setCount = _setCount;
  }
};

