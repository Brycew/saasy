var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var tableSchema = new mongoose.Schema({
	group_status      : { type: String, default: 'ACTIVE'},
	group_title       : String,
	group_description : String,
	
	//default schema for a new access group's security
	permissions : {
		Web : {
			Auth : {
				Login         : { type : Boolean, default : true   },
				ResetPassword : { type : Boolean, default : true   },
				Timeout       : { type : Number,  default : 600000 }, //10 minutes in milli's
				Attempts      : { type : Number,  default : 5      }  //5 login attempts before lockout
			},
			Employees : {
				View   : { type : Boolean, default : false },
				Edit   : { type : Boolean, default : false },
				Remove : { type : Boolean, default : false },
				Scope  : { type : Number,  default : 0     } //scope of access *0 = all access 1 would be within group 
															 //2 would be within group and one up etc
			}
		},
		App : {
			
		}	
	},
    
    timestamp_created   : { type: Date, default: Date.now },
    timestamp_modified  : { type: Date, default: Date.now }
});

tableSchema.statics.listActive = function(cb) {
	this.find({ 'group_status': 'ACTIVE' }, function (err, resp) {
    	if(err) {
    		appLog.logError(err);
	    	return cb(false);
    	} else {
	    	return cb(resp);
    	}
    }); 
};

module.exports = tableSchema;