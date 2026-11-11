import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp,rm,readFile,readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createCMS } from '../server.mjs';
import { richText } from '../lib/richtext.mjs';

test('formatted text supports lists, tables, links, and escapes all raw HTML',()=>{
 const html=richText('**Bold** and *italic* [safe](/about/)\n\n- One\n- Two\n\n| A | B |\n| --- | --- |\n| C | D |\n\n<script>alert(1)</script> [bad](javascript:evil)');
 assert.ok(html.includes('<strong>Bold</strong>'));assert.ok(html.includes('<em>italic</em>'));assert.ok(html.includes('<ul><li>One</li>'));assert.ok(html.includes('<th>A</th>'));assert.ok(html.includes('href="/about/"'));assert.ok(!html.includes('<script>'));assert.ok(!html.includes('href="javascript:'));
});
test('categories, links, archives, content references, histories, trash, scheduling and full backups',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'1ded-content-')),data=join(dir,'data'),cms=await createCMS({dataDir:data,setupToken:'install-content-token'});await new Promise(r=>cms.server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+cms.server.address().port;let cookie='',csrf='';
 async function req(path,method='GET',body){return fetch(origin+path,{method,redirect:'manual',headers:{Origin:origin,Cookie:cookie,'X-CSRF-Token':csrf,'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});}
 const state=async()=>{const response=await req('/api/state');assert.equal(response.status,200);return response.json();};
 try {
  await req('/api/setup','POST',{token:'install-content-token',email:'owner@example.com',password:'a long content password',url:origin});let r=await req('/api/login','POST',{email:'owner@example.com',password:'a long content password'});cookie=r.headers.get('set-cookie').split(';')[0];csrf=(await state()).csrf;
  r=await req('/api/categories','POST',{name:'Design',slug:'design',description:'Considered ideas.'});assert.equal(r.status,201);const category=await r.json();
  r=await req('/api/links','POST',{label:'About our studio',page:'about',category:category.id,newTab:true,nofollow:true});assert.equal(r.status,201);const link=await r.json();
  r=await req('/api/pages','POST',{title:'First article',slug:'blog/first-article',status:'published',kind:'post',categories:[category.id],tags:['design'],author:'Studio',date:'2026-11-11',excerpt:'A short introduction.',sections:[{type:'hero',title:'First article'},{type:'text',text:'**Original** ideas.'},{type:'links',title:'Resources',linkCategory:category.id}]});assert.equal(r.status,201);let post=await r.json();
  const p={...post,sections:[...post.sections,{type:'cta',title:'Learn more',button:'About us',linkPage:'about'}]};r=await req('/api/pages/'+post.id,'PUT',p);post=await r.json();assert.equal(r.status,200);
  const about=(await state()).pages.find(p=>p.id==='about');about.slug='our-story';await req('/api/pages/about','PUT',about);assert.equal((await req('/api/publish','POST',{})).status,200);
  let html=await(await req('/blog/first-article/')).text();assert.ok(html.includes('<strong>Original</strong>'));assert.ok(html.includes('href="/our-story/"'));assert.ok(html.includes('BlogPosting'));assert.ok(html.includes('rel="noopener nofollow"'));
  html=await(await req('/category/design/')).text();assert.ok(html.includes('First article'));assert.ok(html.includes('About our studio'));assert.equal((await req('/blog/')).status,200);assert.equal((await req('/search/')).status,200);const search=await(await req('/search-index.json')).json();assert.ok(search.some(p=>p.title==='First article'));
  const report=await(await req('/api/link-check')).json();assert.ok(!report.some(r=>r.message.includes('Destination page is missing')));
  assert.equal((await req('/api/categories/'+category.id,'DELETE')).status,409);assert.equal((await req('/api/pages/about','DELETE')).status,409);
  const history=await(await req('/api/history/'+post.id)).json();assert.ok(history.length);post=(await state()).pages.find(p=>p.id===post.id);r=await req('/api/history/'+post.id,'POST',{id:history[0].id,revision:post.revision});assert.equal(r.status,200);
  r=await req('/api/pages/'+post.id,'DELETE');assert.equal(r.status,200);assert.ok((await state()).trash.some(t=>t.id===post.id));r=await req('/api/trash/'+post.id,'POST',{});assert.equal(r.status,200);assert.equal((await r.json()).status,'draft');
  r=await req('/api/schedule','PUT',{at:new Date(Date.now()+120000).toISOString()});assert.equal(r.status,200);assert.equal((await state()).schedule.status,'pending');await req('/api/schedule','PUT',{});assert.equal((await state()).schedule,null);
  r=await req('/api/backup/full');assert.equal(r.status,200);const archive=Buffer.from(await r.arrayBuffer());assert.ok(archive.includes(Buffer.from('cms.sqlite')));assert.ok(archive.includes(Buffer.from('backup.json')));
 }finally{await cms.close();await rm(dir,{recursive:true,force:true});}
});
