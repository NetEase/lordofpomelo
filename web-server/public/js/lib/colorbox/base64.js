
__resources__["/__builtin__/base64.js"] = {meta: {mimetype: "application/javascript"}, data: function(exports, require, module, __filename, __dirname) {
/**
 * Thin wrapper around JXG's Base64 utils
 *copyed from coco2d-html v0.1.0 (http://cocos2d-javascript.org) under MIT license.
 *changed by zhangping. 2012.06.06
 */

var JXG = require('JXGUtil');

var base64 = {
    decode: function(input) {
        return JXG.Util.Base64.decode(input);
    },

    decodeAsArray: function(input, bytes) {
        bytes = bytes || 1;

        var dec = JXG.Util.Base64.decode(input),
            ar = [], i, j, len;

        for (i = 0, len = dec.length/bytes; i < len; i++){
            ar[i] = 0;
            for (j = bytes-1; j >= 0; --j){
                ar[i] += dec.charCodeAt((i *bytes) +j) << (j *8);
            }
        }
        return ar;
    },

    encode: function(input) {
        return JXG.Util.Base64.encode(input);
    }
};

module.exports = base64;

}};