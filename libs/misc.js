//format our url into our function to call
//sample url using method GET /api/employees/employee/id/123
function prettyParams(meth,text) {
	var split = text[0].split('/');
	
	var controller = split[1].charAt(0).toUpperCase() + split[1].slice(1);
	var action = split[2].charAt(0).toUpperCase() + split[2].slice(1);
	var method = (meth+"").toLowerCase();
	
	var passingVars = {};
	//let's grab our variables to pass to the controller
	if(split.length > 3) {
		//get a base count (remove the controller and action from the count)
		var base = 3;
		var count = (split.length) - base;
				
		for(x=0;x<count;x++) {
			var countThis = parseInt(base+x);
			passingVars[split[countThis]] = split[countThis+1];
			//skip ahead since the next is this's vars
			x++;
		}
	}
	
	//
	
	
	return {
		controller:controller,
		func:(method+""+action),
		vars:passingVars
		
	};
};

module.exports = {
	prettyParams : prettyParams
};