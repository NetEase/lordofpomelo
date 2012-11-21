
__resources__["/__builtin__/gui/slidebar.js"] = {meta: {mimetype: "application/javascript"}, data: function(exports, require, module, __filename, __dirname) {
var BObject = require("base").BObject
,   pipe = require('pipe')
,   geo = require("geometry")
,   Component = require("component").Component
,   MouseButtonEventComponent = require("component").MouseButtonEventComponent
,   TimeStamper = require('director').TimeStamper
,   debug = require("debug")
,   util = require("util")

var SlideBarComponent = Component.extend({
  init:function(param)
  {
    SlideBarComponent.superClass.init.call(this, param);
    
    debug.assert(param.level && param.scene, "parameter error in SlideBarComponent");
    
    this._bn = param.bn;

    this._isVertical = param.vertical;
    if (!param.barPosResolver)
    {
      //make sure bar and slide center to stack
      var view = require("director").director().defaultView()
      ,   slidebbox = view.bbox(param.host.model())
      ,   barbbox = view.bbox(param.bn.model())

      if (param.vertical)
      {
        var x = (slidebbox.width - barbbox.width)/2;
        param.bn.exec("applyTranslate", x, 0, 0);
      }
      else
      {
        var y = (slidebbox.height - barbbox.height)/2;
        param.bn.exec("applyTranslate", 0, y, 0);
      }
      
      this._barPosResolver = function (host)
      {
        var barNode = host.exec("getBar")
        if (!barNode)
          return;

        var curV = host.exec("value")
        ,   minV = host.exec("minValue")
        ,   maxV = host.exec("maxValue")
        ,   percent = (curV - minV) / (maxV - minV)
        ,   bbox = require("director").director().defaultView().bbox(host.model())
        ,   barbbox = require("director").director().defaultView().bbox(barNode.model())
        ,   vertical = host.exec("isVertical")
        ,   barOriPos = barNode.exec("getMatrixHdl").position
        ,   x = vertical ? barOriPos.x : (bbox.width - barbbox.width) * percent
        ,   y = vertical ? (bbox.height - barbbox.height) * percent : barOriPos.y;

        barNode.exec("translate", x, y);
      };
    }
    else
      this._barPosResolver = param.barPosResolver;

    this._minV = param.minV;
    this._maxV = param.maxV;
    this._onValueChanged = param.onValueChanged;
    this._curValue = this._minV;

    //init event
    var evtComponent = new MouseButtonEventComponent(
    {
      pipe:param.level.sysPipe(), 
      decider:param.scene.queryDecider('mouseButtonDecider'), 
      callback:util.callback(this, this.onMousePressedOrDragged),//this.onMousePressedOrDragged.bind(this),
    });
    param.host.addComponent("slideBarMouseEvent", evtComponent);

    //init pipe:
    this._timeStamper = new TimeStamper();
    this._pipe = pipe.createEventTrigger(this._timeStamper);
    this._port = pipe.createPort(this._pipe);
  },

  onMousePressedOrDragged:function(evt, host)
  {
    console.log("receive log:"+evt.type);

    pipe.triggerEvent(this._pipe, evt);
  },

  getBar:function(host)
  {
    return this._bn;
  },

  setBar:function(host, bn)
  {
    var oldbn = this._bn;
    this._bn = bn;
    return oldbn;
  },

  minValue:function(host)
  {
    return this._minV;
  },
  
  maxValue:function(host)
  {
    return this._maxV;
  },

  value:function(host)
  {
    return this._curValue;
  },

  setValue:function(host, v)
  {
    if (v < this._minV)
      v = this._minV;
    else if (v > this._maxV)
      v = this._maxV;

    this._curValue = v;

    this._barPosResolver(host);
    if (this._onValueChanged)
      this._onValueChanged(host);
  },

  isVertical:function(host)
  {
    return this._isVertical;
  },

  onValueChanged:function(host, f)
  {
    var old = this._onValueChanged;
    this._onValueChanged = f;
    return old;
  },
  
  update:function(host, t, dt)
  {
    var pMsg = this._port.query()
    , evt
    
    while(pMsg)
    {
      evt = pMsg.content;      
      pMsg = this._port.query();
    }

    this._timeStamper.stepForward();

    if (!evt)
      return;

    var matrix = geo.affineTransformInvert(host.exec('matrix'));
    var newpos = geo.pointApplyAffineTransform({x:evt.mouseX, y:evt.mouseY}, matrix);
    var view = require("director").director().defaultView();
    var bbox = view.bbox(host.model());
    var percent = this._isVertical ? newpos.y / bbox.height : newpos.x / bbox.width;
    
    if (percent > 1)
      percent = 1;
    else if (percent < 0)
      percent = 0;

    this._curValue = (this._maxV - this._minV) * percent + this._minV; 
    
    this._barPosResolver(host);
    if (this._onValueChanged)
      this._onValueChanged(host);
  },
  
  abilities:function()
  {
    return ["getBar", "setBar", "minValue", "maxValue", "value", "isVertical", "onValueChanged", "setValue"]; 
  },
});

/*
  sm: 滑块轴的model
  bm: 滑块的model
  isVertical: 是否是一个垂直的slidebar
  onValueChanged: 当slidebar的值变化的时候的回调函数
  minV: maxV: slidebar可以选择的值的范围
  initValue: slidebar的初始值
  barPosResolver: (slidebar -> void) 默认情况下，滑块与滑块轴 是轴对齐的，然后根据滑块轴的boudingbox来决定不同的值滑块的不同位置。 如果不想使用这种排版策略，可以设置该参数, 滑块的值变化的时候会调用到这里来。
*/
var createSlideBar = function(level, scene, sm, bm, isVertical, onValueChanged, minV, maxV, initValue, barPosResolver)
{
  var sn = scene.createNode({model:sm})
  ,   bn = scene.createNode({model:bm})
  
  scene.addNode(bn, sn);

  var sc = new SlideBarComponent(
    {
      level:level,
      scene:scene,
      host:sn,
      bn:bn,
      vertical:typeof(isVertical) == "boolean" ? isVertical : false,
      barPosResolver:barPosResolver,
      onValueChanged:onValueChanged,
      minV:typeof(minV) == "number" ? minV : 0,
      maxV:typeof(maxV) == "number" ? maxV : 100,
    });
  sn.addComponent("slideBarComponent", sc);

  if (typeof(initValue) == "number")
    sn.exec("setValue", initValue);

  return sn;
};

exports.SlideBarComponent = SlideBarComponent;
exports.createSlideBar = createSlideBar;

}};