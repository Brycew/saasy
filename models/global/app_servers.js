module.exports = function(mongoose) {
	var tableName = 'app_server';
	

	var tableSchema = new mongoose.Schema({
        server_id          : mongoose.Schema.ObjectId,
        server_status      : { type: String, default: 'ACTIVE'},
        server_account_id  : Number,
        server_database_id : Number,
        server_token       : String,
        timestamp_created  : { type: Date, default: Date.now },
        timestamp_modified : { type: Date, default: Date.now },
        timestamp_last_boot: { type: Date, default: Date.now }
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
    


 
	return tableSchema;
	
};