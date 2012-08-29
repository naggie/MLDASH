# TODO: Connection error handling, loop that
# TODO: Real stats

import requests
import time
import copy

server = 'http://localhost/'
#server = 'http://status/'
key    = 'banana'

def update(payload,mode="update"):
	"""Updates the server, initial or update depending on mode"""
	payload.update({"key":key})
	req = requests.post(server+mode,data=payload)
	print req.text
	req.raise_for_status()
	return req

while True:
	try:
		# send some limits to define this platform
		update({
			# memory in MB
			"Memory": 4096,
			# total storage capacity in GB
			"Storage": 128,
			# total synchronous internet bandwidth in Mbps
			# false if this is unknown
			"Traffic": 200,
			# is temperature supported? t/f (if so, updates are the highest temperature)
			"Temperature": True,
		},"init")

		# in a loop, update the server
		while True:
			update({
				# memory used in MB
				"Memory": 2321,
				# total storage capacity in GB
				"Storage": 28,
				# total synchronous internet bandwidth in Mbps
				# false if this is unknown
				"Traffic": 20,
				# temp in degrees celcius
				"Temperature": 73,
				# uptime in days
				"Uptime": 23,
				# 0-100 CPU load 
				"Load": 92
			})
			time.sleep(1)

	except (requests.HTTPError,requests.ConnectionError, requests.Timeout) as e:
		print
		print e
	finally:
		print "Reconnecting in 4 seconds..."
		time.sleep(4)
