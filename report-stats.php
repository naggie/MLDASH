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
  * NOT time
*/

$host = 'snowstorm';

// dir to calc disk usage. May be auto generated to find
// largest mount
$dir = '/srv/';

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
		'max' => shell_exec("free -m | grep 'Mem:' | awk '{print $2}'"),
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


sendAttrs($host,$init);

while(1){
	$uptime = preg_split('/\s+/',trim(exec('uptime')));
	$days = floor(end(preg_split('/\s+/',trim(exec('cat /proc/uptime'))))/86400);

	$pcount = exec("cat /proc/cpuinfo | grep processor | wc -l");

	$freeGB = round(disk_free_space($dir)/1073741824,1);

	$update = array(
		'uptime' =>  $days,
		'CPU Load' => floor($uptime[9]*100/$pcount),
		'Disk usage' => $totalGB-$freeGB,
//		'Time' => date('h:i:s'),
		'RAM Usage' => shell_exec("free -m | grep -E '\-\/\+' | awk '{print $3}'"),
	);

	if (isset($init['Temperature']))
		$update['Temperature'] = shell_exec("sensors -u | grep input | grep temp | grep -oE '[0-9]{1,2}\.' | grep -oE '[0-9]+' | sort -g | tail -n 1");

	sendAttrs($host,$update);

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

