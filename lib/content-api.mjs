import { join, dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { readFile, mkdir, rm, writeFile } from 'node:fs/promises';
import { id } from './model.mjs';
import { validateCategory, validateLink, validateContentPage, categoryPath, linkReport } from './content.mjs';
import { fullBackup, VERSION } from './maintenance.mjs';
import { zipDirectory } from './zip.mjs';
import { SCHEMA_VERSION } from './migrations.mjs';
import { themeCatalog } from './themes.mjs';
import { starterCatalog,createStarter } from './starters.mjs';
import { validateSite } from './model.mjs';

export function contentState(store) {
  return {starters:starterCatalog,starterImports:store.get('starterImports',[]),themes:themeCatalog,version:VERSION,schema:SCHEMA_VERSION,categories:store.get('categories',[]),links:store.get('links',[]),trash:store.db.prepare('SELECT id,created,actor,snapshot FROM trash ORDER BY created DESC').all().map(r=>({...r,snapshot:JSON.parse(r.snapshot)})),autosave:store.get('autosave',true),schedule:store.get('schedule',null),lastUpdate:store.get('lastUpdate',null)};
}
export function saveHistory(store,page,actor) {
  store.db.prepare('INSERT INTO page_history VALUES (?,?,?,?,?)').run(id(),page.id,new Date().toISOString(),actor,JSON.stringify(page));
  store.db.prepare('DELETE FROM page_history WHERE page_id=? AND id NOT IN (SELECT id FROM page_history WHERE page_id=? ORDER BY created DESC,id DESC LIMIT 50)').run(page.id,page.id);
}
export async function contentAPI({path,method,req,res,s,store,body,json,fail,owner,directory,getSite,getPages,publish}) {
  const db=store.db,categories=()=>store.get('categories',[]),links=()=>store.get('links',[]);
  if(path==='/api/starters/activate'&&method==='POST'){owner();const input=await body(req),record=store.get('starterImports',[]).find(r=>r.id===input.id);if(!record)fail(404,'Template import not found.');const pages=getPages(),changes=new Map();for(const page of pages.filter(p=>record.pageIds.includes(p.id)&&p.status==='draft'))changes.set(page.id,validateContentPage({...page,status:'published'},pages,categories()));store.transaction(()=>{for(const page of pages)if(changes.has(page.id))saveHistory(store,page,s.email);store.set('pages',pages.map(p=>changes.get(p.id)||p));store.audit(s.email,'Included imported template pages in next publication');});json(res,200,{ok:true,count:changes.size});return true;}
  if(path==='/api/starters/import'&&method==='POST'){
    owner();const input=await body(req),current=getSite(),existing=getPages(),previousCategories=categories();
    if(current.revision&&input.revision!==current.revision)fail(409,'Site settings changed. Reload the template library before importing.');
    const bundle=createStarter(String(input.starterId||''),{prefix:String(input.prefix||''),draft:true,existingCategories:previousCategories});
    if(!input.prefix)fail(400,'Choose a folder for imported pages.');if(existing.length+bundle.pages.length>1000)fail(400,'This installation has reached the 1,000-page import limit.');
    if(bundle.pages.some(p=>existing.some(e=>e.slug===p.slug)))fail(409,'This folder already contains a page. Choose another folder name; existing pages will not be overwritten.');
    const combinedCategories=[...previousCategories,...bundle.categories.filter(c=>!previousCategories.some(e=>e.id===c.id))];
    const imported=bundle.pages.map(p=>validateContentPage(p,[...existing,...bundle.pages],combinedCategories)),all=[...existing,...imported];
    const appearance=input.applyLook?{theme:bundle.settings.theme,accent:bundle.settings.accent,font:bundle.settings.font}:{};
    const site=validateSite({...current,...appearance,menus:input.addMenu?[...current.menus,bundle.importedMenu]:current.menus},all,combinedCategories);
    const record={id:id(),starterId:bundle.definition.id,name:bundle.definition.name,prefix:String(input.prefix),created:new Date().toISOString(),pageIds:imported.map(p=>p.id)};
    store.transaction(()=>{store.set('pages',all);store.set('categories',combinedCategories);store.set('site',site);store.set('starterImports',[record,...store.get('starterImports',[])].slice(0,100));store.audit(s.email,'Imported subject template: '+record.name);});
    json(res,201,{ok:true,import:record});return true;
  }
  const match=path.match(/^\/api\/(categories|links)\/([a-zA-Z0-9-]+)$/);
  if(path==='/api/link-check'&&method==='GET'){json(res,200,linkReport(getSite(),getPages(),categories(),links(),store.get('redirects',[])));return true;}
  if(path==='/api/categories'&&method==='POST'){const input=await body(req),all=categories(),value=validateCategory({...input,id:id()},all);all.push(value);store.set('categories',all);store.audit(s.email,'Created category: '+value.name);json(res,201,value);return true;}
  if(path==='/api/links'&&method==='POST'){const input=await body(req),value=validateLink({...input,id:id()},getPages(),categories());store.set('links',[...links(),value]);store.audit(s.email,'Created saved link');json(res,201,value);return true;}
  if(match&&['PUT','DELETE'].includes(method)) {
    const [,key,itemId]=match,input=method==='PUT'?await body(req):null,all=store.get(key,[]),old=all.find(x=>x.id===itemId);if(!old)fail(404,'Item not found.');
    if(method==='DELETE') {const categoryUsedInMenu=items=>items.some(i=>i.category===itemId||categoryUsedInMenu(i.children||[]));if(key==='categories'&&(categoryUsedInMenu(getSite().menus)||categoryUsedInMenu(getSite().footerMenus)))fail(409,'Remove this category from navigation before deleting it.');if(key==='categories'&&(getPages().some(p=>p.categories?.includes(itemId)||p.sections.some(x=>x.linkCategory===itemId))||links().some(x=>x.category===itemId)))fail(409,'Remove this category from content and links before deleting it.');store.set(key,all.filter(x=>x.id!==itemId));}
    else {if(old.revision&&input.revision!==old.revision)fail(409,'This item changed in another session. Reload before saving.');const value=key==='categories'?validateCategory({...input,id:itemId},all):validateLink({...input,id:itemId},getPages(),categories());
      if(key==='categories'&&old.slug!==value.slug){const from=categoryPath(old),to=categoryPath(value),redirects=store.get('redirects',[]).filter(r=>r.from!==from&&r.from!==to).map(r=>({...r,to:r.to===from?to:r.to}));redirects.push({from,to});store.set('redirects',redirects);}
      store.set(key,all.map(x=>x.id===itemId?value:x));}
    store.audit(s.email,`${method==='PUT'?'Updated':'Removed'} ${key}`);json(res,200,{ok:true});return true;
  }
  const history=path.match(/^\/api\/history\/([a-zA-Z0-9-]+)$/);
  if(history&&method==='GET'){json(res,200,db.prepare('SELECT id,created,actor,snapshot FROM page_history WHERE page_id=? ORDER BY created DESC LIMIT 50').all(history[1]).map(r=>({...r,snapshot:JSON.parse(r.snapshot)})));return true;}
  if(history&&method==='POST'){const input=await body(req),pages=getPages(),current=pages.find(p=>p.id===history[1]);if(!current)fail(404,'Page not found.');if(input.revision!==current.revision)fail(409,'Page changed. Reload before restoring.');const row=db.prepare('SELECT snapshot FROM page_history WHERE id=? AND page_id=?').get(String(input.id),current.id);if(!row)fail(404,'Revision not found.');const recovered=JSON.parse(row.snapshot);recovered.categories=(recovered.categories||[]).filter(id=>categories().some(c=>c.id===id));for(const section of recovered.sections){if(section.linkCategory&&!categories().some(c=>c.id===section.linkCategory))section.linkCategory='';if(section.linkPage&&!pages.some(p=>p.id===section.linkPage))section.linkPage='';}const page=validateContentPage({...recovered,id:current.id,slug:current.slug},pages,categories());store.transaction(()=>{saveHistory(store,current,s.email);store.set('pages',pages.map(p=>p.id===current.id?page:p));store.audit(s.email,'Restored page history');});json(res,200,page);return true;}
  const trash=path.match(/^\/api\/trash\/([a-zA-Z0-9-]+)$/);
  if(trash&&method==='POST'){const row=db.prepare('SELECT snapshot FROM trash WHERE id=?').get(trash[1]);if(!row)fail(404,'Trash item not found.');const pages=getPages(),input=JSON.parse(row.snapshot);input.categories=(input.categories||[]).filter(id=>categories().some(c=>c.id===id));for(const section of input.sections){if(section.linkCategory&&!categories().some(c=>c.id===section.linkCategory))section.linkCategory='';if(section.linkPage&&!pages.some(p=>p.id===section.linkPage))section.linkPage='';}input.status='draft';const value=validateContentPage(input,pages,categories());store.transaction(()=>{store.set('pages',[...pages,value]);db.prepare('DELETE FROM trash WHERE id=?').run(trash[1]);store.audit(s.email,'Restored page from trash');});json(res,200,value);return true;}
  if(trash&&method==='DELETE'){owner();db.prepare('DELETE FROM trash WHERE id=?').run(trash[1]);store.audit(s.email,'Permanently removed trashed page');json(res,200,{ok:true});return true;}
  if(path==='/api/schedule'&&method==='PUT'){owner();const input=await body(req);let schedule=null;if(input.at){const at=new Date(input.at);if(!Number.isFinite(at.getTime())||at.getTime()<Date.now()+60000)fail(400,'Choose a publication time at least one minute in the future.');schedule={at:at.toISOString(),actor:s.email,status:'pending'};}store.set('schedule',schedule);json(res,200,{ok:true});return true;}
  if(path==='/api/backup/full'&&method==='GET'){owner();const target=join(dirname(directory),'1ded-backups','download-'+randomUUID());let data;try{await fullBackup(directory,target);data=await zipDirectory(target);}finally{await rm(target,{recursive:true,force:true,maxRetries:5,retryDelay:100});}res.writeHead(200,{'Content-Type':'application/zip','Content-Disposition':'attachment; filename="1ded-full-backup.zip"','Cache-Control':'no-store'});res.end(data);return true;}
  if(path==='/api/media'&&method==='PATCH') {const input=await body(req),all=store.get('media',[]),item=all.find(m=>m.id===input.id);if(!item)fail(404,'Image not found.');item.name=String(input.name||'').trim().slice(0,150);item.alt=String(input.alt||'').trim().slice(0,500);item.folder=String(input.folder||'').trim().slice(0,100);if(input.originalId){if(!all.some(m=>m.id===input.originalId&&m.id!==item.id))fail(400,'Original image not found.');item.originalId=input.originalId;}if(Number.isInteger(input.width)&&input.width>0&&input.width<=20000)item.width=input.width;if(Number.isInteger(input.height)&&input.height>0&&input.height<=20000)item.height=input.height;store.set('media',all);json(res,200,{ok:true});return true;}
  return false;
}
