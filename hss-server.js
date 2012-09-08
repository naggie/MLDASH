// Listens for hss-reporter clients

// TODO: exceptions
// TODO: rdns fail handling

var key = 'banana'

// shared domain name for servers, or false if servers
// no not have a common domain name
var common_domain = false

var express = require('express')
var app = express()
var http = require('http')
var server = http.createServer(app)
var io = require('socket.io').listen(server)
var dns = require('dns')
var os = require('os')

server.listen( process.env.PORT||80 )

// state to be synchronised with the client
var state = {}
var title = ''

// dict of IP -> [host,domain,host.domain]
var fqdns = {}

// object, host -> date last updated
// to find dormant servers 
var updated = {}

// maximum time in seconds a server can go quiet for without
// removing it
var max_dormant = 10

app.use(express.bodyParser())

app.post('/init', function(req, res) {
	if (req.body.key != key)
		return res.json(403,{error:'Wrong API key'})
	else
		delete req.body.key

	var ip = req.connection.remoteAddress
	// remove cached DNS name
	delete fqdns[ip]

	getFqdn(req,function(err,host) {
		if (err) return res.json(404,{error:"Could not find DNS hostname"})

		// replace with something clever FIXME TODO
		if (host.domain) {
			title = domain
			io.sockets.emit('title',title)
		}

		state[host.name] = {
			Uptime : {
				units : ' days'
			},
			Load : {
				units : '%',
				max : 100,
				gradient : 'negative'
			},
			Storage : {
				units : 'GB',
				max : req.body.Storage,
				gradient : 'negative'
			},
			Memory : {
				units : 'MB',
				max : req.body.Memory,
				gradient : 'negative'
			},
			Temperature : {
				units : '&deg;C',
				max : 80,
				gradient : 'negative',
				min : 15,
				alarm :true
			},
			TX : {
				units : 'Mbps',
				max : 10
			},
			RX : {
				units : 'Mbps',
				max : 10
			}
		}

		io.sockets.emit('refresh',state,host.name+' connected')

		res.json({
			success  : "Initialised server to pool",
			hostname : host.name;
			domain   : host.domain,
		})
	})
})

	
app.post('/update', function(req, res){
	if (req.body.key != key)
		res.json({error:'Wrong API key'})
	else
		delete req.body.key

	getFqdn(req,function(err,host) {
		if (err) return res.json(404,{error:"Could not find DNS hostname"})

		updated[host] = new Date()

		// set new max values for RX and TX, and value
		state[host].TX.max = Math.max(state[host].TX.max,req.body.TX)
		state[host].RX.max = Math.max(state[host].RX.max,req.body.RX)

		// update the remaining
		for (var attr in req.body)
			state[host][attr].value = update[host][attr] = req.body[attr]
		
		// send new max values perhapswhynot
		// as long-hand update. Make it conditional later.
		update[host].TX = state[host].TX
		update[host].RX = state[host].RX

		io.sockets.emit('update',update)
		res.json({success:'Updated'})
	})
})

app.use(express.static(__dirname + '/www'))


io.set('log level',1)
io.enable('browser client minification')
io.enable('browser client etag')
io.enable('browser client gzip')
io.set('transports', ['websocket','flashsocket','htmlfile','xhr-polling','jsonp-polling'])


// longhand defining parameters of attributes
var initial = {}

// new client
io.sockets.on('connection',function (socket) {
	socket.emit('refresh',state)
	socket.emit('title',title)
})


// given a HTTP request object, callback with host, domain and fqdn
// uses DNS, falls back to relying on the client if not found
function getFqdn(req,cb) {
	var ip = req.connection.remoteAddress

	// cached?
	if (fqdns[ip])
		return fqdns[ip]

	dns.reverse(ip,function(err,domains){
		if (err) return cb(err)	

		// proxy or local
		if (ip == '127.0.0.1' && req.body.fqdn)
			domains = [req.body.fqdn]
		else if (domains.length == 0)
			return cb(true)	

		var parts = domains.split('.')

		var host = {
			host : parts.shift() || null,
			domain : parts.join('.') || null,
			fqdn : domains[0],
		}

		// cache
		fqdns[ip] = host
	})
}


// look for dormant servers and remove them
setInterval(function(){
	for (var host in updated) {
		var min = (new Date()).getTime() - max_dormant*1000

		if ( updated[host].getTime() < min) {
			// remove host and tell clients
			delete state[host]
			delete updated[host]

			// remove the entry from the DNS cache
			for (var ip in fqdns)
				if (fqdns[0] == host)
					delete fqdns[ip]

			io.sockets.emit('refresh',state,host+' disconnected')
		}
	}
},max_dormant*500)
