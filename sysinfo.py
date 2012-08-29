# provides methods to get stats about the local machine.
# currently relies too much on the shell. Change it.
# Most cammands are directly ported from report-stats.php

import commands

def totalMemory():
	try:
		mem = commands.getstatusoutput("free -m | grep 'Mem:' | awk '{print $2}'")
		mem = int(mem[1])
	except:
		return False
	return mem


def usedMemory():
	try:
		mem = commands.getstatusoutput("free -m | grep -E '\-\/\+' | awk '{print $3}'")
		mem = int(mem[1])
	except:
		return False
	return mem





