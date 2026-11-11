import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createCMS } from '../server.mjs';
import { defaultSite, starterPages, validatePage, validateSite, safeUrl } from '../lib/model.mjs';
import { renderPage } from '../lib/render.mjs';
import { hashPassword, verifyPassword } from '../lib/security.mjs';
import { crc32 } from '../lib/zip.mjs';

test('content validation rejects dangerous URLs and reserved routes',()=>{
 assert.equal(safeUrl('javascript:alert(1)'),'');assert.equal(safeUrl('//evil.example'),'');assert.equal(safeUrl('/\\evil'),'');assert.equal(safeUrl('/hello/'),'/hello/');
 assert.throws(()=>validatePage({title:'x',slug:'../data',sections:[]},[]));assert.throws(()=>validatePage({title:'x',slug:'admin',sections:[]},[]));
 assert.throws(()=>validatePage({id:'new',title:'x',slug:'about',sections:[]},starterPages()));
 const site=defaultSite();site.accent='red;display:none';assert.throws(()=>validateSite(site,starterPages()));
});
test('renderer escapes content and structured data, excludes hidden sections',()=>{
 const site=defaultSite(),pages=starterPages();site.name='</script><script>alert(1)</script>';pages[0].sections[0].title='<img src=x onerror=alert(1)>';pages[0].sections.push({type:'text',hidden:true,title:'SECRET HIDDEN TITLE'});
 const html=renderPage(pages[0],site,pages);assert.ok(html.includes('&lt;img'));assert.ok(!html.includes('<script>alert'));assert.ok(html.includes('\\u003c/script>'));assert.ok(!html.includes('SECRET HIDDEN TITLE'));
});
test('password hashes are salted and verified',async()=>{const a=await hashPassword('a long secret phrase'),b=await hashPassword('a long secret phrase');assert.notEqual(a,b);assert.ok(await verifyPassword('a long secret phrase',a));assert.ok(!await verifyPassword('wrong',a));await assert.rejects(()=>hashPassword('short'));});
test('ZIP CRC matches a known vector',()=>assert.equal(crc32(Buffer.from('123456789')),0xcbf43926));

test('installation, authorization, publication isolation, rollback, forms, exports and recovery sessions',async t=>{
 const dataDir=await mkdtemp(join(tmpdir(),'1ded-test-'));const cms=await createCMS({dataDir,setupToken:'test-installation-token'});
 await new Promise(r=>cms.server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+cms.server.address().port;let cookie='',csrf='';
 async function call(path,method='GET',data,extra={}){const res=await fetch(origin+path,{method,redirect:'manual',headers:{Origin:origin,'Content-Type':'application/json',Cookie:cookie,'X-CSRF-Token':csrf,...extra},body:data===undefined?undefined:JSON.stringify(data)});return res;}
 async function login(email,password){const r=await call('/api/login','POST',{email,password});assert.equal(r.status,200);cookie=r.headers.get('set-cookie').split(';')[0];const s=await(await call('/api/state')).json();csrf=s.csrf;return s;}
 try {
  assert.equal((await call('/api/state')).status,401);
  assert.equal((await call('/api/setup','POST',{token:'bad'})).status,403);
  let r=await call('/api/setup','POST',{token:'test-installation-token',email:'owner@example.com',password:'an excellent secret passphrase',name:'My Test Studio',url:origin});assert.equal(r.status,201);
  assert.equal((await call('/api/setup','POST',{})).status,409);
  let state=await login('owner@example.com','an excellent secret passphrase');assert.equal(state.pages.length,3);
  assert.equal((await call('/api/site','PUT',state.site,{'X-CSRF-Token':'bad'})).status,403);
  assert.equal((await call('/api/site','PUT',state.site,{Origin:'https://evil.example'})).status,403);
  const home=state.pages.find(p=>p.slug==='');const changed=structuredClone(home);changed.sections[0].title='A changed heading';
  const saved=await call('/api/pages/'+home.id,'PUT',changed);assert.equal(saved.status,200);Object.assign(changed,await saved.json());
  assert.equal((await call('/api/pages/'+home.id,'PUT',home)).status,409,'stale page saves must be rejected');
  assert.equal((await call('/api/publish','POST',{})).status,200);let html=await(await call('/')).text();assert.ok(html.includes('A changed heading'));const first=(await(await call('/api/state')).json()).current;
  changed.sections[0].title='Only a draft edit';await call('/api/pages/'+home.id,'PUT',changed);html=await(await call('/')).text();assert.ok(!html.includes('Only a draft edit'));assert.ok((await(await call('/preview/'+home.id)).text()).includes('Only a draft edit'));
  await call('/api/publish','POST',{});assert.ok((await(await call('/')).text()).includes('Only a draft edit'));await call('/api/rollback','POST',{id:first});assert.ok((await(await call('/')).text()).includes('A changed heading'));
  assert.ok((await(await call('/preview/'+home.id)).text()).includes('Only a draft edit'));
  assert.equal((await call('/preview/'+home.id,'GET',undefined,{Cookie:''})).status,401);
  assert.equal((await call('/api/contact','POST',{name:'Reader',email:'reader@example.com',message:'I would like to know more.'},{Accept:'application/json'})).status,201);
  state=await(await call('/api/state')).json();assert.equal(state.messages.length,1);
  const about=state.pages.find(p=>p.slug==='about');about.slug='our-story';await call('/api/pages/'+about.id,'PUT',about);await call('/api/publish','POST',{});r=await call('/about/');assert.equal(r.status,301);assert.equal(r.headers.get('location'),'/our-story/');assert.equal((await call('/our-story')).status,301);
  const draft=await(await call('/api/pages','POST',{title:'Private',slug:'private',status:'draft',sections:[]})).json();await call('/api/publish','POST',{});assert.equal((await call('/private/')).status,404);const sitemap=await(await call('/sitemap.xml')).text();assert.ok(!sitemap.includes('/private/'));
  const zip=Buffer.from(await(await call('/api/export')).arrayBuffer());assert.equal(zip.readUInt32LE(0),0x04034b50);assert.ok(zip.includes(Buffer.from('sitemap.xml')));
  const beforeFailedPublish=(await(await call('/api/state')).json()).current;
  const noHome=await(await call('/api/state')).json();const h=noHome.pages.find(p=>p.slug==='');h.status='draft';let hSaved=await(await call('/api/pages/'+h.id,'PUT',h)).json();
  assert.equal((await call('/api/publish','POST',{})).status,400);assert.equal((await(await call('/api/state')).json()).current,beforeFailedPublish,'failed builds must not replace the live site');hSaved.status='published';await call('/api/pages/'+h.id,'PUT',hSaved);
  const siteBefore=structuredClone(noHome.site);assert.equal((await call('/api/site','PUT',{...siteBefore,tagline:'New tagline'})).status,200);assert.equal((await call('/api/site','PUT',siteBefore)).status,409,'stale settings must be rejected');
  const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aZ1cAAAAASUVORK5CYII=','base64');
  r=await fetch(origin+'/api/media',{method:'POST',headers:{Origin:origin,Cookie:cookie,'X-CSRF-Token':csrf,'Content-Type':'image/png'},body:png});assert.equal(r.status,201);const uploaded=await r.json();
  await call('/api/publish','POST',{});const unreferenced=Buffer.from(await(await call('/api/export')).arrayBuffer());assert.ok(!unreferenced.includes(Buffer.from(uploaded.id)),'exports must omit unreferenced uploads');
  const imageState=await(await call('/api/state')).json();const imageHome=imageState.pages.find(p=>p.slug==='');imageHome.sections.push({type:'image',id:'photo',image:uploaded.url,alt:'Test image'});await call('/api/pages/'+imageHome.id,'PUT',imageHome);await call('/api/publish','POST',{});const referenced=Buffer.from(await(await call('/api/export')).arrayBuffer());assert.ok(referenced.includes(Buffer.from(uploaded.id)));
  const db=Buffer.from(await(await call('/api/backup')).arrayBuffer());assert.ok(db.subarray(0,16).toString().startsWith('SQLite format 3'));
  await call('/api/users','POST',{email:'editor@example.com',password:'a temporary editor passphrase'});const ownerCookie=cookie,ownerCsrf=csrf;await login('editor@example.com','a temporary editor passphrase');assert.equal((await call('/api/publish','POST',{})).status,403);assert.equal((await call('/api/site','PUT',state.site)).status,403);assert.equal((await call('/api/pages','POST',{title:'Editor page',slug:'editor-page',sections:[]})).status,201);
  cookie=ownerCookie;csrf=ownerCsrf;assert.equal((await call('/api/password','POST',{current:'wrong',password:'another very good passphrase'})).status,400);assert.equal((await call('/api/password','POST',{current:'an excellent secret passphrase',password:'another very good passphrase'})).status,200);assert.equal((await call('/api/state')).status,401);await login('owner@example.com','another very good passphrase');
  await cms.close();const reopened=await createCMS({dataDir});assert.equal(reopened.store.get('pages',[]).length,5);assert.ok(reopened.store.get('current'));reopened.store.db.close();
 }finally{if(cms.server.listening)await cms.close();await rm(dataDir,{recursive:true,force:true});}
});
