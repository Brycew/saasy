var mongoose = require('mongoose');
var moment   = require('moment');
var config = require('./../../config/defaults.js');

var Schema = mongoose.Schema;
var ObjectId = mongoose.Types.ObjectId;

var util = require('util');

var tableSchema = new mongoose.Schema({
	session_status       : { type: String, default: 'ACTIVE'},
	session_type         : String,
	session_loginToken   : String,
	session_loginID      : Schema.ObjectId,
	session_ip           : String,
    
    session_accessGroups : Array,
    
    timestamp_created   : { type: Date, default: Date.now },
    timestamp_lastuse   : { type: Date, default: Date.now },
    timestamp_expires   : { type: Date, default: Date.now }
});

tableSchema.statics.listActive = function(cb) {
	this.find({ 'session_status': 'ACTIVE' }, function (err, resp) {
    	if(err) {
    		appLog.logError(err);
	    	return cb(false);
    	} else {
	    	return cb(resp);
    	}
    }); 
};

tableSchema.statics.insertSessionHTTP = function(loginID,loginToken,clientIP,AccessGroups,cb) {
	var expires = moment().utc().add(config.authorize.timeout,'minutes').format();

	var session = new this({session_type         : 'http', 
							session_loginToken   : loginToken,
							session_loginID      : loginID,
							session_accessGroups : AccessGroups,
							session_ip           : clientIP,
							timestamp_expires    : expires
							});
							
	session.save(function (err,newOBJ) {
			if (err) {
				return cb(err);
			} else {
				return cb(newOBJ);
			}
	});
};

////////// mark old session as expired //////////////
tableSchema.statics.updateExpiredSession = function(sessionID, cb) {
	this.findOne({'_id': ObjectId(sessionID)}).select('_id').exec(function(err,doc) {
		if(err || !doc || doc === null) {
			return cb(false);
		}
		
		doc.session_status = 'EXPIRED';
		
		doc.save(function(err) {
			if(err) {
				return cb(false);
			} else {
				return cb(true);
			}
		});
	});
};

////////// mark old session as expired //////////////
tableSchema.statics.terminateSession = function(sessionID, cb) {
	this.findOne({'_id': ObjectId(sessionID),'session_status':'ACTIVE'}).select('_id').exec(function(err,doc) {
		if(err || !doc || doc === null) {
			return cb(false);
		}
		
		doc.session_status = 'TERMINATED';
		
		doc.save(function(err) {
			if(err) {
				return cb(false);
			} else {
				return cb(true);
			}
		});
	});
};
module.exports = tableSchema;