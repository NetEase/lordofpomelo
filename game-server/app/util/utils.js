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