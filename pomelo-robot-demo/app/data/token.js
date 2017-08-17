var crypto = require('crypto');

/**
 * Create token by uid. Encrypt uid and timestamp to get a token.
 * 
 * @param  {String} uid user id
 * @param  {String|Number} timestamp
 * @param  {String} pwd encrypt password
 * @return {String}     token string
 */
module.exports.create = function(uid, timestamp, pwd) {
	var msg = uid + '|' + timestamp;
	var cipher = crypto.createCipher('aes256', pwd);
	var enc = cipher.update(msg, 'utf8', 'hex');
	enc += cipher.final('hex');
	return enc;
};
