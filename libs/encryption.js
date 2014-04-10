var crypto = require('crypto');

module.exports = function(password,salt,cb) {
	var iterations = 1000;
	var keylen = 24;
	
	var callback = function(err, key) {
		return cb(Buffer(key, 'binary').toString('hex'));
	};
	crypto.pbkdf2(password, salt, iterations, keylen, callback);	
};