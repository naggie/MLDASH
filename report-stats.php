<?php
// test script to report to central server.
// Written in PHP as BASH is terrible to create JSON with
// and node is too asynchronous to easily run commands
// in the shell

// This needs to be cleaned up when the aggregator is finalised and
// the network utilisation is quantified.

/* TODO
  * Uptime in days
  * CPU usage in %
  * RAM usage in GB
  * Aggregate disk usage in GB
  * Temperatures
  * Network up/down
  * Total up/down this month (if there is a limit)
  * Location, CPU type
  * NOT time
*/

//$host = 'localhost';
$host = 'snowstorm';

// dir to calc disk usage. May be auto generated to find
// largest mount
$dir = '/srv/';

// network device to count from
$dev = 'eth0';

$totalGB = round(disk_total_space($dir)/1073741824,1);

// send initial attrs
$init = array (
	'uptime' => array (
		'units' => ' days'
	),
	'CPU Load' => array (
		'units' => '%',
		'max' => 100,
		'gradient' => 'negative'
	),
	'Disk usage' => array (
		'units' => 'GB',
		'gradient' => 'negative',
		'max' => $totalGB
	),
	'RAM Usage' => array (
		'max' => (int)shell_exec("free -m | grep 'Mem:' | awk '{print $2}'"),
		'units' => 'MB',
		'gradient' => 'negative',
	),
//	'Time' => array (
//		'value' => date('h:i:s'),
//	)
);

if (shell_exec('sensors')!==null)
	$init['Temperature'] = array (
		'units' => '&deg;C',
		'max' => 80,
		'min' => 10,
		'gradient' => 'negative'
	);

if (file_exists("/sys/class/net/$dev/speed"))
	$init['Traffic'] = array (
		'units' => 'Mbps',
		'max' => (int)file_get_contents("/sys/class/net/$dev/speed"),
		'min' => 0,
		'gradient' => 'negative'
	);



sendAttrs($host,$init);

$txB = 0;
$rxB = 0;
$txBPrev = 0;
$rxBPrev = 0;
$elapsed = 0;
$elapsedPrev = 0;

while(1){
	$uptime = preg_split('/\s+/',trim(exec('uptime')));
	$days = floor(end(preg_split('/\s+/',trim(exec('cat /proc/uptime'))))/86400);

	$pcount = (int)exec("cat /proc/cpuinfo | grep processor | wc -l");

	$freeGB = round(disk_free_space($dir)/1073741824,1);

	$update = array(
		'uptime' =>  $days,
		'CPU Load' => floor($uptime[9]*100/$pcount),
		'Disk usage' => $totalGB-$freeGB,
//		'Time' => date('h:i:s'),
		'RAM Usage' => (int)shell_exec("free -m | grep -E '\-\/\+' | awk '{print $3}'"),
	);

	if (isset($init['Temperature']))
		$update['Temperature'] = (int)shell_exec("sensors -u | grep input | grep temp | grep -v - | grep -oE '[0-9]{1,2}\.' | grep -oE '[0-9]+' | sort -g | tail -n 1");

	// differentiate net traffic
	if (isset($init['Traffic'])){
		$elapsed = microtime(true);
		// read in integral, convert bytes to megabits
		$txB = (int)file_get_contents("/sys/class/net/$dev/statistics/tx_bytes");
		$rxB = (int)file_get_contents("/sys/class/net/$dev/statistics/rx_bytes");

		// use change per time to differentiate
		$txBps = floor( ($txB-$txBPrev)/($elapsed-$elapsedPrev) );
		$rxBps = floor( ($rxB-$rxBPrev)/($elapsed-$elapsedPrev) );

		// convert to Megabits per second
		$txMbps = round( $txBps/131072,1);
		$rxMbps = round( $rxBps/131072,1);

		// choose largest
		$update['Traffic'] = $txMbps > $rxMbps? $txMbps:$rxMbps;
		
		$txBPrev = $txB;
		$rxBPrev = $rxB;
		$elapsedPrev = $elapsed;
	}

	sendAttrs($host,$update);

	sleep(1);
}


function sendAttrs ($host,$attrs){
	//return print_r($attrs);

	$name = exec('hostname');

	$data = json_encode(
		array($name => $attrs)
	);

	$params = array('http' =>
		array(
			'method' => 'POST', 
			'content' => $data,
			'header' => "Content-Type: application/json\r\n"
		)
	);

	$ctx = stream_context_create($params); 
	$fp = @fopen('http://'.$host, 'rb', false, $ctx); 

	if (!$fp)
		die("Problem with $host\n");

	$response = @stream_get_contents($fp); 
	if ($response === false)
		die("Problem reading data from $url\n");

	return $response;
}

?>

