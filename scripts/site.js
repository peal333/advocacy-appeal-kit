(function runtime(c,sub){
 const $=s=>document.getElementById(s); let recipient, selectedIndex=0;
 const validSource=url=>{try{const u=new URL(url);return ['https:','http:'].includes(u.protocol)&&!u.username&&!u.password;}catch{return false;}};
 const encode=value=>encodeURIComponent(Array.from(value,c=>c.length===1&&c.charCodeAt(0)>=0xd800&&c.charCodeAt(0)<=0xdfff?'\ufffd':c).join(''));
 function mail(){const href='mailto:'+encode(recipient.email)+'?subject='+encode($('email-subject').value.replace(/[\r\n]/g,' '))+'&body='+encode($('email-body').value);$('open-email').href=href;$('email-status').textContent=href.length>1800?'This draft is long. Copy the fields if your email app cannot open it.':'';}
 function update(){recipient=c.contacts[selectedIndex];const v={name:$('visitor-name').value,personalMessage:$('personal-message').value,recipient:recipient.name};$('email-subject').value=sub(recipient.subject||c.messages.subject,v);$('email-body').value=sub(recipient.body||c.messages.body,v);const detail=$('contact-detail');detail.textContent=[recipient.name,recipient.role,recipient.priority,recipient.email,recipient.verified?.trim()?'Verified '+recipient.verified:''].filter(Boolean).join(' · ');if(recipient.sourceUrl?.trim()&&validSource(recipient.sourceUrl)){const a=document.createElement('a');a.href=recipient.sourceUrl;a.textContent=' Public source ↗';a.target='_blank';a.rel='noopener noreferrer';detail.append(a);}mail();}
 if(c.contacts.length){document.querySelectorAll('input[name="recipient"]').forEach(input=>{if(input.checked)selectedIndex=Number(input.value);input.addEventListener('change',()=>{if(input.checked){selectedIndex=Number(input.value);update();}});});['visitor-name','personal-message'].forEach(id=>$(id).addEventListener('input',update));['email-subject','email-body'].forEach(id=>$(id).addEventListener('input',mail));document.querySelectorAll('[data-copy]').forEach(b=>b.addEventListener('click',async()=>{const key=b.dataset.copy;const value=key==='recipient'?recipient.email:$(key).value;try{await navigator.clipboard.writeText(value);$('email-status').textContent='Copied.';}catch{let field=key==='recipient'?$('copy-fallback'):$(key);if(!field){field=document.createElement('textarea');field.id='copy-fallback';field.setAttribute('aria-label','Address to copy');$('email-status').after(field);}field.value=value;field.focus();field.select();$('email-status').textContent='Clipboard unavailable. The text is selected; use your keyboard or device copy command.';}}));update();}
 document.querySelectorAll('[data-event]').forEach(el=>{const left=Date.parse(el.dataset.event)-Date.now();el.textContent=left<=0?el.dataset.after:Math.ceil(left/86400000)+' days until this event.';});
})({"schemaVersion":1,"id":"my-campaign","title":"Your campaign title","summary":"Replace this with a short explanation of your campaign and the change you are asking for.","language":"en","siteUrl":"","updated":"2026-10-20","introduction":"Use this space to explain the situation, who it affects, and why it matters. Include only information you have checked and are comfortable making public. This starter contains instructions and a non-real example recipient, not campaign facts.","action":"Tell visitors what you want them to ask for and why the selected recipient can help. Replace the example recipient and review the message template before publishing.","petitionUrl":"","theme":{"accent":"#245844","background":"#f5f2e9"},"poster":"","posterAlt":"","socialImage":"","sections":[{"heading":"Add your supporting context","body":"Replace this section with verified background, or remove it if you do not need it. Add public sources, a timeline, or an event only when you have the information to support them."}],"sources":[],"timeline":[],"event":null,"socialLinks":[],"groups":[],"contacts":[{"id":"example-recipient","name":"Example recipient (replace me)","role":"Replace with the recipient’s role","group":"","email":"recipient@example.com","sourceUrl":"","verified":"","priority":"","subject":"","body":""}],"messages":{"subject":"Replace with a clear, specific request","body":"Dear {{recipient}},\n\n[Explain the change you are asking for, using information you have checked.]\n\n{{personalMessage}}\n\nThank you for considering this request.\n{{name}}"},"assets":[]},function substitute(t,values){
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
});