<?php
declare(strict_types=1);
if(!defined('CMS_ENTRY'))exit;
// Local checks only. Never contact an update server or disclose absolute paths.
function release_integrity(string $root):array{
 $file=$root.'/release.json';if(!is_file($file))return ['status'=>'warning','message'=>'Release manifest is missing; file integrity cannot be checked.'];
 try{$manifest=json_decode(file_get_contents($file),true,32,JSON_THROW_ON_ERROR);$files=$manifest['files']??null;if(!is_array($files)||!$files||count($files)>5000)throw new RuntimeException();$changed=[];$missing=[];
 foreach($files as $name=>$hash){if(!is_string($name)||!preg_match('~^[A-Za-z0-9_.-]+(?:/[A-Za-z0-9_.-]+)*$~D',$name)||in_array('..',explode('/',$name),true)||!is_string($hash)||!preg_match('/^[a-f0-9]{64}$/D',$hash))throw new RuntimeException();$path=$root.'/'.$name;$real=realpath($path);if(!$real||!is_file($path)){$missing[]=$name;continue;}if(!inside(realpath($root),$real)||is_link($path)||!hash_equals($hash,hash_file('sha256',$path)))$changed[]=$name;}
 return ['status'=>$missing||$changed?'warning':'pass','message'=>$missing||$changed?'Some packaged files are missing or changed. Review before updating.':'Packaged files match the local release manifest.','checked'=>count($files),'missing'=>$missing,'changed'=>$changed,'manifestVersion'=>txt($manifest['version']??'',60)];
 }catch(Throwable){return ['status'=>'warning','message'=>'Release manifest is invalid; integrity could not be checked.'];}
}
function hosting_health(Store $s):array{
 $checks=[];$add=function(string $id,string $label,string $status,string $message)use(&$checks){$checks[]=['id'=>$id,'label'=>$label,'status'=>$status,'message'=>$message];};
 $add('php','PHP version',version_compare(PHP_VERSION,'8.3','>=')?'pass':'error','Running PHP '.PHP_VERSION.'. Keep the hosting provider’s security patches current.');
 $missing=[];foreach(['gd','fileinfo','mbstring','openssl'] as $extension)if(!extension_loaded($extension))$missing[]=$extension;if(!class_exists('ZipArchive'))$missing[]='zip';
 $add('extensions','Required extensions',$missing?'error':'pass',$missing?'Missing: '.implode(', ',$missing):'Image processing, file detection, text, encryption and ZIP support are available.');
 $root=realpath($_SERVER['DOCUMENT_ROOT']??CMS_ROOT)?:realpath(CMS_ROOT);$private=realpath(private_dir());$outside=$private&&!inside($root,$private)&&!inside(realpath(CMS_ROOT),$private);
 $add('private','Private storage',$outside?'pass':'error',$outside?'Outside this site’s reported public root. Also verify addon-domain roots in File Manager.':'Private storage appears to be inside a public root. Ask your host to correct this.');
 $writable=true;foreach(['','/media','/originals','/backups','/releases'] as $directory)if(!is_writable(private_dir().$directory))$writable=false;
 $add('storage','Storage permissions',$writable?'pass':'error',$writable?'Required private directories are writable.':'A required private directory is not writable. Check ownership with your host; avoid world-writable permissions.');
 $add('https','HTTPS',tls()?'pass':'warning',tls()?'This request uses HTTPS.':'This request uses HTTP. Enable HTTPS before using a public installation.');
 $integrity=release_integrity(CMS_ROOT);$add('integrity','Application file integrity',$integrity['status'],$integrity['message'].' This is a local comparison, not proof of publisher authenticity.');
 $newest=0;$count=0;foreach(new DirectoryIterator(private_dir().'/backups') as $file){if($file->isFile()&&!$file->isLink()&&preg_match('/^backup-.*\.zip$/D',$file->getFilename())){$count++;$newest=max($newest,$file->getMTime());}}
 $recent=$newest&&time()-$newest<=7*86400;$add('backup','Full backups',$recent?'pass':'warning',$newest?('Latest local full backup: '.gmdate('Y-m-d H:i',$newest).' UTC. Download an off-host copy and test restoring it.'):'No local full backup found. Create one in Updates & backups and save an off-host copy.');
 $owners=$s->query("SELECT id FROM cms_users WHERE role='owner'")->fetchAll();$protected=0;foreach($owners as $owner)if(mfa_enabled($s,$owner['id']))$protected++;
 $add('mfa','Owner two-factor authentication',$protected===count($owners)&&$protected>0?'pass':'warning',$protected.' of '.count($owners).' owner accounts have authenticator MFA enabled.');
 $current=$s->get('current');$valid=is_string($current)&&preg_match('/^[a-f0-9]{32}$/D',$current)&&is_file(private_dir().'/releases/'.$current.'/index.html');
 $add('publication','Published website',$valid?'pass':'warning',$valid?'A published homepage is available.':'No published homepage is available. Review the draft and publish.');
 $add('updates','Update authenticity','warning','Signed automatic updates are not available. Obtain releases from the trusted project source and back up before manual updates.');
 return ['edition'=>'PHP','version'=>CMS_VERSION,'php'=>PHP_VERSION,'database'=>$s->db->getAttribute(PDO::ATTR_DRIVER_NAME),'privateStorageOutsideWebRoot'=>(bool)$outside,'https'=>tls(),'gd'=>extension_loaded('gd'),'zip'=>class_exists('ZipArchive'),'signedUpdates'=>false,'checkedAt'=>stamp(),'checks'=>$checks,'integrity'=>$integrity,'localBackups'=>$count,'cron'=>'Configure cron.php in your hosting control panel. This report does not confirm cron execution.'];
}
