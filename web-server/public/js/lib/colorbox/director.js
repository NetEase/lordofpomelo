
__resources__["/__builtin__/director.js"] = {meta: {mimetype: "application/javascript"}, data: function(exports, require, module, __filename, __dirname) {
var util = require("util")
  , debug = require("debug")
  , BObject = require("base").BObject
  , pipe = require('pipe')
  , globalClocker = require('clocker').globalClocker
  , helper = require("helper")
  , view = require("view")
  , model = require("model");

var TimeStamper = BObject.extend({
  init:function(param)
  {
    TimeStamper.superClass.init.call(this, param);
    
    param = param || {};
    
    if (param.startTime != undefined)
      this._startTime = param.startTime;
    else
      this._startTime = 0;  
    
    this._curTime = this._startTime;
    
    if (param.step != undefined)
      this._step = param.step;
    else
      this._step = 1;
  },
  
  stepForward:function(dt)
  {
    if (dt != undefined)
      this._curTime += dt;
    else
      this._curTime += this._step;
  },
  
  now:function()
  {
    return this._curTime;
  },
});
  
var timeStamp = new TimeStamper();

//event helper functions
function createMouseEvtHdl(d, type)
{
  return function(e)
  {
    var evt = {type:type};

    evt.mouseX = e.x;
    evt.mouseY = e.y;

    //console.log("event type:"+evt.type);
    //console.log(evt);

    d.triggerEvent(evt);
   };
}

function createKeyEvtHdl(d, type)
{
  return function(e)
  {
    var evt = {type:type};
  
    // evt.key = d._defaultView.sketchpad().key;
    // evt.keyCode = d._defaultView.sketchpad().keyCode;

    evt.key = e.key;
    evt.keyCode = e.keyCode;
    //donot permit event.id is copyable through util.copy in for..in.. expression
    //Object.defineProperty(evt, 'id', {value:d.eventIdGenerator++, writable:true, configurable:true, enumerable:false});
    //evt.id = d.eventIdGenerator ++;

    d.triggerEvent(evt);
  };
}

function redrawLevel2View(level, view)
{
  var displayList = [];
  view.clear();
  level.logic().getScene().filt(displayList, function(node){return !!node.model();});      
  view.redraw(displayList);
}
var prevEvt;


function transAndDraw(d, dt)
{
  var setLevelInfo = d._setLevelList[0];
  var preLevel = d._level, 
      nextLevel = setLevelInfo.nextLevel,
      transInfo = setLevelInfo.transInfo;

  if(transInfo.isDone())
  {
    d._level = nextLevel;
    if (d._level)
      d._level.active(d);
    
    d._preLevelView.sketchpad().canvas.loaded = false;
    d._preLevelModel = undefined;
    d._nextLevelView.sketchpad().canvas.loaded = false;
    d._nextLevelModel = undefined;
  
    d._setLevelList.splice(0, 1);
    if(d._setLevelList.length > 0)
    {
      d._preLevelModel = new model.ImageModel({image:d._preLevelView.sketchpad().canvas});;
      d._nextLevelModel = new model.ImageModel({image:d._nextLevelView.sketchpad().canvas});;
      setLevelInfo = d._setLevelList[0];
      preLevel = d._level;
      nextLevel = setLevelInfo.nextLevel;
      transInfo = setLevelInfo.transInfo;
    }
    else
    {
      return true;
    }
  }

  if(preLevel && d._preLevelView.sketchpad().canvas.loaded === false)
  {
    redrawLevel2View(preLevel, d._preLevelView);
    d._preLevelView.sketchpad().canvas.loaded = true;
    preLevel.deactive();
  }
  if(nextLevel && d._nextLevelView.sketchpad().canvas.loaded === false)
  {
    redrawLevel2View(nextLevel, d._nextLevelView);
    d._nextLevelView.sketchpad().canvas.loaded = true;
  }

  var displayList = transInfo.trans(d._preLevelModel, d._nextLevelModel, dt);

  d._defaultView.clear();
  d._defaultView.drawDispList(displayList);
  
  return false;
}
      

var Director = BObject.extend({
  eventIdGenerator:0,
  
  init:function(param)
  {
    if (Director.__instance__)
      return Director.__instance__;

    Director.superClass.init.call(this, param);
    
    this._timeStamper = new TimeStamper();
    this._sysPipe = pipe.createEventTrigger(this._timeStamper);
    
    debug.assert(param.view, 'param error');
    
    this._defaultView = param.view;
    this._displayList = [];

    this._now = 0;

    this.registerEvents();

    Director.__instance__ = this;
    
    var self = this;
    var clockf = function()
    {
      return self._now;
    };
    
    globalClocker(clockf);
  },

  registerEvents:function()
  {
    // //this._defaultView.canvas().mouseClicked = createMouseEvtHdl(this, 'mouseClicked');
    // this._defaultView.eventDecider().ondrag = createMouseEvtHdl(this, 'mouseDragged');
    // this._defaultView.eventDecider().onmousemove = createMouseEvtHdl(this, 'mouseMoved');
    // this._defaultView.eventDecider().onmouseout = createMouseEvtHdl(this, 'mouseOut');
    // this._defaultView.eventDecider().onmouseover = createMouseEvtHdl(this, 'mouseOver');
    // this._defaultView.eventDecider().onmousedown = createMouseEvtHdl(this, 'mousePressed');
    // this._defaultView.eventDecider().onmouseup = createMouseEvtHdl(this, 'mouseReleased');
    
    // this._defaultView.eventDecider().onkeydown = createKeyEvtHdl(this, 'keyPressed');
    // this._defaultView.eventDecider().onkeyup = createKeyEvtHdl(this, 'keyReleased');

    this._defaultView.eventDecider().mouseClicked = createMouseEvtHdl(this, 'mouseClicked');
    this._defaultView.eventDecider().mouseDragged = createMouseEvtHdl(this, 'mouseDragged');
    this._defaultView.eventDecider().mouseMoved = createMouseEvtHdl(this, 'mouseMoved');
    this._defaultView.eventDecider().mouseOut = createMouseEvtHdl(this, 'mouseOut');
    this._defaultView.eventDecider().mouseOver = createMouseEvtHdl(this, 'mouseOver');
    this._defaultView.eventDecider().mousePressed = createMouseEvtHdl(this, 'mousePressed');
    this._defaultView.eventDecider().mouseReleased = createMouseEvtHdl(this, 'mouseReleased');
    
    this._defaultView.eventDecider().keyPressed = createKeyEvtHdl(this, 'keyPressed');
    this._defaultView.eventDecider().keyReleased = createKeyEvtHdl(this, 'keyReleased');
  },
  
  triggerEvent:function(evt)
  {
    if (this._level)
    {
      this._level.switchPipeTriggerEvent(evt);
    }
  },
  
  draw:function()
  {
    if (this._level)
    {
      this._defaultView.clear();

      this._displayList.length = 0;
      this._level.logic().getScene().filt(this._displayList, function(node){return !!node.model();});      
      this._defaultView.redraw(this._displayList);
    }
  },

  step:function(t, dt)
  {
    this._timeStamper.stepForward(dt);
    this._now += 1;

    //allways check mouseover, mouseout.
    if (!this._defaultView.sketchpad().__mousePressed)
    {
      //createMouseEvtHdl(this, 'mouseMoved')();
    }

    if(this._setLevelList && this._setLevelList.length > 0)
    {
      if(transAndDraw(this, dt) == false)
        return;
    }

    if (this._level)
    {
      this._level.step(this._timeStamper.now(), dt);
    }
  },
  
  setLevel:function(level, transInfo)
  {
    if(!transInfo)
    {
       if (this._level === level)
        return;

      if (this._level)
      {
        this._level.deactive();
      }
      this._level = level;
      if (this._level)
        this._level.active(this);
    }
    else
    {
      if(!this._setLevelList)
        this._setLevelList = [];
      this._setLevelList.push({nextLevel:level, transInfo:transInfo});

      if(!this._preLevelView)
      {
        var sketchpad = helper.createHiddenSketchpad(this._defaultView.sketchpad().canvas.width, this._defaultView.sketchpad().canvas.height);

        this._preLevelView = new view.HonestView(sketchpad);
      }
      if(this._preLevelModel == undefined)
        this._preLevelModel = new model.ImageModel({image:this._preLevelView.sketchpad().canvas});
        
      if(this._preLevelView)
        this._preLevelView.sketchpad().canvas.loaded = false;

      if(!this._nextLevelView)
      {
        var sketchpad = helper.createHiddenSketchpad(this._defaultView.sketchpad().canvas.width, this._defaultView.sketchpad().canvas.height);

        this._nextLevelView = new view.HonestView(sketchpad);
      }
      if(this._nextLevelModel == undefined)
        this._nextLevelModel = new model.ImageModel({image:this._nextLevelView.sketchpad().canvas});
      
      if(this._nextLevelView)
        this._nextLevelView.sketchpad().canvas.loaded = false;
    }
  },
  
  getLevel:function()
  {
    return this._level;
  },
  
  sysPipe:function()
  {
    return this._sysPipe;
  },

  defaultView:function()
  {
    return this._defaultView;
  },
  
  defaultViewWidth:function()
  {
    return this._defaultView.sketchpad().canvas.width;
  },
  
  defaultViewHeight:function()
  {
    return this._defaultView.sketchpad().canvas.height;
  },
  
  getCurrentLevelImgModel:function()
  {
    var sketchpad = helper.createHiddenSketchpad(this._defaultView.sketchpad().canvas.width, this._defaultView.sketchpad().canvas.height);
    var newview = new view.HonestView(sketchpad);
    
    redrawLevel2View(this._level, newview);
    
    return new model.ImageModel({image:sketchpad});
  },
});

function director(param)
{ 
  if (!Director.__instance__)
  {
    Director.__instance__ = new Director(param);
  }

  return Director.__instance__;
}



exports.Director = Director;
exports.director = director;
exports.timeStamp = timeStamp;
exports.TimeStamper = TimeStamper;

}};
