var mongoose = require('mongoose');

	var tableSchema = new mongoose.Schema({
        entity_status     : { type: String, default: 'ACTIVE'},
        appserver_id      : String,
        entity_surname    : String,
        entity_givenone   : String,
        entity_giventwo   : String,
        
        entity_email      : String,
        
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