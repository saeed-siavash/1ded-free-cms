import { randomUUID } from 'node:crypto';

import { themeCatalog } from './themes.mjs';
export const themes = themeCatalog.map(theme=>theme.id);
export const types = ['hero', 'text', 'features', 'image', 'gallery', 'timeline', 'testimonials', 'faq', 'cta', 'contact', 'links', 'collection'];
export const id = () => randomUUID();
export const defaultSite = () => ({
  name: 'Northstar Studio', tagline: 'Independent thinking. Lasting impact.', url: 'https://example.com',
  description: 'We bring thoughtful ideas to life through strategy, design, and craft.',
  theme: 'minimal', accent: '#486548', font: 'sans', language: 'en', direction: 'ltr',
  email: 'hello@example.com', phone: '', address: '', footer: 'Thoughtfully made. Built to last.',
  copyright: 'Northstar Studio', entity: 'Organization', logo: '', favicon: '', socialImage: '',
  social: [], formEndpoint: '',
  menus: [{ id: id(), label: 'Home', page: 'home', url: '', children: [] }, { id: id(), label: 'About', page: 'about', url: '', children: [] }, { id: id(), label: 'Contact', page: 'contact', url: '', children: [] }],
  footerMenus: [], starterLayout:'split', menuStyle: 'auto', menuAlign: 'right', stickyHeader: false, showSearch: false
});
const section = (type, data) => ({ id: id(), type, ...data });
export function starterPages(preset = 'business') {
  const personal = preset === 'personal', portfolio = preset === 'portfolio';
  return [
    { id: 'home', title: 'Home', slug: '', status: 'published', seo: { title: '', description: '', noindex: false }, sections: [
      section('hero', { eyebrow: personal ? 'A life of curiosity' : portfolio ? 'Selected work & independent practice' : 'A small studio. A bigger perspective.', title: personal ? 'Your story,\nbeautifully told.' : portfolio ? 'Good work.\nGreat possibilities.' : 'Good ideas deserve\nto become real.', text: 'A considered approach to meaningful work. Discover who we are, what we do, and what we can create together.', button: 'Explore our story', link: '/about/' }),
      section('features', { title: personal ? 'A few things about me' : 'Thoughtful from the start.', text: 'Clear thinking. Careful execution. A human touch.', items: [{ title: 'A fresh perspective', text: 'We ask the right questions and find the possibilities others overlook.', icon: 'spark' }, { title: 'Made with intention', text: 'Every detail serves a purpose. Every decision moves the work forward.', icon: 'grid' }, { title: 'Better together', text: 'Open conversations and lasting relationships are at the heart of our work.', icon: 'heart' }] }),
      section('text', { eyebrow: 'OUR APPROACH', title: 'Simple, honest,\nand a little different.', text: 'We believe the best work starts with understanding. We take time to listen, explore, and build something that feels right for you.\n\nThis is your starting point. Make it your own in the page editor.' }),
      section('cta', { title: 'Let’s make something meaningful.', text: 'Have an idea in mind? We’d love to hear about it.', button: 'Start a conversation', link: '/contact/' })
    ] },
    { id: 'about', title: 'About', slug: 'about', status: 'published', seo: {}, sections: [section('hero', { eyebrow: 'OUR STORY', title: personal ? 'Hello.\nThis is my story.' : 'Small team.\nShared ambition.', text: 'We care about good work and the people behind it.' }), section('text', { title: 'Built on curiosity.', text: 'Tell your story here. Share your background, what motivates you, and the ideas that shape your work.' }), section('timeline', { title: 'The journey so far', items: [{ title: '2020 — The beginning', text: 'An idea became a practice.' }, { title: 'Today — Moving forward', text: 'Still curious. Still creating.' }] })] },
    { id: 'contact', title: 'Contact', slug: 'contact', status: 'published', seo: {}, sections: [section('hero', { eyebrow: 'SAY HELLO', title: 'Good things start\nwith a conversation.', text: 'Tell us a little about yourself and what you have in mind.' }), section('contact', { title: 'Get in touch', text: 'We look forward to hearing from you.' })] }
  ];
}
export function safeUrl(value, { image = false } = {}) {
  if (typeof value !== 'string') return '';
  if (image) return /^\/media\/[a-zA-Z0-9._-]+$/.test(value) ? value : '';
  if (/^\/(?!\/)[^\\\s]*$/.test(value) || /^#[\w-]+$/.test(value)) return value;
  try { const u = new URL(value); return ['https:', 'http:', 'mailto:', 'tel:'].includes(u.protocol) ? value : ''; } catch { return ''; }
}
function assert(ok, message) { if (!ok) { const e = new Error(message); e.status = 400; throw e; } }
function short(v, n = 1000) { return typeof v === 'string' ? v.slice(0, n).trim() : ''; }
export function validateSite(input, pages, categories=[]) {
  assert(input && typeof input === 'object' && !Array.isArray(input), 'Invalid site settings.');
  const site = defaultSite();
  for (const k of ['name','tagline','description','email','phone','address','footer','copyright','language','formEndpoint']) site[k] = short(input[k], k === 'description' ? 2000 : 1000);
  assert(site.name, 'Site name is required.');
  assert(/^[a-z]{2,3}(-[a-zA-Z0-9]{2,8})*$/.test(site.language), 'Use a language code such as en or en-US.');
  try { const u = new URL(input.url); assert(['https:','http:'].includes(u.protocol) && !u.username && !u.password && u.pathname === '/' && !u.search && !u.hash, 'Website URL must be an origin, e.g. https://example.com'); site.url = u.origin; } catch { assert(false, 'Enter a valid website URL (https://example.com).'); }
  assert(themes.includes(input.theme), 'Unknown theme.'); site.theme = input.theme;
  assert(/^#[0-9a-f]{6}$/i.test(input.accent), 'Accent must be a six-digit hex color.'); site.accent = input.accent;
  site.font = ['sans','serif','mono'].includes(input.font) ? input.font : 'sans';
  site.direction = input.direction === 'rtl' ? 'rtl' : 'ltr';
  site.entity = ['Organization','LocalBusiness','Person'].includes(input.entity) ? input.entity : 'Organization';
  for (const k of ['logo','favicon','socialImage']) site[k] = safeUrl(input[k], { image: true });
  if (site.formEndpoint) { const u = new URL(site.formEndpoint); assert(u.protocol === 'https:' || (u.protocol === 'http:' && ['localhost','127.0.0.1'].includes(u.hostname)), 'Form endpoint must use HTTPS.'); }
  site.social = (Array.isArray(input.social) ? input.social : []).slice(0, 12).map(x => ({ label: short(x.label, 60), url: safeUrl(x.url) })).filter(x => x.label && x.url);
  site.starterLayout=['split','centered','card','resume','editorial'].includes(input.starterLayout)?input.starterLayout:'split';
  site.menuStyle=['auto','normal','mega'].includes(input.menuStyle)?input.menuStyle:'auto';
  site.menuAlign=input.menuAlign==='center'?'center':'right';site.stickyHeader=!!input.stickyHeader;site.showSearch=!!input.showSearch;
  let total = 0;
  function menu(items, depth = 0) {
    assert(Array.isArray(items) && depth <= 2, 'Menus support at most three levels.');
    return items.map(x => {
      assert(x&&typeof x==='object'&&!Array.isArray(x),'Invalid menu entry.');assert(++total <= 120, 'Too many menu entries.');
      const page=short(x.page,80),category=short(x.category,80),label=short(x.label,100);
      assert(!page||pages.some(p=>p.id===page),'A menu links to a missing page.');assert(!category||categories.some(c=>c.id===category),'A menu links to a missing category.');assert(!(page&&category),'Choose either a page or a category destination.');assert(label,'Each menu entry needs a label.');
      return {id:short(x.id,80)||id(),label,page,category,url:page||category?'':safeUrl(x.url),description:short(x.description,200),
        layout:['auto','dropdown','mega'].includes(x.layout)?x.layout:'auto',columns:[2,3,4].includes(Number(x.columns))?Number(x.columns):3,
        icon:['spark','grid','heart','arrow','check','star'].includes(x.icon)?x.icon:'',highlight:!!x.highlight,newTab:!!x.newTab,nofollow:!!x.nofollow,
        children:x.children?.length?menu(x.children,depth+1):[]};
    });
  }
  site.menus=menu(input.menus||[]);site.footerMenus=menu(input.footerMenus||[]);
  site.revision = id();
  return site;
}
export function validatePage(input, existing) {
  assert(input && typeof input === 'object', 'Invalid page.');
  const slug = short(input.slug, 160).toLowerCase();
  assert(slug === '' || /^[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$/.test(slug), 'Use lowercase URL segments separated by hyphens.');
  assert(!['admin','api','media','assets','preview','starter-preview','category','search'].includes(slug.split('/')[0]) && slug!=='blog' && !['404','robots.txt','sitemap.xml'].includes(slug), 'This URL is reserved.');
  const pageId = short(input.id, 80) || id();
  assert(!existing.some(p => p.id !== pageId && p.slug === slug), 'Another page already uses this URL.');
  const title = short(input.title, 200); assert(title, 'A page title is required.');
  assert(Array.isArray(input.sections) && input.sections.length <= 80, 'A page may contain up to 80 sections.');
  const sections = input.sections.map(s => {
    assert(types.includes(s.type), 'Unknown section type.');
    const result = { id: short(s.id, 80) || id(), type: s.type, hidden: !!s.hidden };
    for (const k of ['eyebrow','title','text','button','alt']) result[k] = short(s[k], k === 'text' ? 20000 : 1000);
    result.link = safeUrl(s.link); result.image = safeUrl(s.image, { image: true });
    result.items = (Array.isArray(s.items) ? s.items : []).slice(0, 40).map(i => ({ title: short(i.title, 300), text: short(i.text, 5000), image: safeUrl(i.image, { image: true }), alt: short(i.alt, 500), icon: ['spark','grid','heart','arrow','check','star'].includes(i.icon) ? i.icon : 'spark' }));
    return result;
  });
  const seo = { title: short(input.seo?.title, 200), description: short(input.seo?.description, 1000), noindex: !!input.seo?.noindex, image: safeUrl(input.seo?.image, { image: true }) };
  return { id: pageId, revision: id(), title, slug, status: input.status === 'published' ? 'published' : 'draft', seo, sections, updatedAt: new Date().toISOString() };
}
