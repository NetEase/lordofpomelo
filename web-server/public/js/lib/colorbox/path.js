
__resources__["/__builtin__/path.js"] = {meta: {mimetype: "application/javascript"}, data: function(exports, require, module, __filename, __dirname) {
/*
  copyed from coco2d-html v0.1.0 (http://cocos2d-javascript.org) under MIT license.
  changed by zhangping. 2012.06.06
*/

var path = {
  dirname: function(path) 
  {
    var tokens = path.split('/');
    tokens.pop();
    return tokens.join('/');
  },

  basename: function(path) 
  {
    var tokens = path.split('/');
    return tokens[tokens.length-1];
  },

  join: function () 
  {
    return module.exports.normalize(Array.prototype.join.call(arguments, "/"));
  },

  exists: function(path) 
  {
    return (__resources__[path] !== undefined);
  },

  normalizeArray: function (parts, keepBlanks) 
  {
    var directories = [], prev;
    for (var i = 0, l = parts.length - 1; i <= l; i++) 
    {
      var directory = parts[i];

      // if it's blank, but it's not the first thing, and not the last thing, skip it.
      if (directory === "" && i !== 0 && i !== l && !keepBlanks) continue;

      // if it's a dot, and there was some previous dir already, then skip it.
      if (directory === "." && prev !== undefined) continue;

      // if it starts with "", and is a . or .., then skip it.
      if (directories.length === 1 && directories[0] === "" && (
        directory === "." || directory === "..")) continue;

      if (
        directory === ".."
          && directories.length
          && prev !== ".."
          && prev !== "."
          && prev !== undefined
          && (prev !== "" || keepBlanks)
      ) 
      {
        directories.pop();
        prev = directories.slice(-1)[0]
      } else 
      {
        if (prev === ".") directories.pop();
        directories.push(directory);
        prev = directory;
      }
    }
    return directories;
  },

  normalize: function (path, keepBlanks) 
  {
    return module.exports.normalizeArray(path.split("/"), keepBlanks).join("/");
  }
};

module.exports = path;

}};