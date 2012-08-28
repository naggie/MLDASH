import requests
import time
import copy

server = 'http://status/'
server = 'http://requestb.in/182woa51'
key    = 'grumpycheese'

def init(payload):
	print requests.post(server+'init',data=payload).text

def update(payload):
	print requests.post(server+'update',data=payload).text
	
# send some limits to define this platform
init({
	# memory in MB
	"ram": 4096,
	# total storage capacity in GB
	"hdd": 128,
	# total synchronous internet bandwidth in Mbps
	# false if this is unknown
	"bandwidth": 200,
	# is temperature supported? t/f (if so, updates are the highest temperature)
	"temperature": True,
	"key" :key
})

# in a loop, update the server
while True:
	update({
		# memory used in MB
		"ram": 2321,
		# total storage capacity in GB
		"hdd": 28,
		# total synchronous internet bandwidth in Mbps
		# false if this is unknown
		"bandwidth": 20,
		# temp in degrees celcius
		"temperature": 73,
		"key" :key
	})
	time.sleep(1)


