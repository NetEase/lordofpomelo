
__resources__["/__builtin__/geometry.js"] = {meta: {mimetype: "application/javascript"}, data: function(exports, require, module, __filename, __dirname) {
/*
  copyed from coco2d-html v0.1.0 (http://cocos2d-javascript.org) under MIT license.
  changed by zhangping. 2012.06.06
*/

/*globals module exports resource require BObject BArray*/
/*jslint undef: true, strict: true, white: true, newcap: true, browser: true, indent: 4 */
"use strict";

var util = require('util');

var RE_PAIR = /\{\s*([\d.\-]+)\s*,\s*([\d.\-]+)\s*\}/,
RE_DOUBLE_PAIR = /\{\s*(\{[\s\d,.\-]+\})\s*,\s*(\{[\s\d,.\-]+\})\s*\}/;

var geometry = 
  {
    Point: function (x, y) 
    {
      this.x = x;

      this.y = y;
    },

    Size: function (w, h) 
    {
      this.width = w;
      this.height = h;
    },

    Rect: function (x, y, w, h) 
    {
      this.origin = new geometry.Point(x, y);
      this.size   = new geometry.Size(w, h);
    },

    TransformMatrix: function (a, b, c, d, tx, ty, tz) 
    {
      this.a = a;
      this.b = b;
      this.c = c;
      this.d = d;
      this.tx = tx;
      this.ty = ty;
      this.tz = tz;
    },

    ccp: function (x, y) 
    {
      return module.exports.pointMake(x, y);
    },

    ccpAdd: function (p1, p2) 
    {
      return geometry.ccp(p1.x + p2.x, p1.y + p2.y);
    },

    ccpSub: function (p1, p2) 
    {
      return geometry.ccp(p1.x - p2.x, p1.y - p2.y);
    },

    ccpMult: function (p1, p2) 
    {
      return geometry.ccp(p1.x * p2.x, p1.y * p2.y);
    },


    ccpNeg: function (p) 
    {
      return geometry.ccp(-p.x, -p.y);
    },

    ccpRound: function (p) 
    {
      return geometry.ccp(Math.round(p.x), Math.round(p.y));
    },

    ccpCeil: function (p) 
    {
      return geometry.ccp(Math.ceil(p.x), Math.ceil(p.y));
    },

    ccpFloor: function (p) 
    {
      return geometry.ccp(Math.floor(p.x), Math.floor(p.y));
    },

    PointZero: function () 
    {
      return geometry.ccp(0, 0);
    },

    rectMake: function (x, y, w, h) 
    {
      return new geometry.Rect(x, y, w, h);
    },

    rectFromString: function (str) 
    {
      var matches = str.match(RE_DOUBLE_PAIR),
      p = geometry.pointFromString(matches[1]),
      s = geometry.sizeFromString(matches[2]);

      return geometry.rectMake(p.x, p.y, s.width, s.height);
    },

    sizeMake: function (w, h) 
    {
      return new geometry.Size(w, h);
    },

    sizeFromString: function (str) 
    {
      var matches = str.match(RE_PAIR),
      w = parseFloat(matches[1]),
      h = parseFloat(matches[2]);

      return geometry.sizeMake(w, h);
    },

    pointMake: function (x, y) 
    {
      return new geometry.Point(x, y);
    },

    pointFromString: function (str) 
    {
      var matches = str.match(RE_PAIR),
      x = parseFloat(matches[1]),
      y = parseFloat(matches[2]);

      return geometry.pointMake(x, y);
    },

    rectContainsPoint: function (r, p) 
    {
      return ((p.x >= r.origin.x && p.x <= r.origin.x + r.size.width) &&
              (p.y >= r.origin.y && p.y <= r.origin.y + r.size.height));
    },

    rectUnion: function (r1, r2) 
    {
      var rect = new geometry.Rect(0, 0, 0, 0);

      rect.origin.x = Math.min(r1.origin.x, r2.origin.x);
      rect.origin.y = Math.min(r1.origin.y, r2.origin.y);
      rect.size.width = Math.max(r1.origin.x + r1.size.width, r2.origin.x + r2.size.width) - rect.origin.x;
      rect.size.height = Math.max(r1.origin.y + r1.size.height, r2.origin.y + r2.size.height) - rect.origin.y;

      return rect;
    },

    rectOverlapsRect: function (r1, r2) 
    {
      if (r1.origin.x + r1.size.width < r2.origin.x) 
      {
        return false;
      }
      if (r2.origin.x + r2.size.width < r1.origin.x) 
      {
        return false;
      }
      if (r1.origin.y + r1.size.height < r2.origin.y) 
      {
        return false;
      }
      if (r2.origin.y + r2.size.height < r1.origin.y) 
      {
        return false;
      }

      return true;
    },

    rectIntersection: function (lhsRect, rhsRect) 
    {

      var intersection = new geometry.Rect(
        Math.max(geometry.rectGetMinX(lhsRect), geometry.rectGetMinX(rhsRect)),
        Math.max(geometry.rectGetMinY(lhsRect), geometry.rectGetMinY(rhsRect)),
        0,
        0
      );

      intersection.size.width = Math.min(geometry.rectGetMaxX(lhsRect), geometry.rectGetMaxX(rhsRect)) - geometry.rectGetMinX(intersection);
      intersection.size.height = Math.min(geometry.rectGetMaxY(lhsRect), geometry.rectGetMaxY(rhsRect)) - geometry.rectGetMinY(intersection);

      return intersection;
    },

    pointEqualToPoint: function (point1, point2) 
    {
      return (point1.x == point2.x && point1.y == point2.y);
    },

    sizeEqualToSize: function (size1, size2) 
    {
      return (size1.width == size2.width && size1.height == size2.height);
    },

    rectEqualToRect: function (rect1, rect2) 
    {
      return (module.exports.sizeEqualToSize(rect1.size, rect2.size) && module.exports.pointEqualToPoint(rect1.origin, rect2.origin));
    },

    rectGetMinX: function (rect) 
    {
      return rect.origin.x;
    },

    rectGetMinY: function (rect) 
    {
      return rect.origin.y;
    },

    rectGetMaxX: function (rect) 
    {
      return rect.origin.x + rect.size.width;
    },

    rectGetMaxY: function (rect) 
    {
      return rect.origin.y + rect.size.height;
    },

    boundingRectMake: function (p1, p2, p3, p4) 
    {
      var minX = Math.min(p1.x, p2.x, p3.x, p4.x);
      var minY = Math.min(p1.y, p2.y, p3.y, p4.y);
      var maxX = Math.max(p1.x, p2.x, p3.x, p4.x);
      var maxY = Math.max(p1.y, p2.y, p3.y, p4.y);

      return new geometry.Rect(minX, minY, (maxX - minX), (maxY - minY));
    },

    pointApplyAffineTransform: function (point, t) 
    {

      /*
        aPoint.x * aTransform.a + aPoint.y * aTransform.c + aTransform.tx,
        aPoint.x * aTransform.b + aPoint.y * aTransform.d + aTransform.ty
      */

      return new geometry.Point(t.a * point.x + t.c * point.y + t.tx, t.b * point.x + t.d * point.y + t.ty);

    },

    rectApplyAffineTransform: function (rect, trans) 
    {

      var p1 = geometry.ccp(geometry.rectGetMinX(rect), geometry.rectGetMinY(rect));
      var p2 = geometry.ccp(geometry.rectGetMaxX(rect), geometry.rectGetMinY(rect));
      var p3 = geometry.ccp(geometry.rectGetMinX(rect), geometry.rectGetMaxY(rect));
      var p4 = geometry.ccp(geometry.rectGetMaxX(rect), geometry.rectGetMaxY(rect));

      p1 = geometry.pointApplyAffineTransform(p1, trans);
      p2 = geometry.pointApplyAffineTransform(p2, trans);
      p3 = geometry.pointApplyAffineTransform(p3, trans);
      p4 = geometry.pointApplyAffineTransform(p4, trans);

      return geometry.boundingRectMake(p1, p2, p3, p4);
    },
    
    affineTransformInvert: function (trans) 
    {
      var determinant = 1 / (trans.a * trans.d - trans.b * trans.c);

      return new geometry.TransformMatrix(
        determinant * trans.d,
          -determinant * trans.b,
          -determinant * trans.c,
        determinant * trans.a,
        determinant * (trans.c * trans.ty - trans.d * trans.tx),
        determinant * (trans.b * trans.tx - trans.a * trans.ty),
        /*now do not support z invert, just record z*/
        trans.tz
      );
    },
     
    affineTransformConcat: function (lhs, rhs) 
    {
      return new geometry.TransformMatrix(
        lhs.a * rhs.a + lhs.b * rhs.c,
        lhs.a * rhs.b + lhs.b * rhs.d,
        lhs.c * rhs.a + lhs.d * rhs.c,
        lhs.c * rhs.b + lhs.d * rhs.d,
        lhs.tx * rhs.a + lhs.ty * rhs.c + rhs.tx,
        lhs.tx * rhs.b + lhs.ty * rhs.d + rhs.ty
      );
    },
    
    degreesToRadians: function (angle) 
    {
      return angle / 180.0 * Math.PI;
    },

    radiansToDegrees: function (angle) 
    {
      return angle * (180.0 / Math.PI);
    },

    affineTransformTranslate: function (trans, tx, ty, tz) 
    {
      if (tz != undefined && trans.tz == undefined)
      {
        trans.tz = 0;
      }
      
      /*
      var newTrans = util.copy(trans);
      newTrans.tx = trans.tx + trans.a * tx + trans.c * ty;
      newTrans.ty = trans.ty + trans.b * tx + trans.d * ty;
      
      if (tz != undefined)
      {
        newTrans.tz = trans.tz + tz;
      }
    
      return newTrans;
      */

      trans.tx = trans.tx + trans.a * tx + trans.c * ty;
      trans.ty = trans.ty + trans.b * tx + trans.d * ty;
      if (tz != undefined)
        trans.tz = trans.tz + tz;

      return trans;
    },

    affineTransformRotate: function (trans, angle) 
    {
      var sin = Math.sin(angle),
      cos = Math.cos(angle);

      var a, b, c, d;
      a = trans.a * cos + trans.c * sin;
      b = trans.b * cos + trans.d * sin;
      c = trans.c * cos - trans.a * sin;
      d = trans.d * cos - trans.b * sin;

      /*
      return new geometry.TransformMatrix(
        
        trans.a * cos + trans.c * sin,
        trans.b * cos + trans.d * sin,
        trans.c * cos - trans.a * sin,
        trans.d * cos - trans.b * sin,
        
        
          // trans.a * cos - trans.c * sin,
          // trans.b * cos - trans.d * sin, 
          // trans.c * cos + trans.a * sin,
          // trans.d * cos + trans.b * sin,
        
        trans.tx,
        trans.ty,
        trans.tz
      );
      */
      trans.a = a;
      trans.b = b;
      trans.c = c;
      trans.d = d;

      return trans;
    },

    affineTransformScale: function (trans, sx, sy) 
    {
      if (sy === undefined) 
      {
        sy = sx;
      }

      //return new geometry.TransformMatrix(trans.a * sx, trans.b * sx, trans.c * sy, trans.d * sy, trans.tx, trans.ty, trans.tz);
      trans.a *= sx;
      trans.b *= sx;
      trans.c *= sy;
      trans.d *= sy;

      return trans;
    },

    affineTransformIdentity: function () 
    {
      return new geometry.TransformMatrix(1, 0, 0, 1, 0, 0);
    },
    
    //add by ZP.
    
    signed2DTriArea : function (a, b, c)
    {
      //return (b.x - a.x)*(c.y - b.y) - (c.x-b.x)*(b.y-a.y);
      return (a.x - c.x)*(b.y-c.y) - (a.y-c.y)*(b.x-c.x);
    },
    
    blineSegsCross :function (a, b, c, d)
    {
      var S1 = geometry.signed2DTriArea(a, b, d);
      var S2 = geometry.signed2DTriArea(a, b, c);
      
      if (S1 == 0)
      { //c a b collineation
        if (Math.abs(c.x - a.x) <= Math.abs(b.x - a.x))
          return true;
      }
      else if (S2 == 0)
      {//d a b collineation
        if (Math.abs(d.x - a.x) <= Math.abs(b.x - a.x))
          return true;
      }
      else if (S1 * S2 < 0)
      {
        var S3 = geometry.signed2DTriArea(c, d, a);
        var S4 = geometry.signed2DTriArea(c, d, b);
        S4 = S3+S2-S1;
        
        if (S3 * S4 < 0)
        {
          //var t = S3 / (S3 - S4);
          //P = a + t*(b-a);
          return true;
        }
      }
      return false;
    },
    
    blineSegsCrossRect : function (r, a, b)
    {
      if (geometry.blineSegsCross(a, b, r.origin, geometry.ccp(r.origin.x+r.size.width, r.origin.y)) ||
          geometry.blineSegsCross(a, b, r.origin, geometry.ccp(r.origin.x, r.origin.y+r.size.height)) ||
          geometry.blineSegsCross(a, b, geometry.ccp(r.origin.x, r.origin.y+r.size.height), geometry.ccp(r.origin.x+r.size.width, r.origin.y+r.size.height)) ||
          geometry.blineSegsCross(a, b, geometry.ccp(r.origin.x+r.size.width, r.origin.y), geometry.ccp(r.origin.x+r.size.width, r.origin.y+r.size.height))||
          geometry.rectContainsPoint(r, a) || 
          geometry.rectContainsPoint(r, b))
      {
        return true;
      }
    },
  };

module.exports = geometry;

}};