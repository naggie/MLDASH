// Listens for hss-reporter clients

var key = 'grumpycheese'


var express = require('express')
var app = express()
var http = require('http')
var server = http.createServer(app)
var io = require('socket.io').listen(server)

server.listen( process.env.PORT||80 )

// state to be synchronised with the client
var state = {}

app.use(express.bodyParser())

app.post('/init', function(req, res) {
	var ip = req.connection.remoteAddress
	getFqdn(ip,function(host,domain) {
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
				max : req.body.storage,
				gradient : 'negative'
			},
			Memory : {
				units : 'MB',
				max : req.body.memory,
				gradient : 'negative'
			}
		}

		if (req.body.temperature)
			state[host].Temperature = {
				units : '&deg;C',
				max : 80,
				gradient : 'negative',
				min : 15,
				alarm :true
			}

		if (req.body.traffic)
			state[host].Traffic = {
				units : 'Mbps',
				max : req.body.traffic,
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
	res.end()
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
io.sockets.on('connection',function (socket){
	socket.emit('refresh',state)
	socket.emit('title','darksky.io server fleet')
})


// given an ip, callback with host and domain
function getFqdn(ip,cb) {
	cb(ip)
}
