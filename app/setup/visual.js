/* Edit-only canvas. Never included in a published website or editable campaign data. */
(function(root){
'use strict';
const Kit=root.Kit||(typeof require!=='undefined'?require('../src/core.js'):null);
const Schema=root.KitSchema||(typeof require!=='undefined'?require('../src/schema.js'):null);
const get=(object,path)=>path.split('.').reduce((o,k)=>o?.[k],object);
function ruleFor(path){let rule=Schema;for(const key of path.split('.')){if(rule?.type==='array'){if(!/^\d+$/.test(key))return null;rule=rule.items;}else if(rule?.anyOf){rule=rule.anyOf.find(x=>x.type==='object')?.properties?.[key];}else rule=rule?.properties?.[key];}return rule;}
function targets(c){
 const out=[
  {selector:'.topbar a:first-child',key:'campaign',label:'Page settings'},
  {selector:'.hero h1',key:'title',path:'title',label:'Campaign title'},
  {selector:'.hero .lead',key:'summary',path:'summary',label:'Summary',multiline:true},
  {selector:'.hero .small',key:'updated',path:'updated',label:'Updated date'},
  {selector:'.hero figure, .hero .garden',key:'hero',label:c.poster?'Replace hero image':'Add a hero image'},
  {selector:'.story > h2 + p.preserve',key:'introduction',path:'introduction',label:'Introduction',multiline:true},
  {selector:'#take-action > p.preserve',key:'action',path:'action',label:'Call to action',multiline:true},
  {selector:'.recipient-picker',key:'contacts',label:'Contacts & groups'},
  {selector:'.composer > div:first-child',key:'contacts',label:'Contacts & groups'},
  {selector:'.composer > div:nth-child(2)',key:'messages',label:'Message template'},
  {selector:'#email-subject',key:'messages',path:'messages.subject',label:'Default subject',input:true},
  {selector:'#email-body',key:'messages',path:'messages.body',label:'Default message',input:true,multiline:true},
  {selector:'.sources',key:'sources',label:'Sources & verification'},
  {selector:'nav[aria-label="Campaign links"]',key:'socialLinks',label:'Further links'}
 ];
 c.contacts.forEach((item,i)=>out.push({selector:'.recipient-card:nth-child('+(i+1)+')',key:'contacts:'+i,label:'Contact details'}));
 c.sections.forEach((item,i)=>{out.push({selector:'.story > h3:nth-of-type('+(i+1)+')',key:'sections:'+i,path:'sections.'+i+'.heading',label:'Section heading'});out.push({selector:'.story > h3:nth-of-type('+(i+1)+') + p',key:'sections:'+i,path:'sections.'+i+'.body',label:'Section text',multiline:true});});
 c.timeline.forEach((item,i)=>{out.push({selector:'.timeline > li:nth-child('+(i+1)+')',key:'timeline:'+i,label:'Timeline entry'});out.push({selector:'.timeline > li:nth-child('+(i+1)+') > strong',key:'timeline:'+i,path:'timeline.'+i+'.date',label:'Date label'});out.push({selector:'.timeline > li:nth-child('+(i+1)+') > p',key:'timeline:'+i,path:'timeline.'+i+'.text',label:'Timeline text',multiline:true});});
 c.sources.forEach((item,i)=>out.push({selector:'.sources > li:nth-child('+(i+1)+')',key:'sources:'+i,label:'Source details'}));
 if(c.event)out.push({selector:'.event',key:'event',label:'Event details'},{selector:'.event h2',key:'event',path:'event.label',label:'Event label'});
 return out.map(t=>({...t,...(t.path?{value:get(c,t.path)||'',maxLength:ruleFor(t.path)?.maxLength||10000}:{})}));
}
function acceptEdit(c,message,expectedToken){
 if(!message||message.type!=='kit:edit'||message.token!==expectedToken||typeof message.path!=='string'||typeof message.value!=='string')return null;
 const target=targets(c).find(t=>t.path===message.path);
 if(!target||message.value.length>target.maxLength||/[\u0000]/.test(message.value))return null;
 if(Array.from(message.value).some(ch=>ch.length===1&&ch.charCodeAt(0)>=0xd800&&ch.charCodeAt(0)<=0xdfff))return null;
 return {path:target.path,value:target.multiline?message.value:message.value.replace(/[\r\n]+/g,' '),key:target.key};
}
function safeCampaign(c){
 const safe=JSON.parse(JSON.stringify(c));
 ['siteUrl','petitionUrl'].forEach(k=>{if(!Kit.safeUrl(safe[k]))safe[k]='';});
 for(const item of [...safe.contacts,...safe.assets])if(!Kit.safeUrl(item.sourceUrl))item.sourceUrl='';
 for(const item of [...safe.sources,...safe.socialLinks])if(!Kit.safeUrl(item.url))item.url='';
 if(!/^#[0-9a-f]{6}$/i.test(safe.theme.accent))safe.theme.accent='#245844';
 if(!/^#[0-9a-f]{6}$/i.test(safe.theme.background))safe.theme.background='#f5f2e9';
 return safe;
}
function bridge(data){
 const send=message=>parent.postMessage({...message,token:data.token},'*');
 let selected=data.selected;
 const editable=new Map();
 function choose(key,scroll=false){selected=key;document.querySelectorAll('[data-kit-key]').forEach(el=>el.classList.toggle('kit-selected',el.dataset.kitKey===key));if(scroll){const el=[...document.querySelectorAll('[data-kit-key]')].find(el=>el.dataset.kitKey===key);if(el)el.scrollIntoView({behavior:'auto',block:'center'});}}
 function plain(el,t){return t.input?el.value:el.innerText.replace(/\r\n?/g,'\n').replace(/\n$/,'');}
 function bound(el,t){let text=plain(el,t);if(!t.multiline)text=text.replace(/[\r\n]+/g,' ');if(text.length>t.maxLength){text=text.slice(0,t.maxLength);if(t.input)el.value=text;else el.textContent=text;}send({type:'kit:edit',path:t.path,value:text});}
 for(const t of data.targets){const el=document.querySelector(t.selector);if(!el)continue;el.removeAttribute('aria-hidden');el.dataset.kitKey=t.key;el.dataset.kitLabel=t.label;el.title=t.path?'Click to edit '+t.label.toLowerCase():'Edit '+t.label.toLowerCase();
  if(t.path){editable.set(el,t);el.dataset.kitPath=t.path;if(t.input){el.value=t.value;el.maxLength=t.maxLength;el.removeAttribute('readonly');}else{el.textContent=t.value;el.contentEditable='true';el.setAttribute('role','textbox');el.setAttribute('aria-multiline',String(!!t.multiline));el.spellcheck=true;}el.setAttribute('aria-label',t.label);el.addEventListener('input',()=>bound(el,t));el.addEventListener('paste',event=>{if(t.input)return;event.preventDefault();const pasted=(event.clipboardData?.getData('text/plain')||'').slice(0,t.maxLength);const selection=getSelection();if(!selection?.rangeCount)return;const range=selection.getRangeAt(0);if(!el.contains(range.commonAncestorContainer))return;range.deleteContents();const node=document.createTextNode(t.multiline?pasted:pasted.replace(/[\r\n]+/g,' '));range.insertNode(node);range.setStartAfter(node);range.collapse(true);selection.removeAllRanges();selection.addRange(range);bound(el,t);});el.addEventListener('drop',e=>e.preventDefault());el.addEventListener('keydown',event=>{if(event.key==='Enter'&&!t.multiline){event.preventDefault();el.blur();}if(event.key==='Escape'){event.preventDefault();el.blur();}});
  }else{el.tabIndex=0;el.setAttribute('role','button');el.setAttribute('aria-label','Edit '+t.label.toLowerCase());}
 }
 // No external navigation, mailto, copy actions or visitor data entry in edit mode.
 document.addEventListener('click',event=>{const target=event.target.closest('[data-kit-key]');if(event.target.closest('a,button,select,input,textarea')&&!editable.has(event.target))event.preventDefault();if(target){event.stopPropagation();choose(target.dataset.kitKey);send({type:'kit:select',key:target.dataset.kitKey});}},true);
 document.addEventListener('focusin',event=>{const target=event.target.closest('[data-kit-key]');if(target){choose(target.dataset.kitKey);send({type:'kit:select',key:target.dataset.kitKey});}});
 document.addEventListener('keydown',event=>{const target=event.target.closest('[data-kit-key]');if(target&&!editable.has(target)&&['Enter',' '].includes(event.key)){event.preventDefault();choose(target.dataset.kitKey);send({type:'kit:select',key:target.dataset.kitKey});}});
 document.querySelectorAll('input,textarea,select,button,a').forEach(el=>{if(editable.has(el))return;if(!el.dataset.kitKey)el.tabIndex=-1;if(el.matches('input,textarea'))el.readOnly=true;if(el.matches('input[type="radio"]'))el.disabled=true;if(el.matches('select'))el.style.pointerEvents='none';if(el.matches('a')){el.removeAttribute('href');el.removeAttribute('target');}});
 window.addEventListener('message',event=>{if(event.source!==parent||!event.data||event.data.token!==data.token)return;if(event.data.type==='kit:highlight')choose(event.data.key,!!event.data.scroll);if(event.data.type==='kit:flush'){const values=[...editable].map(([el,t])=>({path:t.path,value:plain(el,t)}));send({type:'kit:flushed',request:event.data.request,values});}});
 let scheduled=false;window.addEventListener('scroll',()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;send({type:'kit:scroll',top:window.scrollY});});});
 choose(selected);requestAnimationFrame(()=>window.scrollTo(0,data.scroll||0));send({type:'kit:ready'});
}
const editCss=`[data-kit-key]{position:relative;outline:1px dashed #4d7ca955;outline-offset:5px;cursor:pointer;border-radius:3px;transition:outline-color .12s}[data-kit-key]:hover,[data-kit-key]:focus{outline:2px solid #2974be;outline-offset:5px}[data-kit-key].kit-selected{outline:2px solid #2974be;outline-offset:5px}[data-kit-key]::after{content:'✎ ' attr(data-kit-label);position:absolute;z-index:8;left:0;top:-24px;white-space:nowrap;background:#2465a3;color:#fff;font:600 10px/1.5 system-ui;letter-spacing:0;text-transform:none;padding:3px 7px;border-radius:4px;opacity:0;pointer-events:none}[data-kit-key]:hover::after,[data-kit-key]:focus::after,[data-kit-key].kit-selected::after{opacity:1}[contenteditable]{cursor:text;min-height:1em;white-space:pre-wrap}[contenteditable]:empty::before{content:'Click to add text';color:#667b70;font-style:italic;font-size:16px}[data-kit-key] [data-kit-key]{outline-offset:3px}.garden[data-kit-key]{cursor:pointer}.garden[data-kit-key]::after{opacity:1;top:12px;left:12px}.composer{gap:30px}.sources li{margin-top:20px}.story h3{margin-top:34px}a:not([data-kit-path]){cursor:default}.hero figure{min-height:150px}body{padding-top:12px}input,textarea{cursor:text}`;
function documentFor(c,css,urls,token,selected,scroll=0){const safe=safeCampaign(c);const data=JSON.stringify({targets:targets(c),token,selected,scroll}).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');return '<!doctype html><html lang="'+Kit.esc(c.language)+'"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Edit campaign</title><style>'+css+'\n'+editCss+'</style></head><body style="--accent:'+safe.theme.accent+';--paper:'+safe.theme.background+'">'+Kit.render(safe,p=>urls[p]||'')+'<script>('+bridge.toString()+')('+data+');</script></body></html>';}
root.KitVisual={targets,acceptEdit,safeCampaign,document:documentFor,ruleFor};
if(typeof module!=='undefined')module.exports=root.KitVisual;
})(typeof globalThis!=='undefined'?globalThis:this);
