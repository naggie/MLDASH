# provides methods to get stats about the local machine.

import multiprocessing
import commands
import re
from os import path
from time import time

def totalMemory():
	"Total mem in MB"
	try:
		mem = commands.getstatusoutput("free -m | grep 'Mem:' | awk '{print $2}'")
		mem = int(mem[1])
	except:
		return False
	return mem


def usedMemory():
	"Memory used in MB"
	try:
		mem = commands.getstatusoutput("free -m | grep -E '\-\/\+' | awk '{print $3}'")
		mem = int(mem[1])
	except:
		return False
	return mem


def uptime():
	"Uptime in days"
	try:
		f = open('/proc/uptime','r')
		line = f.readline()
		f.close()

		seconds = line.partition(' ')[0]
		seconds = float(seconds)
		seconds = int(seconds)

	except:
		return False
	
	return int(seconds/86400)

def startupTime():
	"Unix time when the server was started"
	pass



def load():
        "return load normalised to 100"
        uptime = commands.getstatusoutput('uptime')

        if uptime[0]:
                raise Exception('Failed to run uptime command')

        bits = re.findall(r"(\d\.\d{2})",uptime[1])

        if not bits:
                raise Exception('Invalid output from uptime command')

        load = bits[0]
        load = float(load)
        load = load/multiprocessing.cpu_count()

        return int(load*100)


def storage():
        "Return used and total disk space in GB"
        df = commands.getstatusoutput('df --total | grep total')

        if df[0]:
                raise Exception('Failed to run df command')

        bits = re.findall(r"(\d+)",df[1],re.M)

        if not bits:
                raise Exception('Invalid output from df command')

        total = int(bits[0])
        used = int(bits[1])

        # convert to GB
        total = int(total/1048576)
        used = int(used/1048576)

        return {
                "use" : used,
                "total": total
        }



class traffic:
        "Calculates traffic for given device in bytes per second. Call update() regularly, read tx and rx"
        last_time = time()
        last_tx_bytes = 0
        last_rx_bytes = 0

        # read these for tx/rx in Mbps
        tx = 0
        rx = 0

        # scales, automatically set to max-ever-recorded
        tx_max = 0
        rx_max = 0


        def __init__(self,dev='eth0'):
                self.tx_file = "/sys/class/net/%s/statistics/tx_bytes" % (dev)
                self.rx_file = "/sys/class/net/%s/statistics/rx_bytes" % (dev)

                if not path.exists(self.tx_file):
                        raise Exception("Could not find stats files for " % dev)

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

def maxTemp():
        """
                gets the hottest temperature integer in degrees celcius. Requires lm-sensors to be configured
                Warn: some modules may produce garbage temperatures.
                Configure those out, or don't load that module
        """
        sensors = commands.getstatusoutput('sensors -u | grep _input')

        if sensors[0] == 1:
                raise Exception('lm-sensors is not setup. Run sensors-detect')

        if sensors[0] == 127:
                raise Exception('lm-sensors is not installed')

        temps = re.findall(r"(\d+.\d+)",sensors[1],re.M)

        if not temps:
                raise Exception('Invalid output from sensors command')

        for i,temp in enumerate(temps):
                temps[i] = float(temp)
                temps[i] = int(temps[i])

        return max(temps)




