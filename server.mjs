import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join, extname } from 'node:path';
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { backup } from 'node:sqlite';
import { openStore } from './lib/store.mjs';
import { defaultSite, starterPages, validatePage, validateSite, id } from './lib/model.mjs';
import { hashPassword, verifyPassword, token, digest, limiter } from './lib/security.mjs';
import { renderPage, buildRelease, seoWarnings, pagePath, esc } from './lib/render.mjs';
import { zipDirectory } from './lib/zip.mjs';
import { contentAPI,contentState,saveHistory } from './lib/content-api.mjs';
import { validateContentPage,generatedPages,pageReferences } from './lib/content.mjs';
import { acquireLock,VERSION } from './lib/maintenance.mjs';
import { findTheme } from './lib/themes.mjs';
import { starterCatalog,findStarter,createStarter } from './lib/starters.mjs';

const root=dirname(fileURLToPath(import.meta.url));
export async function createCMS(options={}) {
  const directory=resolve(options.dataDir || process.env.DATA_DIR || join(root,'data'));
  const assets=join(root,'public'), media=join(directory,'media'), releases=join(directory,'releases');
  await mkdir(media,{recursive:true}); await mkdir(releases,{recursive:true});
  const store=openStore(directory), db=store.db;
  let setupToken=options.setupToken || process.env.SETUP_TOKEN || token();
  const configured=()=>!!db.prepare('SELECT id FROM users LIMIT 1').get();
  const loginLimit=limiter(15,15*60*1000), formLimit=limiter(6,60*60*1000);
  const dummy=await hashPassword(token()); let publishing=false;
  const getSite=()=>store.get('site',defaultSite()), getPages=()=>store.get('pages',[]);
  const current=()=>store.get('current',null);
  const secure=process.env.COOKIE_SECURE==='true';
  const sessionCookie=(value,age)=>`cms_session=${value}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${age}${secure?'; Secure':''}`;
  async function body(req,max=2*1024*1024,raw=false) { let size=0; const chunks=[]; for await(const chunk of req) { size+=chunk.length; if(size>max) throw Object.assign(new Error('Request is too large.'),{status:413}); chunks.push(chunk); } const buffer=Buffer.concat(chunks); if(raw) return buffer; if(req.headers['content-type']?.startsWith('application/x-www-form-urlencoded')) return Object.fromEntries(new URLSearchParams(buffer.toString())); try{return JSON.parse(buffer.toString()||'{}');}catch{throw Object.assign(new Error('Invalid JSON.'),{status:400});} }
  function json(res,status,value) { res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(value)); }
  function fail(status,message) { throw Object.assign(new Error(message),{status}); }
  function session(req) { const cookie=String(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('cms_session='))?.slice(12); if(!cookie) return null; return db.prepare('SELECT sessions.*,users.email,users.role FROM sessions JOIN users ON users.id=sessions.user_id WHERE sessions.hash=? AND expires>?').get(digest(cookie),Date.now()); }
  function auth(req,owner=false) { const s=session(req); if(!s) fail(401,'Please sign in.'); if(owner&&s.role!=='owner') fail(403,'Only the owner can do this.'); if(!['GET','HEAD'].includes(req.method)&&req.headers['x-csrf-token']!==s.csrf) fail(403,'Session verification failed. Refresh and try again.'); return s; }
  function sameOrigin(req) { const origin=req.headers.origin; if(!origin) fail(403,'An Origin header is required.'); const expected=process.env.PUBLIC_ORIGIN || `http://${req.headers.host}`; if(origin!==expected) fail(403,'Cross-origin request blocked.'); }
  function state(s) { return { ...contentState(store), site:getSite(), pages:getPages(), redirects:store.get('redirects',[]), current:current(), warnings:seoWarnings(getSite(),getPages()), user:{email:s.email,role:s.role}, csrf:s.csrf, revisions:db.prepare('SELECT id,created FROM revisions ORDER BY created DESC LIMIT 30').all(), messages:db.prepare('SELECT * FROM messages ORDER BY created DESC LIMIT 200').all(), media:store.get('media',[]) }; }
  async function publish(actor,snapshot=null) {
    if(publishing) fail(409,'A publication is already running.'); publishing=true;
    try { const data=snapshot || {site:getSite(),pages:getPages(),categories:store.get('categories',[]),links:store.get('links',[]),redirects:store.get('redirects',[])}; const releaseId=id();
      await buildRelease({directory:releases,releaseId,...data,assets,media});
      store.transaction(()=>{ db.prepare('INSERT INTO revisions VALUES (?,?,?)').run(releaseId,new Date().toISOString(),JSON.stringify(data)); store.set('current',releaseId); store.audit(actor, snapshot ? 'Rolled back published website' : 'Published website'); });
      return releaseId;
    } finally {publishing=false;}
  }
  async function file(res,path,status=200,extra={}) { try { const data=await readFile(path); const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.xml':'application/xml; charset=utf-8','.txt':'text/plain; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.gif':'image/gif','.ico':'image/x-icon','.json':'application/json; charset=utf-8'}[extname(path)] || 'application/octet-stream'; res.writeHead(status,{'Content-Type':mime,...extra});res.end(data); }catch(e){if(e.code==='ENOENT'||e.code==='EISDIR') {res.writeHead(404);res.end('Not found');}else throw e;} }
  const server=http.createServer(async(req,res)=>{
    res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');res.setHeader('X-Frame-Options','SAMEORIGIN');
    res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self'; font-src 'self'; connect-src 'self'; frame-src 'self'; frame-ancestors 'self'; base-uri 'none'; object-src 'none'; form-action 'self' https:");
    try {
      const url=new URL(req.url,'http://localhost'); const path=decodeURIComponent(url.pathname); const method=req.method;
      if(path.includes('\\')||path.includes('\0')||path.split('/').includes('..')) fail(400,'Invalid path.');
      if(path.startsWith('/api/')&&method!=='GET'&&path!=='/api/contact') sameOrigin(req);
      if(path==='/api/status'&&method==='GET') return json(res,200,{configured:configured(),starters:starterCatalog});
      if(path==='/api/setup'&&method==='POST'){
        if(configured())fail(409,'Setup is already complete.');const input=await body(req);
        if(!loginLimit(req.socket.remoteAddress)||digest(String(input.token))!==digest(setupToken))fail(403,'Invalid setup token.');
        const email=String(input.email||'').trim().toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254)fail(400,'Enter a valid email.');
        const hash=await hashPassword(input.password),bundle=findStarter(input.preset)?createStarter(input.preset):null;
        const pages=bundle?bundle.pages.map(p=>validateContentPage(p,bundle.pages,bundle.categories)):starterPages(input.preset);
        const site={...defaultSite(),...(bundle?{...bundle.settings,menus:bundle.menus,footerMenus:bundle.footerMenus}:{})};
        if(input.name){site.name=String(input.name).slice(0,100);site.copyright=site.name;}if(input.url)site.url=input.url;if(findTheme(input.theme))site.theme=input.theme;
        const validated=validateSite(site,pages,bundle?.categories||[]),newUser=id();
        store.transaction(()=>{if(configured())fail(409,'Setup is already complete.');db.prepare('INSERT INTO users VALUES (?,?,?,?)').run(newUser,email,hash,'owner');store.set('site',validated);store.set('pages',pages);store.set('categories',bundle?.categories||[]);store.set('redirects',[]);if(bundle)store.set('starterImports',[{id:id(),starterId:bundle.definition.id,name:bundle.definition.name,prefix:'',created:new Date().toISOString(),pageIds:pages.map(p=>p.id)}]);store.audit(email,'Completed installation');});
        setupToken='';return json(res,201,{ok:true});
      }
      if(path==='/api/login'&&method==='POST') { if(!loginLimit(req.socket.remoteAddress)) fail(429,'Too many attempts. Try again in 15 minutes.');const b=await body(req); const user=db.prepare('SELECT * FROM users WHERE email=?').get(String(b.email||'').toLowerCase().trim());const valid=await verifyPassword(b.password,user?.hash||dummy);if(!valid||!user) fail(401,'Email or password is incorrect.'); const raw=token(),csrf=token();db.prepare('DELETE FROM sessions WHERE expires<?').run(Date.now());db.prepare('INSERT INTO sessions VALUES (?,?,?,?)').run(digest(raw),user.id,csrf,Date.now()+8*60*60*1000);res.setHeader('Set-Cookie',sessionCookie(raw,8*60*60));store.audit(user.email,'Signed in');return json(res,200,{ok:true}); }
      if(path==='/api/contact'&&method==='POST') {
        if(!formLimit(req.socket.remoteAddress)) fail(429,'Too many messages. Please try again later.');const b=await body(req,20000);if(b.website) return json(res,200,{ok:true});
        const name=String(b.name||'').trim(),email=String(b.email||'').trim(),message=String(b.message||'').trim(); if(!name||name.length>120||email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||message.length<10||message.length>10000) fail(400,'Please provide your name, a valid email, and a message of 10–10,000 characters.');
        if(db.prepare('SELECT count(*) AS n FROM messages').get().n>=10000) fail(503,'The inbox is temporarily unavailable. Please contact us directly.');
        db.prepare('INSERT INTO messages(id,created,name,email,message) VALUES (?,?,?,?,?)').run(id(),new Date().toISOString(),name,email,message);
        if(req.headers.accept?.includes('application/json'))return json(res,201,{ok:true});res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});return res.end('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Message received</title><link rel="stylesheet" href="/assets/site.css"><main class="container section"><h1>Thank you.</h1><p>Your message has been received.</p><a class="button" href="/">Return to website ↗</a></main></html>');
      }
      if(path.startsWith('/api/')) {
        const s=auth(req); const owner=()=>{if(s.role!=='owner')fail(403,'Only the owner can do this.');};
        if(await contentAPI({path,method,req,res,s,store,body,json,fail,owner,directory,getSite,getPages,publish}))return;
        if(path==='/api/state'&&method==='GET') return json(res,200,state(s));
        if(path==='/api/logout'&&method==='POST'){db.prepare('DELETE FROM sessions WHERE hash=?').run(s.hash);res.setHeader('Set-Cookie',sessionCookie('',0));return json(res,200,{ok:true});}
        if(path==='/api/site'&&method==='PUT'){owner();const input=await body(req);const existingSite=getSite();if(existingSite.revision&&input.revision!==existingSite.revision)fail(409,'Site settings changed in another session. Reload before saving.');const site=validateSite(input,getPages(),store.get('categories',[]));store.set('site',site);store.audit(s.email,'Updated site settings');return json(res,200,{ok:true});}
        if(path==='/api/pages'&&method==='POST'){const b=await body(req);const pages=getPages();const page=validateContentPage({...b,id:id()},pages,store.get('categories',[]));pages.push(page);store.set('pages',pages);store.audit(s.email,`Created page: ${page.title}`);return json(res,201,page);}
        const match=path.match(/^\/api\/pages\/([a-zA-Z0-9-]+)$/);
        if(match&&method==='PUT'){const input=await body(req);const pages=getPages(),old=pages.find(p=>p.id===match[1]);if(!old)fail(404,'Page not found.');if(old.revision&&input.revision!==old.revision)fail(409,'This page changed in another session. Reload before saving to avoid overwriting their work.');const page=validateContentPage({...input,id:old.id},pages,store.get('categories',[]));store.transaction(()=>{saveHistory(store,old,s.email);const redirects=store.get('redirects',[]);if(page.slug!==old.slug&&old.slug!=='') { const from=pagePath(old),to=pagePath(page);for(const r of redirects)if(r.to===from)r.to=to;const filtered=redirects.filter(r=>r.from!==from&&r.from!==to);filtered.push({from,to});store.set('redirects',filtered); }store.set('pages',pages.map(p=>p.id===old.id?page:p));store.audit(s.email,`Saved page: ${page.title}`);});return json(res,200,page);}
        if(match&&method==='DELETE'){const pages=getPages(),page=pages.find(p=>p.id===match[1]);if(!page)fail(404,'Page not found.');if(page.slug==='')fail(400,'The homepage cannot be deleted.');const used=items=>items.some(i=>i.page===page.id||used(i.children||[]));const site=getSite();if(used(site.menus)||used(site.footerMenus))fail(409,'Remove this page from navigation before deleting it.');if(pages.some(p=>p.id!==page.id&&pageReferences(p).includes(page.id))||store.get('links',[]).some(l=>l.page===page.id))fail(409,'Remove page references from content and saved links before deleting.');store.transaction(()=>{db.prepare('INSERT INTO trash VALUES (?,?,?,?)').run(page.id,new Date().toISOString(),s.email,JSON.stringify(page));store.set('pages',pages.filter(p=>p.id!==page.id));store.audit(s.email,`Moved page to trash: ${page.title}`);});return json(res,200,{ok:true});}
        if(path==='/api/publish'&&method==='POST'){owner();const release=await publish(s.email);return json(res,200,{ok:true,release});}
        if(path==='/api/rollback'&&method==='POST'){owner();const b=await body(req);const revision=db.prepare('SELECT snapshot FROM revisions WHERE id=?').get(String(b.id));if(!revision)fail(404,'Publication not found.');const release=await publish(s.email,JSON.parse(revision.snapshot));return json(res,200,{ok:true,release});}
        if(path==='/api/export'&&method==='GET'){owner();const release=current();if(!release)fail(400,'Publish the website first.');const archive=await zipDirectory(join(releases,release));res.writeHead(200,{'Content-Type':'application/zip','Content-Disposition':'attachment; filename="1ded-static-website.zip"','Cache-Control':'no-store'});return res.end(archive);}
        if(path==='/api/backup'&&method==='GET'){owner();const target=join(directory,'backup.sqlite');await backup(db,target);return file(res,target,200,{'Content-Disposition':'attachment; filename="1ded-cms-backup.sqlite"','Cache-Control':'no-store'});}
        if(path==='/api/media'&&method==='POST'){const buffer=await body(req,8*1024*1024,true);let ext='';if(buffer.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))ext='png';else if(buffer[0]===255&&buffer[1]===216&&buffer[2]===255)ext='jpg';else if(buffer.subarray(0,4).toString()==='RIFF'&&buffer.subarray(8,12).toString()==='WEBP')ext='webp';else if(/^GIF8[79]a$/.test(buffer.subarray(0,6).toString()))ext='gif';if(!ext)fail(400,'Upload a PNG, JPEG, WebP, or GIF image (maximum 8 MB).');const filename=id()+'.'+ext;await writeFile(join(media,filename),buffer);const item={id:filename,url:'/media/'+filename,size:buffer.length,created:new Date().toISOString()};store.set('media',[item,...store.get('media',[])]);return json(res,201,item);}
        if(path==='/api/password'&&method==='POST'){const b=await body(req);const user=db.prepare('SELECT * FROM users WHERE id=?').get(s.user_id);if(!await verifyPassword(b.current,user.hash))fail(400,'Current password is incorrect.');const hash=await hashPassword(b.password);store.transaction(()=>{db.prepare('UPDATE users SET hash=? WHERE id=?').run(hash,s.user_id);db.prepare('DELETE FROM sessions WHERE user_id=?').run(s.user_id);store.audit(s.email,'Changed password and revoked sessions');});res.setHeader('Set-Cookie',sessionCookie('',0));return json(res,200,{ok:true});}
        if(path==='/api/users'&&method==='GET'){owner();return json(res,200,db.prepare('SELECT id,email,role FROM users').all());}
        if(path==='/api/users'&&method==='POST'){owner();const b=await body(req);const email=String(b.email||'').trim().toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254)fail(400,'Enter a valid email.');const hash=await hashPassword(b.password);if(db.prepare('SELECT id FROM users WHERE email=?').get(email))fail(409,'This email is already registered.');db.prepare('INSERT INTO users VALUES (?,?,?,?)').run(id(),email,hash,'editor');store.audit(s.email,'Added an editor');return json(res,201,{ok:true});}
        const userMatch=path.match(/^\/api\/users\/([a-zA-Z0-9-]+)$/);if(userMatch&&method==='DELETE'){owner();if(userMatch[1]===s.user_id)fail(400,'You cannot delete your own account.');db.prepare("DELETE FROM users WHERE id=? AND role='editor'").run(userMatch[1]);store.audit(s.email,'Removed an editor');return json(res,200,{ok:true});}
        if(path==='/api/messages'&&method==='PATCH'){const b=await body(req);db.prepare('UPDATE messages SET status=? WHERE id=?').run(b.status==='read'?'read':'new',String(b.id));return json(res,200,{ok:true});}
        if(path==='/api/messages'&&method==='DELETE'){const b=await body(req);db.prepare('DELETE FROM messages WHERE id=?').run(String(b.id));return json(res,200,{ok:true});}
        if(path==='/api/audit'&&method==='GET'){owner();return json(res,200,db.prepare('SELECT * FROM audit ORDER BY id DESC LIMIT 100').all());}
        fail(404,'Endpoint not found.');
      }
      if(!['GET','HEAD'].includes(method))fail(405,'Method not allowed.');
      if(path==='/admin'||path==='/admin/'){res.setHeader('Cache-Control','no-store');res.setHeader('X-Robots-Tag','noindex, nofollow');return file(res,join(assets,'admin.html'));}
      if(path.startsWith('/assets/')){const filename=path.slice(8);if(!['admin.css','admin.js','site.css','site.js','templates.css'].includes(filename))fail(404,'Not found.');return file(res,join(assets,filename));}
      if(path.startsWith('/starter-preview/')){auth(req);const [, ,starterId,key='home']=path.split('/');const bundle=createStarter(starterId,{preview:true});const page=bundle.pages.find(p=>p.starterKey===key);if(!page)fail(404,'Template page not found.');const site={...getSite(),...bundle.settings,menus:bundle.menus,footerMenus:bundle.footerMenus};const requestedTheme=findTheme(url.searchParams.get('theme'));if(requestedTheme){site.theme=requestedTheme.id;site.accent=requestedTheme.accent;site.font=requestedTheme.font;}const previewRoutes=Object.fromEntries(bundle.pages.map(p=>[p.id,'/starter-preview/'+starterId+'/'+p.starterKey]));res.setHeader('Cache-Control','no-store');res.setHeader('X-Robots-Tag','noindex, nofollow');const html=renderPage(page,site,bundle.pages,{preview:true,previewRoutes,categories:bundle.categories,links:[]});res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});return res.end(html);}
      if(path.startsWith('/preview/')){auth(req);res.setHeader('Cache-Control','no-store');res.setHeader('X-Robots-Tag','noindex, nofollow');const page=getPages().find(p=>p.id===path.split('/')[2]);if(!page)fail(404,'Page not found.');const previewSite={...getSite()};if(url.searchParams.has('theme')){const theme=findTheme(url.searchParams.get('theme'));if(!theme)fail(400,'Unknown template.');previewSite.theme=theme.id;if(url.searchParams.get('palette')==='preset'){previewSite.accent=theme.accent;previewSite.font=theme.font;}}res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});return res.end(renderPage(page,previewSite,getPages(),{preview:true,categories:store.get('categories',[]),links:store.get('links',[])}));}
      if(path.startsWith('/media/')){const name=path.slice(7);if(!/^[a-f0-9-]+\.(png|jpg|webp|gif)$/.test(name))fail(404,'Not found.');return file(res,join(media,name),200,{'Cache-Control':'public, max-age=31536000, immutable'});}
      const release=current();if(!release){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','X-Robots-Tag':'noindex'});return res.end('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>1DED Free CMS</title><link rel="stylesheet" href="/assets/site.css"><main class="container section"><div class="eyebrow">1DED FREE CMS</div><h1>A fresh start.</h1><p>Your website is ready to take shape. Sign in to create and publish it.</p><a class="button" href="/admin/">Open the admin panel ↗</a></main></html>');}
      const revision=db.prepare('SELECT snapshot FROM revisions WHERE id=?').get(release);const snapshot=JSON.parse(revision.snapshot);const live=generatedPages(snapshot.site,snapshot.pages,snapshot.categories||[],snapshot.links||[]).filter(p=>p.status==='published');
      const normalized=path==='/'?'/':path.replace(/\/$/,'')+'/';const page=live.find(p=>pagePath(p)===normalized);
      if(page){if(path!==normalized){res.writeHead(301,{Location:normalized});return res.end();}return file(res,join(releases,release,page.slug,'index.html'));}
      const redirect=snapshot.redirects.find(r=>r.from===normalized);if(redirect){res.writeHead(301,{Location:redirect.to});return res.end();}
      if(['sitemap.xml','robots.txt','_redirects','nginx-redirects.conf','search-index.json'].includes(path.slice(1)))return file(res,join(releases,release,path.slice(1)));
      return file(res,join(releases,release,'404.html'),404);
    } catch(e){if(res.headersSent){res.end();return;}const status=e.status||500;if(status===500)console.error(e);json(res,status,{error:status===500?'Something went wrong. Check the server log.':e.message});}
  });
  const interrupted=store.get('schedule',null);if(interrupted?.status==='running')store.set('schedule',{...interrupted,status:'pending',note:'Retrying interrupted publication'});
  let scheduledWork=null;
  const scheduler=setInterval(()=>{if(scheduledWork)return;const schedule=store.get('schedule',null);if(schedule?.status==='pending'&&new Date(schedule.at).getTime()<=Date.now()){store.set('schedule',{...schedule,status:'running'});scheduledWork=(async()=>{try{await publish(schedule.actor);store.set('schedule',{...schedule,status:'complete',finished:new Date().toISOString()});}catch(error){store.set('schedule',{...schedule,status:'failed',error:error.message});}})().finally(()=>scheduledWork=null);}},15000);scheduler.unref();
  server.requestTimeout=30000;server.headersTimeout=15000;
  return {server,store,setupToken:configured()?null:setupToken,close:async()=>{clearInterval(scheduler);if(scheduledWork)await scheduledWork;return new Promise(resolve=>{server.close(()=>{db.close();resolve();});});}};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const dataDir=resolve(process.env.DATA_DIR||join(root,'data'));const unlock=await acquireLock(dataDir);
  let cms;try{cms=await createCMS({dataDir});}catch(error){await unlock();throw error;}const host=process.env.HOST||'127.0.0.1',port=Number(process.env.PORT||3000);
  cms.server.listen(port,host,()=>{console.log(`\n1DED Free CMS · http://${host==='0.0.0.0'?'localhost':host}:${port}/admin/`);if(cms.setupToken)console.log(`\nFirst installation token (keep private): ${cms.setupToken}\nEnter this token in the installation wizard.\n`);});
  for(const signal of ['SIGINT','SIGTERM'])process.on(signal,async()=>{await cms.close();await unlock();process.exit(0);});
}
