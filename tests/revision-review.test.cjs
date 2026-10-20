'use strict';
/* Independent review: data contracts and simulated DOM only, not browser rendering. */
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const Kit=require('../src/core.js'),Zip=require('../src/archive.js');
const clone=()=>structuredClone(require('../campaign.json'));

test('optional contact provenance accepts omitted or blank values but rejects malformed supplied values',()=>{
 for(const omit of [true,false]){const c=clone();for(const key of ['sourceUrl','verified']){if(omit)delete c.contacts[0][key];else c.contacts[0][key]='';}assert.deepEqual(Kit.validate(c).errors,[]);assert(!Kit.render(c).includes('href="undefined"'));assert(!Kit.render(c).includes('href=""'));}
 for(const [key,values] of Object.entries({sourceUrl:['javascript:alert(1)','data:text/html,x','file:///tmp/x','https://u:p@example.com','not-a-url'],verified:['2026-02-30','2026-13-01','yesterday','2026-01-01T00:00:00Z']})){
  for(const value of values){const c=clone();c.contacts[0][key]=value;assert(Kit.validate(c).errors.length,key+': '+value);}
 }
});

test('missing hero alt is advisory while asset integrity remains mandatory',()=>{
 const c=clone();c.assets=[{path:'assets/photo.png',creator:'',sourceUrl:'',permission:'Fixture'}];c.poster='assets/photo.png';c.posterAlt='';
 const good=Kit.validate(c,{'assets/photo.png':new Uint8Array([1])});assert.deepEqual(good.errors,[]);assert(good.warnings.some(s=>/alternative|alt text/i.test(s)));
 assert(Kit.validate(c,{}).errors.length);c.poster='assets/not-listed.png';assert(Kit.validate(c).errors.length);
});

test('group catalog is optional for older projects and persists empty named groups in backups',()=>{
 const old=clone();delete old.groups;old.contacts[0].group='Legacy office';assert.deepEqual(Kit.validate(old).errors,[]);
 const c=clone();c.groups=['Empty group',c.contacts[0].group].filter(Boolean);c.contacts[0].subject='Private override {{recipient}}';c.contacts[0].body='Kept override {{name}}';c.socialImage='';
 assert.deepEqual(Kit.validate(c).errors,[]);const zip=Zip.read(Zip.write({'campaign.json':JSON.stringify(c)}));assert.deepEqual(JSON.parse(new TextDecoder().decode(zip['campaign.json'])),c);
 for(const groups of [null,{},[''],['same','same'],['a'.repeat(201)],Array.from({length:101},(_,i)=>'Group '+i)]){assert(Kit.validate({...c,groups}).errors.length,JSON.stringify(groups).slice(0,80));}
});

function harness(){
 // Reuse only the existing test harness declarations, not its registered test cases.
 const file=path.join(__dirname,'editor-integration.test.cjs');
 const code=fs.readFileSync(file,'utf8').split("test('editor boots")[0];
 const context={require:require('node:module').createRequire(file),__dirname,module:{exports:{}},structuredClone,setTimeout,clearTimeout,TextEncoder,TextDecoder,Blob,queueMicrotask};
 vm.runInNewContext(code+'\nmodule.exports={setup,descendants,Element};',context);return context.module.exports;
}
async function saved(e){await e.ids['download-json'].onclick();return JSON.parse(await e.downloads.at(-1).blob.text());}

test('empty group creation and confirmed deletion preserve contacts and hidden override fields',async()=>{
 const {setup}=harness(),e=setup();await e.ids['nav-contacts'].onclick();e.field('new-group').value='Independent empty group';await e.button('+ Add group').onclick();let data=await saved(e);assert(data.groups.includes('Independent empty group'));
 let confirmed=false;e.ctx.confirm=()=>{confirmed=true;return false;};await e.button('Delete group Independent empty group').onclick();assert(confirmed);data=await saved(e);assert(data.groups.includes('Independent empty group'));
 e.ctx.confirm=()=>true;await e.button('Delete group Independent empty group').onclick();data=await saved(e);assert(!data.groups.includes('Independent empty group'));
 const group=data.contacts[0].group;if(group){const before=structuredClone(data.contacts[0]);await e.button('Delete group '+group).onclick();data=await saved(e);assert.deepEqual(data.contacts[0],{...before,group:''});}
});

test('new contact starts with required guidance but no premature field errors and focuses its name',async()=>{
 const {setup,Element,descendants}=harness();let focused='',scrolled='';Element.prototype.focus=function(){focused=this.dataset.path;};Element.prototype.scrollIntoView=function(){scrolled=this.dataset.path;};
 const e=setup();await e.ids['nav-contacts'].onclick();await e.button('+ Add contact').onclick();const name=e.field('contacts.1.name'),email=e.field('contacts.1.email');assert(name.parentElement.textContent.includes('required'));assert(email.parentElement.textContent.includes('required'));assert.equal(name.getAttribute('aria-invalid'),'false');assert.equal(name._hint.hidden,true);assert.equal(focused,'contacts.1.name');assert.equal(scrolled,'contacts.1.name');
 name.handlers.blur();assert.equal(name.getAttribute('aria-invalid'),'true');assert.equal(name._hint.hidden,false);
 const issue=descendants(e.ids.validation).find(x=>x.tagName==='BUTTON'&&x.textContent.startsWith('contacts[1].email'));assert(issue);await issue.onclick();assert.equal(focused,'contacts.1.email');assert.equal(e.field('contacts.1.email')._hint.hidden,false);
 const group=e.field('contacts.1.group');assert.equal(group.tagName,'SELECT');assert(group.children.some(o=>o.value===''&&o.textContent==='Ungrouped'));
});

test('legacy import infers group catalog and structural edits preserve unseen data',async()=>{
 const {setup}=harness(),e=setup(),c=clone();delete c.groups;c.contacts[0].group='Legacy group';c.contacts[0].subject='An override';c.contacts[0].body='A custom body';c.contacts[0].priority='Local priority';c.socialLinks=[{label:'Fixture',url:'https://example.com/fixture'}];
 const json=JSON.stringify(c);e.ids.import.files=[{name:'old.json',size:json.length,text:async()=>json}];await e.ids.import.onchange();assert.equal(e.ids.status.textContent.startsWith('Import failed'),false,e.ids.status.textContent);await e.ids['nav-contacts'].onclick();e.field('new-group').value='Empty new group';await e.button('+ Add group').onclick();await e.button('Delete group Legacy group').onclick();const data=await saved(e);assert.deepEqual(data.contacts,[{...c.contacts[0],group:''}]);assert.deepEqual(data.socialLinks,c.socialLinks);assert(data.groups.includes('Empty new group'));
});

test('upload rejects SVG, forged raster signatures and decoding failures without changing hero',async()=>{
 const {setup,descendants}=harness();
 for(const [name,bytes,decodeFails] of [['script.svg',new TextEncoder().encode('<svg onload="alert(1)"/>'),false],['fake.png',new TextEncoder().encode('<script>alert(1)</script>'),false],['broken.png',Uint8Array.from([137,80,78,71,13,10,26,10]),true]]){
  const e=setup();if(decodeFails)e.ctx.Image=class{set src(value){queueMicrotask(()=>this.onerror());}};
  await e.ids['nav-hero'].onclick();const input=descendants(e.ids.properties).find(x=>x.type==='file');input.files=[{name,size:bytes.length,arrayBuffer:async()=>bytes.buffer}];await input.onchange();assert(!e.ids.preview.srcdoc.includes('src="data:image/'),name);const c=await saved(e);assert.equal(c.poster,'');assert.equal(c.assets.length,0);
 }
});

test('import that overflows group catalog during legacy normalization is rejected without data loss',async()=>{
 const {setup}=harness(),e=setup(),c=clone();c.groups=Array.from({length:100},(_,i)=>'Catalog '+i);c.contacts[0].group='Extra legacy group';assert.deepEqual(Kit.validate(c).errors,[]);const json=JSON.stringify(c);e.ids.import.files=[{name:'overflow.json',size:json.length,text:async()=>json}];await e.ids.import.onchange();assert(e.ids.status.textContent.startsWith('Import failed:'));const kept=await saved(e);assert.equal(kept.title,clone().title);assert(!kept.groups.includes('Extra legacy group'));assert.equal(e.ids.workspace.inert,false);
});
