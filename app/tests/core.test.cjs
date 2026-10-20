'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),Kit=require('../src/core.js'),Zip=require('../src/archive.js'),original=require('../../campaign.json');
// Synthetic test-only source and timeline exercise references without publishing invented facts in the starter.
const clone=()=>({...structuredClone(original),sources:[{id:'example-source',title:'Synthetic test source',url:'https://example.com/test-source',publisher:'Test fixture',checked:'2026-01-01'}],timeline:[{date:'Test date label',text:'Synthetic test timeline entry',sourceId:'example-source'}]}), utf8=s=>new TextEncoder().encode(s);
test('instructional starter validates and all emails use example.com',()=>{assert.deepEqual(Kit.validate(original,{}).errors,[]);assert(original.contacts.every(c=>c.email.endsWith('@example.com')));});
test('validation is total for malformed JSON shapes, dates and types',()=>{for(const value of [null,[],42,'hello',{}, {...clone(),updated:'9999-99-99'}, {...clone(),posterAlt:12}, {...clone(),sources:[null]}, {...clone(),contacts:[{name:{}}]}, {...clone(),event:[]}])assert(Kit.validate(value).errors.length);});
test('schema rejects unsupported version, unknown and dangerous keys',()=>{for(const patch of [{schemaVersion:2},{privateNotes:'not publishable'},{__proto__:null}]){if(Object.keys(patch).length)assert(Kit.validate({...clone(),...patch}).errors.length);}const c=clone();c.theme=JSON.parse('{"accent":"#245844","background":"#ffffff","__proto__":{}}');assert(Kit.validate(c).errors.length);});
test('URL, source references, email injection and placeholder checks',()=>{for(const [field,value] of [['siteUrl','javascript:alert(1)'],['petitionUrl','data:text/html,hello']]){const c=clone();c[field]=value;assert(Kit.validate(c).errors.length);}for(const value of ['a@example.com?bcc=b@example.com','a@example.com\r\nBcc: victim@example.com','a@example.com,b@example.com']){const c=clone();c.contacts[0].email=value;assert(Kit.validate(c).errors.length);}const c=clone();c.timeline[0].sourceId='missing';assert(Kit.validate(c).errors.length);c.timeline=[];c.messages.body='{{unsupported}}';assert(Kit.validate(c).errors.length);});
test('renderer escapes text, metadata, and script-closing sequences',()=>{const c=clone();c.title='</title><img src=x onerror=alert(1)>';c.introduction='<script>alert(1)</script>';c.contacts[0].name='</script><script>alert(2)</script>';const html=Kit.html(c,'',p=>p,true);assert(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));assert(!html.includes('<script>alert'));assert(html.includes('\\u003c/script>'));assert(!html.includes('<img src=x onerror='));});
test('optional sections disappear and past event text is static',()=>{const c=clone();c.timeline=[];c.contacts=[];c.sections=[];c.sources=[];const html=Kit.html(c,'');assert(!html.includes('Campaign timeline'));assert(!html.includes('id="recipient"'));assert(!html.includes('Sources &amp;'));const e=clone();e.event={label:'Example event',dateTime:'2020-01-01T10:00:00Z',sourceId:'example-source',afterText:'This fictional event has ended.'};assert.deepEqual(Kit.validate(e).errors,[]);assert(Kit.render(e).includes('This fictional event has ended.'));for(const dt of ['2026-01-01T10:00:00','2026-02-30T12:00:00Z','2026-04-31T12:00:00+00:00','2026-12-01T24:00:00Z']){e.event.dateTime=dt;assert(Kit.validate(e).errors.length);}});
test('placeholders remain literal text and do not recursively interpolate',()=>{assert.equal(Kit.substitute('{{name}} / {{personalMessage}} / {{recipient}}',{name:'{{recipient}}',personalMessage:'A&B',recipient:'Council'}),'{{recipient}} / A&B / Council');});
test('backup ZIP preserves JSON and image bytes exactly',()=>{const image=new Uint8Array([137,80,78,71,0,255]),json=JSON.stringify(clone());const files=Zip.read(Zip.write({'campaign.json':json,'assets/garden.png':image}));assert.equal(new TextDecoder().decode(files['campaign.json']),json);assert.deepEqual(files['assets/garden.png'],image);});
test('ZIP rejects traversal, unknown files, duplicate entries, corruption, truncation and compression',()=>{for(const name of ['../campaign.json','assets/../../x.png','assets/test.svg','assets/a/b.png','app/setup/index.html','C:/x.png'])assert.throws(()=>Zip.read(Zip.write({'campaign.json':'{}',[name]:utf8('x')})));const duplicate=Zip.write({'campaign.json':'{}','assets/one.png':utf8('x'),'assets/two.png':utf8('y')});for(let i=0;i<=duplicate.length-14;i++){if(new TextDecoder().decode(duplicate.slice(i,i+14))==='assets/two.png')duplicate.set(utf8('assets/one.png'),i);}assert.throws(()=>Zip.read(duplicate));const good=Zip.write({'campaign.json':'{}'});for(const bytes of [good.slice(0,-1),new Uint8Array(21),new Uint8Array(21*1024*1024)])assert.throws(()=>Zip.read(bytes));const corrupt=good.slice();corrupt[43]^=1;assert.throws(()=>Zip.read(corrupt));const compressed=good.slice();new DataView(compressed.buffer).setUint16(8,8,true);assert.throws(()=>Zip.read(compressed));});
test('missing assets and unsupported paths prevent exports',()=>{const c=clone();c.assets=[{path:'assets/garden.png',creator:'Test',sourceUrl:'',permission:'Own work'}];c.poster='assets/garden.png';c.posterAlt='A garden';assert(Kit.validate(c,{}).errors.some(s=>s.includes('Missing image')));assert.deepEqual(Kit.validate(c,{'assets/garden.png':new Uint8Array()}).errors,[]);c.assets[0].path='../garden.png';assert(Kit.validate(c).errors.length);});
test('website ZIP has root-level files and no editor or project config',()=>{const files={'index.html':Kit.html(original,''),'styles/site.css':'/* css */','scripts/site.js':Kit.script(original)};const zipped=Zip.write(files);const names=[];for(let i=0;i<zipped.length-46;i++){const v=new DataView(zipped.buffer);if(v.getUint32(i,true)===0x02014b50){names.push(new TextDecoder().decode(zipped.slice(i+46,i+46+v.getUint16(i+28,true))));}}assert.deepEqual(names,['index.html','styles/site.css','scripts/site.js']);});
test('bundled example and stylesheet match editable source',()=>{const ctx={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'app/setup/bundle.js'),'utf8'),ctx);assert.equal(JSON.stringify(ctx.window.KitBundle.campaign),JSON.stringify(original));assert.equal(ctx.window.KitBundle.css,fs.readFileSync(path.join(root,'app/src/site.css'),'utf8'));});
test('offline setup uses classic local scripts and no fetch or third-party runtime dependency',()=>{const html=fs.readFileSync(path.join(root,'app/setup/index.html'),'utf8');assert(!/type="module"|https?:\/\//.test(html));for(const file of ['app/src/core.js','app/src/archive.js','app/setup/editor.js'])assert(!/\bfetch\(|XMLHttpRequest|localStorage|sessionStorage/.test(fs.readFileSync(path.join(root,file),'utf8')));});
test('email runtime produces recipient-specific encoded draft and clipboard fallback',async()=>{const c=clone();c.contacts[0].subject='For {{recipient}}';c.contacts[0].body='Hello {{name}}: {{personalMessage}}';const elements={},handlers={};for(const id of ['recipient','visitor-name','personal-message','email-subject','email-body','open-email','email-status','contact-detail'])elements[id]={value:id==='recipient'?'0':'',textContent:'',addEventListener:(event,fn)=>handlers[id]=fn,append(){},after(){},focus(){},select(){this.selected=true;}};const buttons=['recipient','email-subject','email-body'].map(key=>({dataset:{copy:key},addEventListener:(event,fn)=>handlers['copy-'+key]=fn}));const ctx={document:{getElementById:id=>elements[id],querySelectorAll:s=>s==='[data-copy]'?buttons:[],createElement:()=>({setAttribute(){},focus(){},select(){this.selected=true;}})},navigator:{clipboard:{writeText:async()=>{throw Error('Denied');}}},Date,encodeURIComponent};vm.runInNewContext(Kit.script(c),ctx);elements['visitor-name'].value='Alex & Jo';elements['personal-message'].value='Please keep it open.\nThanks!';handlers['visitor-name']();assert.equal(elements['email-body'].value,'Hello Alex & Jo: Please keep it open.\nThanks!');assert(elements['open-email'].href.includes('Alex%20%26%20Jo'));await handlers['copy-email-body']();assert(elements['email-body'].selected);assert(elements['email-status'].textContent.includes('Clipboard unavailable'));elements['email-body'].value='x'.repeat(2000);handlers['email-body']();assert(elements['email-status'].textContent.includes('long'));});

test('unpaired Unicode is rejected and pretty JSON byte limit enforced',()=>{const c=clone();c.messages.body='\ud800';assert(Kit.validate(c).errors.some(x=>x.includes('Unicode')));const large=clone();large.sections=Array.from({length:100},()=>({heading:'Heading',body:'漢'.repeat(4000)}));assert(Kit.validate(large).errors.some(x=>x.includes('MiB')));});

test('low contrast custom themes are blocked',()=>{const c=clone();c.theme.accent='#ffffff';assert(Kit.validate(c).errors.some(x=>x.includes('contrast')));c.theme.accent='#245844';c.theme.background='#000000';assert(Kit.validate(c).errors.some(x=>x.includes('contrast')));});

test('empty own words removes only its standalone line and separator',()=>{
 const cases=[
  ['Before\n\n{{personalMessage}}\n\nAfter','Before\n\nAfter'],
  ['Before\n{{personalMessage}}\nAfter','Before\nAfter'],
  ['{{personalMessage}}\n\nAfter','After'],
  ['Before\n\n{{personalMessage}}','Before'],
  ['Before\n\n{{personalMessage}}\n \n','Before'],
  ['{{personalMessage}}',''],
  [' \t{{personalMessage}} \t\n\nAfter','After'],
  ['Before\n\n{{personalMessage}}\n\n{{personalMessage}}\n\nAfter','Before\n\nAfter'],
  ['{{personalMessage}} {{personalMessage}}\n\nAfter','After'],
  ['Before\n\n{{personalMessage}}\n\nAfter\n\n{{personalMessage}}','Before\n\nAfter'],
  ['Before\r\n\r\n{{personalMessage}}\r\n\r\nAfter','Before\r\n\r\nAfter'],
  ['Before\r\r{{personalMessage}}\r\rAfter','Before\r\rAfter'],
  ['Intro\n\n\nKeep spacing\n\n{{personalMessage}}\n\nAfter\n\n\nEnd\n','Intro\n\n\nKeep spacing\n\nAfter\n\n\nEnd\n'],
  ['Before {{personalMessage}} after\n\n\nEnd','Before  after\n\n\nEnd'],
  ['Before\n\n{{name}}\n\nAfter','Before\n\n\n\nAfter'],
 ];
 for(const personalMessage of ['',undefined,' \t\r\n  '])for(const [template,expected] of cases)assert.equal(Kit.substitute(template,{personalMessage}),expected,JSON.stringify({template,personalMessage}));
});
test('nonempty own words and inserted placeholder-looking text remain exact',()=>{
 const template='Before\n\n{{personalMessage}}\n\nAfter';
 for(const personalMessage of ['My words',' \nFirst\n\n\nSecond\n ','{{personalMessage}}\n\n{{name}}'])assert.equal(Kit.substitute(template,{personalMessage}),'Before\n\n'+personalMessage+'\n\nAfter');
 assert.equal(Kit.substitute('Before\n\n{{name}}\n\nAfter',{name:'{{personalMessage}}'}),'Before\n\n{{personalMessage}}\n\nAfter');
});
test('shared export and inline-preview composers omit empty own words in display, copy and mailto',async()=>{
 const c=clone();c.messages.body='Intro\n\n{{personalMessage}}\n\nThanks';c.contacts[0].body='Dear {{recipient}},\n\n{{personalMessage}}\n\nRegards,\n{{name}}';
 const inline=Kit.html(c,'',p=>p,true).match(/<script>([\s\S]*)<\/script>/)[1];
 const exported=require('../src/project.js').websiteFiles(c,{},'')['scripts/site.js'];
 for(const source of [inline,exported]){
  const nodes={},copied=[];
  for(const id of ['visitor-name','personal-message','email-subject','email-body','open-email','email-status','contact-detail'])nodes[id]={value:'',handlers:{},textContent:'',append(){},addEventListener(e,fn){this.handlers[e]=fn;}};
  const copy={dataset:{copy:'email-body'},addEventListener(e,fn){this.click=fn;}};
  vm.runInNewContext(source,{document:{getElementById:id=>nodes[id],querySelectorAll:s=>s==='[data-copy]'?[copy]:[],createElement:()=>({})},navigator:{clipboard:{writeText:async text=>copied.push(text)}},Date,encodeURIComponent,URL});
  nodes['visitor-name'].value='Example visitor';
  for(const personalMessage of ['','First\n\nSecond',' \t\n ','']){
   nodes['personal-message'].value=personalMessage;nodes['personal-message'].handlers.input();
   const expected='Dear '+c.contacts[0].name+',\n\n'+(personalMessage.trim()?personalMessage+'\n\n':'')+'Regards,\nExample visitor';
   assert.equal(nodes['email-body'].value,expected);
   assert.equal(new URL(nodes['open-email'].href).searchParams.get('body'),expected);
   await copy.click();assert.equal(copied.pop(),expected);
  }
 }
 // The global fallback template uses the same omission rules as contact overrides.
 c.contacts[0].body='';assert.equal(Kit.substitute(c.contacts[0].body||c.messages.body,{}),'Intro\n\nThanks');
});
