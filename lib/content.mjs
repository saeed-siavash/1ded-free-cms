import { id, safeUrl, validatePage } from './model.mjs';
const pagePath=p=>p.slug?`/${p.slug}/`:'/';
export const kinds=['page','post','project','service','member'];
export const categoryPath=c=>`/category/${c.slug}/`;
const fail=message=>{throw Object.assign(new Error(message),{status:400});};
const text=(s,n=500)=>String(s||'').trim().slice(0,n);
export function validateCategory(input,existing) {
  const name=text(input.name,100),slug=text(input.slug,100).toLowerCase(),categoryId=text(input.id,80)||id();
  if(!name||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))fail('A category needs a name and a lowercase hyphenated URL slug.');
  if(existing.some(c=>c.id!==categoryId&&c.slug===slug))fail('Another category uses this URL.');
  return {id:categoryId,name,slug,description:text(input.description,2000),revision:id()};
}
export function validateLink(input,pages,categories) {
  const label=text(input.label,200),page=text(input.page,80),url=safeUrl(input.url),category=text(input.category,80);
  if(!label||(!page&&!url))fail('A link needs a label and a destination.');
  if(page&&!pages.some(p=>p.id===page))fail('The selected destination page no longer exists.');
  if(category&&!categories.some(c=>c.id===category))fail('The link category no longer exists.');
  return {id:text(input.id,80)||id(),label,page,url:page?'':url,category,description:text(input.description,2000),newTab:!!input.newTab,nofollow:!!input.nofollow,sponsored:!!input.sponsored,revision:id()};
}
export function pageReferences(page,sections=page.sections) {
  const refs=[];for(const s of sections){if(s.linkPage)refs.push(s.linkPage);for(const item of s.items||[])if(item.linkPage)refs.push(item.linkPage);}return refs;
}
export function validateContentPage(input,pages,categories) {
  const page=validatePage(input,pages);
  page.starterLayout=['split','centered','card','resume','editorial'].includes(input.starterLayout)?input.starterLayout:'';page.starterId=text(input.starterId,80);page.starterKey=text(input.starterKey,80);
  page.kind=kinds.includes(input.kind)?input.kind:'page';
  page.categories=[...new Set(Array.isArray(input.categories)?input.categories:[])].slice(0,20);
  if(page.categories.some(c=>!categories.some(x=>x.id===c)))fail('A selected category no longer exists.');
  page.tags=[...new Set((Array.isArray(input.tags)?input.tags:[]).map(x=>text(x,60)).filter(Boolean))].slice(0,30);
  page.excerpt=text(input.excerpt,2000);page.author=text(input.author,200);page.date=/^\d{4}-\d{2}-\d{2}$/.test(input.date||'')?input.date:new Date().toISOString().slice(0,10);
  page.sections.forEach((s,i)=>{s.collectionKind=kinds.includes(input.sections[i].collectionKind)?input.sections[i].collectionKind:'post';s.itemLimit=Math.max(1,Math.min(24,Number(input.sections[i].itemLimit)||6));s.linkPage=text(input.sections[i].linkPage,80);if(s.linkPage&&!pages.some(p=>p.id===s.linkPage||p.id===page.id))fail('A button destination no longer exists.');s.linkCategory=text(input.sections[i].linkCategory,80);if(s.linkCategory&&!categories.some(c=>c.id===s.linkCategory))fail('A section category no longer exists.');});
  return page;
}
export function resolvePageLinks(pages) {return pages.map(page=>({...page,sections:page.sections.map(s=>{const target=pages.find(p=>p.id===s.linkPage&&p.status==='published');return {...s,link:s.linkPage?(target?pagePath(target):''):s.link};})}));}
export function linkReport(site,pages,categories,links,redirects=[]) {
  const results=[],live=pages.filter(p=>p.status==='published');const paths=new Set(['/', '/search/', '/blog/',...live.map(pagePath),...categories.map(categoryPath)]);
  const incoming=new Map(pages.map(p=>[p.id,0]));
  function inspect(label,url,page){if(page){const p=pages.find(x=>x.id===page);if(!p)results.push({level:'error',source:label,message:'Destination page is missing.'});else {incoming.set(page,(incoming.get(page)||0)+1);if(p.status!=='published')results.push({level:'warning',source:label,message:`Links to private draft: ${p.title}`});}return;}
    if(!url)return;try {const parsed=new URL(url,site.url);if(parsed.origin===new URL(site.url).origin&&parsed.pathname.startsWith('/')&&!parsed.pathname.startsWith('/media/')){const path=parsed.pathname.endsWith('/')?parsed.pathname:parsed.pathname+'/';if(!paths.has(path)){const redirected=redirects.find(r=>r.from===path);results.push({level:redirected?'warning':'error',source:label,message:redirected?`Uses a redirect: ${path} → ${redirected.to}`:`Missing internal destination: ${parsed.pathname}`});}const target=live.find(p=>pagePath(p)===path);if(target)incoming.set(target.id,(incoming.get(target.id)||0)+1);}}catch{results.push({level:'error',source:label,message:'Invalid URL.'});}}
  const menu=items=>items.forEach(x=>{inspect('Menu: '+x.label,x.url,x.page);menu(x.children||[]);});menu(site.menus);menu(site.footerMenus);
  for(const p of pages)for(const s of p.sections){inspect(p.title+' · '+s.type,s.link,s.linkPage);for(const m of String(s.text||'').matchAll(/\[[^\]]+\]\(([^\s)]+)\)/g))inspect(p.title+' · text',m[1]);}
  for(const link of links)inspect('Saved link: '+link.label,link.url,link.page);
  for(const p of live)if(p.slug&&!incoming.get(p.id))results.push({level:'warning',source:p.title,message:'No incoming internal links were found (orphan page).'});
  return results;
}
export function generatedPages(site,pages,categories=[],links=[]) {
  const source=resolvePageLinks(pages),live=source.filter(p=>p.status==='published');
  const make=(slug,title,desc,sections)=>({id:'generated-'+slug,slug,title,status:'published',seo:{description:desc},sections:[{type:'hero',title,text:desc},...sections]});
  const cards=items=>({type:'listing',items:items.map(p=>({title:p.title,text:p.excerpt||p.seo?.description||'',link:pagePath(p),date:p.kind==='post'?p.date:''}))});
  const archives=categories.map(c=>make('category/'+c.slug,c.name,c.description,[cards(live.filter(p=>p.categories?.includes(c.id))),{type:'links',linkCategory:c.id,title:'Useful links'}]));
  const posts=live.filter(p=>p.kind==='post').sort((a,b)=>(b.date||'').localeCompare(a.date||''));
  if(posts.length)archives.push(make('blog','Journal','News, notes, and ideas.',[cards(posts)]));
  const search=make('search','Find something good.','Search pages, posts, projects, and services.',[{type:'search'}]);search.seo.noindex=true;archives.push(search);
  return [...source,...archives];
}
