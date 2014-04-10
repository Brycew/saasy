var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var tableSchema = new mongoose.Schema({

    employee_id              : Number,
    employee_status          : { type: String, default: 'ACTIVE'},
    employee_login_token     : String,
    employee_login_password  : String,
    employee_pos_pin         : Number,
    employee_pos_password    : String,
    
    employee_group_id        : { type: Schema.Types.ObjectId, ref: 'EmployeeGroups' },
    
    
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
//test
tableSchema.statics.getByLoginToken = function(logins, cb) {

    this.findOne(logins).select('_id employee_id employee_login_token employee_group_id').populate('employee_group_id').exec(function(err,doc) { 
    	if(err) {
    		appLog.logError(err);
	    	return cb(false);
    	} else {
	    	return cb(doc);
    	}	    	
    });
};

module.exports = tableSchema;