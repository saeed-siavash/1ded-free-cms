import { readFile, writeFile, mkdir, cp, readdir, lstat, rename, rm, open } from 'node:fs/promises';
import { existsSync,readFileSync } from 'node:fs';
import { resolve, join, dirname, relative, isAbsolute } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { DatabaseSync, backup } from 'node:sqlite';
import { inflateRawSync } from 'node:zlib';
import { crc32, zipDirectory } from './zip.mjs';
import { SCHEMA_VERSION } from './migrations.mjs';

export const VERSION=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8')).version;
export const CODE_ROOTS=['server.mjs','cli.mjs','package.json','Dockerfile','compose.yaml','.dockerignore','.env.example','.gitignore','README.md','LICENSE','SECURITY.md','CONTRIBUTING.md','CHANGELOG.md','release.json','lib','public','test','docs','.github'];
const sha = b => createHash('sha256').update(b).digest('hex');
const inside=(root,path)=>{const r=relative(resolve(root),resolve(path));return r!==''&&!r.startsWith('..')&&!isAbsolute(r);};
const stamp=()=>new Date().toISOString().replace(/[:.]/g,'-')+'-'+randomUUID().slice(0,8);
export async function acquireLock(dataDir) {
  await mkdir(dataDir,{recursive:true});const path=join(dataDir,'process.lock');
  for(let attempt=0;attempt<2;attempt++) {
    try { const fd=await open(path,'wx',0o600);await fd.writeFile(JSON.stringify({pid:process.pid,token:randomUUID()}));await fd.close();return async()=>{try{const entry=JSON.parse(await readFile(path,'utf8'));if(entry.pid===process.pid)await rm(path);}catch(e){if(e.code!=='ENOENT')throw e;}}; }
    catch(error) { if(error.code!=='EEXIST')throw error;let entry;try{entry=JSON.parse(await readFile(path,'utf8'));}catch{throw new Error('Cannot read process.lock. Check that the CMS is stopped before repairing the lock.');}try{process.kill(entry.pid,0);}catch(e){if(e.code==='ESRCH'){await rm(path);continue;}throw new Error('Cannot verify the CMS process. Stop it before maintenance.');}throw new Error('The CMS is running. Stop it before updating or restoring.'); }
  }
  throw new Error('Could not acquire the maintenance lock.');
}
export async function fullBackup(dataDir,destination,{appDir}={}) {
  const dest=resolve(destination),data=resolve(dataDir);
  if(dest===data||inside(data,dest))throw new Error('Backups must be stored outside the live data directory.');
  if(!existsSync(join(data,'cms.sqlite')))throw new Error('No installed database at DATA_DIR.');
  await mkdir(dirname(dest),{recursive:true});await mkdir(dest,{recursive:false});
  const db=new DatabaseSync(join(data,'cms.sqlite'),{readOnly:true});
  try {await backup(db,join(dest,'cms.sqlite'));}finally{db.close();}
  for(const entry of await readdir(data,{withFileTypes:true})) {
    if(['cms.sqlite','cms.sqlite-wal','cms.sqlite-shm','process.lock','backup.sqlite'].includes(entry.name))continue;
    if(entry.isSymbolicLink())throw new Error('Backup refuses symbolic links inside the data directory.');
    await cp(join(data,entry.name),join(dest,entry.name),{recursive:entry.isDirectory(),dereference:false});
  }
  await writeFile(join(dest,'backup.json'),JSON.stringify({format:1,version:VERSION,created:new Date().toISOString(),schema:SCHEMA_VERSION},null,2));
  if(appDir){const code=join(dest,'application');await mkdir(code);for(const name of CODE_ROOTS)if(existsSync(join(appDir,name)))await cp(join(appDir,name),join(code,name),{recursive:true});}
  return dest;
}
// Central-directory based ZIP reader; supports store and deflate. No executables run.
export async function extractZip(buffer,destination) {
  if(buffer.length>256*1024*1024)throw new Error('Archive exceeds 256 MB.');
  let end=-1;for(let i=buffer.length-22;i>=Math.max(0,buffer.length-65557);i--)if(buffer.readUInt32LE(i)===0x06054b50){end=i;break;}
  if(end<0)throw new Error('Invalid ZIP archive.');
  const count=buffer.readUInt16LE(end+10);let cursor=buffer.readUInt32LE(end+16),total=0;const names=new Set();
  if(buffer.readUInt16LE(end+4)||buffer.readUInt16LE(end+6)||count===65535||count>10000)throw new Error('Unsupported ZIP format.');
  await mkdir(destination,{recursive:true});
  for(let i=0;i<count;i++) {
    if(cursor+46>end||buffer.readUInt32LE(cursor)!==0x02014b50)throw new Error('Invalid ZIP directory.');
    const flags=buffer.readUInt16LE(cursor+8),method=buffer.readUInt16LE(cursor+10),crc=buffer.readUInt32LE(cursor+16),compressed=buffer.readUInt32LE(cursor+20),size=buffer.readUInt32LE(cursor+24),n=buffer.readUInt16LE(cursor+28),extra=buffer.readUInt16LE(cursor+30),comment=buffer.readUInt16LE(cursor+32),offset=buffer.readUInt32LE(cursor+42),mode=buffer.readUInt32LE(cursor+38)>>>16;
    if(cursor+46+n+extra+comment>end)throw new Error('Invalid ZIP entry.');
    const name=buffer.subarray(cursor+46,cursor+46+n).toString('utf8');cursor+=46+n+extra+comment;
    if(!name||name.includes('\\')||name.includes('\0')||name.includes(':')||name.startsWith('/')||name.split('/').some(x=>x==='..'||x==='.')||(mode&0xf000)===0xa000||names.has(name.toLowerCase()))throw new Error('Unsafe or duplicate ZIP path.');
    names.add(name.toLowerCase());const dest=resolve(destination,name);if(!inside(destination,dest))throw new Error('ZIP path escapes destination.');
    if(flags&1||![0,8].includes(method)||size>64*1024*1024||(total+=size)>512*1024*1024)throw new Error('Unsupported or oversized ZIP entry.');
    if(name.endsWith('/')){await mkdir(dest,{recursive:true});continue;}
    if(offset+30>buffer.length||buffer.readUInt32LE(offset)!==0x04034b50)throw new Error('Invalid ZIP local header.');
    const localNameLength=buffer.readUInt16LE(offset+26),localExtra=buffer.readUInt16LE(offset+28),start=offset+30+localNameLength+localExtra;
    if(start+compressed>buffer.length||buffer.subarray(offset+30,offset+30+localNameLength).toString('utf8')!==name)throw new Error('ZIP entry mismatch.');
    const raw=buffer.subarray(start,start+compressed),data=method===0?raw:inflateRawSync(raw,{maxOutputLength:Math.max(1,size)});
    if(data.length!==size||crc32(data)!==crc)throw new Error('ZIP integrity check failed.');
    await mkdir(dirname(dest),{recursive:true});await writeFile(dest,data,{flag:'wx'});
  }
}
export async function makeReleaseManifest(appDir) {
  const files={};async function walk(dir,prefix=''){for(const e of await readdir(dir,{withFileTypes:true})){const path=prefix+e.name;if(!prefix&&!CODE_ROOTS.includes(e.name)||path==='release.json')continue;if(e.isSymbolicLink())throw new Error('Release cannot include symlinks.');if(e.isDirectory())await walk(join(dir,e.name),path+'/');else files[path]=sha(await readFile(join(dir,e.name)));}}
  await walk(appDir);const manifest={project:'1DED Free CMS',version:VERSION,minNode:24,schema:SCHEMA_VERSION,minSchema:0,files};await writeFile(join(appDir,'release.json'),JSON.stringify(manifest,null,2)+'\n');return manifest;
}
export async function applyUpdate({appDir,dataDir,archive,backupRoot}) {
  appDir=resolve(appDir);dataDir=resolve(dataDir);
  const unlock=await acquireLock(dataDir),stage=join(dirname(appDir),'.1ded-update-'+randomUUID());let safety;
  try {
    await extractZip(await readFile(archive),stage);
    let source=stage;if(!existsSync(join(source,'release.json'))){const entries=await readdir(stage,{withFileTypes:true});if(entries.length===1&&entries[0].isDirectory())source=join(stage,entries[0].name);}
    const manifest=JSON.parse(await readFile(join(source,'release.json'),'utf8'));
    if(manifest.project!=='1DED Free CMS'||manifest.minNode>Number(process.versions.node.split('.')[0])||!/^\d+\.\d+\.\d+$/.test(manifest.version)||!Number.isInteger(manifest.schema)||manifest.schema<0||!Number.isInteger(manifest.minSchema)||manifest.minSchema<0||!manifest.files||Object.keys(manifest.files).length>10000)throw new Error('Incompatible release manifest.');
    const current=JSON.parse(await readFile(join(appDir,'package.json'),'utf8')).version;
    const numeric=v=>v.split('.').reduce((a,b)=>a*10000+Number(b),0);if(numeric(manifest.version)<=numeric(current))throw new Error('This command only accepts a newer release. Use a full restore to downgrade.');
    const db=new DatabaseSync(join(dataDir,'cms.sqlite'));let schema;try{schema=db.prepare('PRAGMA user_version').get().user_version;}finally{db.close();}
    if(schema>manifest.schema||schema<manifest.minSchema)throw new Error('This release does not support the installed database schema.');
    const all=[];async function inventory(dir,prefix=''){for(const e of await readdir(dir,{withFileTypes:true})){if(e.isSymbolicLink())throw new Error('Release cannot include symlinks.');if(e.isDirectory())await inventory(join(dir,e.name),prefix+e.name+'/');else all.push(prefix+e.name);}}await inventory(source);
    for(const name of all){if(!CODE_ROOTS.includes(name.split('/')[0])||['data','backups','.env'].includes(name.split('/')[0]))throw new Error('Release contains files outside the application boundary.');if(name!=='release.json'&&(!manifest.files[name]||sha(await readFile(join(source,name)))!==manifest.files[name]))throw new Error(`Release integrity mismatch: ${name}`);}
    for(const name of Object.keys(manifest.files)){if(!all.includes(name)||!inside(source,join(source,name)))throw new Error('Release manifest references missing or unsafe files.');}
    for(const required of ['server.mjs','cli.mjs','package.json','lib/migrations.mjs'])if(!manifest.files[required])throw new Error('Incomplete release.');
    const pkg=JSON.parse(await readFile(join(source,'package.json'),'utf8'));if(pkg.version!==manifest.version)throw new Error('Release version mismatch.');
    async function rejectSymlinks(dir){for(const e of await readdir(dir,{withFileTypes:true})){if(e.isSymbolicLink())throw new Error('Application contains a symbolic link; use a normal application directory.');if(e.isDirectory())await rejectSymlinks(join(dir,e.name));}}
    for(const name of CODE_ROOTS)if(existsSync(join(appDir,name))){const meta=await lstat(join(appDir,name));if(meta.isSymbolicLink())throw new Error('Application path is a symbolic link.');if(meta.isDirectory())await rejectSymlinks(join(appDir,name));}
    safety=await fullBackup(dataDir,join(backupRoot||join(dirname(dataDir),'1ded-update-backups'),stamp()),{appDir});
    // Never copy data/, .env, arbitrary files, or uploads from a release.
    for(const name of CODE_ROOTS){if(!existsSync(join(source,name)))continue;const target=join(appDir,name);if(existsSync(target)&&(await lstat(target)).isSymbolicLink())throw new Error('Application path is a symbolic link.');await cp(join(source,name),target,{recursive:true});}
    await writeFile(join(dataDir,'last-update.json'),JSON.stringify({from:current,to:manifest.version,backup:safety,created:new Date().toISOString()},null,2));
    return {version:manifest.version,backup:safety};
  } catch(error) {
    if(safety){try{for(const name of CODE_ROOTS)if(existsSync(join(safety,'application',name)))await cp(join(safety,'application',name),join(appDir,name),{recursive:true});}catch(restoreError){throw new Error(`${error.message}; automatic code recovery failed: ${restoreError.message}. Restore ${safety} manually.`);}}
    throw error;
  } finally {await rm(stage,{recursive:true,force:true});await unlock();}
}
export async function restoreBackup({dataDir,source,backupRoot}) {
  dataDir=resolve(dataDir);source=resolve(source);
  if(source===dataDir||inside(dataDir,source)||inside(source,dataDir))throw new Error('Restore source must be separate from live data.');
  const unlock=await acquireLock(dataDir);const stage=join(dirname(dataDir),'.1ded-restore-'+randomUUID());let safety;
  try {
    if(!existsSync(join(source,'cms.sqlite')))throw new Error('Backup has no database.');
    const db=new DatabaseSync(join(source,'cms.sqlite'),{readOnly:true});try{if(db.prepare('PRAGMA integrity_check').get().integrity_check!=='ok')throw new Error('Backup database is damaged.');if(db.prepare('PRAGMA user_version').get().user_version>SCHEMA_VERSION)throw new Error('Install matching newer application code before restoring this database.');if(!db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='kv'").get())throw new Error('Not a CMS database.');const mediaRow=db.prepare("SELECT value FROM kv WHERE key='media'").get();for(const item of mediaRow?JSON.parse(mediaRow.value):[]){if(!/^[a-f0-9-]+\.(png|jpg|webp|gif)$/.test(item.id)||!existsSync(join(source,'media',item.id)))throw new Error('Backup is missing an uploaded image.');}const currentRow=db.prepare("SELECT value FROM kv WHERE key='current'").get();if(currentRow){const current=JSON.parse(currentRow.value);if(current&&(!/^[a-f0-9-]{36}$/.test(current)||!existsSync(join(source,'releases',current,'index.html'))))throw new Error('Backup is missing the current publication.');}}finally{db.close();}
    for(const name of ['media','releases'])if(!existsSync(join(source,name)))throw new Error(`Full backup is missing ${name}.`);
    await mkdir(stage);await cp(join(source,'cms.sqlite'),join(stage,'cms.sqlite'));for(const name of ['media','releases','migration-backups'])if(existsSync(join(source,name)))await cp(join(source,name),join(stage,name),{recursive:true});
    const restored=new DatabaseSync(join(stage,'cms.sqlite'));try{restored.exec('DELETE FROM sessions');}finally{restored.close();}
    safety=await fullBackup(dataDir,join(backupRoot||join(dirname(dataDir),'1ded-update-backups'),'before-restore-'+stamp()));
    // A complete staging copy exists before the live directory is touched.
    const old=join(dirname(dataDir),'.1ded-before-restore-'+randomUUID());await rename(dataDir,old);try{await rename(stage,dataDir);}catch(error){await rename(old,dataDir);throw error;}await rm(old,{recursive:true,force:true});return {backup:safety};
  } finally {await rm(stage,{recursive:true,force:true});await unlock();}
}
