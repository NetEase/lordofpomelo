
__resources__["/__builtin__/canvaseventdecider.js"] = {meta: {mimetype: "application/javascript"}, data: function(exports, require, module, __filename, __dirname) {
var BObject = require("base").BObject
,   debug = require("debug")
,   platform = require("platform");

var shakeSpan = 5;

var calcRelativeMousePstn = function(evt)
{
  var el = evt.target;

  var osl = 0
  var ost = 0
  while (el) {
    osl += el.offsetLeft
    ost += el.offsetTop
    el = el.offsetParent
  }

  return {x:evt.pageX - osl, y:evt.pageY - ost};
}

var onmousedown = function(evt)
{
  var evtPstn = calcRelativeMousePstn(evt);

  this._mousePressed = true;
  this._mouseX = evtPstn.x;
  this._mouseY = evtPstn.y;

  //prev evt maybe:
  //dragging, moving, mouseover
  if (this.lastEvt.type == "mousedrag" ||
      this.lastEvt.type == "mousedown")
  {
    if (this.mouseReleased)
      this.mouseReleased({
        x:this.lastEvt.x,
        y:this.lastEvt.y,
        type:"mouseReleased"
      });
  }

  this.lastEvt = {
    x:evtPstn.x,
    y:evtPstn.y,
    type:"mousedown"
  };

  if (this.mousePressed)
  {
    this.mousePressed(this.lastEvt);
  }
}

var onmouseup = function(evt)
{
  var evtPstn = calcRelativeMousePstn(evt);

  this._mousePressed = false;
  this._mouseX = evtPstn.x;
  this._mouseY = evtPstn.y;

  //prev evt maybe:
  //mousedown, moving, draging. 
  //If mouse locate outside the canvas, there is no mouseup event.
  if (this.lastEvt.type == "mousedown")
  {
    if (this.mouseClicked)
      this.mouseClicked({
        x:this.lastEvt.x,
        y:this.lastEvt.y,
        type:"mouseClicked"
      });
  }

  this.lastEvt = {
    x:evtPstn.x,
    y:evtPstn.y,
    type:"mousedup"
  };

  if (this.mouseReleased)
  {
    this.mouseReleased(this.lastEvt);
  }
}

var onmouseover = function(evt)
{
  var evtPstn = calcRelativeMousePstn(evt);
  
  if (this.mouseOver)
    this.mouseOver({
      x:evtPstn.x,
      y:evtPstn.y,
      type:"mouseover",
    });
}

var onmouseout = function(evt)
{
  var evtPstn = calcRelativeMousePstn(evt);
  
  if (this.mouseOut)
    this.mouseOut({
      x:evtPstn.x,
      y:evtPstn.y,
      type:"mouseout",
    });
}

var onmousemove = function(evt)
{
  var evtPstn = calcRelativeMousePstn(evt);

  this._mouseX = evtPstn.x;
  this._mouseY = evtPstn.y;

  //prev evt maybe
  //mouseover mousemove mousedown drag
  if (this.lastEvt.type == "mousedown")
  {
    //test shake
    if (Math.pow(this.lastEvt.x - evtPstn.x, 2) + Math.pow(this.lastEvt.y - evtPstn.y, 2) > Math.pow(shakeSpan, 2))
    {
      this.lastEvt.type = "mousedrag";
    }
  }

  if (this.lastEvt.type == "mousedrag")
  {
    this.lastEvt.x = evtPstn.x;
    this.lastEvt.y = evtPstn.y;

    if (this.mouseDragged)
      this.mouseDragged(this.lastEvt);

    return;
  }
  
  if (this.mouseMoved)
  {
    this.mouseMoved({
      x:evtPstn.x,
      y:evtPstn.y,
      type:"mousemove"
    });
  }
}

var isMousePressed = function()
{
  return this._mousePressed;
}

var mousePstn = function()
{
  return {x:this._mouseX, y:this._mouseY};
}

var CanvasEventDecider = function(canvas)
{
  this._canvas = canvas;

  this._mousePressed = false;
  this.lastEvt = {x:-1, y:-1, type:""};

  
  if (platform.isMobile())
  {
    canvas.ontouchstart = this.onmousedown.bind(this);
    canvas.ontouchend = this.onmouseup.bind(this);
    canvas.ontouchmove = this.onmousemove.bind(this);
  }
  else
  {
    canvas.onmousedown = this.onmousedown.bind(this);
    canvas.onmouseup = this.onmouseup.bind(this);
    canvas.onmousemove = this.onmousemove.bind(this);

    canvas.onmouseover = this.onmouseover.bind(this);
    canvas.onmouseout = this.onmouseout.bind(this);

    var self = this;
    canvas.style.outline = "none";
    canvas.tabIndex = 0;

    canvas.onkeydown = function(evt)
    {
      if (self.keyPressed)
        self.keyPressed(evt);
    }

    canvas.onkeyup = function(evt)
    {
      if (self.keyReleased)
        self.keyReleased(evt);
    }
  }
}

CanvasEventDecider.prototype.onmousedown = onmousedown;
CanvasEventDecider.prototype.onmouseup = onmouseup;
CanvasEventDecider.prototype.onmouseover = onmouseover;
CanvasEventDecider.prototype.onmouseout = onmouseout;
CanvasEventDecider.prototype.onmousemove = onmousemove;
CanvasEventDecider.prototype.isMousePressed = isMousePressed;
CanvasEventDecider.prototype.mousePstn = mousePstn;

exports.CanvasEventDecider = CanvasEventDecider;

}};