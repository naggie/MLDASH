# provides methods to get stats about the local machine.

import multiprocessing
import commands
import re
from os import path
import os
from time import time

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
	return int( time() - uptime() )



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

		last_time = time()
                self.update()


        def update(self):
                "Call regularly to get rx and tx in Mbps"
                current_time = time()

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
