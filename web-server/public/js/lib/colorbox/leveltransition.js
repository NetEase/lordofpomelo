
__resources__["/__builtin__/leveltransition.js"] = {meta: {mimetype: "application/javascript"}, data: function(exports, require, module, __filename, __dirname) {
var director = require("director")
  , debug = require("debug")
  , Matrix = require("matrix").Matrix
  , BObject = require("base").BObject
  , animate = require("animate")
  , makeAnimationsByArray = require("animate").makeAnimationsByArray
  , SequenceAnimation = require("animate").SequenceAnimation;
  


function fade(val, target)
{
  target.set("alpha", val);
}


var FadeTo = SequenceAnimation.extend({
  init:function()
  {
    var transAnis = makeAnimationsByArray(fade, arguments);
    
    FadeTo.superClass.init.call(this, {animations:transAnis});
  },
});


var leaveLevelTransAnis =
  {
    "left2right": function(w, h)
    {
      var ma = new animate.MoveTo(
        [0, {x:0, y:0}, 'linear'],
        [1, {x:w, y:0}, 'linear']
      );
      
      return new animate.ParallelAnimation({
      animations:[ma]
      });
    },
    
    "right2left": function(w, h)
    {
      var ma = new animate.MoveTo(
        [0, {x:0, y:0}, 'linear'],
        [1, {x:-w, y:0}, 'linear']
      );
      
      return new animate.ParallelAnimation({
      animations:[ma]
      });
    },
    
    "top2bottom": function(w, h)
    {
      var ma = new animate.MoveTo(
        [0, {x:0, y:0}, 'linear'],
        [1, {x:0, y:h}, 'linear']
      );
      
      return new animate.ParallelAnimation({
        animations:[ma]
      });
    },
    
    "bottom2top": function(w, h)
    {
      var ma = new animate.MoveTo(
        [0, {x:0, y:0}, 'linear'],
        [1, {x:0, y:-h}, 'linear']
      );
      
      return new animate.ParallelAnimation({
        animations:[ma]
      });
    },
    
    "zoomOut": function(w, h)
    {
      var ma1 = new animate.MoveTo(
        [0, {x:0, y:0}, 'linear'],
        [1, {x:w, y:h}, 'linear']
      );
        
      var ma2 = new animate.ScaleTo(
        [0, {x:1, y:1}, 'sine'],
        [1, {x:0.1, y:0.1}, 'linear']
        );
      
      return new animate.ParallelAnimation({
        animations:[ma1, ma2]
      });
    },
    
    "zoomInRotate180": function( w, h)
    {
      var ma1 = new animate.MoveTo(
        [0, {x:0, y:0}, 'linear'],
        [1, {x:w, y:h}, 'linear']
      );
      
      var ma2 = new animate.ScaleTo(
        [0, {x:1, y:1}, 'sine'],
        [2/3, {x:0.3, y:0.3}, 'linear'],
        [1, {x:1, y:1}, 'linear']
        );

      var ma3 = new animate.RotateTo(
        [0, 0, 'linear'],
        [1, Math.PI*2, 'linear']
        );

      return new animate.ParallelAnimation({
        animations:[ma1, ma2, ma3]
      });
    },

    "fadeOut": function()
    {
      var ma = new FadeTo(
        [0, 1, 'linear'],
        [1, 0, 'linear']
      );
      
     return new animate.ParallelAnimation({
        animations:[ma]
        });
    },
  };
  
var enterLevelTransAnis = 
  {
    "left2right": function(w, h)
    {
      var ma = new animate.MoveTo(
        [0, {x:w, y:0}, 'linear'],
        [1, {x:0, y:0}, 'linear']
      );
      
      return new animate.ParallelAnimation({
        animations:[ma]
      });
    },
    
    "right2left": function(w, h)
    {
      var ma = new animate.MoveTo(
        [0, {x:-w, y:0}, 'linear'],
        [1, {x:0, y:0}, 'linear']
      );
      
      return new animate.ParallelAnimation({
        animations:[ma]
      });
    },
    
    "top2bottom": function(w, h)
    {
      var ma = new animate.MoveTo(
        [0, {x:0, y:-h}, 'linear'],
        [1, {x:0, y:0}, 'linear']
      );
      
      return new animate.ParallelAnimation({
        animations:[ma]
      });
    },
    
    "bottom2top": function(w, h)
    {
      var ma = new animate.MoveTo(
        [0, {x:0, y:h}, 'linear'],
        [1, {x:0, y:0}, 'linear']
      );
      
      return new animate.ParallelAnimation({
        animations:[ma]
      });
    },
    
    "zoomIn": function(w, h)
    {
      var ma1 = new animate.MoveTo(
        [0, {x:w, y:h}, 'linear'],
        [1, {x:0, y:0}, 'linear']
      );
      
      var ma2 = new animate.ScaleTo(
        [0, {x:0.1, y:0.1}, 'sine'],
        [1, {x:1, y:1}, 'linear']);

      return new animate.ParallelAnimation({
        animations:[ma1, ma2]
      });
    },
    
    "zoomInRotate360": function(w, h)
    {
      var ma1 = new animate.MoveTo(
        [0, {x:w, y:h}, 'linear'],
        [1, {x:0, y:0}, 'linear']
      );
      
      var ma2 = new animate.ScaleTo(
        [0, {x:0.1, y:0.1}, 'sine'],
        [0.5, {x:0.7, y:0.7}, 'sine'],
        [1, {x:1, y:1}, 'sine']);
     
     
      var ma3 = new animate.RotateTo(
        [0, 0, 'linear'],
        [1, Math.PI*2, 'linear']);

     
      return new animate.ParallelAnimation({
        animations:[ma1, ma2, ma3]
      });
    },

    "fadeIn": function()
    {
      var ma = new FadeTo(
        [0, 0, 'linear'],
        [1, 1, 'linear']
      );
      
      return new animate.ParallelAnimation({
        animations:[ma]
        });
    },
  };

function transGenerator(ani)
{
  ani.prepare();
  return function(imgModel, t)
  {
    var displayList = [];
    var mat = new Matrix({timeStamp:director.timeStamp});

    if(imgModel)
    {
      ani.doTick(0, t, mat);
      displayList.push([mat.matrix(), imgModel]);
    }
    
    return displayList;
  }
}

function leaveLevelTransGenerator(director, leaveTranStr)
{
  var transani = leaveLevelTransAnis[leaveTranStr](director.defaultViewWidth(), director.defaultViewHeight());
  
  return transGenerator(transani);
}

function enterLevelTransGenerator(director, enterTranStr)
{
  var transani = enterLevelTransAnis[enterTranStr](director.defaultViewWidth(), director.defaultViewHeight());
  
  return transGenerator(transani);
}

function levelFadeFun(ani)
{
  return function(imgModel, t)
  {
    var displayList = [];
    var mat = new Matrix({timeStamp:director.timeStamp});
  
    if(imgModel)
    {
      ani.doTick(0, t, imgModel);
      displayList.push([mat.matrix(), imgModel]);
    }
  
    return displayList;
  }

}

function leaveLevelFadeOutGenerator()
{
  var ani = leaveLevelTransAnis["fadeOut"]();
  ani.prepare();
  
  return levelFadeFun(ani);
}

function enterLevelFadeInGenerator()
{
  var ani = enterLevelTransAnis["fadeIn"]();
  ani.prepare();
  
  return levelFadeFun(ani);
}

var SetLevelTransitionBase = BObject.extend({
  init:function(param)
  {
    SetLevelTransitionBase.superClass.init.call(this);
  },
  
  trans:function()
  {
    debug.assert(false, "SetLevelTransitionBase-->trans can not exec");
  },
  
  isDone : function()
  {
    debug.assert(false, "SetLevelTransitionBase-->isDone can not exec");
  },
});

var SetLevelParallelTransition = SetLevelTransitionBase.extend({
  init:function(param)
  {
    SetLevelParallelTransition.superClass.init.call(this);
    
    this.leaveTime = param.leaveTime;
    this.enterTime = param.enterTime;
    this.leaveTrans = param.leaveTrans;
    this.enterTrans = param.enterTrans;
    this.elapsed = 0;
  },
  
  trans:function(leaveImgModel, enterImgModel, dt)
  {
  	var percent, displayList = [];
  	
  	this.elapsed += dt;
  	
  	percent = dt/this.leaveTime;
  	if(this.leaveTrans)
  	  displayList = this.leaveTrans(leaveImgModel, percent);
  	percent = dt/ this.enterTime;
  	if(this.enterTrans)
  	  displayList = displayList.concat(this.enterTrans(enterImgModel, percent));
  	
  	return displayList;  			
  },
  
  isDone : function()
  {
  	var totalTime = this.leaveTime > this.enterTime ? this.leaveTime : this.enterTime
  	return this.elapsed >= totalTime;
  },
});


var SetLevelSequenceTransition = SetLevelTransitionBase.extend({
  init:function(param)
  {
    SetLevelSequenceTransition.superClass.init.call(this);
    
    this.leaveTime = param.leaveTime;
    this.enterTime = param.enterTime;
    this.leaveTrans = param.leaveTrans;
    this.enterTrans = param.enterTrans;
    this.elapsed = 0;
  },
  
  trans:function(leaveImgModel, enterImgModel, dt)
  {
  	var percent, displayList = [];
  			
  	this.elapsed += dt;
  	
  	percent = dt/this.leaveTime;
  	if(this.elapsed <= this.leaveTime && this.leaveTrans)
  	  displayList = this.leaveTrans(leaveImgModel, percent);
  	else
  	{
  	  percent = dt/ this.enterTime;
  	  if((this.elapsed - this.leaveTime) <= this.enterTime && this.enterTrans)
  	    displayList = this.enterTrans(enterImgModel, percent);
  	}
  	
  	return displayList;    			
  },
  
  isDone : function()
  {
  	var totalTime = this.leaveTime + this.enterTime;
  	return this.elapsed >= totalTime;
  },
});


exports.leaveLevelTransGenerator = leaveLevelTransGenerator;
exports.enterLevelTransGenerator = enterLevelTransGenerator;
exports.leaveLevelFadeOutGenerator = leaveLevelFadeOutGenerator;
exports.enterLevelFadeInGenerator = enterLevelFadeInGenerator;
exports.SetLevelParallelTransition = SetLevelParallelTransition;
exports.SetLevelSequenceTransition = SetLevelSequenceTransition;
}};