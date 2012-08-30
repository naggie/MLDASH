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

	getFqdn(ip,function(err,host,domain,fqdn) {
		if (err) return res.json(404,{error:"Could not find DNS hostname"})

		fqdns[ip] = [host,domain,fqdn]

		// replace with something clever FIXME TODO
		if (domain) {
			title = domain
			io.sockets.emit('title',title)
		}

		state[host] = {
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

		io.sockets.emit('refresh',state,host+' connected')

		res.json({
			success  : "Initialised server to pool",
			hostname : host,
			domain   : domain,
			ip : ip
		})
	})
})

	
app.post('/update', function(req, res){
	if (req.body.key != key)
		res.json({error:'Wrong API key'})
	else
		delete req.body.key

	var ip = req.connection.remoteAddress
	var host = fqdns[ip][0]
	var update = {}
	update[host] = {}

	updated[host] = new Date()

	// set new max values for RX and TX, and value
	state[host].TX.max = Math.max(state[host].TX.max,req.body.TX)
	state[host].TX.max = Math.max(state[host].TX.max,req.body.TX)

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


// given an ip, callback with host and domain and fqdn
function getFqdn(ip,cb) {
	dns.reverse(ip,function(err,domains){
		if (err) return cb(err)	

		if (ip == '127.0.0.1')
			domains = [os.hostname()]
		else if (domains.length == 0)
			return cb(true)	

		var parts = domains[0].split('.')
		var host = parts.shift() || null
		var domain = parts.join('.') || null

		cb(null,host,domain,domains[0])
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
