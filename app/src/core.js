(function(root){
'use strict';
const schema=root.KitSchema||(typeof require!=='undefined'?require('./schema.js'):null);
const MAX=20*1024*1024, MAX_IMAGE=5*1024*1024;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeUrl=s=>{try{const u=new URL(s);return ['https:','http:'].includes(u.protocol)&&!u.username&&!u.password;}catch{return false;}};
const uri=value=>encodeURIComponent(Array.from(String(value??''),c=>c.length===1&&c.charCodeAt(0)>=0xd800&&c.charCodeAt(0)<=0xdfff?'\ufffd':c).join(''));
const assetPath=s=>/^assets\/[A-Za-z0-9][A-Za-z0-9._-]*\.(png|jpg|jpeg|webp)$/i.test(s);
const date=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s+'T00:00:00Z'))&&new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s;
// Format only complete calendar dates. UTC validation and string components avoid
// local-time shifts; approximate/freeform dates retain the organizer's meaning.
function timelineDate(value){
 if(!date(value))return value;
 const [year,month,day]=value.split('-');
 const months=['January','February','March','April','May','June','July','August','September','October','November','December'];
 return months[Number(month)-1]+' '+Number(day)+', '+year;
}
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
 const d=c.display||{};
 if(d.timer?.dateTime&&!zonedDate(d.timer.dateTime))bad('display.timer.dateTime must be a valid explicitly zoned date-time.');
 if(d.timer?.enabled&&!d.timer.dateTime&&!d.timer.dateLabel?.trim())bad('Enabled header timer needs a verified zoned date-time or date-only label.');
 if(d.sharing&&!safeUrl(c.siteUrl))bad('Sharing requires a published siteUrl using http or https.');
 if(d.footer?.followXUrl){try{const u=new URL(d.footer.followXUrl);if(!safeUrl(u.href)||!['x.com','www.x.com','twitter.com','www.twitter.com'].includes(u.hostname)||!/^\/[A-Za-z0-9_]{1,15}\/?$/.test(u.pathname)||['home','explore','search','notifications','messages','settings','compose','intent','share','login','signup','i','tos','privacy','help','about','download','jobs'].includes(u.pathname.replace(/\//g,'').toLowerCase())||u.search||u.hash)throw Error();}catch{bad('display.footer.followXUrl must be an X or Twitter profile URL.');}}
 for(const [i,item] of (d.efforts?.items||[]).entries()){if(!item.title.trim())bad('display.efforts.items['+i+'].title is required.');if(!safeUrl(item.url))bad('display.efforts.items['+i+'].url must use http or https.');}
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
 const name=String(values.name||'').trim()?values.name:'[Your Name]';
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
 return text.replace(/{{(name|personalMessage|recipient)}}/g,(_,k)=>k==='name'?name:k==='personalMessage'&&emptyPersonal?'':values[k]||'');
}
function contactGroups(c){
 const names=[...new Set([...(c.groups||[]),...c.contacts.map(p=>p.group).filter(Boolean)])];
 return names.map((name,i)=>({key:'group-'+i,name,count:c.contacts.filter(p=>p.group===name).length})).filter(g=>g.count);
}
function render(c,resolve=p=>p){
 const groups=contactGroups(c),ungrouped=c.contacts.filter(p=>!p.group).length;
 const filters='<div class="recipient-filters" id="recipient-filters" role="group" aria-label="Filter contacts by group" hidden><button type="button" data-contact-group="all" aria-pressed="true">All contacts ('+c.contacts.length+')</button>'+groups.map(g=>'<button type="button" data-contact-group="'+g.key+'" aria-pressed="false">'+esc(g.name)+' ('+g.count+')</button>').join('')+(ungrouped?'<button type="button" data-contact-group="ungrouped" aria-pressed="false">Uncategorized ('+ungrouped+')</button>':'')+'</div>';

 const link=(url,label)=>`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>`;
 let output=`<header class="topbar"><a href="#main">${esc(c.display?.headerTitle||c.id.replace(/-/g,' '))}</a><a href="#take-action">Take action ↗</a></header><main id="main"><section class="hero"><div><p class="eyebrow">COMMUNITY • COLLECTIVE ACTION</p><h1>${esc(c.title)}</h1><p class="lead">${esc(c.summary)}</p><a class="button" href="#take-action">Make your voice heard <span aria-hidden="true">↗</span></a><p class="small">Updated ${esc(c.updated)}</p></div>${c.poster?`<figure><img src="${esc(resolve(c.poster))}" alt="${esc(c.posterAlt)}"></figure>`:'<div class="garden" aria-hidden="true"><span>Small voices.<br>Shared ground.<br>Real possibility.</span><div class="sun"></div><div class="stem one"></div><div class="stem two"></div><div class="stem three"></div></div>'}</section><section class="story"><p class="eyebrow">THE CONTEXT</p><h2>Why this matters</h2><p class="preserve">${esc(c.introduction)}</p>${c.sections.map(s=>`<h3>${esc(s.heading)}</h3><p class="preserve">${esc(s.body)}</p>`).join('')}</section>${c.timeline.length?`<section><p class="eyebrow">THE RECORD</p><h2>Campaign timeline</h2><ol class="timeline">${c.timeline.map(t=>`<li><strong>${esc(timelineDate(t.date))}</strong><p>${esc(t.text)}</p>${link((c.sources.find(s=>s.id===t.sourceId)||{}).url||'','Read source ↗')}</li>`).join('')}</ol></section>`:''}${c.event?`<section class="event"><h2>${esc(c.event.label)}</h2><time datetime="${esc(c.event.dateTime)}">${esc(c.event.dateTime)}</time><p data-event="${esc(c.event.dateTime)}" data-after="${esc(c.event.afterText)}">${Date.parse(c.event.dateTime)<=Date.now()?esc(c.event.afterText):'See the scheduled date above.'}</p>${link((c.sources.find(s=>s.id===c.event.sourceId)||{}).url||'','Event source ↗')}</section>`:''}<section id="take-action" class="action"><p class="eyebrow">YOUR NEXT STEP</p><h2>A thoughtful message can make a difference.</h2><p class="preserve">${esc(c.action)}</p>${c.petitionUrl?link(c.petitionUrl,'Visit the petition ↗'):''}${c.contacts.length?`<h3 id="appeal-heading" tabindex="-1">Prepare your message</h3><div class="composer" id="appeal-form" role="region" aria-labelledby="appeal-heading"><div class="composer-personal"><label for="visitor-name">Your name (optional)</label><input id="visitor-name" maxlength="200" autocomplete="name"><label for="personal-message">Your own words (optional)</label><textarea id="personal-message" maxlength="10000" rows="4" placeholder="Why does this matter to you?"></textarea><p class="small">Your name and own words apply to new drafts for each recipient. A blank name appears as [Your Name] in templates; replace or remove it before sending. Drafts stay only in this open page; reloading clears them. Nothing is sent automatically.</p></div><div class="composer-message"><div class="recipient-search" id="recipient-search" hidden><label for="recipient-query">Choose a recipient</label><p id="recipient-search-help" class="small">Browse all contacts or search by name, role, group, country or email. Choose a listed contact to switch drafts.</p><div class="recipient-search-control"><input id="recipient-query" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="recipient-options" aria-describedby="recipient-search-help" autocomplete="off" spellcheck="false"><button type="button" id="recipient-toggle" aria-label="Browse all recipients" aria-expanded="false" aria-controls="recipient-options">▾</button></div><ul id="recipient-options" role="listbox" aria-label="Recipients" hidden></ul><p id="recipient-search-status" class="small" role="status"></p></div><p class="eyebrow">YOUR SELECTED RECIPIENT</p><p id="contact-detail" role="status">${esc(c.contacts[0].name)} · ${esc(c.contacts[0].email)}</p><label for="email-subject">Subject</label><input id="email-subject"><label for="email-body">Message</label><textarea id="email-body" rows="12"></textarea><p class="small">Review and edit before opening your email app. Your edits are kept separately for each recipient when you switch contacts. Edited fields no longer update automatically from your name or own words; adjust those fields directly.</p><p id="draft-status" class="small" role="status"></p><div class="button-row"><a class="button" id="open-email" target="_blank" rel="noopener noreferrer">Open email app ↗</a><button data-copy="recipient">Copy address</button><button data-copy="email-subject">Copy subject</button><button data-copy="email-body">Copy message</button></div><p id="email-status" role="status"></p><p class="small">If no mail app opens, copy the address, subject and message into your preferred email service. We cannot tell whether a message was sent.</p></div></div><fieldset id="recipient-picker" class="recipient-picker" aria-describedby="recipient-help"><legend>Choose one recipient</legend><p id="recipient-help" class="small">Select a contact to go straight to the message form above; nothing is sent. Group filters only change the list, not your selected recipient.</p>${filters}<div class="recipient-cards">${c.contacts.map((p,i)=>`<article class="recipient-card" data-contact-group-key="${p.group?groups.find(g=>g.name===p.group).key:'ungrouped'}"><label class="recipient-choice" for="recipient-${i}"><input type="radio" name="recipient" id="recipient-${i}" value="${i}"${i===0?' checked':''}><span><strong class="recipient-name">${esc(p.name)}</strong><span class="recipient-choice-hint">Select for your message</span></span></label><div class="recipient-info">${p.group?`<p class="recipient-group">${esc(p.group)}</p>`:''}${p.role?`<p class="recipient-role">${esc(p.role)}</p>`:''}${p.country?.trim()?`<p class="recipient-country">${esc(p.country)}</p>`:''}${p.priority?`<p class="small">${esc(p.priority)}</p>`:''}<p class="recipient-address">${esc(p.email)}</p>${p.verified?.trim()?`<p class="small">Verified ${esc(p.verified)}</p>`:''}${p.sourceUrl?.trim()&&safeUrl(p.sourceUrl)?link(p.sourceUrl,'Public source ↗'):''}</div></article>`).join('')}</div></fieldset><noscript><p>JavaScript is disabled. Use the addresses in the contact list in your email app and write your own message. Draft preparation requires JavaScript.</p></noscript>`:''}</section>${c.sources.length?`<section><p class="eyebrow">CHECK THE DETAILS</p><h2>Sources & further reading</h2><ul class="sources source-list">${c.sources.map(s=>`<li>${link(s.url,s.title)}<span>${esc(s.publisher||'')} · checked ${esc(s.checked)}</span></li>`).join('')}</ul></section>`:''}${c.socialLinks.length?`<nav aria-label="Campaign links">${c.socialLinks.map(s=>link(s.url,s.label)).join(' · ')}</nav>`:''}<footer><p>Built for people who care.</p><p class="small">This page has no analytics or automatic email sending. Your hosting provider may keep logs. External links and email apps have their own privacy practices.</p>${c.assets.map(a=>`<p class="small">Image: ${esc(a.path)} · ${esc(a.creator||'')} · ${esc(a.permission||'')} ${a.sourceUrl&&safeUrl(a.sourceUrl)?link(a.sourceUrl,'Source'):''}</p>`).join('')}</footer></main>`;
 const d=c.display||{},timer=d.timer;
 if(timer?.enabled){const target=timer.dateTime||'',parsed=Date.parse(target),ended=Number.isFinite(parsed)&&parsed<=Date.now();const label=timer.dateLabel||target;output=output.replace('</header>',()=>`<div class="header-timer"><p class="timer-label">${esc(timer.label||'Upcoming event')}</p>${target?`<time datetime="${esc(target)}">${esc(label)}</time>`:`<p>${esc(label)}</p>`}<p id="header-countdown"${target?` data-countdown="${esc(target)}"`:''} data-after="${esc(timer.afterText||'The scheduled time has passed.')}" role="timer" aria-live="off">${ended?esc(timer.afterText||'The scheduled time has passed.'):target?'See the scheduled date above.':'Time not specified.'}</p></div></header>`);}
 if(d.sharing&&safeUrl(c.siteUrl))output=output.replace('</header>',()=>shareMarkup(c,d)+'</header>');
 let bottom='';
 if(d.background?.enabled)bottom+=`<section class="campaign-background"><h2>${esc(d.background.title||'Background')}</h2><p class="preserve">${esc(d.background.body||'')}</p></section>`;
 if(d.timeline){output=output.replace(/<section><p class="eyebrow">THE RECORD<\/p>[\s\S]*?<\/section>/,section=>{if(d.timeline.enabled!==false)bottom+=section.replace('Campaign timeline',()=>esc(d.timeline.title||'Campaign timeline'));return '';});}
 const bottomAnchor='<section><p class="eyebrow">CHECK THE DETAILS';
 if(output.includes(bottomAnchor))output=output.replace(bottomAnchor,()=>bottom+bottomAnchor);
 else {const anchor=c.socialLinks.length?'<nav aria-label="Campaign links">':'<footer>';output=output.replace(anchor,()=>bottom+anchor);}
 if(d.sources){output=output.replace(/<section><p class="eyebrow">CHECK THE DETAILS<\/p>[\s\S]*?<\/section>/,section=>d.sources.enabled===false?'':section.replace('Sources & further reading',()=>esc(d.sources.title||'Sources & further reading')));}
 const efforts=d.efforts;if(efforts?.enabled&&efforts.items?.length)output=output.replace('<footer>',()=>`<section class="existing-efforts"><h2>${esc(efforts.title||'Existing efforts')}</h2><ul class="sources">${efforts.items.map(item=>`<li>${link(item.url,item.title)}<p class="preserve">${esc(item.description)}</p></li>`).join('')}</ul></section><footer>`);
 if(d.footer)output=output.replace('<footer><p>Built for people who care.</p>',()=>`<footer><div class="footer-row"><div>${d.footer.followXUrl&&safeUrl(d.footer.followXUrl)?link(d.footer.followXUrl,'Follow updates on X'):''}</div><p>${esc(d.footer.middleText??'Built for people who care.')}</p><p>${d.footer.showUpdated?'Updated '+esc(c.updated):''}</p></div>`);
 return output;
}
function runtime(c,sub){
 const $=s=>document.getElementById(s); let recipient, selectedIndex=0; const drafts=new Map();
 const validSource=url=>{try{const u=new URL(url);return ['https:','http:'].includes(u.protocol)&&!u.username&&!u.password;}catch{return false;}};
 const encode=value=>encodeURIComponent(Array.from(value,c=>c.length===1&&c.charCodeAt(0)>=0xd800&&c.charCodeAt(0)<=0xdfff?'\ufffd':c).join(''));
 function mail(){const href='mailto:'+encode(recipient.email)+'?subject='+encode($('email-subject').value.replace(/[\r\n]/g,' '))+'&body='+encode($('email-body').value);$('open-email').href=href;$('email-status').textContent=href.length>1800?'This draft is long. Copy the fields if your email app cannot open it.':'';}
 function update(){recipient=c.contacts[selectedIndex];const draft=drafts.get(selectedIndex)||{};const v={name:$('visitor-name').value,personalMessage:$('personal-message').value,recipient:recipient.name};$('email-subject').value=draft.subject??sub(recipient.subject||c.messages.subject,v);$('email-body').value=draft.body??sub(recipient.body||c.messages.body,v);if($('draft-status'))$('draft-status').textContent=Object.keys(draft).length?'Your edited draft for this recipient is preserved. Update edited fields directly if your name or own words change.':'Using the appeal template for this recipient.';const detail=$('contact-detail');detail.textContent=[recipient.name,recipient.role,recipient.country,recipient.priority,recipient.email,recipient.verified?.trim()?'Verified '+recipient.verified:''].filter(Boolean).join(' · ');if(recipient.sourceUrl?.trim()&&validSource(recipient.sourceUrl)){const a=document.createElement('a');a.href=recipient.sourceUrl;a.textContent=' Public source ↗';a.target='_blank';a.rel='noopener noreferrer';detail.append(a);}mail();}
 if(c.contacts.length){
 const inputs=[...document.querySelectorAll('input[name="recipient"]')],cards=[...document.querySelectorAll('.recipient-card')],filters=$('recipient-filters');
 let closeSearch=()=>{};
 function jump(){const heading=$('appeal-heading');if(heading){heading.focus({preventScroll:true});heading.scrollIntoView({block:'start'});}}
 function select(index,navigate){selectedIndex=index;inputs.forEach((input,i)=>{input.checked=i===index;});update();closeSearch();if(navigate)jump();}
 inputs.forEach(input=>{if(input.checked)selectedIndex=Number(input.value);input.addEventListener('change',()=>{if(input.checked)select(Number(input.value),true);});});
 cards.forEach((card,i)=>card.addEventListener('click',event=>{
  if(event.target.closest('a,button'))return;
  if(event.target.closest('input')){if(selectedIndex===i)jump();return;}
  if(event.target.closest('label'))return; // Native label activation reaches the radio above.
  select(i,true);
 }));
 const search=$('recipient-search'),query=$('recipient-query'),list=$('recipient-options'),toggle=$('recipient-toggle');
 if(search&&query&&list&&toggle){
  let opened=false,matches=[],active=-1;
  const status=$('recipient-search-status');
  function highlight(index){active=index;[...list.children].forEach((option,i)=>option.classList.toggle('is-active',i===active));if(active>=0){query.setAttribute('aria-activedescendant','recipient-option-'+matches[active]);list.children[active].scrollIntoView({block:'nearest'});}else query.removeAttribute('aria-activedescendant');}
  function draw(){const term=query.value.trim().toLocaleLowerCase();matches=c.contacts.map((p,i)=>i).filter(i=>[c.contacts[i].name,c.contacts[i].role,c.contacts[i].group,c.contacts[i].country,c.contacts[i].email].filter(Boolean).join(' ').toLocaleLowerCase().includes(term));list.replaceChildren();active=-1;query.removeAttribute('aria-activedescendant');
   matches.forEach(index=>{const p=c.contacts[index],option=document.createElement('li');option.id='recipient-option-'+index;option.setAttribute('role','option');option.setAttribute('aria-selected',String(index===selectedIndex));option.textContent=[p.name,p.role,p.group,p.email].filter(Boolean).join(' · ');option.addEventListener('mousedown',event=>event.preventDefault());option.addEventListener('click',()=>{select(index,false);query.focus();});list.append(option);});
   status.textContent=matches.length?matches.length+' contacts available.':'No contacts found. Try another search; your selected recipient has not changed.';
  }
  function open(){opened=true;query.value='';list.hidden=false;query.setAttribute('aria-expanded','true');toggle.setAttribute('aria-expanded','true');draw();}
  closeSearch=()=>{opened=false;list.hidden=true;query.value=c.contacts[selectedIndex].name;query.setAttribute('aria-expanded','false');toggle.setAttribute('aria-expanded','false');query.removeAttribute('aria-activedescendant');status.textContent='';};
  query.addEventListener('focus',()=>{if(!opened)open();});
  query.addEventListener('click',()=>{if(!opened)open();});
  query.addEventListener('input',()=>{if(!opened){opened=true;list.hidden=false;query.setAttribute('aria-expanded','true');toggle.setAttribute('aria-expanded','true');}draw();});
  query.addEventListener('keydown',event=>{
   if(event.key==='Escape'){event.preventDefault();closeSearch();}
   else if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();if(!opened)open();if(matches.length)highlight(active<0?(event.key==='ArrowDown'?0:matches.length-1):(active+(event.key==='ArrowDown'?1:-1)+matches.length)%matches.length);}
   else if(event.key==='Enter'){event.preventDefault();if(opened&&active>=0)select(matches[active],false);else if(!opened)open();}
   else if(event.key==='Tab')closeSearch();
  });
  toggle.addEventListener('mousedown',event=>event.preventDefault());
  toggle.addEventListener('click',()=>{if(opened)closeSearch();else{query.focus();if(!opened)open();}});
  search.addEventListener('focusout',event=>{if(!search.contains(event.relatedTarget))closeSearch();});
  search.hidden=false;closeSearch();
 }
 if(filters&&cards.length===c.contacts.length){
  const inputs=[...document.querySelectorAll('input[name="recipient"]')],buttons=[...document.querySelectorAll('[data-contact-group]')];
  function filter(key){
   cards.forEach((card,i)=>{const show=key==='all'||card.dataset.contactGroupKey===key;card.hidden=!show;inputs[i].disabled=!show;});
   buttons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.contactGroup===key)));
  }
  buttons.forEach(button=>button.addEventListener('click',()=>filter(button.dataset.contactGroup)));
  filters.hidden=false;
 }
 ['visitor-name','personal-message'].forEach(id=>$(id).addEventListener('input',update));['email-subject','email-body'].forEach(id=>$(id).addEventListener('input',()=>{
  const draft=drafts.get(selectedIndex)||{};draft[id==='email-subject'?'subject':'body']=$(id).value;drafts.set(selectedIndex,draft);
  if($('draft-status'))$('draft-status').textContent='Your edited draft for this recipient is preserved. Update edited fields directly if your name or own words change.';mail();
 }));document.querySelectorAll('[data-copy]').forEach(b=>b.addEventListener('click',async()=>{const key=b.dataset.copy;const value=key==='recipient'?recipient.email:$(key).value;try{await navigator.clipboard.writeText(value);$('email-status').textContent='Copied.';}catch{let field=key==='recipient'?$('copy-fallback'):$(key);if(!field){field=document.createElement('textarea');field.id='copy-fallback';field.setAttribute('aria-label','Address to copy');$('email-status').after(field);}field.value=value;field.focus();field.select();$('email-status').textContent='Clipboard unavailable. The text is selected; use your keyboard or device copy command.';}}));update();}

 const timer=document.querySelectorAll('[data-countdown]')[0];
 if(timer){let interval;const tick=()=>{const remaining=Date.parse(timer.dataset.countdown)-Date.now();if(!Number.isFinite(remaining)){timer.textContent='See the scheduled date above.';return false;}if(remaining<=0){timer.textContent=timer.dataset.after;return false;}const seconds=Math.floor(remaining/1000);timer.textContent=Math.floor(seconds/86400)+'d '+Math.floor(seconds%86400/3600)+'h '+Math.floor(seconds%3600/60)+'m '+seconds%60+'s';return true;};const stop=()=>{if(interval!==undefined){clearInterval(interval);interval=undefined;}};const start=()=>{stop();if(tick())interval=setInterval(()=>{if(!tick())stop();},1000);};start();if(typeof window!=='undefined'){window.addEventListener('pagehide',stop);window.addEventListener('pageshow',start);}}
 const copy=$('share-copy'),native=$('share-native');
 if(copy&&validSource(c.siteUrl))copy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(c.siteUrl);$('share-status').textContent='Link copied.';}catch{let field=$('share-fallback');if(!field){field=document.createElement('input');field.id='share-fallback';field.setAttribute('aria-label','Campaign link to copy');copy.after(field);}field.value=c.siteUrl;field.focus();field.select();$('share-status').textContent='Clipboard unavailable. Copy the selected link.';}});
 if(native&&validSource(c.siteUrl)&&typeof navigator.share==='function'){native.hidden=false;native.addEventListener('click',async()=>{try{await navigator.share({title:c.title,text:c.display?.shareText||c.summary,url:c.siteUrl});$('share-status').textContent='Share dialog closed.';}catch(error){$('share-status').textContent=error?.name==='AbortError'?'Sharing cancelled.':'Sharing unavailable. Use Copy link instead.';}});}
 document.querySelectorAll('[data-event]').forEach(el=>{const left=Date.parse(el.dataset.event)-Date.now();el.textContent=left<=0?el.dataset.after:Math.ceil(left/86400000)+' days until this event.';});
}
function shareMarkup(c,d){
 const u=uri(c.siteUrl),text=uri(d.shareText||c.title);
 const paths={
 copy:'<path d="M10 13a5 5 0 0 0 7 .1l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7-.1l-3 3a5 5 0 0 0 7 7l1.7-1.7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
 whatsapp:'<path d="M20.5 3.5A11.8 11.8 0 0 0 1.9 17.7L.2 24l6.4-1.7A11.8 11.8 0 0 0 24 12a11.7 11.7 0 0 0-3.5-8.5ZM12.2 21.8a9.8 9.8 0 0 1-5-1.4l-.4-.2-3.8 1 1-3.7-.3-.4A9.8 9.8 0 1 1 12.2 21.8Zm5.4-7.3c-.3-.1-1.8-.9-2-.9-.3-.1-.5-.1-.7.2l-.9 1c-.2.2-.3.2-.6.1a8 8 0 0 1-2.4-1.5 9 9 0 0 1-1.7-2.1c-.2-.3 0-.5.1-.6l.5-.6.3-.5c.1-.2 0-.4 0-.5l-.9-2.1c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4s1.1 2.8 1.3 3c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.3.2 1.8.1.6-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.1-.3-.2-.6-.3Z"/>',
 facebook:'<path d="M24 12.1C24 5.4 18.6 0 12 0S0 5.4 0 12.1C0 18.1 4.4 23.1 10.1 24v-8.4H7.1v-3.5h3V9.4c0-3 1.8-4.7 4.5-4.7 1.3 0 2.7.2 2.7.2v3h-1.5c-1.5 0-1.9.9-1.9 1.9v2.3h3.3l-.5 3.5h-2.8V24C19.6 23.1 24 18.1 24 12.1Z"/>',
 x:'<path d="M18.9 1.2h3.7l-8.1 9.3L24 22.8h-7.4l-5.8-7.6-6.6 7.6H.5l8.6-9.9L0 1.2h7.6l5.3 7 6-7ZM17.6 20.6h2L6.5 3.3H4.3l13.3 17.3Z"/>',
 native:'<g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m8.5 10.5 7-4m-7 7 7 4"/><circle cx="5" cy="12" r="3"/><circle cx="19" cy="4" r="3"/><circle cx="19" cy="20" r="3"/></g>'
 };
 const icon=name=>`<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true" focusable="false">${paths[name]}</svg>`;
 const anchor=(url,label,name)=>`<a class="share-icon" href="${esc(url)}" target="_blank" rel="noopener noreferrer" aria-label="${label}" title="${label}">${icon(name)}</a>`;
 return `<nav class="share-tools" aria-label="Share this campaign"><button class="share-icon" id="share-copy" type="button" aria-label="Copy link" title="Copy link">${icon('copy')}</button>${anchor('https://wa.me/?text='+text+'%20'+u,'Share on WhatsApp','whatsapp')}${anchor('https://www.facebook.com/sharer/sharer.php?u='+u,'Share on Facebook','facebook')}${anchor('https://twitter.com/intent/tweet?text='+text+'&url='+u,'Share on X','x')}<button class="share-icon" id="share-native" type="button" aria-label="More sharing options" title="More sharing options" hidden>${icon('native')}</button><p id="share-status" role="status"></p></nav>`;
}
function script(c){return '('+runtime.toString()+')('+JSON.stringify(c).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029')+','+substitute.toString()+');';}
function html(c,css,resolve=p=>p,inline=false){const meta=c.siteUrl?`<meta property="og:url" content="${esc(c.siteUrl)}">`:'';const image=c.socialImage&&c.siteUrl?`<meta property="og:image" content="${esc(new URL(c.socialImage,c.siteUrl.endsWith('/')?c.siteUrl:c.siteUrl+'/').href)}">`:'';return `<!doctype html><html lang="${esc(c.language)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(c.title)}</title><meta name="description" content="${esc(c.summary)}"><meta property="og:title" content="${esc(c.title)}"><meta property="og:description" content="${esc(c.summary)}">${meta}${image}${inline?`<style>${css}</style>`:'<link rel="stylesheet" href="styles/site.css">'}</head><body style="--accent:${esc(c.theme.accent)};--paper:${esc(c.theme.background)}"><a class="skip" href="#main">Skip to content</a>${render(c,resolve)}${inline?`<script>${script(c)}</script>`:'<script src="scripts/site.js"></script>'}</body></html>`;}
root.Kit={validate,render,html,script,substitute,esc,safeUrl,assetPath,MAX,MAX_IMAGE};
if(typeof module!=='undefined')module.exports=root.Kit;
})(typeof globalThis!=='undefined'?globalThis:this);

