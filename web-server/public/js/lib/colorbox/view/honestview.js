
__resources__["/__builtin__/view/honestview.js"] = {meta: {mimetype: "application/javascript"}, data: function(exports, require, module, __filename, __dirname) {
var debug = require("debug");
var BObject = require("base").BObject;
var ps = require("processing");
var assert = require("debug").assert;
var abs = Math.abs;
var pow = Math.pow;
var CanvasEventDecider = require("canvaseventdecider").CanvasEventDecider;

var hvBboxTbl = {
  model: function (m, vr)
  {
    var cache = m.get("cache");
    if (cache.bbox !== undefined)
    {
      return cache.bbox;
    }
    
    var res = {left:0, top:0, width:0, height:0};
    cahce.bbox = res;
    return res;
  },

  circle : function (m, vr)
  {
    var r = m.get("radius");
    return {left:0, top:0, width: 2*r, height: 2*r};
  },

  convex : function (m, vr)
  {
    var cache = m.get("cache");
    if (cache.bbox !== undefined)
    {
      return cache.bbox;
    }

    var left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
    var vs = m.get("vertexes");
    
    for (var i in vs)
    {
      var p = vs[i];
      left = (p.x < left) ? p.x : left;
      top = (p.y < top) ? p.y : top;
      right = (p.x > right) ? p.x : right;
      bottom = (p.y > bottom) ? p.y : bottom;
    }
    
    var res = {left: left, top:top, width: right - left + 1, height: bottom - top + 1};
    cache.bbox= res;
    return res;
  },

  text: function (m, vr)
  {
    var ctx = vr._ctx;
    var str = m.get("text");
    var h = m.get("height");
    var fontN = m.get("font");
    fontN = (fontN === undefined) ? "Arial" : fontN;

    var oldFont = ctx.font;

    ctx.font = "" + h + " " + fontN;

    var w = ctx.measureText(str).width;

    ctx.font = oldFont;

    return {left: 0, top:0, width:w, height:h};
  },

  image : function (m, vr)
  {
    return {
      left:0, top:0, width: m.width, height: m.height,
      nocache: !m.get("image").complete
    };
  },

  map: function (m, vr)
  {
    var mp = m.get("map");
    return {left:0, top:0, width: mp.widthPx, height:mp.heightPx};
  }
};


var hvInsideTbl = {
  model: function (m, x, y, vr)
  {
    return false;
  },

  circle : function (m, x, y, vr)
  {
    var r = m.get("radius");
    var d2 = pow(x -r , 2) + pow(y-r, 2);
    return d2 <= r * r;
  },

  convex : function (m, x, y, vr)
  {
    var vs = m.get("vertexes");
    var len = vs.length;
    var accum = 0;
    var diffSign = false;
    var onSide = false;
    for (var i = 0; i < len; ++i)
    {
      var p1 = vs[i];
      var p2 = vs[(i + 1) % len];
      var s = x - p1.x, t = y - p1.y;
      var u = x - p2.x, v = y - p2.y;
      var cross = s * v - t * u;
      var lastaccum = accum;
      if (cross > 0)
      {
        accum += 1;
      }
      else if(cross === 0)
      {
        // test whether just on the side segment
        if ((s * u <= 0))
        {
          onSide = true;
        }
      }
      else
      {
        accum -= 1;
      }

      if (abs(accum) < abs(lastaccum))
      {
        diffSign = true;
        break;
      }
    }

    if (diffSign)
    {
      return false;
    }

    if (accum === 0)
    {
      return onSide;
    }

    return true;
  },

  text: function (m, x, y, vr)
  {
    return true;
  },

  image : function (m, x, y, vr)
  {
    // todo: consider when alpha is 0
    //var i = m.get("image");

    return true;
  },

  map: function (m, x, y, vr)
  {
    return true;
  }
};

var cmpZ =  function (n1,n2)
{
  var m1 = n1.exec("matrix");
  var m2 = n2.exec("matrix");
  return m1.tz - m2.tz;
}

var beginDrawMode = function (m, ctx)
{
  var oldStyles = {fill:ctx.fillStyle, stroke:ctx.strokeStyle};

  var fillc = m.get("fill");

  debug.assert(typeof(fillc) == "string" || fillc == undefined, "color format changed to rgb(0, 0, 0)");
  
  if (fillc !== undefined)
  {
    ctx.fillStyle = fillc;
  }
  
  var sc = m.get("stroke");
  
  if (sc !== undefined)
  {
    ctx.strokeStyle = sc;
  }

  return oldStyles;
}

var endDrawMode = function (m, ctx, oldStyles)
{
  ctx.fillStyle = oldStyles.fill;
  ctx.strokeStyle = oldStyles.stroke;
}

var hvDraw = {
  model: function (m,vr)
  {
    
  },

  circle : function (m,vr, spad)
  {
    var ctx = spad || vr._ctx;
    var r = m.get("radius");
    var oldStyles = beginDrawMode(m, ctx);

    ctx.translate(r, r);

    ctx.beginPath();
    ctx.arc(0, 0, r, Math.PI*2, 0, true);
    ctx.closePath();

    if (m.get("fill") != undefined)
      ctx.fill();
    if (m.get("stroke") != undefined)
      ctx.stroke();

    endDrawMode(m, ctx, oldStyles);

    ctx.translate(-r, -r);
  },

  convex : function (m, vr, spad)
  {
    var ctx = spad || vr._ctx;
    var vs = m.get("vertexes");
    var oldStyles = beginDrawMode(m, ctx);
    ctx.beginPath();
    for (var i in vs)
    {
      var p = vs[i];
      ctx.lineTo(p.x, p.y);
    }
    ctx.closePath(oldStyles);

    if (m.get("fill") != undefined)
      ctx.fill();
    if (m.get("stroke") != undefined)
      ctx.stroke();

    endDrawMode(m, ctx, oldStyles);
  },

  text: function (m, vr, spad)
  {
    var ctx = spad || vr._ctx;
    var str = m.get("text");
    var oldStyles = beginDrawMode(m, ctx);
    var h = m.get("height");

    var oldFont = ctx.font;

    //FIXME:text 不能直接从0 0开始画，这样显示的是从baseline还是什么位置开始画的。同理boundingbox也需要调整。
    var fontN = m.get("font");
    fontN = (fontN === undefined) ? "Arial" : fontN;

    ctx.font = "" + h + " " + fontN;

    var oldTextBaseline = ctx.textBaseline;
    ctx.textBaseline = "top"
    ctx.fillText(str, 0, 0);

    ctx.textBaseline = oldTextBaseline;

    endDrawMode(m,ctx, oldStyles);
  },

  image : function (m, vr, spad)
  {
    var ctx = spad || vr._ctx;
    //var oldStyles = beginDrawMode(m, ctx);
    var i = m.get("image");
    if (i.loaded && i.naturalWidth != 0)
    {
      var w = m.get("width");
      var h = m.get("height");
      var alpha = m.get("alpha");
      var gAlpha = ctx.globalAlpha;

      if(alpha != gAlpha)
      {
        ctx.globalAlpha = alpha;
      }

      ctx.drawImage(i, 0, 0, w, h, 0, 0, w, h);
      ctx.globalAlpha = gAlpha;
    }
    else
    {
      if (vr.showUnloadedImage())
      {
        ctx.fillStyle = "white";

        ctx.fillRect(0, 0, m.width, m.height);

        var oldWidth = ctx.lineWidth;

        ctx.lineWidth = 5;
        ctx.fillStyle = "blue";
        ctx.strokeStyle = "blue";

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(m.width-1, m.height-1);

        ctx.moveTo(m.width-1, 0);
        ctx.lineTo(0, m.height-1);

        ctx.stroke();

        var oldFont = ctx.font;
        var oldTextBaseline = ctx.textBaseline;
        
        ctx.font = "32 Arial";
        ctx.textBaseline = "top";

        ctx.fillText("未加载\n的图片", 0, 0);
        ctx.font = oldFont;
        ctx.textBaseline = oldTextBaseline;
      }
    }

    //endDrawMode(m, ctx, oldStyles);
  },

  map: function (m, vr, spad)
  {
    var ctx = spad || vr._ctx;
    var map = m.get("map");
    var width = vr._canvas.width, height = vr._canvas.height;

    map.paint(ctx, 
              0, 0, width, height,
              0, 0, width, height);
  }
};

var HonestView = BObject.extend({
  init: function (param)
  {
    HonestView.superClass.init.call(this, param);
    this._canvas = param;
    this._ctx = this._canvas.getContext("2d");
    this._showUnloadedImage = true;
    this._cmpSprites = param.cmpSprites ? param.cmpSprites : cmpZ;
  },

  sketchpad: function()
  {
    return this._ctx;
  },

  canvas:function()
  {
    return this._canvas;
  },

  bbox: function (m)
  {
    var cache = m.get("cache");
    if (cache.bbox !== undefined)
    {
      return cache.bbox;
    }

    var f = hvBboxTbl[m.get("type")];
    assert(f, "no bounding box calculator for the `" + m.get("type") + "' type of model");
    var res = f(m, this);
    if (!res.nocache)
    {
      cache.bbox = res;
    }
    else
    {
      cache.bbox = undefined;
    }
    return res;
  },

  anchorPoint: function (m)
  {
    var cache = m.get("cache");
    if (cache.anchorPoint !== undefined)
    {
      return cache.anchorPoint;
    }

    var ap = m.get("anchorPoint");
    var res;
    if (!ap.ratio)
    {
      res = {x:ap.point.x, y:ap.point.y};
    }
    else
    {
      var bbox = this.bbox(m);
      var x = bbox.left + bbox.width * ap.point.x;
      var y = bbox.top  + bbox.height * ap.point.y;
      res = {x:x, y:y, nocache:bbox.nocache};
    }

    if (!res.nocache)
      cache.anchorPoint = res;
    else
      cache.anchorPoint = undefined;
    return res;
  },

  inside: function (m, p)
  {
    var ap = this.anchorPoint(m);
    var bbox = this.bbox(m);
    var x = p.x + ap.x, y = p.y + ap.y;
    if (bbox.left <= x && x < (bbox.left + bbox.width) 
        && bbox.top <= y && y < (bbox.top + bbox.height))
    {
      var f = hvInsideTbl[m.get("type")];
      assert(f, "no inside function for the `" + m.get("type") + "' of model");
      return f(m, x, y, this);
    }
    else
    {
      return false;
    }
  },

  showUnloadedImage: function(flag)
  {
		//debugger;
    if (flag === undefined)
    {
      return this._showUnloadedImage;
    }
    else
    {
      this._showUnloadedImage = flag;
      return flag;
    }
  },

  draw : function (m, spad)
  {
    var ctx = spad || this._ctx;
    var t = m.get("type");
    var f = hvDraw[t];      
    assert(f, "no draw function for type `" + t + "'");
    
    var ap = this.anchorPoint(m);
    
    ctx.save();
    ctx.translate(-ap.x, -ap.y);
    f(m, this, ctx);
    ctx.restore();
  },

  clear: function ()
  {
    var ctx = this._ctx;
    ctx.clearRect(0,0,this._canvas.width, this._canvas.height);
  },

  redraw : function (content)
  {
    var ctx = this._ctx;
    //pjs.externals.context.clearRect(0,0,pjs.width, pjs.height);
    content.sort(this._cmpSprites); //sortByZ(content);
    var it = content.iterator();

    content.forEach(function(c)
                    {
                      var node = c;
                      var m = node.model();
                      var t = m.get("type");

                      var f = hvDraw[t];      
                      var mat = node.exec('matrix');
                      
                      var ctx = this._ctx;
                      ctx.save();
                      ctx.transform(mat.a, mat.b, mat.c, mat.d, mat.tx, mat.ty);
                      

                      var ap = this.anchorPoint(m);
                      ctx.translate(-ap.x, -ap.y);

                      f(m, this);

                      ctx.restore();
                    },
                    this);
  },

  drawDispList : function (list)
  {
    var ctx = this._ctx;
    //pjs.externals.context.clearRect(0,0,pjs.width, pjs.height);
    for (var i = 0; i < list.length; ++i)
    {
      var mat = list[i][0];
      var m = list[i][1];
      var t = m.get("type");
      var f = hvDraw[t];
      
      ctx.save();
      assert(f, "no draw function for type `" + t + "'");
      ctx.transform(mat.a, mat.b, mat.c, mat.d, mat.tx, mat.ty);

      var ap = this.anchorPoint(m);
      ctx.translate(-ap.x, -ap.y);

      f(m, this);

      ctx.restore();
    }
  },

  eventDecider:function()
  {
    if (!this._evtDecider)
    {
      this._evtDecider = new CanvasEventDecider(this.canvas());
    }

    return this._evtDecider;
  },
});

HonestView.register = function (type, fs)
{
  assert(!hvDraw[type],type + " has already exist in draw functions table");
  assert(!hvBboxTbl[type],type + " has already exist in bbox functions table");
  assert(!hvInsideTbl[type],type + " has already exist in inside functions table");

  hvDraw[type] = fs.draw;
  hvBboxTbl[type] = fs.bbox;
  hvInsideTbl[type] = fs.inside;
  return fs;
}

hvDraw = hvDraw;
hvBboxTbl = hvBboxTbl;
hvInsideTbl = hvInsideTbl;

exports.HonestView = HonestView;

}};
