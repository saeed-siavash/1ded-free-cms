<?php
// Development server only. Apache uses .htaccess and index.php.
declare(strict_types=1);
if(PHP_SAPI!=='cli-server'){http_response_code(404);exit;}
$_SERVER['SCRIPT_NAME']=rtrim(getenv('CMS_BASE')?:'','/').'/index.php';
require __DIR__.'/index.php';
