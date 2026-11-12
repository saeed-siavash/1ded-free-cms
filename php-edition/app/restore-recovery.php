<?php
declare(strict_types=1);
if(!defined('CMS_ENTRY'))exit;
// The journal is written before any live file is moved. The transaction's marker
// decides whether recovery rolls files back or finishes the committed restore.
function restore_journal_path():string{return private_dir().'/restore-journal.json';}
function restore_journal(array $record):void{atomic_write(restore_journal_path(),json_encode($record,JSON_THROW_ON_ERROR));}
function recover_interrupted_restore(Store $store):void{
 if(!is_file(restore_journal_path()))return;
 $j=json_decode(file_get_contents(restore_journal_path()),true,32,JSON_THROW_ON_ERROR);
 if(!is_array($j)||!preg_match('/^[a-f0-9]{32}$/D',$j['id']??'')||!preg_match('/^restore-[a-f0-9]{32}$/D',$j['stage']??'')||!preg_match('/^before-restore-[a-f0-9]{32}$/D',$j['old']??''))fail(503,'Restore recovery needs administrator attention. Preserve private storage and contact your host.');
 $old=private_dir().'/'.$j['old'];$stage=private_dir().'/'.$j['stage'];
 if($store->get('restoreOperation')!==$j['id']){
  foreach(['media','originals'] as $name)if(is_dir($old.'/'.$name)){if(is_dir(private_dir().'/'.$name))remove_private_tree(private_dir().'/'.$name);move_private($old.'/'.$name,private_dir().'/'.$name);}
  if(($j['previousKey']??null)!==null){$key=base64_decode($j['previousKey'],true);if($key===false||strlen($key)!==32)fail(503,'Restore recovery key is invalid.');atomic_write(private_dir().'/mfa.key',$key);}elseif(is_file(private_dir().'/mfa.key'))unlink(private_dir().'/mfa.key');
  $store->query('DELETE FROM cms_sessions');
 }else{
  // Re-create the old published snapshot from the restored backup, not drafts.
  if(!$store->get('current')){foreach($store->get('revisions',[]) as $revision)if(($revision['id']??null)===($j['incomingCurrent']??null)){publish($store,'restore recovery',$revision['snapshot']);break;}}
 }
 if(is_dir($stage))remove_private_tree($stage);
 // Keep the old images until publication and cleanup both succeed.
 if(is_dir($old))remove_private_tree($old);
 if(!unlink(restore_journal_path()))fail(503,'Could not finish restore recovery. Check private storage permissions.');
}
