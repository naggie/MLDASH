# TODO: non-indo handling (eg, can't get data) 

import requests
import time
import datetime
import copy

import sysinfo

#server = 'http://snorlax/'
#server = 'http://localhost/'
server = 'http://status/'

key    = 'banana'

def update(payload,mode="update"):
	"""Updates the server, initial or update depending on mode"""
	payload.update({"key":key})
	req = requests.post(server+mode,data=payload,timeout=6)
	return req

while True:
	try:
		traffic = sysinfo.traffic('eth1')

		# send some limits to define this platform
		req = update({
			# memory in MB
			"Memory": int(sysinfo.memory()["total"]/1024),
			# total storage capacity in GB
			"Storage": int(sysinfo.storage()["total"]/1048576),
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
				"Memory": int(sysinfo.memory()["used"]/1024),
				# total storage capacity in GB
				"Storage": int(sysinfo.storage()["used"]/1048576),
				# total synchronous internet bandwidth in Mbps
				# false if this is unknown
				"TX": int(traffic.tx/131072),
				"RX": int(traffic.rx/131072),
				# temp in degrees celcius
				"Temperature": sysinfo.temperature(),
				# uptime in days
				"Uptime": (sysinfo.uptime()/84600),
				# 0-100 CPU load 
				"Load": sysinfo.load() 
			})

			if req.status_code != requests.codes.ok:
				print req.text

			req.raise_for_status()
			traffic.update()
			time.sleep(1)

	except (requests.HTTPError,requests.ConnectionError, requests.Timeout) as e:
		print
		print e
	finally:
		print
		print "Reconnecting in 4 seconds..."
		print
		time.sleep(4)
