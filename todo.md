# Planned features

  * JSON API
  * unknown attr? ask for refresh
  * configure so that reconnect is always tried, and messages on client events are fired, for example on a billboard it is unfeasible to refresh manually
  * Group aggregate status or something?
  * OOR (out of range) alarm -- flashing&|red attribute + alarm noise

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

Per host as group, monitoring:

  * Uptime in days
  * CPU usage in %
  * RAM usage in GB
  * Aggregate disk usage in GB
  * Temperatures
  * Network up/down
  * Total up/down this month (if there is a limit)

## Host uptime monitor

Server pings each host at set intervals, checking for online status. Records ping and calculates up/downtime, availability, current ping.

Text values may need to be coloured (from set list or defined)

## Download dashboard

Showing all usenet and bittorrent downloads with bitorrent, they should nicely vanish and manifest.

## Brew monitor

Chemical/time/temperature analysis of fermentation.

## Continuous integration

Could monitor build and test status
