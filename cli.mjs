import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import readline from 'node:readline';
import { Writable } from 'node:stream';
import { randomUUID } from 'node:crypto';
import { openStore } from './lib/store.mjs';
import { hashPassword } from './lib/security.mjs';
import { fullBackup, applyUpdate, restoreBackup, extractZip, makeReleaseManifest, VERSION } from './lib/maintenance.mjs';
import { zipDirectory } from './lib/zip.mjs';
const args=process.argv.slice(2),target=args.indexOf('--target');
const root=resolve(target>=0?args[target+1]:dirname(fileURLToPath(import.meta.url))),data=resolve(process.env.DATA_DIR||join(root,'data'));
async function secret(prompt) {process.stdout.write(prompt);const output=new Writable({write(chunk,encoding,callback){callback();}}),rl=readline.createInterface({input:process.stdin,output,terminal:true});return new Promise(resolve=>rl.question('',answer=>{rl.close();process.stdout.write('\n');resolve(answer);}));}
let store;
try {
 const command=args[0];
 if(command==='update') {if(!args[1])throw new Error('Usage: node cli.mjs update /path/to/new-release.zip [--target /path/to/installed-cms]');const result=await applyUpdate({appDir:root,dataDir:data,archive:resolve(args[1])});console.log(`Updated to ${result.version}. Data and uploads preserved.\nRecovery backup: ${result.backup}\nStart the CMS to run backed-up schema migrations.`);}
 else if(command==='restore') {if(!args[1])throw new Error('Usage: node cli.mjs restore /path/to/full-backup.zip-or-folder');let source=resolve(args[1]),stage;try {if(source.toLowerCase().endsWith('.zip')){stage=join(dirname(data),'.1ded-backup-import-'+randomUUID());await extractZip(await readFile(source),stage);source=stage;}const result=await restoreBackup({dataDir:data,source});console.log(`Full backup restored. Previous data saved at ${result.backup}. Restart the CMS.`);}finally{if(stage)await rm(stage,{recursive:true,force:true});}}
 else if(command==='backup') {const destination=resolve(args[1]||join(dirname(data),'1ded-backups',new Date().toISOString().replace(/[:.]/g,'-')));const path=await fullBackup(data,destination);console.log('Full backup saved to '+path);}
 else if(command==='release') {const manifest=await makeReleaseManifest(root);console.log(`Release manifest generated for ${manifest.version}.`);if(args[1]){const zip=await zipDirectory(root,{exclude:['data','backups','1ded-backups','1ded-update-backups','.git','node_modules','.env']});await writeFile(resolve(args[1]),zip);console.log('Release ZIP saved to '+resolve(args[1]));}}
 else if(command==='reset-password') {store=openStore(data);const email=args[1];if(!email)throw new Error('Usage: node cli.mjs reset-password owner@example.com');const user=store.db.prepare('SELECT id FROM users WHERE email=?').get(email.trim().toLowerCase());if(!user)throw new Error('Account not found. Check DATA_DIR and the email address.');if(!process.stdin.isTTY)throw new Error('Run this command in an interactive terminal. Passwords are entered privately, never as arguments.');const password=await secret('New password (12–256 characters, hidden): '),confirm=await secret('Confirm password (hidden): ');if(password!==confirm)throw new Error('Passwords do not match.');const hash=await hashPassword(password);store.transaction(()=>{store.db.prepare('UPDATE users SET hash=? WHERE id=?').run(hash,user.id);store.db.prepare('DELETE FROM sessions WHERE user_id=?').run(user.id);store.audit('server-console',`Reset password for ${email}`);});console.log('Password updated. All account sessions revoked.');}
 else if(command==='doctor') {store=openStore(data);console.log(JSON.stringify({version:VERSION,dataDir:data,schema:store.db.prepare('PRAGMA user_version').get().user_version,database:store.db.prepare('PRAGMA integrity_check').get().integrity_check,media:store.get('media',[]).length,missingImages:store.get('media',[]).filter(m=>!existsSync(join(data,'media',m.id))).map(m=>m.id),published:!!store.get('current',null)},null,2));}
 else throw new Error('Commands: update <release.zip> | backup [new-directory] | restore <full-backup.zip-or-folder> | reset-password <email> | doctor | release [output.zip]');
}catch(e){console.error(e.message);process.exitCode=1;}finally{store?.db.close();}
