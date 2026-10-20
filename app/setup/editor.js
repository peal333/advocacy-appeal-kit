/* Local visual editor. Campaign data remains the shared version-1 format. */
(function(){
'use strict';
let campaign=structuredClone(KitBundle.campaign),assets=Object.create(null),urls=Object.create(null),dirty=false;
const touched=new Set(),contactDetailsOpen=new WeakMap();let focusAfterAction=null;
function normalizeGroups(c){c.groups=[...new Set([...(c.groups||[]),...c.contacts.map(x=>x.group).filter(Boolean)])];return c;}
normalizeGroups(campaign);
let mode='visual',selected='title',previewToken='',previewScroll=0,activeImport=false,busy=false,pendingFlush=null;
const $=id=>document.getElementById(id),status=text=>$('status').textContent=text;
const sections=[
 ['Campaign',[['title','Campaign title'],['summary','Short summary','textarea'],['id','Campaign ID'],['language','Language tag'],['updated','Last updated','date'],['siteUrl','Published site URL (optional)','url'],['introduction','Introduction','textarea'],['action','Requested action','textarea'],['petitionUrl','Petition URL (optional)','url']]],
 ['Message templates',[['messages.subject','Default subject'],['messages.body','Default message','textarea']]],
 ['Appearance',[['theme.accent','Accent color','color'],['theme.background','Page background','color'],['poster','Poster asset path'],['posterAlt','Poster alternative text'],['socialImage','Social preview asset path']]]
];
const lists={
 contacts:{label:'Contacts',singular:'contact',fields:[['id','Stable ID'],['name','Name / office'],['role','Role'],['group','Group'],['email','Public email','email'],['sourceUrl','Public source URL (optional)','url'],['verified','Verified date (optional)','date'],['priority','Priority label'],['subject','Subject override (optional)'],['body','Message override (optional)','textarea']]},
 sources:{label:'Sources',singular:'source',fields:[['id','Stable ID'],['title','Title'],['url','Source URL','url'],['publisher','Publisher'],['checked','Checked date','date']]},
 timeline:{label:'Timeline',singular:'timeline entry',fields:[['date','Date label (approximate dates allowed)'],['text','What happened','textarea'],['sourceId','Supporting source ID']]},
 sections:{label:'Extra sections',singular:'section',fields:[['heading','Heading'],['body','Text','textarea']]},
 socialLinks:{label:'Further links',singular:'link',fields:[['label','Label'],['url','URL','url']]}
};
const labels={title:'Campaign title',summary:'Short summary',updated:'Updated date',introduction:'Introduction',action:'Call to action',hero:'Hero image',campaign:'Page settings',messages:'Message template',contacts:'Contacts & groups',content:'Page sections',sources:'Sources',timeline:'Timeline',sections:'Extra sections',socialLinks:'Further links',event:'Event details'};
function get(path){return path.split('.').reduce((o,k)=>o?.[k],campaign);}
function write(path,value){const keys=path.split('.'),last=keys.pop();keys.reduce((o,k)=>o[k],campaign)[last]=value;dirty=true;$('save-state').textContent='Unsaved changes';}
function set(path,value){write(path,value);refresh();}
function requiredField(path){
 return ['title','summary','id','language','updated','introduction','action','messages.subject','messages.body'].includes(path)||/^contacts\.\d+\.(name|email)$/.test(path)||/^sources\.\d+\.(title|url|checked)$/.test(path)||/^sections\.\d+\.(heading|body)$/.test(path)||/^timeline\.\d+\.(date|text|sourceId)$/.test(path)||/^socialLinks\.\d+\.(label|url)$/.test(path)||/^event\.(label|dateTime|sourceId|afterText)$/.test(path);
}
function fieldLabel(title,required){
 const label=document.createElement('label');label.textContent=title+(required?' ':'');
 if(required){const marker=document.createElement('span');marker.className='required-marker';marker.textContent='*required';label.append(marker);}
 return label;
}
function field(parent,path,title,type='text'){
 const label=fieldLabel(title,requiredField(path));
 const input=document.createElement(type==='textarea'?'textarea':'input');if(type==='textarea')input.rows=path.endsWith('body')?9:4;else input.type=type;
 input.value=get(path)||'';input.dataset.path=path;input.id='field-'+path.replace(/\./g,'-');const rule=KitVisual.ruleFor(path);if(rule?.maxLength)input.maxLength=rule.maxLength;
 if(requiredField(path))input.setAttribute('aria-required','true');
 const hint=document.createElement('span');hint.className='field-help';hint.id=input.id+'-help';hint.hidden=true;input.setAttribute('aria-describedby',hint.id);input._hint=hint;
 input.addEventListener('input',()=>{touched.add(path);set(path,input.value);});input.addEventListener('blur',()=>{touched.add(path);validate();});label.append(input,hint);parent.append(label);return input;
}
function focusField(path){const input=[...document.querySelectorAll('[data-path]')].find(el=>el.dataset.path===path);if(input){for(let node=input.parentElement;node;node=node.parentElement){if(node.tagName==='DETAILS'){node.open=true;if(node._contact)contactDetailsOpen.set(node._contact,true);}}input.scrollIntoView?.({block:'center'});input.focus?.();}}
function groupField(parent,path){
 const label=document.createElement('label');label.textContent='Group';const input=document.createElement('select');input.dataset.path=path;input.id='field-'+path.replace(/\./g,'-');input.append(new Option('Ungrouped',''));campaign.groups.forEach(group=>input.append(new Option(group,group)));input.value=get(path)||'';input.onchange=()=>withCanvas(()=>set(path,input.value));label.append(input);parent.append(label);return input;
}
function help(parent,text){const p=document.createElement('p');p.className='help';p.textContent=text;parent.append(p);return p;}
function button(parent,text,handler,className=''){const b=document.createElement('button');b.type='button';b.textContent=text;b.className=className;b.onclick=()=>withCanvas(handler);parent.append(b);return b;}
function heading(parent,title){const h=document.createElement('h2');h.textContent=title;parent.append(h);return h;}
function details(title,open=false){const d=document.createElement('details');d.open=open;const s=document.createElement('summary');s.textContent=title;d.append(s);$('editor').append(d);return d;}
function select(key,{scroll=false}={}){
 selected=key;if(mode!=='visual')setMode('visual');else buildProperties();
 $('preview').contentWindow?.postMessage({type:'kit:highlight',key:selected,token:previewToken,scroll},'*');
}
function newId(prefix){let id;do{id=prefix+'-'+Math.random().toString(36).slice(2,10);}while([...campaign.contacts,...campaign.sources].some(x=>x.id===id));return id;}
function addEntry(key,group=''){
 if(campaign[key].length>=100){status('This section supports at most 100 entries.');return;}
 const item={};lists[key].fields.forEach(([name])=>item[name]='');if('id'in item)item.id=newId(key);if(key==='contacts')item.group=group;
 campaign[key].push(item);dirty=true;selected=key+':'+(campaign[key].length-1);buildProperties();refresh();if(key==='contacts')focusAfterAction='contacts.'+(campaign.contacts.length-1)+'.name';status('New '+lists[key].singular+' added. Complete the details before exporting.');
}
function removeEntry(key,index){
 const item=campaign[key][index];if(!item)return;
 if(key==='sources'&&(campaign.timeline.some(x=>x.sourceId===item.id)||campaign.event?.sourceId===item.id)){status('This source is used by a timeline entry or event. Update those references before removing it.');return;}
 if(key!=='contacts'&&!confirm('Remove this '+lists[key].singular+'? This changes the current unsaved campaign.'))return;
 campaign[key].splice(index,1);dirty=true;selected=key;buildProperties();refresh();status(key==='contacts'?'Contact deleted. Choose Save to ZIP to keep your changes.':'Entry removed. Choose Save to ZIP to keep your changes.');
}
function listNavigation(parent,key){
 const row=document.createElement('div');row.className='section-label';heading(row,lists[key].label);button(row,'+ Add',()=>addEntry(key));parent.append(row);
 const list=document.createElement('div');list.className='stack';campaign[key].forEach((item,i)=>button(list,item.name||item.title||item.heading||item.label||item.date||'Untitled '+lists[key].singular,()=>select(key+':'+i,{scroll:true})));parent.append(list);
 if(!campaign[key].length)help(parent,'No '+lists[key].label.toLowerCase()+' yet. This section is hidden on the website.');
}
function referenceField(parent,path,title){
 const label=fieldLabel(title,true);const input=document.createElement('select');input.dataset.path=path;input.id='field-'+path.replace(/\./g,'-');input.setAttribute('aria-required','true');const hint=document.createElement('span');hint.className='field-help';hint.id=input.id+'-help';hint.hidden=true;input._hint=hint;input.setAttribute('aria-describedby',hint.id);
 const empty=document.createElement('option');empty.value='';empty.textContent='Choose a source';input.append(empty);
 campaign.sources.forEach(source=>{const o=document.createElement('option');o.value=source.id;o.textContent=source.title||source.id;input.append(o);});input.value=get(path)||'';input.onchange=()=>withCanvas(()=>{touched.add(path);set(path,input.value);});label.append(input,hint);parent.append(label);
}
function buildProperties(){
 const parent=$('properties');parent.replaceChildren();$('selection-title').textContent=labels[selected]||'Selected item';$('selection-hint').textContent='Edit here or directly on the page.';
 document.querySelectorAll('.quick-nav button').forEach(b=>b.setAttribute('aria-current',String(b.id==='nav-'+selected)));
 if(['title','summary','updated','introduction','action'].includes(selected)){
  field(parent,selected,labels[selected],selected==='updated'?'date':['summary','introduction','action'].includes(selected)?'textarea':'text');
  if(selected==='title')help(parent,'A clear headline helps visitors understand the campaign at a glance.');
  if(selected==='updated')help(parent,'Use the date the campaign information was last checked.');
  return;
 }
 if(selected==='campaign'){
  $('selection-hint').textContent='Identity, appearance and sharing settings.';
  field(parent,'id','Campaign ID');help(parent,'Lowercase letters, numbers and hyphens. Used in download filenames.');field(parent,'language','Language tag');field(parent,'updated','Last updated','date');field(parent,'siteUrl','Published website URL (optional)','url');
  heading(parent,'Appearance');field(parent,'theme.accent','Accent color','color');field(parent,'theme.background','Page background','color');help(parent,'Keep a dark accent and a light background for readable text.');
  field(parent,'petitionUrl','Petition URL (optional)','url');
  const label=document.createElement('label');label.textContent='Social preview image';const pick=document.createElement('select');pick.append(new Option('No social image',''));campaign.assets.forEach(a=>pick.append(new Option(a.path,a.path)));pick.value=campaign.socialImage;pick.onchange=()=>withCanvas(()=>set('socialImage',pick.value));label.append(pick);parent.append(label);help(parent,'A public website URL is also needed for social-image metadata.');return;
 }
 if(selected==='hero'){buildHero(parent);return;}
 if(selected==='messages'){
  $('selection-hint').textContent='The starting draft visitors can personalize.';
  field(parent,'messages.subject','Default email subject');field(parent,'messages.body','Default email message','textarea');
  help(parent,'Supported placeholders: {{name}}, {{personalMessage}}, {{recipient}}. Contacts can override either field. Nothing is sent from this editor.');return;
 }
 if(selected==='contacts'){buildContacts(parent);return;}
 if(selected==='content'){
  $('selection-hint').textContent='Add, edit and organize optional page content.';
  listNavigation(parent,'sections');listNavigation(parent,'timeline');listNavigation(parent,'sources');listNavigation(parent,'socialLinks');
  heading(parent,'Optional event');button(parent,campaign.event?'Edit event':'Add event',()=>{if(!campaign.event){campaign.event={label:'',dateTime:'',sourceId:'',afterText:''};dirty=true;}selected='event';buildProperties();refresh();});return;
 }
 if(selected==='event'){
  if(!campaign.event){selected='content';buildProperties();return;}
  field(parent,'event.label','Event label');field(parent,'event.dateTime','Date and time, including time zone');help(parent,'For example: 2026-12-01T10:00:00+07:00. Use a verified time; do not guess.');referenceField(parent,'event.sourceId','Supporting source');field(parent,'event.afterText','Text after the event','textarea');button(parent,'Remove event',()=>{if(!confirm('Remove this event from the page?'))return;campaign.event=null;dirty=true;selected='content';buildProperties();refresh();},'remove add');return;
 }
 if(lists[selected]){listNavigation(parent,selected);return;}
 const [key,indexText]=selected.split(':'),index=Number(indexText),config=lists[key],item=campaign[key]?.[index];
 if(!config||!item){selected='title';buildProperties();return;}
 $('selection-title').textContent=key==='contacts'?'Contact details':config.singular.charAt(0).toUpperCase()+config.singular.slice(1);
 $('selection-hint').textContent='Changes update your campaign immediately.';
 button(parent,'← '+(key==='contacts'?'Contacts & groups':config.label),()=>select(key),'back-button');
 let more=null;
 if(key==='contacts'){
  more=document.createElement('details');more.className='contact-details';const summary=document.createElement('summary');summary.textContent='More details';more.append(summary);more._contact=item;more.open=contactDetailsOpen.get(item)||false;more.ontoggle=()=>contactDetailsOpen.set(item,more.open);
  $('selection-hint').textContent='Start with a name and public email. Other details are optional.';
 }
 const fields=key==='contacts'?[...config.fields.filter(([name])=>['name','email','group'].includes(name)).sort((a,b)=>['name','email','group'].indexOf(a[0])-['name','email','group'].indexOf(b[0])),...config.fields.filter(([name])=>!['name','email','group'].includes(name))]:config.fields;
 fields.forEach(([name,label,type])=>{
  const target=more&&!['name','email','group'].includes(name)?more:parent;
  if(name==='id'){const input=field(target,`${key}.${index}.${name}`,label);input.readOnly=true;input.title='Stable identifier preserved for references.';return;}
  if(name==='sourceId'){referenceField(target,`${key}.${index}.${name}`,label);return;}
  if(key==='contacts'&&name==='group'){groupField(target,`${key}.${index}.${name}`);return;}
  field(target,`${key}.${index}.${name}`,label,type);
 });
 if(more){help(more,'Create or manage groups in Contacts & groups. Leave override fields blank to use the default message template.');parent.append(more);}
 const row=document.createElement('div');row.className='button-row';
 const up=button(row,'Move up',()=>moveEntry(key,index,-1));up.disabled=index===0;const down=button(row,'Move down',()=>moveEntry(key,index,1));down.disabled=index===campaign[key].length-1;parent.append(row);
 button(parent,'Remove '+config.singular,()=>removeEntry(key,index),'remove add');
}
function moveEntry(key,index,delta){const next=index+delta;if(next<0||next>=campaign[key].length)return;const [item]=campaign[key].splice(index,1);campaign[key].splice(next,0,item);dirty=true;selected=key+':'+next;buildProperties();refresh();}
function buildContacts(parent){
 $('selection-hint').textContent='Create groups first, then assign contacts using their group dropdown.';
 button(parent,'+ Add contact',()=>addEntry('contacts'),'primary add');
 const newLabel=document.createElement('label');newLabel.textContent='New group name';const newGroup=document.createElement('input');newGroup.maxLength=200;newGroup.setAttribute('aria-label','New group name');newLabel.append(newGroup);parent.append(newLabel);
 button(parent,'+ Add group',()=>{const name=newGroup.value.trim();if(!name){status('Enter a name for the new group.');focusAfterAction='new-group';return;}if(campaign.groups.includes(name)){status('That group already exists. Choose a different name.');return;}if(campaign.groups.length>=100){status('This project supports at most 100 groups.');return;}campaign.groups.push(name);dirty=true;buildProperties();refresh();status('Group created. You can add contacts now or later.');},'add');newGroup.dataset.path='new-group';
 help(parent,'Groups can be empty. Deleting a group keeps its contacts in Ungrouped.');
 const groups=[...campaign.groups,''];
 groups.forEach(group=>{
  const h=document.createElement('p');h.className='group-heading';h.textContent=group||'Ungrouped';parent.append(h);
  if(group){const row=document.createElement('div');row.className='group-rename';const input=document.createElement('input');input.value=group;input.maxLength=200;input.setAttribute('aria-label','Rename group '+group);row.append(input);button(row,'Rename',()=>{const name=input.value.trim();if(!name){status('Enter a group name. Use Delete group to move contacts to Ungrouped.');return;}if(name!==group&&campaign.groups.includes(name)){status('That group already exists. Choose a different name.');return;}campaign.groups=campaign.groups.map(g=>g===group?name:g);campaign.contacts.filter(c=>c.group===group).forEach(c=>c.group=name);dirty=true;buildProperties();refresh();status('Group renamed. Its contacts were kept.');});parent.append(row);
   button(parent,'Delete group '+group,()=>{campaign.groups=campaign.groups.filter(g=>g!==group);campaign.contacts.filter(c=>c.group===group).forEach(c=>c.group='');dirty=true;buildProperties();refresh();status('Group deleted. All contacts were kept in Ungrouped.');},'remove add');}
  const contacts=campaign.contacts.map((contact,i)=>({contact,i})).filter(x=>x.contact.group===group);const list=document.createElement('ul');list.className='contact-list';contacts.forEach(({contact,i})=>{const li=document.createElement('li');const b=button(li,contact.name||'Untitled contact',()=>select('contacts:'+i,{scroll:true}));const info=document.createElement('small');info.textContent=contact.email||'Add a public email';b.append(info);list.append(li);});parent.append(list);if(!contacts.length)help(parent,'No contacts in this group yet.');button(parent,'+ Contact in '+(group||'Ungrouped'),()=>addEntry('contacts',group),'add');
 });
}
function removeAsset(path){
 delete assets[path];if(urls[path])URL.revokeObjectURL(urls[path]);delete urls[path];campaign.assets=campaign.assets.filter(a=>a.path!==path);
 if(campaign.poster===path){campaign.poster='';campaign.posterAlt='';}if(campaign.socialImage===path)campaign.socialImage='';dirty=true;
}
function buildHero(parent){
 $('selection-hint').textContent='One hero image for the campaign page.';
 if(campaign.poster&&urls[campaign.poster]){const img=document.createElement('img');img.className='hero-image';img.src=urls[campaign.poster];img.alt=campaign.posterAlt||'Current hero image';parent.append(img);}else{const empty=document.createElement('div');empty.className='image-empty';empty.textContent=campaign.poster?'This image is missing. Add the matching file below.':'No photo yet. The illustrated placeholder appears until you add one.';parent.append(empty);}
 const label=document.createElement('label');label.className='file-button add';label.textContent=campaign.poster?'Replace hero image':'Choose hero image';const input=document.createElement('input');input.type='file';input.accept='image/png,image/jpeg,image/webp';input.onchange=async()=>{const file=input.files[0];if(!file)return;await withCanvas(async()=>{input.disabled=true;try{const path=await addImage(file);campaign.poster=path;campaign.posterAlt='';dirty=true;buildProperties();refresh();status('Hero image added. Describe it in alternative text and record its permission below. Previous images remain available in All fields.');}catch(e){status(e.message);}finally{input.disabled=false;input.value='';}});};label.append(input);parent.append(label);
 help(parent,'PNG, JPEG or WebP, up to 5 MiB and 40 megapixels. Files stay on this device.');
 if(campaign.assets.length){const l=document.createElement('label');l.textContent='Use an image already in this project';const pick=document.createElement('select');pick.append(new Option('Choose image',''));campaign.assets.forEach(a=>pick.append(new Option(a.path,a.path)));pick.value=campaign.poster;pick.onchange=()=>withCanvas(()=>{campaign.poster=pick.value;campaign.posterAlt='';dirty=true;buildProperties();refresh();});l.append(pick);parent.append(l);}
 if(campaign.poster){field(parent,'posterAlt','Alternative text');help(parent,'Describe the image for someone who cannot see it. Recommended for accessibility. Missing alternative text shows a reminder but does not block preview or export.');const index=campaign.assets.findIndex(a=>a.path===campaign.poster);if(index>=0){field(parent,`assets.${index}.creator`,'Creator / attribution');field(parent,`assets.${index}.sourceUrl`,'Original image URL (optional)','url');field(parent,`assets.${index}.permission`,'Permission / license note');}button(parent,'Remove hero from page',()=>{campaign.poster='';campaign.posterAlt='';dirty=true;buildProperties();refresh();status('Hero removed from the page. Its file remains in the project backup.');},'remove add');}
}
function buildForm(){const opened=[...$('editor').querySelectorAll('details[open]')].map(x=>x.querySelector('summary').textContent);$('editor').replaceChildren();sections.forEach(([title,fields],i)=>{const d=details(title,opened.includes(title)||(!opened.length&&i===0));fields.forEach(f=>field(d,...f));if(title==='Message templates'){const p=document.createElement('p');p.className='help';p.textContent='Supported placeholders: {{name}}, {{personalMessage}}, {{recipient}}. One recipient at a time; visitors review before opening their email app.';d.append(p);}});
 Object.entries(lists).forEach(([key,config])=>{const d=details(config.label,opened.includes(config.label));campaign[key].forEach((item,i)=>{const f=document.createElement('fieldset'),l=document.createElement('legend');l.textContent=(item.name||item.title||item.heading||item.label||'Entry')+' '+(i+1);f.append(l);config.fields.forEach(([k,label,type])=>key==='contacts'&&k==='group'?groupField(f,`${key}.${i}.${k}`):field(f,`${key}.${i}.${k}`,label,type));const b=document.createElement('button');b.type='button';b.textContent='Remove entry';b.onclick=()=>{campaign[key].splice(i,1);dirty=true;buildForm();refresh();if(key==='contacts')status('Contact deleted. Choose Save to ZIP to keep your changes.');};f.append(b);d.append(f);});const add=document.createElement('button');add.type='button';add.className='add';add.textContent='Add '+config.label.toLowerCase().replace(/s$/,'');add.onclick=()=>{const item={};config.fields.forEach(([k])=>item[k]='');if(config.fields.some(([k])=>k==='id'))item.id=key+'-'+Date.now();campaign[key].push(item);dirty=true;buildForm();refresh();if(key==='contacts')focusField('contacts.'+(campaign.contacts.length-1)+'.name');};d.append(add);});
 const groups=details('Group management',opened.includes('Group management'));button(groups,'Manage contact groups',()=>select('contacts'));
 const event=details('Optional event',opened.includes('Optional event'));const toggle=document.createElement('button');toggle.type='button';toggle.textContent=campaign.event?'Remove event':'Add event';toggle.onclick=()=>{campaign.event=campaign.event?null:{label:'',dateTime:'',sourceId:'',afterText:''};dirty=true;buildForm();refresh();};event.append(toggle);if(campaign.event)[['label','Event label'],['dateTime','Date & time with zone (2026-12-01T10:00:00+00:00)'],['sourceId','Supporting source ID'],['afterText','Text after event','textarea']].forEach(([k,l,t])=>field(event,'event.'+k,l,t));
 const media=details('Images & permissions',opened.includes('Images & permissions'));const help=document.createElement('p');help.className='help';help.textContent='PNG, JPEG or WebP only, up to 5 MiB each; 19 MiB total images. Add only images you have permission to publish. SVG and remote image URLs are not supported.';media.append(help);const upload=document.createElement('input');upload.type='file';upload.accept='image/png,image/jpeg,image/webp';upload.multiple=true;upload.setAttribute('aria-label','Add campaign images');upload.onchange=async()=>withCanvas(async()=>{try{for(const file of upload.files)await addImage(file);dirty=true;buildForm();refresh();status('Images added. Set a poster path and alternative text in Appearance.');}catch(e){status(e.message);buildForm();refresh();}});media.append(upload);
 campaign.assets.forEach((a,i)=>{const box=document.createElement('div');box.className='asset';const title=document.createElement('strong');title.textContent=a.path;box.append(title);if(urls[a.path]){const img=document.createElement('img');img.src=urls[a.path];img.alt='Uploaded image preview';box.append(document.createElement('br'),img);}['creator','sourceUrl','permission'].forEach(k=>field(box,`assets.${i}.${k}`,{creator:'Creator / attribution',sourceUrl:'Original source URL (optional)',permission:'Permission / license note'}[k]));const b=document.createElement('button');b.type='button';b.textContent='Remove image';b.onclick=()=>{delete assets[a.path];if(urls[a.path])URL.revokeObjectURL(urls[a.path]);delete urls[a.path];campaign.assets.splice(i,1);if(campaign.poster===a.path){campaign.poster='';campaign.posterAlt='';}if(campaign.socialImage===a.path)campaign.socialImage='';dirty=true;buildForm();refresh();};box.append(b);media.append(box);});
}
function issuePath(message){
 const match=message.match(/^(?:campaign\.)?((?:contacts|sources|sections|timeline|socialLinks|assets)\[\d+\]\.[A-Za-z]+|[A-Za-z]+(?:\.[A-Za-z]+)?) /);
 if(match){const path=match[1].replace(/\[(\d+)\]/g,'.$1');if(KitVisual.ruleFor(path))return path;}
 if(message.startsWith('Campaign ID'))return 'id';if(message.startsWith('Use a language'))return 'language';if(message.startsWith('Updated date'))return 'updated';if(message.includes('alternative text'))return 'posterAlt';if(message.startsWith('Default subject'))return !campaign.messages.subject?'messages.subject':'messages.body';
 return '';
}
function revealIssue(path){
 touched.add(path);if(mode==='form'){const input=[...document.querySelectorAll('[data-path]')].find(el=>el.dataset.path===path);let node=input;while(node){if(node.tagName==='DETAILS')node.open=true;node=node.parentElement;}focusAfterAction=path;validate();return;}
 let key=path;if(/^(contacts|sources|sections|timeline|socialLinks)\.\d+/.test(path)){const parts=path.split('.');key=parts[0]+':'+parts[1];}else if(path.startsWith('messages.'))key='messages';else if(path==='posterAlt'||path.startsWith('assets.'))key='hero';else if(path.startsWith('event.'))key='event';else if(!['title','summary','updated','introduction','action'].includes(path))key='campaign';select(key);focusAfterAction=path;validate();
}
function validate(){
 let result;try{result=Kit.validate(campaign,assets);}catch{result={errors:['Invalid campaign structure. Import a supported campaign.json.'],warnings:[]};}
 const fields=new Map();result.errors.forEach(message=>{const path=issuePath(message);if(path)fields.set(path,message);});
 document.querySelectorAll('[data-path]').forEach(input=>{if(!input._hint)return;const path=input.dataset.path,message=fields.get(path),emptyRequired=requiredField(path)&&!String(get(path)||'').trim(),show=emptyRequired||(!!message&&touched.has(path));input._hint.hidden=!show;input._hint.textContent=show?(emptyRequired?'Enter '+(path.endsWith('.email')?'an email address':path.endsWith('.name')?'a contact name':'a value for this required field')+'.':message):'';input.setAttribute('aria-invalid',String(show));input.classList.toggle('needs-attention',show);});
 $('validation').replaceChildren();for(const [kind,messages]of Object.entries(result)){if(!messages.length)continue;const ul=document.createElement('ul');if(kind==='errors')ul.className='error';for(const message of messages){const li=document.createElement('li'),path=issuePath(message);if(path){const action=button(li,message,()=>revealIssue(path),'review-link');action.setAttribute('aria-label',message+' Go to field.');}else li.textContent=message;ul.append(li);}$('validation').append(ul);}
 $('check-summary').textContent=result.errors.length?result.errors.length+' issue'+(result.errors.length===1?'':'s')+' to fix before export':'Ready for your final review';$('check-summary').classList.toggle('error',!!result.errors.length);
 $('download-project').disabled=!!result.errors.length||activeImport||busy;
 $('save-state').textContent=dirty?'Unsaved changes':$('save-state').textContent;
 return result;
}
function refresh(){
 const result=validate();previewToken=Math.random().toString(36).slice(2)+Date.now().toString(36);
 if(mode==='visual'){
  try{$('preview').srcdoc=KitVisual.document(campaign,KitBundle.css,urls,previewToken,selected,previewScroll);}catch{$('preview').srcdoc='<!doctype html><html><body><p>The page cannot be previewed yet. Use All fields to fix the campaign data.</p></body></html>';}
 }else if(!result.errors.length){$('preview').srcdoc=Kit.html(campaign,KitBundle.css,p=>urls[p]||'',true);}else{$('preview').srcdoc='<!doctype html><html><body style="font:16px system-ui;padding:30px"><h1>Visitor preview paused</h1><p>Return to Edit page or All fields to fix the validation issues before testing the visitor experience.</p></body></html>';}
}
function setMode(next){
 mode=next;$('workspace').classList.toggle('preview-only',next==='preview');$('workspace').classList.toggle('form-mode',next==='form');$('editor').hidden=next!=='form';$('properties').hidden=next==='form';
 ['visual','preview','form'].forEach(m=>$('mode-'+m).setAttribute('aria-pressed',String(next===m)));
 $('canvas-title').textContent=next==='visual'?'Your campaign page':'Visitor preview';$('canvas-hint').textContent=next==='visual'?'Click the outlined content to edit':'Preview only. Opening an email app does not send a message.';
 $('preview').title=next==='visual'?'Editable campaign page':'Campaign visitor preview';
 if(next==='form'){$('selection-title').textContent='All campaign fields';$('selection-hint').textContent='The original form editor, with every setting.';buildForm();}else if(next==='visual')buildProperties();
 refresh();sizePreview();
}
window.addEventListener('message',event=>{
 if(event.source!==$('preview').contentWindow||mode!=='visual'||!event.data||event.data.token!==previewToken)return;
 const message=event.data;
 if(message.type==='kit:ready'&&pendingFlush){sendFlush();return;}
 if(message.type==='kit:flushed'&&pendingFlush&&message.request===pendingFlush.request){
  if(!Array.isArray(message.values)||message.values.length>1000){pendingFlush.reject(Error('The editor could not save the current text. Try again.'));return;}
  for(const value of message.values){const edit=KitVisual.acceptEdit(campaign,{...value,type:'kit:edit',token:previewToken},previewToken);if(!edit){pendingFlush.reject(Error('Some edited text is too long or invalid. Fix it before continuing.'));return;}if(get(edit.path)!==edit.value)write(edit.path,edit.value);}
  pendingFlush.resolve();return;
 }
 if(message.type==='kit:scroll'&&Number.isFinite(message.top)){previewScroll=Math.max(0,Math.min(message.top,1000000));return;}
 if(message.type==='kit:select'&&typeof message.key==='string'&&KitVisual.targets(campaign).some(t=>t.key===message.key)){if(selected!==message.key){selected=message.key;buildProperties();validate();}return;}
 const edit=KitVisual.acceptEdit(campaign,message,previewToken);if(!edit)return;
 if(get(edit.path)!==edit.value)write(edit.path,edit.value);document.querySelectorAll('[data-path]').forEach(input=>{if(input.dataset.path===edit.path&&input!==document.activeElement)input.value=edit.value;});validate();
});
function sendFlush(){if(pendingFlush)$('preview').contentWindow?.postMessage({type:'kit:flush',token:previewToken,request:pendingFlush.request},'*');}
function flushCanvas(){
 if(mode!=='visual')return Promise.resolve();
 return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{pendingFlush=null;reject(Error('The canvas is still loading. Wait a moment and try again; your campaign has not been replaced or exported.'));},4000);pendingFlush={request:Math.random().toString(36).slice(2),resolve:()=>{clearTimeout(timer);pendingFlush=null;resolve();},reject:error=>{clearTimeout(timer);pendingFlush=null;reject(error);}};sendFlush();});
}
async function withCanvas(action){
 if(busy)return;busy=true;$('workspace').inert=true;$('import').disabled=true;document.querySelectorAll('.toolbar button').forEach(b=>b.disabled=true);validate();
 try{await flushCanvas();await action();}catch(error){status(error.message);}
 finally{busy=false;$('workspace').inert=false;$('import').disabled=false;document.querySelectorAll('.toolbar button').forEach(b=>b.disabled=false);validate();if(focusAfterAction){focusField(focusAfterAction);focusAfterAction=null;}}
}
function sniff(b,path){const png=b.length>=8&&[137,80,78,71,13,10,26,10].every((x,i)=>b[i]===x),jpg=b.length>=3&&b[0]===255&&b[1]===216&&b[2]===255,webp=b.length>=12&&String.fromCharCode(...b.slice(0,4))==='RIFF'&&String.fromCharCode(...b.slice(8,12))==='WEBP';if(/\.png$/i.test(path)&&png)return'image/png';if(/\.jpe?g$/i.test(path)&&jpg)return'image/jpeg';if(/\.webp$/i.test(path)&&webp)return'image/webp';throw Error('Image content does not match PNG, JPEG or WebP extension: '+path);}
async function verifyImage(bytes,path){if(bytes.length>Kit.MAX_IMAGE)throw Error('Image exceeds 5 MiB: '+path);const type=sniff(bytes,path),blob=new Blob([bytes],{type}),url=URL.createObjectURL(blob);try{await new Promise((ok,no)=>{const image=new Image();image.onload=()=>image.width*image.height>40000000?no(Error('Image dimensions exceed 40 megapixels.')):ok();image.onerror=()=>no(Error('Cannot decode image: '+path));image.src=url;});URL.revokeObjectURL(url);let binary='';for(let offset=0;offset<bytes.length;offset+=16384)binary+=String.fromCharCode(...bytes.subarray(offset,offset+16384));return 'data:'+type+';base64,'+btoa(binary);}catch(e){URL.revokeObjectURL(url);throw e;}}
async function addImage(file){
 if(file.size>Kit.MAX_IMAGE)throw Error('Images must be under 5 MiB.');let name=file.name.replace(/[^A-Za-z0-9._-]/g,'-');if(!/^[A-Za-z0-9]/.test(name))name='image-'+name;let path='assets/'+name;
 if(!Kit.assetPath(path))throw Error('Only PNG, JPEG and WebP images are supported.');let suffix=1;while(assets[path])path='assets/'+suffix+++'-'+name;
 const bytes=new Uint8Array(await file.arrayBuffer());if(Object.values(assets).reduce((n,b)=>n+b.length,bytes.length)>Kit.MAX-1024*1024)throw Error('Total images must be under 19 MiB.');
 const url=await verifyImage(bytes,path);assets[path]=bytes;urls[path]=url;const existing=campaign.assets.find(a=>a.path===path);if(!existing)campaign.assets.push({path,creator:'',sourceUrl:'',permission:''});if(!campaign.poster)campaign.poster=path;return path;
}
function download(name,content,type,max=Kit.MAX){if(type==='application/zip'&&content.length>max)throw Error('ZIP exceeds '+(max/1024/1024)+' MiB; remove some images or shorten the content.');const blob=new Blob([content],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}
function exportFiles(){const check=Kit.validate(campaign,assets);if(check.errors.length)throw Error(check.errors.join(' '));return Object.fromEntries(campaign.assets.map(a=>[a.path,assets[a.path]]));}
$('download-project').onclick=()=>withCanvas(()=>{const media=exportFiles(),files=KitProject.projectFiles(campaign,media,KitBundle.css,KitProjectSources);download(campaign.id+'-project.zip',KitArchive.write(files),'application/zip',KitProject.PROJECT_MAX);dirty=false;$('save-state').textContent='Project download prepared';status('New project ZIP prepared with the updated root website, editor, campaign and all images. Check the download, then extract it and open editor.html to continue, or upload it to an AI chat. Your original ZIP and folder have not changed.');});
$('import').onchange=async function(){
 const file=this.files[0];if(!file)return;await withCanvas(async()=>{
 this.disabled=true;activeImport=true;validate();const nextUrls=Object.create(null);
 try{if(file.size>Kit.MAX)throw Error('Import must be under 20 MiB.');let data,nextAssets=Object.create(null);
  if(/\.json$/i.test(file.name)){if(file.size>1024*1024)throw Error('Campaign JSON must be under 1 MiB.');data=JSON.parse(await file.text());}
  else if(/\.zip$/i.test(file.name)){const files=KitArchive.read(await file.arrayBuffer());data=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(files['campaign.json']));for(const [path,bytes]of Object.entries(files))if(path!=='campaign.json')nextAssets[path]=bytes;}
  else throw Error('Choose campaign JSON or an editable backup ZIP.');
  const validation=Kit.validate(data);if(validation.errors.length)throw Error(validation.errors.join(' '));normalizeGroups(data);const normalized=Kit.validate(data);if(normalized.errors.length)throw Error(normalized.errors.join(' '));
  const listed=new Set(data.assets.map(a=>a.path));for(const path of Object.keys(nextAssets)){if(!listed.has(path))throw Error('Unlisted image in backup: '+path);nextUrls[path]=await verifyImage(nextAssets[path],path);}
  if(/\.zip$/i.test(file.name)){const checked=Kit.validate(data,nextAssets);if(checked.errors.length)throw Error(checked.errors.join(' '));}
  if(dirty&&!confirm('Replace your unsaved editor changes? Cancel and choose Save to ZIP first if you need to keep them.')){Object.values(nextUrls).forEach(URL.revokeObjectURL);return;}
  Object.values(urls).forEach(URL.revokeObjectURL);campaign=normalizeGroups(data);touched.clear();assets=nextAssets;urls=nextUrls;dirty=false;selected='title';previewScroll=0;$('save-state').textContent='Project opened';
  if(mode==='form')buildForm();else buildProperties();refresh();status(data.assets.some(a=>!assets[a.path])?'JSON opened. Add the missing images with matching filenames before exporting.':'Project opened. Your campaign text and images are ready to edit.');
 }catch(e){Object.values(nextUrls).forEach(URL.revokeObjectURL);status('Import failed: '+e.message+' Your current campaign was kept.');}
 finally{this.value='';this.disabled=false;activeImport=false;validate();}
 });
};
$('editor').onsubmit=$('properties').onsubmit=e=>e.preventDefault();
['visual','preview','form'].forEach(next=>$('mode-'+next).onclick=()=>withCanvas(()=>setMode(next)));
['campaign','hero','contacts','messages','content'].forEach(key=>$('nav-'+key).onclick=()=>select(key,{scroll:true}));
['desktop','mobile'].forEach(id=>$(id).onclick=()=>{$('preview').classList.toggle('mobile',id==='mobile');$('desktop').setAttribute('aria-pressed',String(id==='desktop'));$('mobile').setAttribute('aria-pressed',String(id==='mobile'));sizePreview();});
window.addEventListener('beforeunload',event=>{if(dirty){event.preventDefault();event.returnValue='';}});
function sizePreview(){const wrap=$('preview-stage').parentElement,available=wrap.clientWidth-32;if(available<=0)return;const width=$('preview').classList.contains('mobile')?390:1100,scale=Math.min(1,available/width),height=Math.max(720,Math.round((window.innerHeight-285)/scale));Object.assign($('preview').style,{width:width+'px',height:height+'px',transform:'scale('+scale+')'});Object.assign($('preview-stage').style,{width:width*scale+'px',height:height*scale+'px'});}
window.addEventListener('resize',sizePreview);if(typeof ResizeObserver!=='undefined')new ResizeObserver(sizePreview).observe($('preview-stage').parentElement);
async function openBundledMedia(){
 activeImport=true;busy=true;$('workspace').inert=true;$('import').disabled=true;validate();
 const nextAssets=Object.create(null),nextUrls=Object.create(null);
 try{
  const shape=Kit.validate(campaign);if(shape.errors.length)throw Error(shape.errors.join(' '));
  if(!KitBundle.assets||typeof KitBundle.assets!=='object'||Array.isArray(KitBundle.assets))throw Error('Invalid bundled images.');
  const listed=new Set(campaign.assets.map(a=>a.path));let total=0;
  for(const [path,encoded] of Object.entries(KitBundle.assets)){
   if(!listed.has(path)||!Kit.assetPath(path))throw Error('Unlisted bundled image: '+path);
   if(typeof encoded!=='string'||encoded.length>Math.ceil(Kit.MAX_IMAGE/3)*4||encoded.length%4!==0)throw Error('Invalid bundled image encoding: '+path);
   const padding=encoded.endsWith('==')?2:encoded.endsWith('=')?1:0;
   if(/[^A-Za-z0-9+/]/.test(encoded.slice(0,encoded.length-padding)))throw Error('Invalid bundled image encoding: '+path);
   const bytes=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0));total+=bytes.length;if(total>19*1024*1024)throw Error('Bundled images exceed 19 MiB.');
   nextAssets[path]=bytes;nextUrls[path]=await verifyImage(bytes,path);
  }
  const checked=Kit.validate(campaign,nextAssets);if(checked.errors.length)throw Error(checked.errors.join(' '));
  assets=nextAssets;urls=nextUrls;status('Your campaign and bundled images are ready to edit.');
 }catch(error){Object.values(nextUrls).forEach(URL.revokeObjectURL);status('Bundled images could not be opened: '+error.message+' Keep this project ZIP and restore its media before exporting.');}
 finally{activeImport=false;busy=false;$('workspace').inert=false;$('import').disabled=false;buildProperties();refresh();}
}
buildProperties();refresh();sizePreview();
if(KitBundle.assets!==undefined)openBundledMedia();
})();
