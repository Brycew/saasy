module.exports = function(mongoose) {
	var tableName = 'posts';
	

	var tableSchema = new mongoose.Schema({
        post_id            : mongoose.Schema.ObjectId,
        post_status        : { type: String, default: 'ACTIVE'},
        post_title         : String,
        post_article       : Number,
        timestamp_created  : { type: Date, default: Date.now },
        timestamp_modified : { type: Date, default: Date.now },
        timestamp_last_boot: { type: Date, default: Date.now }
    });
    
    tableSchema.statics.listActive = function(cb) {
    	this.find({ 'post_status': 'ACTIVE' }, function (err, resp) {
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