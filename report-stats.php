<?php
// test script to report to central server.
// Written in PHP as BASH is terrible to create JSON with
// and node is too asynchronous to easily run commands
// in the shell

/* TODO
  * Uptime in days
  * CPU usage in %
  * RAM usage in GB
  * Aggregate disk usage in GB
  * Temperatures
  * Network up/down
  * Total up/down this month (if there is a limit)
  * Location, CPU type
*/

$host = 'snowstorm';

$totalGB = round(disk_total_space('/')/1073741824,1);

// send initial attrs
sendAttrs($host,array (
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
	)
));


while(1){
	$uptime = preg_split('/\s+/',trim(exec('uptime')));
	$days = floor(end(preg_split('/\s+/',trim(exec('cat /proc/uptime'))))/86400);

	$pcount = exec("cat /proc/cpuinfo | grep processor | wc -l");

	$freeGB = round(disk_free_space('/')/1073741824,1);
	
	sendAttrs($host,array(
		'uptime' =>  $days,
		'CPU Load' => floor($uptime[9]*100/$pcount),
		'Disk usage' => $totalGB-$freeGB,
	));

	sleep(1);
}


function sendAttrs ($host,$attrs){
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

