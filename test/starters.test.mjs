import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp,rm,readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createCMS } from '../server.mjs';
import { starterCatalog,createStarter } from '../lib/starters.mjs';
import { validateContentPage } from '../lib/content.mjs';
import { defaultSite,validateSite } from '../lib/model.mjs';
import { renderPage,buildRelease } from '../lib/render.mjs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root=dirname(dirname(fileURLToPath(import.meta.url)));
const expected=['web-hosting','cloud-hosting','food','doctor','engineer','business-card','biography','resume','music','artist','it','company','journal','press','blog'];
test('all fifteen subject packs have valid content, menus, and independent page structures',()=>{
 assert.deepEqual(starterCatalog.map(p=>p.id),expected);
 for(const metadata of starterCatalog){
  const bundle=createStarter(metadata.id),pages=bundle.pages.map(p=>validateContentPage(p,bundle.pages,bundle.categories));
  const site=validateSite({...defaultSite(),...bundle.settings,menus:bundle.menus,footerMenus:bundle.footerMenus},pages,bundle.categories);
  assert.ok(pages.some(p=>p.slug===''));assert.equal(new Set(pages.map(p=>p.slug)).size,pages.length);
  const routes=Object.fromEntries(pages.map(p=>[p.id,'/starter-preview/'+metadata.id+'/'+p.starterKey]));
  for(const page of pages){const html=renderPage(page,site,pages,{preview:true,previewRoutes:routes,categories:bundle.categories});assert.ok(html.includes('<h1>'));assert.ok(html.includes('noindex'));assert.ok(html.includes('layout-'+page.starterLayout));assert.ok(!html.includes('href="javascript:'));}
  const imported=createStarter(metadata.id,{prefix:metadata.id,draft:true});assert.ok(imported.pages.every(p=>p.status==='draft'&&p.slug.startsWith(metadata.id)));validateSite({...defaultSite(),menus:[imported.importedMenu]},imported.pages,imported.categories);
 }
 assert.equal(createStarter('business-card').pages.length,1);assert.ok(createStarter('resume').pages.some(p=>p.sections.some(s=>s.type==='timeline')));assert.ok(createStarter('food').pages.some(p=>p.sections.some(s=>s.text?.includes('| Dish |'))));assert.ok(createStarter('web-hosting').pages.some(p=>p.sections.some(s=>s.text?.includes('| Plan |'))));assert.ok(createStarter('doctor').pages.some(p=>p.sections.some(s=>s.text?.includes('Do not submit medical records'))));assert.equal(createStarter('blog').pages.filter(p=>p.kind==='post').length,2);
});

test('subject previews, imports, activation, conflict protection, and editor restrictions',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'1ded-subjects-')),cms=await createCMS({dataDir:directory,setupToken:'subject-setup-token'});await new Promise(r=>cms.server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+cms.server.address().port;let cookie='',csrf='';
 const request=(path,method='GET',body)=>fetch(origin+path,{method,redirect:'manual',headers:{Origin:origin,Cookie:cookie,'X-CSRF-Token':csrf,'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});
 const state=async()=>{const r=await request('/api/state');assert.equal(r.status,200);return r.json();};
 try{
  assert.equal((await(await request('/api/status')).json()).starters.length,15);assert.equal((await request('/starter-preview/doctor/home')).status,401);
  assert.equal((await request('/api/setup','POST',{token:'subject-setup-token',email:'owner@example.com',password:'a long subject owner password',name:'My Practice',url:origin,preset:'doctor'})).status,201);
  let result=await request('/api/login','POST',{email:'owner@example.com',password:'a long subject owner password'});cookie=result.headers.get('set-cookie').split(';')[0];let initial=await state();csrf=initial.csrf;assert.equal(initial.starters.length,15);assert.equal(initial.site.name,'My Practice');assert.equal(initial.site.entity,'Person');assert.ok(initial.pages.some(p=>p.starterKey==='patient-information'));
  const originalPages=JSON.stringify(initial.pages),originalMedia=JSON.stringify(initial.media),originalSite=JSON.stringify(initial.site);
  for(const id of expected){result=await request('/starter-preview/'+id+'/home');assert.equal(result.status,200,id);const html=await result.text();assert.ok(html.includes('/starter-preview/'+id+'/home'));assert.ok(result.headers.get('x-robots-tag').includes('noindex'));}
  assert.equal(JSON.stringify((await state()).site),originalSite,'previews must not change settings');assert.equal((await request('/starter-preview/not-real/home')).status,400);
  result=await request('/api/starters/import','POST',{starterId:'web-hosting',prefix:'hosting',revision:initial.site.revision,addMenu:true});assert.equal(result.status,201);const imported=await result.json();let next=await state();assert.equal(JSON.stringify(next.pages.slice(0,initial.pages.length)),originalPages);assert.equal(JSON.stringify(next.media),originalMedia);assert.equal(next.site.theme,initial.site.theme);assert.ok(next.pages.filter(p=>imported.import.pageIds.includes(p.id)).every(p=>p.status==='draft'));assert.ok(next.site.menus.some(m=>m.label==='Web Hosting'));
  result=await request('/api/starters/import','POST',{starterId:'web-hosting',prefix:'hosting',revision:next.site.revision});assert.equal(result.status,409);assert.equal((await state()).pages.length,next.pages.length);
  result=await request('/api/starters/import','POST',{starterId:'food',prefix:'admin',revision:next.site.revision});assert.equal(result.status,400);assert.equal((await state()).pages.length,next.pages.length);
  assert.equal((await request('/api/starters/activate','POST',{id:imported.import.id})).status,200);next=await state();assert.ok(next.pages.filter(p=>imported.import.pageIds.includes(p.id)).every(p=>p.status==='published'));assert.equal((await request('/api/publish','POST',{})).status,200);assert.equal((await request('/hosting/')).status,200);assert.equal((await request('/hosting/plans/')).status,200);
  result=await request('/api/starters/import','POST',{starterId:'blog',prefix:'writing',revision:next.site.revision,addMenu:false});assert.equal(result.status,201);const writing=await result.json();await request('/api/starters/activate','POST',{id:writing.import.id});await request('/api/publish','POST',{});const home=await(await request('/writing/')).text();assert.ok(home.includes('Welcome to this space'));assert.ok(home.includes('/writing/articles/sample-post-1/'));assert.ok(!home.includes('/starter-preview/'));
  await request('/api/users','POST',{email:'editor@example.com',password:'a long subject editor password'});result=await request('/api/login','POST',{email:'editor@example.com',password:'a long subject editor password'});cookie=result.headers.get('set-cookie').split(';')[0];csrf=(await state()).csrf;assert.equal((await request('/api/starters/import','POST',{starterId:'artist',prefix:'art'})).status,403);assert.equal((await request('/api/starters/activate','POST',{id:writing.import.id})).status,403);
 }finally{await cms.close();await rm(directory,{recursive:true,force:true});}
});

test('subject installation can generate a standalone static site with local assets',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'1ded-subject-export-'));try{const bundle=createStarter('journal');const pages=bundle.pages.map(p=>validateContentPage(p,bundle.pages,bundle.categories)),site=validateSite({...defaultSite(),...bundle.settings,menus:bundle.menus,footerMenus:bundle.footerMenus},pages,bundle.categories);const dest=await buildRelease({directory,releaseId:'journal',site,pages,categories:bundle.categories,links:[],redirects:[],assets:join(root,'public'),media:join(directory,'media')});const html=await readFile(join(dest,'index.html'),'utf8');assert.ok(html.includes('collection-cards'));assert.ok(html.includes('Welcome to this space'));const search=JSON.parse(await readFile(join(dest,'search-index.json'),'utf8'));assert.ok(search.some(p=>p.title==='Welcome to this space'));assert.ok((await readFile(join(dest,'assets','templates.css'),'utf8')).includes('.layout-editorial'));}finally{await rm(directory,{recursive:true,force:true});}
});
