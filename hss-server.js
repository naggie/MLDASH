// Listens for hss-reporter clients

// TODO: rdns
// TODO: rdns fail handling

var key = 'grumpycheese'


var express = require('express')
var app = express()
var http = require('http')
var server = http.createServer(app)
var io = require('socket.io').listen(server)
var dns = require('dns')

server.listen( process.env.PORT||80 )

// state to be synchronised with the client
var state = {}
var title = ''

// dict of IP -> [host,domain]
var fqdns = {}

app.use(express.bodyParser())

app.post('/init', function(req, res) {
	if (req.body.key != key)
		res.json({error:'Wrong API key'})
	else
		delete req.body.key

	var ip = req.connection.remoteAddress

getFqdn(ip,function(err,host,domain) {
		fqdns[ip] = [host,domain]



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
			}
		}

		if (req.body.Temperature)
			state[host].Temperature = {
				units : '&deg;C',
				max : 80,
				gradient : 'negative',
				min : 15,
				alarm :true
			}

		if (req.body.Traffic)
			state[host].Traffic = {
				units : 'Mbps',
				max : req.body.Traffic,
				gradient : 'negative'
			}

		io.sockets.emit('refresh',state)

		res.json({
			success  : "Initialised server to pool",
			hostname : host,
			domain   : domain
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

	for (var attr in req.body)
		state[host][attr].value = update[host][attr] = req.body[attr]

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


// given an ip, callback with host and domain
function getFqdn(ip,cb) {
	dns.reverse(ip,function(err,domains){
		if (err || domains.length == 0) return cb(err)	

		var parts = domains[0].split('.')
		var host = parts.shift()
		var domain = parts.join('.')

		cb(null,host,domain)
	})
}
