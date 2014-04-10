var mongoose = require('mongoose');
var crypto   = require('crypto');

	var tableSchema = new mongoose.Schema({
        login_status     : { type: String, default: 'ACTIVE'},
        login_token      : String,
        login_password   : String,
        login_salt       : String,
        entity_id        : String,
        appserver_id     : String,
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

tableSchema.statics.insertLogin = function(data,cb) {
	var model = this;
	function checkDuplicateToken() {
		model.find({login_token:data.login_token},function(err,resp) {
			if(err || resp) {
				return cb('duplicateToken');
			} else {
				return checkDuplicateEntity();
			}
		});
	}
	function checkDuplicateEntity() {
		model.find({entity_id:data.entity_id},function(err,resp) {
			if(err || resp) {
				return cb('duplicateEntity');
			} else {
				return executeInsert();
			}
		});
	}
	function executeInsert() {
		var newEntry = new model(data);
		newEntry.save(function(err,doc) {
			if(err) {
				return cb(false);
			} else {
				return cb(doc);
			}
		});
	}
	//start the validation before executing
	checkDuplicateToken();
};



module.exports = tableSchema;