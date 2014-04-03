var mongoose = require('mongoose');
var Schema = mongoose.Schema;

module.exports = function() {
	var tableName = 'access_sessions';
	

	var tableSchema = new mongoose.Schema({
		session_status      : { type: String, default: 'ACTIVE'},
		session_type        : String,
		session_loginID     : String,
		session_ip          : String,
        
        session_permissions : Array,
        
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
    


 
	return tableSchema;
	
};