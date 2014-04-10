var mongoose = require('mongoose');

	var tableSchema = new mongoose.Schema({
        code_status       : { type: String, default: 'ACTIVE'},
        code_token        : String,
        code_server_token : String,
        code_server_id    : String,
        
        timestamp_created  : { type: Date, default: Date.now },
        timestamp_modified : { type: Date, default: Date.now },
        timestamp_expires  : { type: Date, default: Date.now }
    });
    
    tableSchema.statics.listActive = function(cb) {
    	this.find({ 'code_status': 'ACTIVE' }, function (err, resp) {
	    	if(err) {
		    	return cb(false);
	    	} else {
		    	return cb(resp);
	    	}
	    }); 
    };



module.exports = tableSchema;