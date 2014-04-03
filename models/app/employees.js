var mongoose = require('mongoose');
var Schema = mongoose.Schema;

module.exports = function() {
	var tableName = 'employees';
	

	var tableSchema = new mongoose.Schema({

        employee_id              : Number,
        employee_status          : { type: String, default: 'ACTIVE'},
        employee_login_token     : String,
        employee_login_password  : String,
        
        
        timestamp_created  : { type: Date, default: Date.now },
        timestamp_modified : { type: Date, default: Date.now },
        timestamp_last_boot: { type: Date, default: Date.now }
    });
    
    tableSchema.statics.listActive = function(cb) {
    	this.find({ 'employee_status': 'ACTIVE' }, function (err, resp) {
	    	if(err) {
	    		appLog.logError(err);
		    	return cb(false);
	    	} else {
		    	return cb(resp);
	    	}
	    }); 
    };
    
    tableSchema.statics.getByLoginToken = function(logins, cb) {
	    this.findOne(logins, '_id employee_id employee_login_token', function (err, resp) {
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