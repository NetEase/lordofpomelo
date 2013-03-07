__resources__["/dataApi.js"] = {
  meta: {
    mimetype: "application/javascript"
  },

  data: function(exports, require, module, __filename, __dirname) {

    function Data(key) {
      this.key = key;
      this.data = null;
    }

    Data.prototype.set = function(data) {
      this.data = data;
      var self = this;
      setTimeout(function(){
        localStorage.setItem(self.key, JSON.stringify(data));
      }, 300);
    };

    Data.prototype.findById = function(id) {
      var data = this.all();
      return data[id];
    };

    Data.prototype.all = function() {
      if (!this.data) {
        this.data = JSON.parse(localStorage.getItem(this.key)) || {};
      }
      return this.data;
    };

    // animation data
    function AnimationData() {
      this.data = {};
    }

    AnimationData.prototype.set = function(data) {
      data || (data = {});
      this.data = data;
      setTimeout(function() {
        for (var k in data) {
          localStorage.setItem('ani_' + k, JSON.stringify(data[k]));
        }
      }, 600);
    };

    AnimationData.prototype.get = function(id) {
      var ani  = this.data[id];
      if (!ani) {
        ani =  JSON.parse(localStorage.getItem('ani_' + id)) || {};
      }
      return ani;
    };

    function Effect(data) {
      this.key = 'effect';
    }

    Effect.prototype.set = function(data) {
      localStorage.setItem(this.key, JSON.stringify(data));
    };

    Effect.prototype.all = function(id) {
      return JSON.parse(localStorage.getItem(this.key)) || {};
    };

    Effect.prototype.findById = function(id) {
      var data = this.all();
      var i, result;
      for (i in data) {
        if (data[i].id == id) {
          result = data[i];
          break;
        }
      }
      return result;
    };

    exports.getVersion = function() {
      return JSON.parse(localStorage.getItem('version')) || {};
    };

    exports.setVersion = function(version) {
      localStorage.setItem('version', JSON.stringify(version));
    };

    exports.fightskill = new Data('fightskill');
    exports.equipment = new Data( 'equipment');
    exports.item = new Data('item');
    exports.character = new Data('character');
    exports.npc = new Data('npc');
    exports.animation = new AnimationData();
    exports.effect = new Effect();

    exports.setData = function(data) {
      if (data) {
        var obj;
        for (var i in data) {
          obj = exports[i];
          if (obj && obj.set) {
            obj.set(data[i]);
          }
        }
      }
    };

  }
};
