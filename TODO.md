# Planned features

  * Gritter support for alarm events
  * Group aggregate status or something?
  * Integrate error messages with request/responses for API -- add to server stack
  * API key auth, generated at startup or first key posted
  * Package as npm app
  * Group decay by serverside watchdog (nulld) (fade out, keep last values?)
  * Value initialisation in report-stats
  * Auto units in report-stats
  * Smart API
  * make XSS secure, key secured
  * Install properly with git on test server, restart hooks
  * Client should be portable -- to include JS/CSS on websites
  * Can shorthand?
  * Silence pipe errors
  * Can defaults?
  * Heartbeat (update blinker) per group?
  * Smarter magicbar -- only animate when necessary to avoid jitteryness
  * Switch from express to connect
  * Pull update command
  * Alarm attribute setting, default off

# Aggregator

  * Produces a state from multiple sources, updating at a maximum rate as necessary

# Standardisation of server?

  1. Analyse use cases and produce concept server code for each
  2. Look for redundant code between
  3. Assess feasibility of transport modules

# Potential use cases

## Host status montior

All hosts run a daemon (written in an arbitray language, such as BASH) which POST
their state as a JSON group.

The daemons may push an initial group followed by shorhand updates.

In order to conserve bandwidth, a server-side aggregator might be needed to throttle the updates. It could also only send what has changed by maintaining the state of what the clients have and comparing it.

Offline detection required.

Per hostname as group, monitoring:

  * Uptime in days
  * CPU usage in %
  * RAM usage in GB
  * Aggregate disk usage in GB
  * Temperatures
  * Network up/down
  * Total up/down this month (if there is a limit)
  * Location, CPU type

## Host uptime monitor

Server pings each host at set intervals, checking for online status. Records ping and calculates up/downtime, availability, current ping.

Text values may need to be coloured (from set list or defined)

## Download dashboard

Showing all usenet and bittorrent downloads with bitorrent, they should nicely vanish and manifest.

## Brew monitor

Chemical/time/temperature analysis of fermentation.

## Continuous integration

Could monitor build and test status

## Sensor data analyser

Connected via RS232 or ethernet to arduino. Server queries arduino.

## HVAC conitoring system

## Car stat analyser through ODB-II can bus port


# Fetures for evented system

## Announcements

## Downloads 

## Pre



http://demo.tutorialzine.com/2009/12/colorful-clock-jquery-css/demo.html
http://visualidiot.com/files/real-world.css