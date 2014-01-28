#!/usr/bin/env python
# Rport server stats to an mldash server
#
# Copyright 2012-2014 Callan Bryant <callan.bryant@gmail.com>
# http://callanbryant.co.uk/
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.


import requests
import time
import datetime
import copy
import os
import sys
import re

if len(sys.argv) == 1:
	print "Usage %s <mldash server URL> [API key]" % sys.argv[0]
	sys.exit(0)
else:
	server = sys.argv[1]

# one slash on the end of url
server = re.sub(r'/+$','/',server+'/')
# protocol must be at beginning
if not re.match(r'https?://',server):
	server = 'http://%s' % server

print 'Connecting to %s...' % server

#server = 'http://snorlax/'
#server = 'http://localhost/'
#server = 'http://status/'

if len(sys.argv) == 3:
	key = sys.argv[2]
else:
	key    = 'banana'

# provides methods to get stats about the local machine.

import multiprocessing
import commands
from os import path

def memory():
	"Total and free mem in kilobytes"
	free = commands.getstatusoutput("free | grep 'Mem:'")

	if free[0]:
		raise Exception('free is not installed')

	numbers = re.findall(r"(\d+)",free[1])

	if not numbers:
		raise Exception('Invalid output from free command')

	for i,number in enumerate(numbers):
		numbers[i] = int(number)

	return {
		"total" : numbers[0],
		"used"  : numbers[1]
	}


def uptime():
	"Uptime in seconds"
	
	if not path.exists('/proc/uptime'):
		raise Exception('/proc/uptime not found')

	f = open('/proc/uptime','r')
	line = f.readline()
	f.close()

	seconds = line.partition(' ')[0]
	seconds = float(seconds)
	seconds = int(seconds)

	return seconds

def started():
	"Unix time when the server was started"
	return int( time.time() - uptime() )



def load():
        "return load (avg num of processes waiting per processor) normalised to 100"

        load = os.getloadavg()[0] 
        load = load/multiprocessing.cpu_count()
	load = int(load*100)

        return load


def storage():
        "Return used and total disk space in kilobytes"
        df = commands.getstatusoutput('df --total | grep total')

        if df[0]:
                raise Exception('Failed to run df command')

        bits = re.findall(r"(\d+)",df[1],re.M)

        if not bits:
                raise Exception('Invalid output from df command')

        total = int(bits[0])
        used = int(bits[1])

        return {
                "total": total,
                "used" : used
        }



class traffic:
        "Calculates traffic for given device in bytes per second. Call update() regularly, read tx and rx"
        last_time = 0
        last_tx_bytes = 0
        last_rx_bytes = 0

        # read these for tx/rx in Mbps
        tx = 0
        rx = 0

        # scales, automatically set to max-ever-recorded
        tx_max = 0
        rx_max = 0


        def __init__(self,dev='eth0'):
                self.tx_file = "/sys/class/net/%s/statistics/tx_bytes" % dev
                self.rx_file = "/sys/class/net/%s/statistics/rx_bytes" % dev

                if not path.exists(self.tx_file):
                        raise Exception("Could not find stats files for %s" % dev)

		last_time = time.time()
                self.update()


        def update(self):
                "Call regularly to get rx and tx in Mbps"
                current_time = time.time()

                current_tx_bytes = self.getBytes('tx')
                current_rx_bytes = self.getBytes('rx')

                delta_time = current_time - self.last_time
                delta_tx_bytes = current_tx_bytes - self.last_tx_bytes
                delta_rx_bytes = current_rx_bytes - self.last_rx_bytes

                self.last_time = current_time
                self.last_tx_bytes = current_tx_bytes
                self.last_rx_bytes = current_rx_bytes

                self.tx = delta_tx_bytes/delta_time
                self.rx = delta_rx_bytes/delta_time

                self.tx = int(self.tx)
                self.rx = int(self.rx)

                self.tx_max = max(self.tx,self.tx_max)
                self.rx_max = max(self.rx,self.rx_max)


        def getBytes(self,direction):
                "get bytes for direction: tx/rx"

                if direction == 'tx':
                        f = open(self.tx_file,'r')
                elif direction == 'rx':
                        f = open(self.rx_file,'r')
                else:
                        raise Exception('Invalid direction. Choose rx/tx')

                bytes = f.readline()
                bytes = int(bytes)

                f.close()

                return bytes

def temperature():
	"""
	gets the hottest temperature integer in degrees celcius. Requires lm-sensors to be configured
	Warn: some modules may produce garbage temperatures.
	Configure those out, or don't load that module
	"""
	sensors = commands.getstatusoutput('sensors -u | grep -E temp[0-9]_input')

	if sensors[0] == 1:
		raise Exception('lm-sensors is not setup. Run sensors-detect')

	if sensors[0] == 127:
		raise Exception('lm-sensors is not installed')

	temps = re.findall(r"(\d{2}.\d+)",sensors[1],re.M)

	if not temps:
		raise Exception('Invalid output from sensors command')

	for i,temp in enumerate(temps):
		temps[i] = float(temp)
		temps[i] = int(temps[i])

	return max(temps)

def update(payload,mode="update"):
	"""Updates the server, initial or update depending on mode"""
	payload.update({"key":key})
	req = requests.post(server+mode,data=payload,timeout=6)
	return req

while True:
	try:
		traffic = traffic(os.getenv('NDEV') or 'eth0')

		# send some limits to define this platform
		req = update({
			# memory in MB
			"Memory" : int(memory()["total"]/1024),
			# total storage capacity in GB
			"Storage" : int(storage()["total"]/1048576),
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
				"Memory": int(memory()["used"]/1024),
				# total storage capacity in GB
				"Storage": int(storage()["used"]/1048576),
				# total synchronous internet bandwidth in Mbps
				# false if this is unknown
				"TX": int(traffic.tx/131072),
				"RX": int(traffic.rx/131072),
				# temp in degrees celcius
				"Temperature": temperature(),
				# uptime in days
				"Uptime": int(uptime()/84600),
				# 0-100 CPU load 
				"Load": load(),
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
		# Try forever
		time.sleep(1)
		#sys.exit(1)
