import { mkdir, writeFile, cp, access, rm, rename } from 'node:fs/promises';
import { join } from 'node:path';
import { safeUrl } from './model.mjs';
import { richText } from './richtext.mjs';
import { generatedPages,resolvePageLinks,categoryPath } from './content.mjs';
export const esc = x => String(x ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const pagePath = p => p.slug ? `/${p.slug}/` : '/';
const paragraphs = richText;
const icon = name => ({ spark:'✳', grid:'▦', heart:'♡', arrow:'↗', check:'✓', star:'☆' }[name] || '✳');
function nav(items,pages,{site,categories=[],footer=false,inMega=false,previewRoutes={}}={},level=0) {
  return items.map(item=>{
    const page=pages.find(p=>p.id===item.page&&p.status==='published'),category=categories.find(c=>c.id===item.category);
    const href=item.page?(page?(previewRoutes[page.id]||pagePath(page)):''):item.category?(category?categoryPath(category):''):safeUrl(item.url);
    const hasChildren=!!item.children?.length;
    const preference=item.layout&&item.layout!=='auto'?item.layout:site?.menuStyle==='mega'?'mega':site?.menuStyle==='normal'?'dropdown':'auto';
    const mega=!footer&&level===0&&hasChildren&&(preference==='mega'||preference==='auto'&&item.children.some(c=>c.children?.length));
    const column=inMega&&level===1&&hasChildren,childHTML=hasChildren?nav(item.children,pages,{site,categories,footer,inMega:mega||inMega,previewRoutes},level+1):'';
    const symbol=item.icon?'<span class="nav-icon" aria-hidden="true">'+icon(item.icon)+'</span>':'';
    const label=symbol+esc(item.label),rel=[item.newTab?'noopener':'',item.nofollow?'nofollow':''].filter(Boolean).join(' ');
    const anchor=(text,overview=false)=>'<a href="'+esc(href)+'"'+(item.newTab?' target="_blank"':'')+(rel?' rel="'+rel+'"':'')+(item.highlight&&!overview?' class="nav-highlight"':'')+'>'+text+(overview?' <span aria-hidden="true">↗</span>':'')+(item.description&&!overview?'<small>'+esc(item.description)+'</small>':'')+'</a>';
    if(!hasChildren&&((item.page&&!page)||(item.category&&!category)))return '';
    if(hasChildren&&!childHTML)return href?'<li class="nav-item">'+anchor(label)+'</li>':'';
    if(!hasChildren)return '<li class="nav-item">'+(href?anchor(label):'<span class="nav-heading">'+label+'</span>')+'</li>';
    const classes=['nav-group','level-'+level,mega?'nav-mega':'nav-dropdown',column?'nav-column':''].filter(Boolean).join(' ');
    return '<li class="nav-item"><details class="'+classes+'"'+(column?' open data-mega-column':'')+' style="--menu-columns:'+([2,3,4].includes(Number(item.columns))?Number(item.columns):3)+'"><summary>'+label+'</summary><ul>'+(href?'<li class="nav-overview">'+anchor('Explore '+esc(item.label),true)+'</li>':'')+childHTML+'</ul></details></li>';
  }).join('');
}
function accentInk(hex){const channel=n=>{n/=255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4;};const values=(hex.match(/[a-f0-9]{2}/gi)||['48','65','48']).map(x=>channel(parseInt(x,16)));const luminance=values[0]*.2126+values[1]*.7152+values[2]*.0722;return (1.05/(luminance+.05))>=4.5?'#ffffff':'#000000';}
function section(s, site, formAction, pages=[], links=[],previewRoutes={}) {
  const image = s.image ? `<img src="${esc(s.image)}" alt="${esc(s.alt)}" loading="lazy" decoding="async" width="1440" height="960">` : '';
  const intro = `${s.eyebrow ? `<div class="eyebrow">${esc(s.eyebrow)}</div>`:''}${s.title ? `<h2>${esc(s.title).replace(/\n/g,'<br>')}</h2>`:''}${paragraphs(s.text)}`;
  const button = s.button && safeUrl(s.link) ? `<a class="button" href="${esc(s.link)}">${esc(s.button)} <span>↗</span></a>` : '';
  let body='';
  switch(s.type) {
    case 'collection': {const selected=pages.filter(p=>p.status==='published'&&(p.kind||'page')===(s.collectionKind||'post')&&(!s.linkCategory||p.categories?.includes(s.linkCategory))).sort((a,b)=>(b.date||b.updatedAt||'').localeCompare(a.date||a.updatedAt||'')).slice(0,s.itemLimit||6);body=intro+'<div class="cards collection-cards">'+selected.map(p=>'<article class="card">'+(p.seo?.image?'<img src="'+esc(p.seo.image)+'" alt="" loading="lazy" width="640" height="400">':'')+'<h3><a href="'+esc(previewRoutes[p.id]||pagePath(p))+'">'+esc(p.title)+'</a></h3>'+(p.date?'<small>'+esc(p.date)+'</small>':'')+paragraphs(p.excerpt||p.seo?.description||'')+'</article>').join('')+'</div>';break;}
    case 'links': { const selected=links.filter(l=>!s.linkCategory||l.category===s.linkCategory);body=intro+'<div class="link-directory">'+selected.map(l=>{const page=pages.find(p=>p.id===l.page&&p.status==='published'),href=l.page?(page?pagePath(page):''):safeUrl(l.url);if(!href)return '';const rel=[l.newTab?'noopener':'',l.nofollow?'nofollow':'',l.sponsored?'sponsored':''].filter(Boolean).join(' ');return '<article class="directory-link"><a href="'+esc(href)+'"'+(l.newTab?' target="_blank"':'')+(rel?' rel="'+rel+'"':'')+'>'+esc(l.label)+' ↗</a>'+paragraphs(l.description)+'</article>';}).join('')+'</div>';break; }
    case 'listing': body=intro+'<div class="cards">'+(s.items||[]).map(i=>'<article class="card"><h3><a href="'+esc(safeUrl(i.link))+'">'+esc(i.title)+'</a></h3>'+(i.date?'<small>'+esc(i.date)+'</small>':'')+paragraphs(i.text)+'</article>').join('')+'</div>';break;
    case 'search': body='<form class="site-search" role="search"><label for="site-search">Search this website</label><input id="site-search" type="search" name="q" placeholder="Type a word or phrase…" autocomplete="off"><button class="button" type="submit">Search ↗</button></form><p id="search-status" role="status"></p><div id="search-results" class="link-directory"></div><noscript>Search needs JavaScript. Use the navigation to browse this website.</noscript>';break;
    case 'hero': body=`<div class="hero-copy">${s.eyebrow ? `<div class="eyebrow"><span class="dot"></span>${esc(s.eyebrow)}</div>`:''}<h1>${esc(s.title).replace(/\n/g,'<br>')}</h1>${paragraphs(s.text)}${button}</div>${image ? `<div class="hero-image">${image}</div>` : '<div class="hero-art" aria-hidden="true"><div></div><div></div><span>Ideas into possibilities.</span></div>'}`; break;
    case 'features': case 'testimonials': body=`<div class="section-heading">${intro}</div><div class="cards">${(s.items||[]).map(i=>`<article class="card">${s.type==='features' ? `<span class="feature-icon" aria-hidden="true">${icon(i.icon)}</span>`:'<span class="quote" aria-hidden="true">“</span>'}<h3>${esc(i.title)}</h3>${paragraphs(i.text)}</article>`).join('')}</div>`; break;
    case 'text': body=`<div class="text-layout">${s.eyebrow ? `<div class="eyebrow">${esc(s.eyebrow)}</div>`:''}<div>${s.title ? `<h2>${esc(s.title).replace(/\n/g,'<br>')}</h2>`:''}${paragraphs(s.text)}</div></div>`; break;
    case 'image': body=`${image}<div class="image-caption">${intro}</div>`; break;
    case 'gallery': body=`${intro}<div class="gallery">${(s.items||[]).map(i=>`<figure>${i.image ? `<img src="${esc(i.image)}" alt="${esc(i.alt)}" loading="lazy" width="900" height="600">`:''}<figcaption><h3>${esc(i.title)}</h3>${paragraphs(i.text)}</figcaption></figure>`).join('')}</div>`; break;
    case 'timeline': body=`${intro}<ol class="timeline">${(s.items||[]).map(i=>`<li><h3>${esc(i.title)}</h3>${paragraphs(i.text)}</li>`).join('')}</ol>`; break;
    case 'faq': body=`${intro}<div class="faq">${(s.items||[]).map(i=>`<details><summary>${esc(i.title)}</summary>${paragraphs(i.text)}</details>`).join('')}</div>`; break;
    case 'cta': body=`${intro}${button}`; break;
    case 'contact': body=`<div class="contact-grid"><div>${intro}${site.email ? `<p><a href="mailto:${esc(site.email)}">${esc(site.email)}</a></p>`:''}${site.phone ? `<p>${esc(site.phone)}</p>`:''}${site.address ? paragraphs(site.address):''}</div><form method="post" action="${esc(formAction)}" class="contact-form"><label>Your name<input name="name" required maxlength="120" autocomplete="name"></label><label>Email address<input type="email" name="email" required maxlength="254" autocomplete="email"></label><label>How can we help?<textarea name="message" required minlength="10" maxlength="10000" rows="5"></textarea></label><label class="honeypot" aria-hidden="true">Leave empty<input name="website" tabindex="-1" autocomplete="off"></label><p class="form-note">Your details will be used to respond to your enquiry.</p><button class="button" type="submit">Send message <span>↗</span></button></form></div>`; break;
  }
  return `<section${s.id?` id="section-${esc(s.id)}"`:""} class="section section-${s.type}"><div class="container">${body}</div></section>`;
}
export function renderPage(page, site, pages, { preview=false,categories=[],links=[],previewRoutes:providedRoutes={} }={}) {
  const previewRoutes=preview?{...Object.fromEntries(pages.map(p=>[p.id,'/preview/'+p.id])),...providedRoutes}:{};
  const visiblePages=preview?pages.map(p=>({...p,status:'published'})):pages;
  page=resolvePageLinks([page,...visiblePages.filter(p=>p.id!==page.id)])[0];
  if(preview)page={...page,sections:page.sections.map(s=>({...s,link:s.linkPage&&previewRoutes[s.linkPage]?previewRoutes[s.linkPage]:s.link}))};
  const homeURL=previewRoutes[pages.find(p=>p.slug==='')?.id]||'/';
  const canonical = site.url + pagePath(page), title = page.seo?.title || (page.slug ? `${page.title} — ${site.name}` : `${site.name} — ${site.tagline}`);
  const desc = page.seo?.description || site.description;
  const social = page.seo?.image || site.socialImage;
  const entity = { '@context':'https://schema.org', '@type':site.entity, name:site.name, url:site.url, description:site.description, ...(site.email ? {email:site.email}:{}), ...(site.phone ? {telephone:site.phone}:{}), ...(site.address ? {address:site.address}:{}), ...(site.logo ? {image:site.url+site.logo}:{}), sameAs:site.social.map(s=>s.url) };
  const article=page.kind==='post'?{'@context':'https://schema.org','@type':'BlogPosting',headline:page.title,datePublished:page.date,author:{'@type':'Person',name:page.author||site.name},mainEntityOfPage:canonical}:null;
  const categoryLinks=(page.categories||[]).map(id=>categories.find(c=>c.id===id)).filter(Boolean).map(c=>`<a href="${categoryPath(c)}">${esc(c.name)}</a>`).join(' · ');
  return `<!doctype html><html lang="${esc(site.language)}" dir="${site.direction}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><link rel="canonical" href="${esc(canonical)}">${preview || page.seo?.noindex ? '<meta name="robots" content="noindex,nofollow">':''}<meta property="og:type" content="website"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${esc(canonical)}"><meta property="og:site_name" content="${esc(site.name)}"><meta name="twitter:card" content="${social ? 'summary_large_image':'summary'}">${social ? `<meta property="og:image" content="${esc(site.url+social)}">`:''}${site.favicon ? `<link rel="icon" href="${esc(site.favicon)}">`:''}<link rel="stylesheet" href="/assets/site.css"><link rel="stylesheet" href="/assets/templates.css"><style>:root{--accent:${site.accent};--accent-ink:${accentInk(site.accent)}}</style><script type="application/ld+json">${JSON.stringify(article?[entity,article]:entity).replace(/</g,'\\u003c')}</script><script src="/assets/site.js" defer></script></head><body class="theme-${site.theme} font-${site.font} layout-${page.starterLayout||site.starterLayout||"split"}"><a class="skip" href="#main">Skip to content</a>${preview ? '<div class="preview-banner">PRIVATE PREVIEW · Unpublished changes</div>':''}<header class="site-header ${site.stickyHeader?'is-sticky':''} ${site.menuAlign==='center'?'nav-centered':''}"><div class="container header-inner"><a class="brand" href="${esc(homeURL)}">${site.logo ? `<img src="${esc(site.logo)}" width="40" height="40" alt="">`:'<span class="brand-symbol" aria-hidden="true">✳</span>'}${esc(site.name)}</a><nav aria-label="Main navigation"><button class="nav-toggle" aria-expanded="false" aria-controls="main-menu">Menu <span>☰</span></button><ul id="main-menu" class="main-menu">${nav(site.menus,visiblePages,{site,categories,previewRoutes})}${site.showSearch?'<li class="nav-item nav-search"><a href="/search/">Search <span aria-hidden="true">⌕</span></a></li>':''}</ul></nav></div></header><main id="main">${page.kind&&page.kind!=='page'?`<div class="container content-meta"><a href="/">Home</a> / ${esc(page.kind)}${categoryLinks?' / '+categoryLinks:''}${page.kind==='post'?`<p>${esc(page.date)} · ${esc(page.author||site.name)}</p>`:''}</div>`:''}${page.sections.filter(s=>!s.hidden).map(s=>section(s,site,site.formEndpoint || '/api/contact',visiblePages,links,previewRoutes)).join('')}</main><footer class="site-footer"><div class="container"><div class="footer-top"><a class="brand" href="${esc(homeURL)}">${esc(site.name)}</a><p>${esc(site.footer)}</p><ul>${nav(site.footerMenus,visiblePages,{site,categories,footer:true,previewRoutes})}</ul></div><div class="footer-bottom"><span>© ${new Date().getFullYear()} ${esc(site.copyright || site.name)}</span><div>${site.social.map(x=>`<a href="${esc(x.url)}" rel="me">${esc(x.label)} ↗</a>`).join('')}</div></div></div></footer></body></html>`;
}
export function seoWarnings(site,pages) {
  const warnings=[];
  if(site.url.includes('example.com')) warnings.push('Set your real website URL before publishing.');
  const titles=new Set();
  for(const p of pages.filter(p=>p.status==='published')) {
    if(!p.seo?.description) warnings.push(`${p.title}: using the site-wide description. Add a unique description.`);
    const title=p.seo?.title || p.title; if(titles.has(title)) warnings.push(`${p.title}: duplicate SEO title.`); titles.add(title);
    const heroes=p.sections.filter(s=>s.type==='hero'&&!s.hidden); if(heroes.length!==1) warnings.push(`${p.title}: use one hero for a clear main heading.`);
    for(const s of p.sections) {
      if(s.image&&!s.alt) warnings.push(`${p.title}: an image has no alt text (leave empty only for decorative images).`);
      for(const i of s.items||[]) if(i.image&&!i.alt) warnings.push(`${p.title}: a gallery image has no alt text.`);
      if(s.link?.startsWith('/')&&!pages.some(x=>x.status==='published'&&pagePath(x)===s.link)&&!s.link.startsWith('/media/')) warnings.push(`${p.title}: check internal link ${s.link}`);
    }
  }
  if(!pages.some(p=>p.slug===''&&p.status==='published')) warnings.push('A published homepage is required.');
  return warnings;
}
export async function buildRelease({directory, releaseId, site, pages, redirects, assets, media,categories=[],links=[]}) {
  const temp=join(directory,releaseId+'.building'), final=join(directory,releaseId);
  try {
    await mkdir(join(temp,'assets'),{recursive:true});
    await cp(join(assets,'site.css'),join(temp,'assets','site.css')); await cp(join(assets,'templates.css'),join(temp,'assets','templates.css')); await cp(join(assets,'site.js'),join(temp,'assets','site.js'));
    const allPages=generatedPages(site,pages,categories,links);const publicPages=allPages.filter(p=>p.status==='published');
    if(!publicPages.some(p=>p.slug==='')) throw Object.assign(new Error('Publish a homepage before building.'),{status:400});
    const images=new Set([site.logo,site.favicon,site.socialImage]);
    for(const page of publicPages) { images.add(page.seo?.image);for(const s of page.sections.filter(s=>!s.hidden)){images.add(s.image);for(const item of s.items||[])images.add(item.image);} }
    for(const image of images) { if(!image)continue;await mkdir(join(temp,'media'),{recursive:true});await cp(join(media,image.slice(7)),join(temp,'media',image.slice(7))); }
    for(const page of publicPages) { const dest=join(temp,page.slug); await mkdir(dest,{recursive:true}); await writeFile(join(dest,'index.html'),renderPage(page,site,allPages,{categories,links})); }
    await writeFile(join(temp,'search-index.json'),JSON.stringify(pages.filter(p=>p.status==='published'&&!p.seo?.noindex).map(p=>({title:p.title,url:pagePath(p),text:[p.excerpt,...p.sections.filter(s=>!s.hidden).flatMap(s=>[s.title,s.text,...(s.items||[]).flatMap(i=>[i.title,i.text])])].filter(Boolean).join(' ').slice(0,30000)}))));
    const indexed=publicPages.filter(p=>!p.seo?.noindex);
    await writeFile(join(temp,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${indexed.map(p=>`<url><loc>${esc(site.url+pagePath(p))}</loc>${p.updatedAt ? `<lastmod>${esc(p.updatedAt)}</lastmod>`:''}</url>`).join('')}</urlset>`);
    await writeFile(join(temp,'robots.txt'),`User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\nDisallow: /preview/\nSitemap: ${site.url}/sitemap.xml\n`);
    await writeFile(join(temp,'404.html'),`<!doctype html><html lang="${esc(site.language)}"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Page not found</title><link rel="stylesheet" href="/assets/site.css"><main class="container section"><h1>Nothing here. Yet.</h1><p>This page may have moved.</p><a class="button" href="/">Back to home ↗</a></main></html>`);
    await writeFile(join(temp,'_redirects'),redirects.map(r=>`${r.from} ${r.to} 301`).join('\n')+'\n');
    await writeFile(join(temp,'nginx-redirects.conf'),redirects.map(r=>`location = ${r.from} { return 301 ${r.to}; }`).join('\n')+'\n');
    await rename(temp,final); return final;
  } catch(e) { await rm(temp,{recursive:true,force:true}); throw e; }
}
