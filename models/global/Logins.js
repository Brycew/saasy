var mongoose = require('mongoose');

	var tableSchema = new mongoose.Schema({
        login_status     : { type: String, default: 'ACTIVE'},
        login_email      : Number,
        login_password   : Number,
        app_server_id    : String,
        app_server_token : String,
        timestamp_created  : { type: Date, default: Date.now },
        timestamp_modified : { type: Date, default: Date.now }
    });
    
    tableSchema.statics.listActive = function(cb) {
    	this.find({ 'server_status': 'ACTIVE' }, function (err, resp) {
	    	if(err) {
		    	return cb(false);
	    	} else {
		    	return cb(resp);
	    	}
	    }); 
    };



module.exports = tableSchema;