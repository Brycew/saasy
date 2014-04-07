var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var tableSchema = new mongoose.Schema({
	
	entity_surname    : String,
	entity_givenone   : String,
	entity_giventwo   : String,
	entity_giventhree : String,
	entity_dateofbirth: Date,
	
	entity_address : [{
		type   : String,
		unit   : String,
		civic  : String,
		postal : String,
		zip    : String,
		city   : String,
		state  : String,
		country: String
		
	}],
	entity_phone : {
		cell : String,
		home : String,
		work : String
	},
	entity_fax : {
		home : String,
		work : String
	},
	entity_email : {
		personal : String,
		work     : String
	},
    
    
    timestamp_created  : { type: Date, default: Date.now },
    timestamp_modified : { type: Date, default: Date.now }
});
module.exports = tableSchema;