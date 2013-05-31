var utils = module.exports;

/**
 * Check and invoke callback function
 */
utils.invokeCallback = function(cb) {
	if(!!cb && typeof cb === 'function') {
		cb.apply(null, Array.prototype.slice.call(arguments, 1));
	}
};

/**
 * clone an object
 */
utils.clone = function(origin) {
	if(!origin) {
		return;
	}

	var obj = {};
	for(var f in origin) {
		if(origin.hasOwnProperty(f)) {
			obj[f] = origin[f];
		}
	}
	return obj;
};

utils.size = function(obj) {
	if(!obj) {
		return 0;
	}

	var size = 0;
	for(var f in obj) {
		if(obj.hasOwnProperty(f)) {
			size++;
		}
	}

	return size;
};

// print the file name and the line number
{
	Object.defineProperty(global, '__STACK__', {
		get: function(){
			var orig = Error.prepareStackTrace;
			Error.prepareStackTrace = function(_, stack){ return stack; };
			var err = new Error;
			Error.captureStackTrace(err, arguments.callee);
			var stack = err.stack;
			Error.prepareStackTrace = orig;
			return stack;
		}
	});

	Object.defineProperty(global, '__FILE__', {
			get: function() {
					return __STACK__[2].getFileName();
			}
	});

	Object.defineProperty(global, '__LINE__', {
		get: function(){
			return __STACK__[2].getLineNumber();
		}
	});
}

utils.myPrint = function() {
  var len = arguments.length;
	if(len <= 0) {
		return;
	}
	var aimStr = '\'' + __FILE__ + '\' @' + __LINE__ + ' :\n';
	for(var i = 0; i < len; ++i) {
		aimStr += arguments[i];
	}
	console.log('\n' + aimStr);
};

