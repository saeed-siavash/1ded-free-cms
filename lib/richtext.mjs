import { safeUrl } from './model.mjs';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function inline(text) {
  // Parse source tokens before escaping. Never accept raw HTML or data URLs.
  const pattern=/(`[^`\n]+`|\*\*[^*\n]+\*\*|\*[^*\n]+\*|\[[^\]\n]+\]\([^\s)]+\))/g;
  let result='',last=0;for(const m of String(text).matchAll(pattern)){result+=esc(text.slice(last,m.index));const t=m[0];if(t.startsWith('`'))result+=`<code>${esc(t.slice(1,-1))}</code>`;else if(t.startsWith('**'))result+=`<strong>${esc(t.slice(2,-2))}</strong>`;else if(t.startsWith('*'))result+=`<em>${esc(t.slice(1,-1))}</em>`;else{const split=t.indexOf(']('),label=t.slice(1,split),href=safeUrl(t.slice(split+2,-1));result+=href?`<a href="${esc(href)}">${esc(label)}</a>`:esc(label);}last=m.index+t.length;}return result+esc(text.slice(last));
}
export function richText(source) {
  const lines=String(source||'').replace(/\r/g,'').split('\n');let out='',paragraph=[],list=[],listType='';
  function flushP(){if(paragraph.length){out+='<p>'+paragraph.map(inline).join('<br>')+'</p>';paragraph=[];}}
  function flushL(){if(list.length){out+=`<${listType}>${list.map(x=>`<li>${inline(x)}</li>`).join('')}</${listType}>`;list=[];}}
  const cells=line=>line.trim().replace(/^\||\|$/g,'').split('|').map(s=>s.trim());
  for(let i=0;i<lines.length;i++) {const line=lines[i],m=line.match(/^\s*(-|\d+\.)\s+(.+)$/),h=line.match(/^(#{2,4})\s+(.+)$/);
    if(!line.trim()){flushP();flushL();continue;}
    if(line.includes('|')&&lines[i+1]&&/^\s*\|?\s*:?-{3,}/.test(lines[i+1])) {flushP();flushL();const head=cells(line);i++;const rows=[];while(lines[i+1]?.includes('|'))rows.push(cells(lines[++i]));out+=`<div class="rich-table"><table><thead><tr>${head.map(c=>`<th>${inline(c)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${head.map((_,j)=>`<td>${inline(r[j]||'')}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;continue;}
    if(m){flushP();const type=m[1]==='-'?'ul':'ol';if(listType&&type!==listType)flushL();listType=type;list.push(m[2]);continue;}flushL();
    if(h){flushP();out+=`<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`;continue;}
    if(line.startsWith('> ')){flushP();out+=`<blockquote>${inline(line.slice(2))}</blockquote>`;continue;}
    paragraph.push(line);
  }flushP();flushL();return out;
}
