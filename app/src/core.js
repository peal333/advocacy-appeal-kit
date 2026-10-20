(function(root){
'use strict';
const schema=root.KitSchema||(typeof require!=='undefined'?require('./schema.js'):null);
const MAX=20*1024*1024, MAX_IMAGE=5*1024*1024;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeUrl=s=>{try{const u=new URL(s);return ['https:','http:'].includes(u.protocol)&&!u.username&&!u.password;}catch{return false;}};
const assetPath=s=>/^assets\/[A-Za-z0-9][A-Za-z0-9._-]*\.(png|jpg|jpeg|webp)$/i.test(s);
const date=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s+'T00:00:00Z'))&&new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s;
function structure(value,rule,path='campaign'){
 if(rule.anyOf){if(rule.anyOf.some(r=>structure(value,r,path).length===0))return [];return [path+' has an unsupported structure.'];}
 const kind=value===null?'null':Array.isArray(value)?'array':typeof value;
 if(rule.type==='integer'?!(typeof value==='number'&&Number.isInteger(value)):kind!==rule.type)return [path+' must be '+rule.type+'.'];
 const issues=[];
 if('const'in rule&&value!==rule.const)issues.push(path+' has an unsupported version.');
 if(kind==='string'){if(Array.from(value).some(c=>c.length===1&&c.charCodeAt(0)>=0xd800&&c.charCodeAt(0)<=0xdfff))issues.push(path+' contains invalid Unicode.');if(value.length<rule.minLength)issues.push(path+' is too short.');if(value.length>rule.maxLength)issues.push(path+' is too long.');if(rule.pattern&&!new RegExp(rule.pattern).test(value))issues.push(path+' has an invalid format.');}
 if(kind==='array'){if(rule.uniqueItems&&new Set(value.map(v=>JSON.stringify(v))).size!==value.length)issues.push(path+' must contain unique entries.');if(value.length>rule.maxItems)issues.push(path+' has too many entries.');else value.forEach((v,i)=>issues.push(...structure(v,rule.items,path+'['+i+']')));}
 if(kind==='object'){for(const key of rule.required||[])if(!Object.hasOwn(value,key))issues.push(path+'.'+key+' is required.');for(const key of Object.keys(value)){if(!Object.hasOwn(rule.properties,key))issues.push(path+' contains unsupported field '+key+'.');else issues.push(...structure(value[key],rule.properties[key],path+'.'+key));}}
 return issues;
}
function contrast(a,b){const l=s=>{const c=[1,3,5].map(i=>parseInt(s.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return c[0]*.2126+c[1]*.7152+c[2]*.0722;};const x=l(a),y=l(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
function zonedDate(s){if(typeof s!=='string')return false;const m=s.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?(Z|([+-])(\d{2}):(\d{2}))$/);return !!m&&date(m[1])&&Number(m[2])<24&&Number(m[3])<60&&Number(m[4]||0)<60&&Number(m[7]||0)<24&&Number(m[8]||0)<60&&Number.isFinite(Date.parse(s));}
function validate(c,assets){
 const errors=[], warnings=[]; const bad=s=>errors.push(s);
 const shape=structure(c,schema);if(shape.length)return {errors:shape,warnings};
 if(!c||typeof c!=='object'||Array.isArray(c))return {errors:['Campaign must be an object.'],warnings};
 if(new TextEncoder().encode(JSON.stringify(c,null,2)).length>1024*1024)bad('Campaign data exceeds 1 MiB.');
 if(c.schemaVersion!==1)bad('Only schemaVersion 1 is supported.');
 ['id','title','summary','language','introduction','action'].forEach(k=>{if(typeof c[k]!=='string'||!c[k].trim())bad(k+' is required.');});
 if(typeof c.id!=='string'||!/^[a-z0-9][a-z0-9-]{0,79}$/.test(c.id))bad('Campaign ID must use lowercase letters, numbers and hyphens (maximum 80).');
 if(typeof c.language!=='string'||!/^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/.test(c.language))bad('Use a language tag such as en or en-GB.');
 ['siteUrl','petitionUrl'].forEach(k=>{if(c[k]&&!safeUrl(c[k]))bad(k+' must use http or https.');});
 if(!date(c.updated))bad('Updated date must be a valid YYYY-MM-DD date.');
 if(!c.theme||!/^#[0-9a-f]{6}$/i.test(c.theme.accent)||!/^#[0-9a-f]{6}$/i.test(c.theme.background))bad('Theme colors must be six-digit hex colors.');
 if(c.theme&&/^#[0-9a-f]{6}$/i.test(c.theme.accent)&&/^#[0-9a-f]{6}$/i.test(c.theme.background)&&(contrast(c.theme.accent,c.theme.background)<4.5||contrast(c.theme.accent,'#ffffff')<4.5||contrast('#48564c',c.theme.background)<4.5))bad('Choose a light background and a darker accent: text contrast must be at least 4.5:1.');
 const arrays=['sources','timeline','contacts','sections','socialLinks','assets']; arrays.forEach(k=>{if(!Array.isArray(c[k])||c[k].length>100)bad(k+' must be an array with at most 100 entries.');});
 if(errors.length)return {errors,warnings};
 function unique(list,key){const ids=new Set();list.forEach((x,i)=>{if(!/^[a-zA-Z0-9_-]{1,80}$/.test(x.id)||ids.has(x.id))bad(key+'['+i+'].id must be a unique simple ID.');ids.add(x.id);});return ids;}
 const ids=unique(c.sources,'sources');unique(c.contacts,'contacts');
 c.sources.forEach((s,i)=>{const path='sources['+i+']';if(!s.title.trim())bad(path+'.title is required.');if(!safeUrl(s.url))bad(path+'.url must use http or https.');if(!date(s.checked))bad(path+'.checked must be a valid YYYY-MM-DD date.');});
 c.contacts.forEach((s,i)=>{if(!s)return;const path='contacts['+i+']';if(!s.name.trim())bad(path+'.name is required.');if(! /^[^\s@?&#,;:]+@[^\s@?&#,;:]+\.[^\s@?&#,;:]+$/.test(s.email)||/[\r\n]/.test(s.email))bad(path+'.email must be one valid email address.');if(s.sourceUrl?.trim()&&!safeUrl(s.sourceUrl))bad(path+'.sourceUrl must use http or https.');if(s.verified?.trim()&&!date(s.verified))bad(path+'.verified must be a valid YYYY-MM-DD date.');});
 c.timeline.forEach((t,i)=>{const path='timeline['+i+']';if(!t.date.trim())bad(path+'.date is required.');if(!t.text.trim())bad(path+'.text is required.');if(!ids.has(t.sourceId))bad(path+'.sourceId must refer to an existing source ID.');});
 c.sections.forEach((s,i)=>{const path='sections['+i+']';if(!s.heading.trim())bad(path+'.heading is required.');if(!s.body.trim())bad(path+'.body is required.');});
 c.socialLinks.forEach((s,i)=>{const path='socialLinks['+i+']';if(!s.label.trim())bad(path+'.label is required.');if(!safeUrl(s.url))bad(path+'.url must use http or https.');});
 if(c.event){if(!c.event.label.trim())bad('event.label is required.');if(!c.event.afterText.trim())bad('event.afterText is required.');if(!ids.has(c.event.sourceId))bad('event.sourceId must refer to an existing source ID.');if(!zonedDate(c.event.dateTime))bad('event.dateTime must be a valid explicitly zoned date-time.');}
 if(!c.messages.subject.trim())bad('messages.subject is required.');if(!c.messages.body.trim())bad('messages.body is required.');
 const templates=[c.messages?.subject,c.messages?.body,...c.contacts.flatMap(x=>[x?.subject,x?.body])];
 templates.forEach(t=>{if(t!==undefined&&typeof t!=='string')bad('Message templates must be text.');for(const m of String(t||'').matchAll(/{{(.*?)}}/g))if(!['name','personalMessage','recipient'].includes(m[1]))bad('Unsupported placeholder: '+m[0]);});
 const paths=new Set();c.assets.forEach(a=>{if(!a||!assetPath(a.path)||paths.has(a.path))bad('Assets need unique safe raster image paths.');else paths.add(a.path);if(a?.sourceUrl&&!safeUrl(a.sourceUrl))bad('Asset source URLs must use http or https.');if(!a?.permission)warnings.push('Record the permission or license for every image.');});
 ['poster','socialImage'].forEach(k=>{if(c[k]&&!paths.has(c[k]))bad(k+' must refer to a listed asset.');});
 if(c.poster&&!c.posterAlt?.trim())warnings.push('Add alternative text for the poster so people using screen readers can understand the image.');
 if(assets)paths.forEach(p=>{if(!assets[p])bad('Missing image: '+p);});
 if(c.contacts.length===0)warnings.push('No contacts: the email action will be hidden.');
 warnings.push('Human review required: facts, public contacts, source dates, consent and image permissions. Every campaign field may become public.');
 return {errors:[...new Set(errors)],warnings:[...new Set(warnings)]};
}
function substitute(t,values){
 let text=String(t||'');
 const emptyPersonal=!String(values.personalMessage||'').trim();
 if(emptyPersonal){
  // Remove only the optional line and its separator, never normalize the draft.
  // Retain the preceding paragraph break in the middle; discard it at the end.
  const parts=text.split(/(\r\n|\n|\r)/),kept=[],optional=/^[^\S\r\n]*(?:{{personalMessage}}[^\S\r\n]*)+$/;
  for(let i=0;i<parts.length;i+=2){
   if(optional.test(parts[i])){
    while(i+2<parts.length&&(!parts[i+2].trim()||optional.test(parts[i+2])))i+=2;
    if(i+2>=parts.length){
     while(kept.length&&!kept[kept.length-2].trim())kept.splice(-2);
     if(kept.length)kept[kept.length-1]='';
    }
   }else kept.push(parts[i],parts[i+1]||'');
  }
  text=kept.join('');
 }
 return text.replace(/{{(name|personalMessage|recipient)}}/g,(_,k)=>k==='personalMessage'&&emptyPersonal?'':values[k]||'');
}
function render(c,resolve=p=>p){
 const link=(url,label)=>`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>`;
 return `<header class="topbar"><a href="#main">${esc(c.id.replace(/-/g,' '))}</a><a href="#take-action">Take action ↗</a></header><main id="main"><section class="hero"><div><p class="eyebrow">COMMUNITY • COLLECTIVE ACTION</p><h1>${esc(c.title)}</h1><p class="lead">${esc(c.summary)}</p><a class="button" href="#take-action">Make your voice heard <span aria-hidden="true">↗</span></a><p class="small">Updated ${esc(c.updated)}</p></div>${c.poster?`<figure><img src="${esc(resolve(c.poster))}" alt="${esc(c.posterAlt)}"></figure>`:'<div class="garden" aria-hidden="true"><span>Small voices.<br>Shared ground.<br>Real possibility.</span><div class="sun"></div><div class="stem one"></div><div class="stem two"></div><div class="stem three"></div></div>'}</section><section class="story"><p class="eyebrow">THE CONTEXT</p><h2>Why this matters</h2><p class="preserve">${esc(c.introduction)}</p>${c.sections.map(s=>`<h3>${esc(s.heading)}</h3><p class="preserve">${esc(s.body)}</p>`).join('')}</section>${c.timeline.length?`<section><p class="eyebrow">THE RECORD</p><h2>Campaign timeline</h2><ol class="timeline">${c.timeline.map(t=>`<li><strong>${esc(t.date)}</strong><p>${esc(t.text)}</p>${link((c.sources.find(s=>s.id===t.sourceId)||{}).url||'','Read source ↗')}</li>`).join('')}</ol></section>`:''}${c.event?`<section class="event"><h2>${esc(c.event.label)}</h2><time datetime="${esc(c.event.dateTime)}">${esc(c.event.dateTime)}</time><p data-event="${esc(c.event.dateTime)}" data-after="${esc(c.event.afterText)}">${Date.parse(c.event.dateTime)<=Date.now()?esc(c.event.afterText):'See the scheduled date above.'}</p>${link((c.sources.find(s=>s.id===c.event.sourceId)||{}).url||'','Event source ↗')}</section>`:''}<section id="take-action" class="action"><p class="eyebrow">YOUR NEXT STEP</p><h2>A thoughtful message can make a difference.</h2><p class="preserve">${esc(c.action)}</p>${c.petitionUrl?link(c.petitionUrl,'Visit the petition ↗'):''}${c.contacts.length?`<fieldset class="recipient-picker" aria-describedby="recipient-help"><legend>Choose one recipient</legend><p id="recipient-help" class="small">Compare the contacts, then select one to prepare your message below.</p><div class="recipient-cards">${c.contacts.map((p,i)=>`<article class="recipient-card"><label class="recipient-choice" for="recipient-${i}"><input type="radio" name="recipient" id="recipient-${i}" value="${i}"${i===0?' checked':''}><span><strong class="recipient-name">${esc(p.name)}</strong><span class="recipient-choice-hint">Select for your message</span></span></label><div class="recipient-info">${p.group?`<p class="recipient-group">${esc(p.group)}</p>`:''}${p.role?`<p class="recipient-role">${esc(p.role)}</p>`:''}${p.priority?`<p class="small">${esc(p.priority)}</p>`:''}<p class="recipient-address">${esc(p.email)}</p>${p.verified?.trim()?`<p class="small">Verified ${esc(p.verified)}</p>`:''}${p.sourceUrl?.trim()&&safeUrl(p.sourceUrl)?link(p.sourceUrl,'Public source ↗'):''}</div></article>`).join('')}</div></fieldset><noscript><p>JavaScript is disabled. Use the addresses shown above in your email app and write your own message. Draft preparation requires JavaScript.</p></noscript><div class="composer"><div><p class="eyebrow">YOUR SELECTED RECIPIENT</p><p id="contact-detail" role="status">${esc(c.contacts[0].name)} · ${esc(c.contacts[0].email)}</p><label for="visitor-name">Your name (optional)</label><input id="visitor-name" maxlength="200" autocomplete="name"><label for="personal-message">Your own words (optional)</label><textarea id="personal-message" maxlength="10000" rows="4" placeholder="Why does this matter to you?"></textarea><p class="small">Your words stay in this page until you copy them or open your email app. Nothing is sent automatically.</p></div><div><label for="email-subject">Subject</label><input id="email-subject"><label for="email-body">Message</label><textarea id="email-body" rows="12"></textarea><p class="small">Review and edit before opening your email app. Changing recipient or personalization regenerates the draft.</p><div class="button-row"><a class="button" id="open-email" target="_blank" rel="noopener noreferrer">Open email app ↗</a><button data-copy="recipient">Copy address</button><button data-copy="email-subject">Copy subject</button><button data-copy="email-body">Copy message</button></div><p id="email-status" role="status"></p><p class="small">If no mail app opens, copy the address, subject and message into your preferred email service. We cannot tell whether a message was sent.</p></div></div>`:''}</section>${c.sources.length?`<section><p class="eyebrow">CHECK THE DETAILS</p><h2>Sources & further reading</h2><ul class="sources">${c.sources.map(s=>`<li>${link(s.url,s.title)}<span>${esc(s.publisher||'')} · checked ${esc(s.checked)}</span></li>`).join('')}</ul></section>`:''}${c.socialLinks.length?`<nav aria-label="Campaign links">${c.socialLinks.map(s=>link(s.url,s.label)).join(' · ')}</nav>`:''}<footer><p>Built for people who care.</p><p class="small">This page has no analytics or automatic email sending. Your hosting provider may keep logs. External links and email apps have their own privacy practices.</p>${c.assets.map(a=>`<p class="small">Image: ${esc(a.path)} · ${esc(a.creator||'')} · ${esc(a.permission||'')} ${a.sourceUrl&&safeUrl(a.sourceUrl)?link(a.sourceUrl,'Source'):''}</p>`).join('')}</footer></main>`;
}
function runtime(c,sub){
 const $=s=>document.getElementById(s); let recipient, selectedIndex=0;
 const validSource=url=>{try{const u=new URL(url);return ['https:','http:'].includes(u.protocol)&&!u.username&&!u.password;}catch{return false;}};
 const encode=value=>encodeURIComponent(Array.from(value,c=>c.length===1&&c.charCodeAt(0)>=0xd800&&c.charCodeAt(0)<=0xdfff?'\ufffd':c).join(''));
 function mail(){const href='mailto:'+encode(recipient.email)+'?subject='+encode($('email-subject').value.replace(/[\r\n]/g,' '))+'&body='+encode($('email-body').value);$('open-email').href=href;$('email-status').textContent=href.length>1800?'This draft is long. Copy the fields if your email app cannot open it.':'';}
 function update(){recipient=c.contacts[selectedIndex];const v={name:$('visitor-name').value,personalMessage:$('personal-message').value,recipient:recipient.name};$('email-subject').value=sub(recipient.subject||c.messages.subject,v);$('email-body').value=sub(recipient.body||c.messages.body,v);const detail=$('contact-detail');detail.textContent=[recipient.name,recipient.role,recipient.priority,recipient.email,recipient.verified?.trim()?'Verified '+recipient.verified:''].filter(Boolean).join(' · ');if(recipient.sourceUrl?.trim()&&validSource(recipient.sourceUrl)){const a=document.createElement('a');a.href=recipient.sourceUrl;a.textContent=' Public source ↗';a.target='_blank';a.rel='noopener noreferrer';detail.append(a);}mail();}
 if(c.contacts.length){document.querySelectorAll('input[name="recipient"]').forEach(input=>{if(input.checked)selectedIndex=Number(input.value);input.addEventListener('change',()=>{if(input.checked){selectedIndex=Number(input.value);update();}});});['visitor-name','personal-message'].forEach(id=>$(id).addEventListener('input',update));['email-subject','email-body'].forEach(id=>$(id).addEventListener('input',mail));document.querySelectorAll('[data-copy]').forEach(b=>b.addEventListener('click',async()=>{const key=b.dataset.copy;const value=key==='recipient'?recipient.email:$(key).value;try{await navigator.clipboard.writeText(value);$('email-status').textContent='Copied.';}catch{let field=key==='recipient'?$('copy-fallback'):$(key);if(!field){field=document.createElement('textarea');field.id='copy-fallback';field.setAttribute('aria-label','Address to copy');$('email-status').after(field);}field.value=value;field.focus();field.select();$('email-status').textContent='Clipboard unavailable. The text is selected; use your keyboard or device copy command.';}}));update();}
 document.querySelectorAll('[data-event]').forEach(el=>{const left=Date.parse(el.dataset.event)-Date.now();el.textContent=left<=0?el.dataset.after:Math.ceil(left/86400000)+' days until this event.';});
}
function script(c){return '('+runtime.toString()+')('+JSON.stringify(c).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029')+','+substitute.toString()+');';}
function html(c,css,resolve=p=>p,inline=false){const meta=c.siteUrl?`<meta property="og:url" content="${esc(c.siteUrl)}">`:'';const image=c.socialImage&&c.siteUrl?`<meta property="og:image" content="${esc(new URL(c.socialImage,c.siteUrl.endsWith('/')?c.siteUrl:c.siteUrl+'/').href)}">`:'';return `<!doctype html><html lang="${esc(c.language)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(c.title)}</title><meta name="description" content="${esc(c.summary)}"><meta property="og:title" content="${esc(c.title)}"><meta property="og:description" content="${esc(c.summary)}">${meta}${image}${inline?`<style>${css}</style>`:'<link rel="stylesheet" href="styles/site.css">'}</head><body style="--accent:${esc(c.theme.accent)};--paper:${esc(c.theme.background)}"><a class="skip" href="#main">Skip to content</a>${render(c,resolve)}${inline?`<script>${script(c)}</script>`:'<script src="scripts/site.js"></script>'}</body></html>`;}
root.Kit={validate,render,html,script,substitute,esc,safeUrl,assetPath,MAX,MAX_IMAGE};
if(typeof module!=='undefined')module.exports=root.Kit;
})(typeof globalThis!=='undefined'?globalThis:this);
