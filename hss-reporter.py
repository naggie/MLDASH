# TODO: Connection error handling, loop that
# TODO: Real stats

import requests
import time
import datetime
import copy

server = 'http://localhost/'
#server = 'http://status/'
key    = 'banana'

def update(payload,mode="update"):
	"""Updates the server, initial or update depending on mode"""
	payload.update({"key":key})
	req = requests.post(server+mode,data=payload,timeout=6)
	return req

while True:
	try:
		# send some limits to define this platform
		req = update({
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

		print req.text
		req.raise_for_status()

		print
		print "Online",
		print datetime.datetime.now()

		# in a loop, update the server
		while True:
			req = update({
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

			if req.status_code != requests.codes.ok:
				print req.text

			req.raise_for_status()
			time.sleep(1)

	except (requests.HTTPError,requests.ConnectionError, requests.Timeout) as e:
		print
		print e
	finally:
		print
		print "Reconnecting in 4 seconds..."
		print
		time.sleep(4)
