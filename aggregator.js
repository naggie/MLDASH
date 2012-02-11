var express = require('express');
var app = express.createServer();
var io = require('socket.io').listen(app);

app.listen(80);

app.use(
	express.static(__dirname + '/www')
);

io.set('log level',1);
io.enable('browser client minification');
io.enable('browser client etag');
io.enable('browser client gzip');
io.set('transports', [                    
    'websocket'
  , 'flashsocket'
  , 'htmlfile'
  , 'xhr-polling'
  , 'jsonp-polling'
]);
//io.set('reconnection limit',1000);


io.sockets.on('connection',function (socket){
	socket.emit('refresh', ml.state);
});



// representation of state at different places
var clientState = {};
var state = {};


// returns whether the state or update is valid
var isValid = function(state){

}

// will broadcast the minimum necessary given a state each time
// by calculating what needs to be updated on the clients.
// This may be nothing, or in case something is added, a full refresh
// 
// Call at an interval to update clients -- this effectively throttles
// the rate of update if data is coming from many places.
// 
// Update, define or initialise the known state with update()
//
// Updates the state of every client to that of var state
var push = function(){

	// no update since
	if (clientState == state)
		return;

	// update to send
	var upd = {};

	// iterate over current state, comparing to the state of each client
	for (var grp in state)
		if ( !clientState[grp])
			// new group
			upd[grp] = state[grp];
		else
			// individually check each attr attribute (unrolled for clarity)
			for (var attr in state[grp]){
				if (!clientState[grp][attr])
					// new attribute!
					upd[grp][attr] = clientState[grp][attr];
				else{
					// make sure the attribute object exists in data structure
					upd[grp][attr] = {};

					['min','max','units','gradient','value'].forEach(function(i){
						if (clientState[grp][attr][i] != state[grp][attr][i])
							upd[grp][attr][i] = state[grp][attr][i];

					});

					// remove attribute from structure if empty (unchanged)
					if (upd[grp][attr] == {}) delete upd[grp][attr];

					// convert update attr to shorthand if possible
					// this might not work or cobber main state object
					// as objects are common when assigned. Try later.
					//if (upd[grp][attr] == {value:state[grp][attr].value})
					//	upd[grp][attr] = state[grp][attr].value;
				}
				
		}


	// broadcast update
	io.sockets.emit('update',upd);

	// update known client state -- might have to clone object!!!
	// done here with JSON 'codec'.......
	clientState = JSON.parse(JSON.stringify(state));
	//clientState = state;
}

// resubmits everything to each client. Use when new attributes are added
var refresh = function(){
	io.sockets.emit('refresh',state);
	
	// update known client state -- might have to clone object!!!
	// done here with JSON 'codec'.......
	clientState = JSON.parse(JSON.stringify(state));
	//clientState = state;

}

// Updates or defines the aggregate state
// push these updates with push() at intervals
//
// Update everything or incrementally, shorthand or longhand 
var update = function(){

}


	// brand new?
	if (ml.state == {}){
		ml.state = upd;
		io.sockets.emit('refresh',upd);
		return;
	}

	// compute full new state, get differences
	for (var grp in upd)
		if (typeof ml.state[grp] !== 'undefined')
			if (typeof upd[grp] == "object"){
				// update, longhand
				if (upd.max) 
				ml.state[grp] = upd[grp];
				
			}else
				// update, shorthand to longhand
				ml.state[grp].value = upd[grp];

}

