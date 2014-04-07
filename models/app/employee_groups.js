var mongoose = require('mongoose');
var Schema = mongoose.Schema;

module.exports = function() {
	var tableName = 'employee_groups';
	

	var tableSchema = new mongoose.Schema({
		group_status        : { type: String, default: 'ACTIVE'},
		group_title         : String,
		group_desc          : String,
		group_access_groups : [{ type: Schema.Types.ObjectId, ref: 'AccessGroups' }],

        timestamp_created   : { type: Date, default: Date.now },
        timestamp_modified  : { type: Date, default: Date.now }
    });

	return tableSchema;
	
};