MLDASH is a server monitoring system. It provides real-time information of a
collection of servers to a web interface.

MLDASH can also support arbitrary data; it has been used as a telemetry system
for an electric vehicle and for a scalable battery management system.


# Server

    npm install -g mldash
    mldash-server <api key>

NPM may require `sudo`, depending on your configuration. Alternatively, you can
run `node server <api key>` after `npm install` on this repository. Environment
variables `PORT`, `IP` and `KEY` can be set to suit your setup.


# Client

You only need to run `reporter.py` which has no local dependencies. Alternatively,
with a global install on the client you may run `mldash-reporter`.

You'll also need to install `lm-sensors` and run `sensors-detect` to configure
it. If you want to monitor a network device other than `eth0` then specify it
using the `NDEV` environment variable for now.

The reporter uses the `requests` python package, so make sure you have an
up-to-date version with:

```
	sudo apt-get install python-pip
	sudo pip install requests --upgrade
```

The client expects the following:

    ./reporter.py <server URL> <key>


# Example usage:

```
	git clone git://github.com/naggie/MLDASH.git
	cd MLDASH
	npm install
	export PORT=8000
	node server banana

	# ...in another terminal
	./reporter.py http://localhost:8000 banana

	# open your browser
	open http://localhost:8000

```

