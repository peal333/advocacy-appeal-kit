/* Small DOM simulation: exercises application state flow, not browser rendering. */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const Kit=require('../src/core.js'),KitVisual=require('../setup/visual.js'),KitArchive=require('../src/archive.js'),KitSchema=require('../src/schema.js');
const original=require('../../campaign.json');
class Element{
 constructor(tag='div'){this.tagName=tag.toUpperCase();this.children=[];this.dataset={};this.attributes={};this.handlers={};this.value='';this._text='';this.style={};this.disabled=false;this.className='';this.clientWidth=1000;this.classList={toggle:(name,force)=>{const set=new Set(this.className.split(' ').filter(Boolean));const on=force===undefined?!set.has(name):force;on?set.add(name):set.delete(name);this.className=[...set].join(' ');return on;},contains:name=>this.className.split(' ').includes(name)};}
 set textContent(value){this._text=String(value);this.children=[];}get textContent(){return this._text+this.children.map(c=>c.textContent||'').join('');}
 append(...children){for(const child of children){if(typeof child==='string'){const text=new Element('text');text.textContent=child;child=text;}child.parentElement=this;this.children.push(child);}}
 replaceChildren(...children){this.children=[];this._text='';this.append(...children);}
 setAttribute(key,value){this.attributes[key]=String(value);if(key==='id')this.id=value;}
 getAttribute(key){return this.attributes[key];}removeAttribute(key){delete this.attributes[key];}
 addEventListener(name,handler){this.handlers[name]=handler;}
 focus(){this.focused=true;}scrollIntoView(){this.scrolled=true;}
 remove(){if(this.parentElement)this.parentElement.children=this.parentElement.children.filter(c=>c!==this);}
 click(){if(this.onclick&&!this.disabled)return this.onclick();}
 querySelectorAll(selector){return descendants(this).filter(el=>selector==='details[open]'?el.tagName==='DETAILS'&&el.open:selector==='[data-path]'?el.dataset.path!==undefined:false);}
 querySelector(selector){return descendants(this).find(el=>el.tagName.toLowerCase()===selector)||null;}
}
function descendants(el){return el.children.flatMap(child=>[child,...descendants(child)]);}
// Read known generated project ZIPs (the import reader intentionally allows only data/media backups).
function projectEntries(input){const b=new Uint8Array(input),view=new DataView(b.buffer,b.byteOffset,b.byteLength),out={};let p=0;while(view.getUint32(p,true)===0x04034b50){const size=view.getUint32(p+18,true),n=view.getUint16(p+26,true),start=p+30+n+view.getUint16(p+28,true);out[new TextDecoder().decode(b.subarray(p+30,p+30+n))]=b.slice(start,start+size);p=start+size;}assert.equal(view.getUint32(p,true),0x02014b50);return out;}
function setup(){
 const ids={};for(const id of ['status','save-state','preview','workspace','preview-stage','selection-title','selection-hint','properties','editor','validation','check-summary','checks','import','download-project','download-website','canvas-title','canvas-hint','desktop','mobile','mode-visual','mode-preview','mode-form','nav-campaign','nav-hero','nav-contacts','nav-messages','nav-content']){ids[id]=new Element(id==='preview'?'iframe':'div');ids[id].id=id;}
 const body=new Element('body');body.append(...Object.values(ids));const wrap=new Element();wrap.append(ids['preview-stage']);
 const listeners={};const blobs=new Map();let nextBlob=0;const downloads=[];const realSetTimeout=setTimeout;const ctx={KitProject:require('../src/project.js'),KitProjectSources:require('../tools/project-bundle.cjs').readSources(path.join(__dirname,'../..')),Kit,KitVisual,KitArchive,KitSchema,KitBundle:{campaign:structuredClone(original),css:fs.readFileSync(path.join(__dirname,'../src/site.css'),'utf8')},document:{body,activeElement:null,getElementById:id=>ids[id],createElement:tag=>{const el=new Element(tag);if(tag==='a')el.click=()=>downloads.push({name:el.download,blob:blobs.get(el.href)});return el;},querySelectorAll:selector=>selector==='[data-path]'?Object.values(ids).flatMap(descendants).filter(el=>el.dataset.path!==undefined):selector==='.quick-nav button'?Object.entries(ids).filter(([id])=>id.startsWith('nav-')).map(([,el])=>el):selector==='.toolbar button'?['mode-visual','mode-preview','mode-form','download-project','download-website'].map(id=>ids[id]):[]},structuredClone,TextDecoder,TextEncoder,Uint8Array,Blob,btoa:binary=>Buffer.from(binary,'binary').toString('base64'),Image:class{constructor(){this.width=1;this.height=1;}set src(value){this.value=value;queueMicrotask(()=>this.onload());}},Option:function(text,value){const el=new Element('option');el.textContent=text;el.value=value;return el;},URL:{createObjectURL:blob=>{const url='blob:test-'+(++nextBlob);blobs.set(url,blob);return url;},revokeObjectURL:url=>blobs.delete(url)},setTimeout:(fn,ms)=>{if(ms===60000)return 0;return realSetTimeout(fn,ms);},clearTimeout,confirm:()=>true,console,Date,Math,Promise,innerHeight:1000};
 ctx.window=ctx;ctx.addEventListener=(name,fn)=>listeners[name]=fn;const queued={};
 ids.preview.contentWindow={postMessage:message=>{if(message.type==='kit:flush'){const token=message.token;const targets=KitVisual.targets(currentData());queueMicrotask(()=>listeners.message({source:ids.preview.contentWindow,data:{type:'kit:flushed',token,request:message.request,values:targets.filter(t=>t.path).map(t=>({path:t.path,value:Object.hasOwn(queued,t.path)?queued[t.path]:t.value}))}}));}}};
 function currentData(){const src=ids.preview.srcdoc||'';const marker=src.lastIndexOf(')({"targets":');if(marker<0)return original;const data=JSON.parse(src.slice(marker+2,src.lastIndexOf(');</script>')));return applyTargets(original,data.targets);}
 function applyTargets(base,targets){const c=structuredClone(base);for(const target of targets){if(!target.path)continue;const keys=target.path.split('.'),last=keys.pop();let node=c;for(const key of keys){if(!node[key])node[key]={};node=node[key];}node[last]=target.value;}return c;}
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../setup/editor.js'),'utf8'),ctx);
 return {ids,ctx,downloads,listeners,queued,field:path=>descendants(ids.properties).find(el=>el.dataset.path===path),button:text=>descendants(ids.properties).find(el=>el.tagName==='BUTTON'&&el.textContent===text),canvas:()=>{const src=ids.preview.srcdoc;const marker=src.lastIndexOf(')({"targets":');return JSON.parse(src.slice(marker+2,src.lastIndexOf(');</script>')));}};
}
test('editor boots in visual mode with a contextual title field and isolated canvas',()=>{const e=setup();assert.equal(e.ids['selection-title'].textContent,'Campaign title');assert.equal(e.field('title').value,original.title);assert(e.ids.preview.srcdoc.includes('kit:flush'));assert.equal(e.ids.preview.style.width,'1100px');assert.equal(e.ids['download-project'].disabled,false);});
test('canvas text updates data and inspector, rejects stale token, and saves latest queued edit',async()=>{
 const e=setup();let token=e.canvas().token;
 e.listeners.message({source:e.ids.preview.contentWindow,data:{type:'kit:edit',token,path:'title',value:'A better title'}});assert.equal(e.field('title').value,'A better title');
 e.listeners.message({source:e.ids.preview.contentWindow,data:{type:'kit:edit',token:'wrong',path:'title',value:'Wrong'}});assert.equal(e.field('title').value,'A better title');
 e.queued.title='Final keystroke before Save';await e.ids['download-project'].onclick();assert.equal(e.downloads.length,1);const zip=projectEntries(await e.downloads[0].blob.arrayBuffer());const data=JSON.parse(new TextDecoder().decode(zip['campaign.json']));assert.equal(data.title,'Final keystroke before Save');assert.equal(e.ids['save-state'].textContent,'Project download prepared');assert.equal(e.ids.workspace.inert,false);
});
test('contact/group inspector and adding an incomplete contact keeps canvas available but blocks exports',async()=>{
 const e=setup();e.ids['nav-contacts'].onclick();assert.equal(e.ids['selection-title'].textContent,'Contacts & groups');assert(e.button('+ Add contact'));await e.button('+ Add contact').onclick();assert.equal(e.ids['selection-title'].textContent,'Contact details');assert(e.field('contacts.1.name'));assert.equal(e.ids['download-project'].disabled,true);assert(e.ids.preview.srcdoc.includes('kit:flush'));assert(e.ids['check-summary'].textContent.includes('issue'));
});
test('all-fields fallback and visitor mode preserve campaign state; width toggles use distinct viewports',async()=>{
 const e=setup();e.queued.title='Kept across modes';await e.ids['mode-form'].onclick();assert.equal(e.ids.editor.hidden,false);assert(e.ids.editor.children.length>5);assert.equal(e.ids['selection-title'].textContent,'All campaign fields');await e.ids['mode-preview'].onclick();assert(e.ids.workspace.classList.contains('preview-only'));assert(e.ids.preview.srcdoc.includes('Kept across modes'));assert(!e.ids.preview.srcdoc.includes('kit:flush'));await e.ids['mode-visual'].onclick();assert.equal(e.field('title').value,'Kept across modes');e.ids.mobile.onclick();assert.equal(e.ids.preview.style.width,'390px');e.ids.desktop.onclick();assert.equal(e.ids.preview.style.width,'1100px');
});
test('failed import preserves existing campaign and clears busy lock',async()=>{
 const e=setup();e.queued.title='Current unsaved campaign';const bytes=new TextEncoder().encode('{broken json');e.ids.import.files=[{name:'bad.json',size:bytes.length,text:async()=>'{broken json'}];await e.ids.import.onchange();assert(e.ids.status.textContent.startsWith('Import failed:'));assert.equal(e.ids.workspace.inert,false);e.queued.title='Current unsaved campaign';await e.ids['download-project'].onclick();const files=projectEntries(await e.downloads[0].blob.arrayBuffer());assert.equal(JSON.parse(new TextDecoder().decode(files['campaign.json'])).title,'Current unsaved campaign');
});

test('verified raster preview uses data URL inside isolated canvas and preserves backup bytes',async()=>{
 const e=setup();e.ids['nav-hero'].onclick();
 const input=descendants(e.ids.properties).find(el=>el.type==='file');
 const bytes=Uint8Array.from([137,80,78,71,13,10,26,10,12,33]);
 input.files=[{name:'sample.png',size:bytes.length,arrayBuffer:async()=>bytes.buffer}];
 await input.onchange();
 assert(e.ids.preview.srcdoc.includes('src="data:image/png;base64,'));
 assert(!e.ids.preview.srcdoc.includes('src="blob:'));
 assert.equal(e.ids['download-project'].disabled,false);
 assert(e.ids.validation.textContent.includes('alternative text'));
 await e.ids['mode-preview'].onclick();assert(e.ids.preview.srcdoc.includes('src="data:image/png;base64,'));
 await e.ids['download-project'].onclick();const files=projectEntries(await e.downloads[0].blob.arrayBuffer());
 assert.deepEqual(files['assets/sample.png'],bytes);
 const data=JSON.parse(new TextDecoder().decode(files['campaign.json']));assert.equal(data.poster,'assets/sample.png');assert.equal(data.posterAlt,'');
 const site=KitArchive.write(e.ctx.KitProject.websiteFiles(data,{'assets/sample.png':bytes},e.ctx.KitBundle.css));
 const html=new TextDecoder().decode(site);assert(html.includes('index.html'));assert(html.includes('src="assets/sample.png"'));assert(!html.includes('data:image/png'));
});


test('website download flushes canvas, excludes project files and keeps unsaved project status',async()=>{
 const e=setup();e.queued.title='Latest public website title';await e.ids['download-website'].onclick();assert.equal(e.downloads.length,1);
 assert.equal(e.downloads[0].name,original.id+'-website.zip');const files=projectEntries(await e.downloads[0].blob.arrayBuffer());
 assert.deepEqual(Object.keys(files).sort(),['assets/','index.html','scripts/site.js','styles/site.css']);
 assert.match(new TextDecoder().decode(files['index.html']),/Latest public website title/);
 assert.equal(e.ids['save-state'].textContent,'Unsaved changes');assert.match(e.ids.status.textContent,/not an editable backup/);assert.match(e.ids.status.textContent,/Nothing has been published/);
 await e.ids['download-project'].onclick();assert.equal(e.ids['save-state'].textContent,'Project download prepared');
});
test('country field is below Role in both forms and survives JSON import and project save',async()=>{
 const e=setup(),data=structuredClone(original);data.contacts[0].country='Example country';
 const json=JSON.stringify(data);e.ids.import.files=[{name:'campaign.json',size:json.length,text:async()=>json}];await e.ids.import.onchange();
 e.ids['nav-contacts'].onclick();await e.button(data.contacts[0].name+data.contacts[0].email).onclick();
 assert.equal(e.field('contacts.0.country').value,'Example country');
 let paths=descendants(e.ids.properties).filter(el=>el.dataset.path).map(el=>el.dataset.path);assert.equal(paths[paths.indexOf('contacts.0.role')+1],'contacts.0.country');
 await e.ids['mode-form'].onclick();paths=descendants(e.ids.editor).filter(el=>el.dataset.path).map(el=>el.dataset.path);assert.equal(paths[paths.indexOf('contacts.0.role')+1],'contacts.0.country');
 await e.ids['download-project'].onclick();const files=projectEntries(await e.downloads.at(-1).blob.arrayBuffer());assert.equal(JSON.parse(new TextDecoder().decode(files['campaign.json'])).contacts[0].country,'Example country');
});
test('invalid contacts block website exports without marking the project saved',async()=>{
 const e=setup();e.ids['nav-contacts'].onclick();await e.button('+ Add contact').onclick();assert.equal(e.ids['download-website'].disabled,true);
 await e.ids['download-website'].onclick();assert.equal(e.downloads.length,0);assert.equal(e.ids['save-state'].textContent,'Unsaved changes');
});

test('website export ignores concurrent clicks and recovers from download preparation failure',async()=>{
 const e=setup();e.queued.title='Unsaved website';const first=e.ids['download-website'].onclick();await e.ids['download-website'].onclick();await first;assert.equal(e.downloads.length,1);
 const create=e.ctx.URL.createObjectURL;e.ctx.URL.createObjectURL=()=>{throw Error('Synthetic download failure');};await e.ids['download-website'].onclick();assert.equal(e.downloads.length,1);assert.match(e.ids.status.textContent,/Synthetic download failure/);assert.equal(e.ids.workspace.inert,false);assert.equal(e.ids['download-website'].disabled,false);assert.equal(e.ids['save-state'].textContent,'Unsaved changes');
 e.ctx.URL.createObjectURL=create;await e.ids['download-website'].onclick();assert.equal(e.downloads.length,2);assert.equal(e.ids['save-state'].textContent,'Unsaved changes');
});

test('optional display inspector and all-fields controls edit/export settings without mutating legacy data',async()=>{
 const e=setup();e.ids['nav-campaign'].onclick();await e.button('Header, sharing & optional sections').onclick();
 for(const key of ['display.headerTitle','display.sharing','display.shareText','display.timer.enabled','display.timer.label','display.timer.dateTime','display.timer.dateLabel','display.timer.afterText','display.background.enabled','display.background.title','display.background.body','display.timeline.enabled','display.sources.enabled','display.efforts.enabled','display.footer.followXUrl','display.footer.middleText','display.footer.showUpdated'])assert(e.field(key),key);
 assert.equal(e.field('display.timer.enabled').checked,false);assert.equal(e.field('display.timeline.enabled').checked,true);assert.equal(e.field('display.sources.enabled').checked,true);
 const edit=(path,value)=>{const f=e.field(path);if(f.type==='checkbox')f.checked=value;else f.value=value;f.handlers.input();};
 edit('display.headerTitle','Custom campaign heading');edit('display.background.title','Fictional bottom background');edit('display.background.body','Example context');edit('display.background.enabled',true);edit('display.footer.middleText','Fictional footer');edit('display.footer.showUpdated',true);edit('display.timer.dateLabel','Date to be announced');edit('display.timer.enabled',true);
 assert(e.ids.preview.srcdoc.includes('Fictional bottom background'));assert(e.ids.preview.srcdoc.includes('Date to be announced'));assert(e.ids.preview.srcdoc.includes('Time not specified.'));
 await e.button('Add existing effort').onclick();edit('display.efforts.items.0.title','Example project');edit('display.efforts.items.0.url','https://example.com/project');edit('display.efforts.items.0.description','A fictional effort');edit('display.efforts.enabled',true);
 await e.ids['download-project'].onclick();assert.equal(e.downloads.length,1);const files=projectEntries(await e.downloads[0].blob.arrayBuffer()),data=JSON.parse(new TextDecoder().decode(files['campaign.json']));
 assert.equal(data.display.background.enabled,true);assert.equal(data.display.footer.showUpdated,true);assert.equal(data.display.timer.dateLabel,'Date to be announced');assert.equal(data.display.efforts.items[0].title,'Example project');assert.deepEqual(data.timeline,original.timeline);assert.deepEqual(data.sources,original.sources);assert.equal(data.event,original.event);
 await e.ids['mode-form'].onclick();const all=descendants(e.ids.editor).filter(el=>el.dataset.path).map(el=>el.dataset.path);assert(all.includes('display.footer.middleText'));assert(all.includes('display.efforts.items.0.description'));
});
test('optional display import, hide toggles and website export retain editable content',async()=>{
 const e=setup(),data=structuredClone(original);data.display={background:{enabled:true,title:'Fictional imported background',body:'Retained background'},footer:{middleText:'Imported footer',showUpdated:true}};
 const json=JSON.stringify(data);e.ids.import.files=[{name:'campaign.json',size:json.length,text:async()=>json}];await e.ids.import.onchange();e.ids['nav-campaign'].onclick();await e.button('Header, sharing & optional sections').onclick();
 assert.equal(e.field('display.background.enabled').checked,true);const toggle=e.field('display.background.enabled');toggle.checked=false;toggle.handlers.input();assert(!e.ids.preview.srcdoc.includes('<h2>Fictional imported background</h2>'));
 await e.ids['download-project'].onclick();const files=projectEntries(await e.downloads.at(-1).blob.arrayBuffer()),saved=JSON.parse(new TextDecoder().decode(files['campaign.json']));assert.equal(saved.display.background.enabled,false);assert.equal(saved.display.background.body,'Retained background');
 await e.ids['download-website'].onclick();const site=projectEntries(await e.downloads.at(-1).blob.arrayBuffer());assert(!new TextDecoder().decode(site['index.html']).includes('<h2>Fictional imported background</h2>'));assert(!site['campaign.json']);
});
