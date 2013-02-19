#! /usr/bin/python

import requests
import time
import datetime
import copy
import os
import sysinfo
import sys

#server = 'http://snorlax/'
#server = 'http://localhost/'
server = 'http://status/'

key    = 'banana'

def update(payload,mode="update"):
	"""Updates the server, initial or update depending on mode"""
	payload.update({"key":key})
	req = requests.post(server+mode,data=payload,timeout=6)
	return req
	
def disk_busy(device):
    with open('/proc/diskstats') as f1:
           content = f1.read()
    sep = '%s ' % device
    for line in content.splitlines():
        if sep in line:
            io_ms = line.strip().split(sep)[1].split()[9]
            break
    return io_ms


while True:
	try:
		traffic = sysinfo.traffic(os.getenv('NDEV') or 'eth0')
		disk_io_ms = disk_busy('sda')
		# send some limits to define this platform
		req = update({
			# memory in MB
			"Memory" : int(sysinfo.memory()["total"]/1024),
			# total storage capacity in GB
			"Storage" : int(sysinfo.storage()["total"]/1048576),
		},"init")

		print req.text
		req.raise_for_status()

		print
		print "Online",
		print datetime.datetime.now()

		# in a loop, update the server
		while True:
			prev_disk_io_ms = disk_io_ms
                        disk_io_ms = disk_busy('sda')
                        disk_io_delta = (int(disk_io_ms)-int(prev_disk_io_ms))/10
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
				"Uptime": int(sysinfo.uptime()/84600),
				# 0-100 CPU load 
				"Load": sysinfo.load(),
				# 0-100 Disk I/O load
				"Disk": disk_io_delta,
			})

			if req.status_code != requests.codes.ok:
				print req.text

			req.raise_for_status()
			traffic.update()
			time.sleep(1)

	except (requests.HTTPError,requests.ConnectionError, requests.Timeout) as e:
		print
		print e
		print
		print "Reconnecting in 4 seconds..."
		print
		time.sleep(4)

	except (Exception) as e:
		print
		print e
		print
		sys.exit(1)
