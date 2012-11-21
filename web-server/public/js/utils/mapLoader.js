__resources__["/mapLoader.js"] = {
  meta: {
    mimetype: "application/javascript"
  },

  data: function(exports, require, module, __filename, __dirname) {

    /**
     * @param {Array}
    **/
    exports.mapLoader = function(maps) {
      if (!Array.isArray(maps)) {
        return;
      }

      var result = [];
      for (var i = 0, l = maps.length; i < l; i++) {
        result.push(imgLoader(maps[i]));
      }

      return result;
    };

    var imgLoader = function(src) {
      var img = new Image();
      img.loaded = false;
      img.onload = function() {
        img.loaded = true;
      };
      img.src = src;
      return img;
    };
  }
};
