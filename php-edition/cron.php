<?php
declare(strict_types=1);
if(PHP_SAPI!=='cli'){http_response_code(404);exit;}
define('CMS_ENTRY',true);
require __DIR__.'/app/core.php';require __DIR__.'/app/model.php';require __DIR__.'/app/security.php';require __DIR__.'/app/render.php';require __DIR__.'/app/maintenance.php';require __DIR__.'/app/restore-recovery.php';
if(!config()){fwrite(STDERR,"Install the CMS first.\n");exit(1);}
$lock=write_lock(private_dir());$store=new Store();recover_interrupted_restore($store);$schedule=$store->get('schedule');
if($schedule&&$schedule['status']==='pending'&&strtotime($schedule['at'])<=time()){
 try{publish($store,$schedule['actor']);$schedule['status']='complete';$schedule['finished']=stamp();$store->set('schedule',$schedule);echo "Website published.\n";}catch(Throwable $error){$schedule['status']='failed';$schedule['error']='Publication failed. Check PHP logs.';$store->set('schedule',$schedule);error_log('1DED cron: '.$error->getMessage());exit(1);}
}
