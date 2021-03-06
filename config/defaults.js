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
		timeout         : 15, //we use minutes here - not ms
		maxConnections  : 5
	},
	
	controller : {
		appPath         : './controllersApp/',
		masterPath      : './controllersMaster/'
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
	tcp : {
		bindingHost   : '127.0.0.1',
		bindingPort   : 9999
	},
	http : {
		bindingHost   : '127.0.0.1',
		bindingPort   : 8888
	},
	appServer : {
		cleanExpiredSessions : 5000, //how often should we remove expired sessions from memory
		updateSessions       : 2000,
		
		idleKillServer       : 600000,  //how long before we kill the server - an idle server can be brought back from the dead if a request is made
	}
}