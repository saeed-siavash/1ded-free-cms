<?php
// Run only against a disposable installed fixture supplied by integration.mjs.
declare(strict_types=1);
if(PHP_SAPI!=='cli'||empty($argv[1]))exit(1);
define('CMS_ENTRY',true);
foreach(['core','model','security','render','maintenance','restore-recovery'] as $name)require $argv[1].'/app/'.$name.'.php';
$lock=write_lock(private_dir());$store=new Store();
function check(bool $ok,string $message):void{if(!$ok)throw new RuntimeException($message);}
$originalKey=random_bytes(32);atomic_write(private_dir().'/mfa.key',$originalKey);
foreach(range(0,5) as $boundary){
 $id=uid();$stage='restore-'.uid();$old='before-restore-'.uid();mkdir(private_dir().'/'.$stage,0700);mkdir(private_dir().'/'.$old,0700);
 foreach(['media','originals'] as $name){mkdir(private_dir().'/'.$stage.'/'.$name,0700);atomic_write(private_dir().'/'.$name.'/recovery-fixture.txt','old');atomic_write(private_dir().'/'.$stage.'/'.$name.'/recovery-fixture.txt','new');}
 restore_journal(['id'=>$id,'stage'=>$stage,'old'=>$old,'previousKey'=>base64_encode($originalKey),'incomingCurrent'=>$store->get('current')]);
 $moves=[['media',$old.'/media'],['originals',$old.'/originals'],[$stage.'/media','media'],[$stage.'/originals','originals']];
 foreach($moves as $i=>[$from,$to])if($boundary>$i)move_private(private_dir().'/'.$from,private_dir().'/'.$to);
 if($boundary>=4)atomic_write(private_dir().'/mfa.key',random_bytes(32));
 if($boundary===5){$store->tx(function()use($store,$id){$store->set('restoreOperation',$id);$store->set('current',null);});}
 recover_interrupted_restore($store);recover_interrupted_restore($store);
 foreach(['media','originals'] as $name){check(file_get_contents(private_dir().'/'.$name.'/recovery-fixture.txt')===($boundary===5?'new':'old'),'Wrong image generation at boundary '.$boundary);unlink(private_dir().'/'.$name.'/recovery-fixture.txt');}
 if($boundary<5)check(hash_equals($originalKey,file_get_contents(private_dir().'/mfa.key')),'MFA key was not rolled back');
 else{check((bool)$store->get('current'),'Committed restore did not recreate publication');atomic_write(private_dir().'/mfa.key',$originalKey);}
 check(!is_file(restore_journal_path())&&!is_dir(private_dir().'/'.$stage)&&!is_dir(private_dir().'/'.$old),'Recovery residue remains');
}
echo "Restore journal: six interruption boundaries and repeated recovery passed.\n";
