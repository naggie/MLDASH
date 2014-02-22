#!/bin/bash
# keeps reporter alive foreve
while true; do
	./reporter.py "$@"
	# usage info
	test $? == 22 && exit
	sleep 10;
done
