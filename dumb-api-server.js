// Provides a basic JSON/HTTP aggregator service to broadcast updates to all clients
// 
// Assumes the first post is the initial state for each group, and subsequent
// posts are updates -- which are broadcasted regardless.
//
// Parts of this file may from an aggregator module in the future
//
// UPDATES MUST BE IN SHORTHAND

var express = require('express')
var app = express()
var http = require('http')
var server = http.createServer(app)
var io = require('socket.io').listen(server)

server.listen(80)

app.use(express.bodyParser())

app.post('/', function(req, res){
	// iterate over group
	for (var grp in req.body){
		if (!initial[grp])
			addGroup(grp,req.body[grp])
		else
			updateGroup(grp,req.body[grp])
	}
	res.end()
})

app.use(express.static(__dirname + '/www'))


io.set('log level',1)
io.enable('browser client minification')
io.enable('browser client etag')
io.enable('browser client gzip')
io.set('transports', [                    
    'websocket'
  , 'flashsocket'
  , 'htmlfile'
  , 'xhr-polling'
  , 'jsonp-polling'
])


// longhand defining parameters of attributes
var initial = {}

// new client
io.sockets.on('connection',function (socket){
	socket.emit('refresh',initial)
})


// add a new group, defining initial state
// will broadcast a refresh
var addGroup = function(name,attrs){
	// add the new group
	initial[name] = attrs

	// refresh all clients with new layout
	io.sockets.emit('refresh',initial)
}

// update a group with shorthand attrs -- will not accept
// longhand
var updateGroup = function(group,attrs){
	if (!initial[group])
		console.log('group not defined:',group)

	// check for shorthand
	for (var attr in attrs){
		if (typeof attrs[attr] == 'object'){
			console.log('Update failed: Pre-existing group or updates must be shorthand')
			return
		}

		if (!initial[group][attr])
			console.log('Update failed: Attribute to update not found in initial state:',attr)

	}

	var update = {}
	update[group] = attrs
	return io.sockets.volatile.emit('update',update)
}
