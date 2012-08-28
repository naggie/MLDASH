import requests
# TODO: Connection error handling, loop that
# TODO: Real stats

import time
import copy

server = 'http://localhost/'
#server = 'http://status/'
key    = 'grumpycheese'

def update(payload,mode="update"):
	"""Updates the server, initial or update depending on mode"""
	payload.update({"key":key})
	print requests.post(server+mode,data=payload).text
	
# send some limits to define this platform
update({
	# memory in MB
	"memory": 4096,
	# total storage capacity in GB
	"storage": 128,
	# total synchronous internet bandwidth in Mbps
	# false if this is unknown
	"bandwidth": 200,
	# is temperature supported? t/f (if so, updates are the highest temperature)
	"temperature": True,
},"init")

# in a loop, update the server
while True:
	update({
		# memory used in MB
		"memory": 2321,
		# total storage capacity in GB
		"storage": 28,
		# total synchronous internet bandwidth in Mbps
		# false if this is unknown
		"bandwidth": 20,
		# temp in degrees celcius
		"temperature": 73,
		# uptime in days
		"uptime": 23
	})
	time.sleep(1)


