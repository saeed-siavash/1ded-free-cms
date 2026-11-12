<?php
declare(strict_types=1);
if(!defined('CMS_ENTRY')){http_response_code(404);exit;}
const CMS_VERSION='1.0.0-php';
const CMS_SCHEMA=1;
const CMS_ROOT=__DIR__.'/..';
final class CmsError extends RuntimeException{public function __construct(public int $status,string $message){parent::__construct($message);}}
function fail(int $status,string $message):never{throw new CmsError($status,$message);}
function uid():string{return bin2hex(random_bytes(16));}
function stamp():string{return gmdate('Y-m-d\TH:i:s\Z');}
function txt(mixed $value,int $limit=1000):string{return mb_substr(is_scalar($value)?trim((string)$value):'',0,$limit);}
function e(mixed $value):string{return htmlspecialchars((string)($value??''),ENT_QUOTES|ENT_SUBSTITUTE,'UTF-8');}
function catalog():array{static $data;return $data??=json_decode(file_get_contents(__DIR__.'/catalog.json'),true,64,JSON_THROW_ON_ERROR);}
function base_path():string{static $base;if($base!==null)return $base;if(PHP_SAPI==='cli'&&config())return $base=rtrim(parse_url(config()['url'],PHP_URL_PATH)?:'','/');return $base=rtrim(str_replace('\\','/',dirname($_SERVER['SCRIPT_NAME']??'/index.php')),'/.');}
function local_url(string $path):string{if(str_starts_with($path,'/')&&!str_starts_with($path,'//'))return base_path().$path;return $path;}
function tls():bool{return (!empty($_SERVER['HTTPS'])&&$_SERVER['HTTPS']!=='off')||(int)($_SERVER['SERVER_PORT']??0)===443;}
function localhost_request():bool{return in_array($_SERVER['REMOTE_ADDR']??'',['127.0.0.1','::1'],true);}
function request_origin():string{$host=$_SERVER['HTTP_HOST']??'localhost';if(!preg_match('/^[a-zA-Z0-9.\-\[\]:]+$/D',$host))fail(400,'Invalid host.');return (tls()?'https://':'http://').strtolower($host);}
function inside(string $root,string $path):bool{$root=strtolower(rtrim(str_replace('\\','/',$root),'/'));$path=strtolower(str_replace('\\','/',$path));return $path===$root||str_starts_with($path,$root.'/');}
function private_default():string{$doc=realpath($_SERVER['DOCUMENT_ROOT']??CMS_ROOT)?:realpath(CMS_ROOT);return dirname($doc).'/1ded-private-'.substr(hash('sha256',realpath(CMS_ROOT)),0,14);}
function atomic_write(string $path,string $content):void{$temp=$path.'.'.uid().'.tmp';if(file_put_contents($temp,$content,LOCK_EX)===false)fail(500,'Unable to write storage.');chmod($temp,0600);if(!rename($temp,$path)){@unlink($temp);fail(500,'Unable to commit storage.');}}
function config():?array{static $loaded=false,$config=null;if(!$loaded){$loaded=true;$path=__DIR__.'/installed.php';if(is_file($path)){$pointer=require $path;if(is_string($pointer)&&is_file($pointer))$config=require $pointer;}}return $config;}
function private_dir():string{$c=config();if(!$c)fail(503,'Install the CMS first.');return $c['private'];}
function database(array $config):PDO{
 if($config['driver']==='sqlite'){$db=new PDO('sqlite:'.$config['private'].'/cms.sqlite');$db->exec('PRAGMA busy_timeout=10000; PRAGMA foreign_keys=ON;');}
 else{$db=new PDO('mysql:host='.$config['host'].';port='.(int)$config['port'].';dbname='.$config['database'].';charset=utf8mb4',$config['username'],$config['password'],[PDO::ATTR_EMULATE_PREPARES=>false]);}
 $db->setAttribute(PDO::ATTR_ERRMODE,PDO::ERRMODE_EXCEPTION);$db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE,PDO::FETCH_ASSOC);return $db;
}
function schema(PDO $db):void{$mysql=$db->getAttribute(PDO::ATTR_DRIVER_NAME)==='mysql';$suffix=$mysql?' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci':'';
 $db->exec('CREATE TABLE IF NOT EXISTS cms_kv (name VARCHAR(100) PRIMARY KEY, value LONGTEXT NOT NULL)'.$suffix);
 $db->exec('CREATE TABLE IF NOT EXISTS cms_users (id VARCHAR(80) PRIMARY KEY,email VARCHAR(254) NOT NULL UNIQUE,hash VARCHAR(255) NOT NULL,role VARCHAR(20) NOT NULL,recovery VARCHAR(255) NOT NULL)'.$suffix);
 $db->exec('CREATE TABLE IF NOT EXISTS cms_sessions (hash VARCHAR(64) PRIMARY KEY,user_id VARCHAR(80) NOT NULL,csrf VARCHAR(64) NOT NULL,expires BIGINT NOT NULL)'.$suffix);
 $db->exec('CREATE TABLE IF NOT EXISTS cms_rates (id VARCHAR(64) PRIMARY KEY,hits INT NOT NULL,expires BIGINT NOT NULL)'.$suffix);
}
final class Store{
 public PDO $db;
 public function __construct(){ $this->db=database(config());$schema=$this->get('schema',0);if($schema!==CMS_SCHEMA)fail(503,'Unsupported database schema. Restore the matching CMS version.');}
 public function query(string $sql,array $params=[]):PDOStatement{$q=$this->db->prepare($sql);$q->execute($params);return $q;}
 public function get(string $name,mixed $fallback=null):mixed{$q=$this->db->prepare('SELECT value FROM cms_kv WHERE name=?');$q->execute([$name]);$s=$q->fetchColumn();return $s===false?$fallback:json_decode($s,true,128,JSON_THROW_ON_ERROR);}
 public function set(string $name,mixed $value):void{$json=json_encode($value,JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR);$q=$this->db->prepare('SELECT name FROM cms_kv WHERE name=?');$q->execute([$name]);if($q->fetch())$this->query('UPDATE cms_kv SET value=? WHERE name=?',[$json,$name]);else $this->query('INSERT INTO cms_kv(name,value) VALUES (?,?)',[$name,$json]);}
 public function tx(callable $fn):mixed{$this->db->beginTransaction();try{$r=$fn();$this->db->commit();return $r;}catch(Throwable $e){$this->db->rollBack();throw $e;}}
 public function audit(string $actor,string $action):void{$a=$this->get('audit',[]);array_unshift($a,['id'=>uid(),'created'=>stamp(),'actor'=>$actor,'action'=>$action]);$this->set('audit',array_slice($a,0,500));}
}
function write_lock(string $directory,bool $exclusive=true):mixed{$path=$directory.'/write.lock';$lock=fopen($path,'c');if(!$lock||!flock($lock,$exclusive?LOCK_EX:LOCK_SH))fail(503,'Storage is busy.');chmod($path,0600);return $lock;}
function password_make(mixed $password):string{if(!is_string($password)||strlen($password)<12||strlen($password)>256||str_contains($password,"\0"))fail(400,'Use a password of 12–256 bytes.');if(defined('PASSWORD_ARGON2ID'))return password_hash($password,PASSWORD_ARGON2ID);if(strlen($password)>72)fail(400,'This host supports passwords up to 72 bytes.');return password_hash($password,PASSWORD_DEFAULT);}
function limited(Store $store,string $purpose,int $limit,int $duration):void{$id=hash('sha256',$purpose.'|'.($_SERVER['REMOTE_ADDR']??'local'));$now=time();$store->query('DELETE FROM cms_rates WHERE expires<?',[$now]);$r=$store->query('SELECT * FROM cms_rates WHERE id=?',[$id])->fetch();if(!$r){if((int)$store->query('SELECT count(*) FROM cms_rates')->fetchColumn()>=10000)fail(429,'Rate-limit storage is full. Try again later.');$store->query('INSERT INTO cms_rates VALUES (?,?,?)',[$id,1,$now+$duration]);}else{if((int)$r['hits']>=$limit)fail(429,'Too many attempts. Try again later.');$store->query('UPDATE cms_rates SET hits=hits+1 WHERE id=?',[$id]);}}
function json_response(mixed $data,int $status=200):never{http_response_code($status);header('Content-Type: application/json; charset=utf-8');header('Cache-Control: no-store');echo json_encode($data,JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR);exit;}
function input_json(int $max=2097152):array{if((int)($_SERVER['CONTENT_LENGTH']??0)>$max)fail(413,'Request is too large.');$raw=file_get_contents('php://input',false,null,0,$max+1);if(strlen($raw)>$max)fail(413,'Request is too large.');try{$data=json_decode($raw?:'{}',true,64,JSON_THROW_ON_ERROR);}catch(Throwable){fail(400,'Invalid JSON.');}if(!is_array($data))fail(400,'Expected an object.');return $data;}
function origin_check():void{$expected=parse_url(config()['url'],PHP_URL_SCHEME).'://'.parse_url(config()['url'],PHP_URL_HOST);$port=parse_url(config()['url'],PHP_URL_PORT);if($port)$expected.=':'.$port;if(strtolower($_SERVER['HTTP_ORIGIN']??'')!==strtolower($expected))fail(403,'Cross-origin request blocked.');}
function auth(Store $store,bool $owner=false):array{$raw=$_COOKIE['cms_php_session']??'';if(!is_string($raw)||!preg_match('/^[a-f0-9]{64}$/D',$raw))fail(401,'Please sign in.');$s=$store->query('SELECT s.*,u.email,u.role FROM cms_sessions s JOIN cms_users u ON u.id=s.user_id WHERE s.hash=? AND s.expires>?',[hash('sha256',$raw),time()])->fetch();if(!$s)fail(401,'Please sign in.');if($owner&&$s['role']!=='owner')fail(403,'Only the owner can do this.');if(!in_array($_SERVER['REQUEST_METHOD'],['GET','HEAD'],true)&&!hash_equals($s['csrf'],$_SERVER['HTTP_X_CSRF_TOKEN']??''))fail(403,'Session verification failed.');return $s;}
function owner(array $session):void{if($session['role']!=='owner')fail(403,'Only the owner can do this.');}
function session_cookie(string $value,int $age):void{setcookie('cms_php_session',$value,['expires'=>$age?time()+$age:1,'path'=>base_path().'/'?:'/','secure'=>tls(),'httponly'=>true,'samesite'=>'Strict']);}
function record_history(Store $store,array $page,string $actor):void{$all=$store->get('history',[]);$rows=$all[$page['id']]??[];array_unshift($rows,['id'=>uid(),'created'=>stamp(),'actor'=>$actor,'snapshot'=>$page]);$all[$page['id']]=array_slice($rows,0,30);$store->set('history',$all);}
function file_response(string $path,string $type):never{if(!is_file($path))fail(404,'File not found.');header('Content-Type: '.$type);header('X-Content-Type-Options: nosniff');readfile($path);exit;}
function mime(string $path):string{return match(strtolower(pathinfo($path,PATHINFO_EXTENSION))){'css'=>'text/css; charset=utf-8','js'=>'text/javascript; charset=utf-8','jpg','jpeg'=>'image/jpeg','png'=>'image/png','webp'=>'image/webp','gif'=>'image/gif','ico'=>'image/x-icon','xml'=>'application/xml; charset=utf-8','json'=>'application/json; charset=utf-8','txt'=>'text/plain; charset=utf-8',default=>'text/html; charset=utf-8'};}
