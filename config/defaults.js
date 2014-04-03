module.exports = {
	isDebug : true,
	runtime : {
		name      : 'Saasy',
		version   : '0.1',
		babydaddy : 'Bryce Wilkinson',	
		copyright : 'Blah Blah'
	},
	
	process : {
		title : 'saasy'
	},
	
	authorize : {
		
		loginCollection : 'employees',
		loginUsername   : 'login_token',
		loginPassword   : 'login_password',
		timeout         : 6000
	},
	
	controller : {
		dir           : './controllers/'	
	},
	
	dbGlobal : {
		connectionUrl : 'mongodb://nodeconnector:123456789@127.0.0.1:27017/affinity_master',
		modelDir      : './models/global/'
	},
	dbApp : {
		connectionUrl : 'mongodb://nodeconnector:123456789@127.0.0.1:27017/affinity_master',
		modelDir      : './models/app/',
		prefix        : 'app_server_'
	},
	socket : {
		bindingHost   : '127.0.0.1',
		bindingPort   : 9091
	},
	http : {
		bindingHost   : '127.0.0.1',
		bindingPort   : 8888
	},
	appServer : {
		cleanExpiredSessions : 300000,
		updateSessions       : 600000
	}
}