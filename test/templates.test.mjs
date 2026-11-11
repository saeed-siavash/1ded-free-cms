import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp,rm,readFile,stat } from 'node:fs/promises';
import { join,dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { themeCatalog } from '../lib/themes.mjs';
import { defaultSite,starterPages,validateSite } from '../lib/model.mjs';
import { renderPage } from '../lib/render.mjs';
import { createCMS } from '../server.mjs';
import { execFileSync } from 'node:child_process';

const root=dirname(dirname(fileURLToPath(import.meta.url)));
test('browser scripts parse before a release is packaged',()=>{
 for(const name of ['admin.js','site.js'])execFileSync(process.execPath,['--check',join(root,'public',name)]);
});
const groups=()=>[{id:'explore',label:'Explore',page:'about',children:[{id:'company',label:'Company',children:[{label:'Our story',page:'about',icon:'heart',description:'The people and purpose behind our work.'},{label:'Say hello',page:'contact'}]},{id:'resources',label:'Resources',children:[{label:'News',category:'news'},{label:'External resource',url:'https://example.org',newTab:true,nofollow:true}]}]}];
test('eight templates share content and remain small and self-contained',async()=>{
 assert.equal(themeCatalog.length,8);const pages=starterPages(),original=JSON.stringify(pages),css=await readFile(join(root,'public','site.css'),'utf8')+await readFile(join(root,'public','templates.css'),'utf8');
 for(const theme of themeCatalog){const site=validateSite({...defaultSite(),theme:theme.id,accent:theme.accent,font:theme.font},pages);const html=renderPage(pages[0],site,pages);assert.ok(html.includes(`theme-${theme.id}`));assert.ok(css.includes(`.theme-${theme.id}`)||theme.id==='minimal');assert.ok(html.includes('Good ideas deserve'));assert.ok(html.includes('/assets/templates.css'));assert.ok(!html.includes('fonts.googleapis'));}
 assert.equal(JSON.stringify(pages),original);const size=(await stat(join(root,'public','site.css'))).size+(await stat(join(root,'public','templates.css'))).size+(await stat(join(root,'public','site.js'))).size;assert.ok(size<50000,'Public CSS and JS should stay below 50 KB uncompressed.');assert.ok(!css.includes('@import'));
});
test('normal, mega, mixed menus and category destinations validate and render safely',()=>{
 const pages=starterPages(),categories=[{id:'news',name:'News',slug:'news'}];
 for(const style of ['normal','mega','auto']){const site=validateSite({...defaultSite(),menuStyle:style,menus:groups(),showSearch:true,stickyHeader:true},pages,categories);const html=renderPage(pages[0],site,pages,{categories});assert.ok(html.includes(style==='normal'?'nav-dropdown':'nav-mega'));if(style==='normal')assert.ok(!html.includes('class="nav-group level-0 nav-mega'));assert.ok(html.includes('/category/news/'));assert.ok(html.includes('rel="noopener nofollow"'));assert.ok(html.includes('is-sticky'));assert.ok(html.includes('class="nav-item nav-search"'));}
 const mixed=groups();mixed[0].layout='mega';mixed[0].columns=4;const site=validateSite({...defaultSite(),menuStyle:'normal',menus:mixed},pages,categories);const html=renderPage(pages[0],site,pages,{categories});assert.ok(html.includes('nav-mega'));assert.ok(html.includes('--menu-columns:4'));assert.throws(()=>validateSite({...defaultSite(),menus:[{label:'Missing category',category:'unknown'}]},pages,categories));
 const legacy=validateSite(defaultSite(),pages);assert.equal(legacy.menuStyle,'auto');assert.equal(legacy.menus[0].layout,'auto');
 const bright=renderPage(pages[0],{...legacy,accent:'#ffff00'},pages);assert.ok(bright.includes('--accent-ink:#000000'));
  const privatePages=structuredClone(pages);privatePages.find(p=>p.id==='about').status='draft';
  const privateSite={...legacy,menus:[{label:'Private menu title',page:'about',children:[]},{label:'Private group title',children:[{label:'Hidden child',page:'about',children:[]}]}]};
  const publicHTML=renderPage(privatePages[0],privateSite,privatePages);assert.ok(!publicHTML.includes('Private menu title'));assert.ok(!publicHTML.includes('Private group title'));
});
test('theme previews are private, do not save settings, and owner-only menu changes persist',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'1ded-themes-')),cms=await createCMS({dataDir:dir,setupToken:'template-installation-token'});await new Promise(r=>cms.server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+cms.server.address().port;let cookie='',csrf='';
 const request=(path,method='GET',body)=>fetch(origin+path,{method,headers:{Origin:origin,Cookie:cookie,'X-CSRF-Token':csrf,'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});
 try{
  assert.equal((await request('/preview/home?theme=coast')).status,401);await request('/api/setup','POST',{token:'template-installation-token',email:'owner@example.com',password:'a long owner template password',url:origin});let r=await request('/api/login','POST',{email:'owner@example.com',password:'a long owner template password'});cookie=r.headers.get('set-cookie').split(';')[0];let state=await(await request('/api/state')).json();csrf=state.csrf;assert.equal(state.themes.length,8);
  for(const theme of themeCatalog){r=await request(`/preview/home?theme=${theme.id}&palette=preset`);assert.equal(r.status,200);const html=await r.text();assert.ok(html.includes('theme-'+theme.id));assert.ok(html.includes('--accent:'+theme.accent));assert.ok(r.headers.get('x-robots-tag').includes('noindex'));}
  assert.equal((await request('/preview/home?theme=invalid')).status,400);assert.equal((await(await request('/api/state')).json()).site.theme,'minimal');
  const category=await(await request('/api/categories','POST',{name:'News',slug:'news'})).json();const menu=groups();menu[0].children[1].children[0].category=category.id;const originalPages=JSON.stringify(state.pages);r=await request('/api/site','PUT',{...state.site,theme:'coast',menuStyle:'mega',menus:menu,showSearch:true});assert.equal(r.status,200);state=await(await request('/api/state')).json();assert.equal(JSON.stringify(state.pages),originalPages);assert.equal(state.site.menuStyle,'mega');assert.equal((await request('/api/categories/'+category.id,'DELETE')).status,409);
  await request('/api/publish','POST',{});assert.ok((await(await request('/')).text()).includes('nav-mega'));assert.equal((await request('/assets/templates.css')).status,200);
  await request('/api/users','POST',{email:'editor@example.com',password:'a long editor template password'});r=await request('/api/login','POST',{email:'editor@example.com',password:'a long editor template password'});cookie=r.headers.get('set-cookie').split(';')[0];state=await(await request('/api/state')).json();csrf=state.csrf;assert.equal((await request('/api/site','PUT',state.site)).status,403);
 }finally{await cms.close();await rm(dir,{recursive:true,force:true});}
});
