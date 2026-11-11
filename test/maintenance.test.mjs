import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp,rm,mkdir,readFile,writeFile,readdir,cp,stat } from 'node:fs/promises';
import { join,dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { DatabaseSync } from 'node:sqlite';
import { openStore } from '../lib/store.mjs';
import { applyUpdate,makeReleaseManifest,fullBackup,restoreBackup,acquireLock,extractZip,CODE_ROOTS,VERSION } from '../lib/maintenance.mjs';
import { zipDirectory } from '../lib/zip.mjs';

const root=dirname(dirname(fileURLToPath(import.meta.url)));
test('legacy schema migration preserves records and writes a pre-migration backup',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'1ded-legacy-'));try{const db=new DatabaseSync(join(dir,'cms.sqlite'));db.exec("CREATE TABLE users(id TEXT PRIMARY KEY,email TEXT,hash TEXT,role TEXT);CREATE TABLE kv(key TEXT PRIMARY KEY,value TEXT NOT NULL);INSERT INTO users VALUES('old','legacy@example.com','preserved-hash','owner');INSERT INTO kv VALUES('pages','[{\"id\":\"home\",\"title\":\"Original home\"}]');");db.close();const store=openStore(dir);assert.equal(store.db.prepare('PRAGMA user_version').get().user_version,2);assert.equal(store.db.prepare('SELECT hash FROM users').get().hash,'preserved-hash');assert.equal(store.get('pages')[0].title,'Original home');assert.equal((await readdir(join(dir,'migration-backups'))).length,1);store.db.close();const original=new DatabaseSync(join(dir,'migration-backups',(await readdir(join(dir,'migration-backups')))[0]));assert.equal(original.prepare('PRAGMA user_version').get().user_version,0);original.close();}finally{await rm(dir,{recursive:true,force:true});}
});
test('newer database schema is refused without being changed',async()=>{const dir=await mkdtemp(join(tmpdir(),'1ded-future-'));try{const db=new DatabaseSync(join(dir,'cms.sqlite'));db.exec('PRAGMA user_version=99');db.close();assert.throws(()=>openStore(dir),/newer/);const after=new DatabaseSync(join(dir,'cms.sqlite'));assert.equal(after.prepare('PRAGMA user_version').get().user_version,99);after.close();}finally{await rm(dir,{recursive:true,force:true});}});
test('offline updater preserves database, images, .env, and recovery backup; rejects running/damaged updates',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'1ded-update-')),installed=join(dir,'installed'),source=join(dir,'new-release'),data=join(installed,'data');
 try{
  await mkdir(installed);await mkdir(source);for(const name of CODE_ROOTS){try{await cp(join(root,name),join(source,name),{recursive:true});}catch(e){if(e.code!=='ENOENT')throw e;}}
  await writeFile(join(installed,'package.json'),JSON.stringify({name:'1ded-free-cms',version:'0.3.0'}));await writeFile(join(installed,'server.mjs'),'// original code');await writeFile(join(installed,'.env'),'PRIVATE_CONFIG=keep-me');
  const store=openStore(data);store.set('pages',[{id:'home',title:'My existing biography',slug:'',sections:[]}]);store.set('media',[{id:'12345678-1234-1234-1234-123456789abc.png',url:'/media/12345678-1234-1234-1234-123456789abc.png'}]);store.db.prepare('INSERT INTO users VALUES (?,?,?,?)').run('owner','same@example.com','unchanged-password-hash','owner');store.db.close();await mkdir(join(data,'media'));await mkdir(join(data,'releases'));const image=Buffer.from('precious-original-image-bytes');await writeFile(join(data,'media','12345678-1234-1234-1234-123456789abc.png'),image);
  await makeReleaseManifest(source);const archive=join(dir,'release.zip');await writeFile(archive,await zipDirectory(source));
  const unlock=await acquireLock(data);await assert.rejects(()=>applyUpdate({appDir:installed,dataDir:data,archive}),/running/);await unlock();
  await writeFile(join(source,'server.mjs'),'// unexpected tampering');const corrupt=join(dir,'corrupt.zip');await writeFile(corrupt,await zipDirectory(source));await assert.rejects(()=>applyUpdate({appDir:installed,dataDir:data,archive:corrupt}),/integrity/);assert.equal(await readFile(join(installed,'server.mjs'),'utf8'),'// original code');
  const result=await applyUpdate({appDir:installed,dataDir:data,archive});assert.equal(result.version,VERSION);assert.equal(await readFile(join(installed,'.env'),'utf8'),'PRIVATE_CONFIG=keep-me');assert.deepEqual(await readFile(join(data,'media','12345678-1234-1234-1234-123456789abc.png')),image);assert.ok((await stat(join(result.backup,'application','server.mjs'))).isFile());const migrated=openStore(data);assert.equal(migrated.get('pages')[0].title,'My existing biography');assert.equal(migrated.db.prepare('SELECT hash FROM users').get().hash,'unchanged-password-hash');migrated.db.close();await assert.rejects(()=>applyUpdate({appDir:installed,dataDir:data,archive}),/newer release/);
  const fullDirectory=await fullBackup(data,join(dir,'full'));const full=join(dir,'extracted-full-backup');await extractZip(await zipDirectory(fullDirectory),full);const changed=openStore(data);changed.set('pages',[{id:'home',title:'Changed later'}]);changed.db.close();await restoreBackup({dataDir:data,source:full});const restored=openStore(data);assert.equal(restored.get('pages')[0].title,'My existing biography');restored.db.close();assert.deepEqual(await readFile(join(data,'media','12345678-1234-1234-1234-123456789abc.png')),image);
 }finally{await rm(dir,{recursive:true,force:true});}
});
test('ZIP extraction checks CRC and refuses unsafe filenames',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'1ded-zip-'));try{const src=join(dir,'source');await mkdir(src);await writeFile(join(src,'safe.txt'),'hello');let zip=await zipDirectory(src);const corrupt=Buffer.from(zip);corrupt[30+Buffer.byteLength('safe.txt')]^=0xff;await assert.rejects(()=>extractZip(corrupt,join(dir,'bad-crc')),/integrity/);const unsafe=Buffer.from(zip);for(let at=0;(at=unsafe.indexOf(Buffer.from('safe.txt'),at))>=0;at+=8)unsafe.write('../x.txt',at);await assert.rejects(()=>extractZip(unsafe,join(dir,'bad-path')),/Unsafe/);await extractZip(zip,join(dir,'good'));assert.equal(await readFile(join(dir,'good','safe.txt'),'utf8'),'hello');}finally{await rm(dir,{recursive:true,force:true});}
});
