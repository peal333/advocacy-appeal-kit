(function runtime(c,sub){
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
})({"schemaVersion":1,"id":"my-campaign","title":"Your campaign title","summary":"Replace this with a short explanation of your campaign and the change you are asking for.","language":"en","siteUrl":"","updated":"2026-10-20","introduction":"Use this space to explain the situation, who it affects, and why it matters. Include only information you have checked and are comfortable making public. This starter contains instructions and a non-real example recipient, not campaign facts.","action":"Tell visitors what you want them to ask for and why the selected recipient can help. Replace the example recipient and review the message template before publishing.","petitionUrl":"","theme":{"accent":"#245844","background":"#f5f2e9"},"poster":"","posterAlt":"","socialImage":"","sections":[{"heading":"Add your supporting context","body":"Replace this section with verified background, or remove it if you do not need it. Add public sources, a timeline, or an event only when you have the information to support them."}],"sources":[],"timeline":[],"event":null,"socialLinks":[],"groups":[],"contacts":[{"id":"example-recipient","name":"Example recipient (replace me)","role":"Replace with the recipient’s role","group":"","email":"recipient@example.com","sourceUrl":"","verified":"","priority":"","subject":"","body":""}],"messages":{"subject":"Replace with a clear, specific request","body":"Dear {{recipient}},\n\n[Explain the change you are asking for, using information you have checked.]\n\n{{personalMessage}}\n\nThank you for considering this request.\n{{name}}"},"assets":[]},function substitute(t,values){
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
});