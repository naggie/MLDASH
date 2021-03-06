MLDASH is a server monitoring system. It provides real-time information of a
collection of servers to a web interface.

MLDASH can also support arbitrary data; it has been used as a telemetry system
for an electric vehicle and for a scalable battery management system.

![MLDASH in action circa 2011](screenshot.png)

# Server

    npm install -g mldash
    mldash-server <api key>

NPM may require `sudo`, depending on your configuration. Alternatively, you can
run `node server <api key>` after `npm install` on this repository. Environment
variables `PORT`, `IP` and `KEY` can be set to suit your setup.

Note that the server is very small. Most of the logic is in the client; as
such, this makes it easy to aggregate and display arbitrary data.


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

There is currently a bug which causes the reporter to crash. There is a simple
wrapper script that will re-launch it if this happens:

    ./reporter-wrapper.sh <server URL> <key>

The wrapper is automatically called by the global `mldash-reporter`.

# Example usage:

```
	git clone git://github.com/naggie/MLDASH.git
	cd MLDASH
	npm install
	export PORT=8000
	node server banana

	# ...in another terminal
	./reporter-wrapper.sh http://localhost:8000 banana

	# open your browser
	open http://localhost:8000

```

Here is MLDASH being used as a telemetry system for an electric racing car. A
serial to JSON protocol bridge was developed in C++ together with a custom
server in nodejs.

![MLDASH as a telemetry system](telemetry.jpg)
