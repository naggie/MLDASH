# provides methods to get stats about the local machine.
# currently relies too much on the shell. Change it.
# Most cammands are directly ported from report-stats.php

import multiprocessing
import commands

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

#multiprocessing.cpu_count()
