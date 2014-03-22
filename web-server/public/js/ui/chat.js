__resources__["/chat.js"] = {meta: {mimetype: "application/javascript"}, data: function(exports, require, module, __filename, __dirname) {

  var pomelo = window.pomelo;
  var isInit = false;
  var msgArray = [];
  var msgBox = null;
  var SCOPE = {PRI:'279106',AREA:'F7A900',ALL:'D41313',TEAM:'0897f7'};
  var typeTarget = null;
  var defaultScope = SCOPE.AREA;
  var ALL = 'all';
  var SYSTEM = 'system';
  var PRIV = 'priv';
  var AREA = 'area';
  var TEAM = 'team';

  var Chat = function(opts) {
  };

  var pro = Chat.prototype;

  pro.init = function() {
    if (isInit) {
      return;
    }
    var self = this;
    msgBox = $('.m-chat .body');
    $('.m-chat').height('0px');
    typeTarget = $('.m-chat .type');
    typeTarget.height('75px').hide();
    $('.m-chat .s-fc7').hide();
    $('.m-chat .u-face').addClass('disabled');
    $('.m-chat .u-area').click(function() {
      typeTarget.show();
    });
    var msgText = $('.m-chat .form .u-txt');
    msgText.attr('maxLength',100);
    msgText.keydown(function(event) {
      if (event.which===13) {
        self.send();
      }
    });
    $('.m-chat .arr').click(function() {
      $('.m-chat .chat').hide();
      $('.u-arr').removeClass('disabled');
    });
    $('.m-chat .u-arr').click(function() {
      $('.m-chat .chat').show();
    });
    $('.m-chat .u-back').click(function() {
      self.send();
    });
    $('.m-chat .arr').click();
    $('.m-chat .s-fc5').attr('scope',SCOPE.PRI).click(function(event) {
      self.scopeClick(event);
      $('.m-chat .u-txt2').width('34px').show();
      $('.u-txt').width('160px');
    });
    $('.m-chat .s-fc6').attr('scope',SCOPE.ALL).click(function(event) {
      self.scopeClick(event);
      $('.u-txt2').hide();
      $('.u-txt').width('200px');
    });
    $('.m-chat .s-fc8').attr('scope',SCOPE.AREA).click(function(event) {
      self.scopeClick(event);
      $('.u-txt2').hide();
      $('.u-txt').width('200px');
    });
    $('.m-chat .s-fc9').attr('scope',SCOPE.TEAM).click(function(event) {
      self.scopeClick(event);
      $('.u-txt2').hide();
      $('.u-txt').width('200px');
    });
    $(function() {
      $('.m-chat .itm').click(function() {
        $('.m-chat .itm').removeClass('selected');
        $(this).addClass('selected');
        self.filter($(this).text());
      });
    });

    pomelo.on('onChat', function(msg) {
      if (msgArray.length>100) {
        msgArray = [];
        msgBox.html('');
      }
      pro.append(msg);
    });

    isInit = true;
  };

  pro.append = function(msg){
    msgArray.push(msg);
    var text = msgBox.html() + this.render(msg);
    msgBox.html(text);
    $('.m-chat .chat').show();
    $('.u-arr').addClass('disabled');
    this.nickClick();
  }

  pro.response = function(data,msg) {
    $('.m-chat .u-txt').val('');
    if (data.code !== 200) {
      if (data.code === 3004) {
        alert(' user is offline ');
      } else {
        // may be something wrong in channel push
      }
      return;
    } else {
      if (msg.scope===SCOPE.PRI)
        this.append(msg);
    }
  };


  pro.nickClick = function() {
    msgBox.scrollTop(msgBox[0].scrollHeight);
    $(function() {
      $('.m-chat .nick').click(function() {
        if ($(this).text()===SYSTEM) {return;}
        $('.m-chat .s-fc5').click();
        $('.m-chat .u-txt2').val($(this).text());
        $('.m-chat .u-area').html('priv');
      });
    });
  };

  pro.scopeClick = function(event) {
    typeTarget.hide();
    $('.u-area').html($(event.target).text());
    defaultScope = $(event.target).attr("scope");
  };

  pro.filter = function(type) {
    var i,self = this;
    msgBox.html('');
    var tmpArray = [];
    if (type === ALL) {
      tmpArray = msgArray;
    } else if (type === SYSTEM) {
      for (i in msgArray) {
        if (msgArray[i].kind === 1) {
          tmpArray.push(msgArray[i]);
        }
      }
    } else {
      for (i in msgArray) {
        if (msgArray[i].kind === 0) {
          tmpArray.push(msgArray[i]);
        }
      }
    }
    var text = '';
    for (var id in tmpArray) {
      var msg = tmpArray[id];
      text = msgBox.html() + self.render(msg);
      msgBox.html(text);
    }
    this.nickClick();
  };

  pro.render = function(msg) {
    if (msg.scope !== SCOPE.PRI) {
      if (msg.from === pomelo.player.name) {
        return  '<font color=#'+ msg.scope +'>you:' + msg.content + '</font><br/>';
      } else {
        return  '<font color=#'+ msg.scope +'><span class="nick">'+ msg.from + '</span>:' + msg.content + '</font><br/>';
      }
    } else {
      if (msg.from === pomelo.player.name) {
        return '<font color=#'+ msg.scope +'>  you say to '+ msg.toName + ':' + msg.content + '</font><br/>';
      } else {
        return '<font color=#'+ msg.scope +'><span class="nick">'+ msg.from + '</span> says to you:' + msg.content + '</font><br/>';
      }
    }
  };

  pro.send = function() {
    var content,msg,route,toName;
    content = $('.u-txt').val();
    var self = this;
    if (!content) {return;}
    route = "chat.chatHandler.send";
    if (defaultScope === SCOPE.PRI && !$('.m-chat .u-txt2').val()) {
      alert('please input chat name');
      return;
    }
    toName = $('.m-chat .u-txt2').val() || '';
    if (defaultScope === SCOPE.PRI && toName === pomelo.player.name) {
      alert('are you crazy');
      return ;
    }
    msg = {from: pomelo.player.name, scope: defaultScope, content: content,
      areaId: pomelo.areaId, toName: toName, teamId: pomelo.teamId};
    pomelo.request(route, msg, function(data) {
      self.response(data,msg);
    });
  };

  module.exports = new Chat();
}};
