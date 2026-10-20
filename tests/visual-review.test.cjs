'use strict';
/* Independent regression checks for the visual editor's shared data/export boundary.
   These are Node checks, not evidence of actual browser interaction. */
const test=require('node:test');
const assert=require('node:assert/strict');
const Kit=require('../src/core.js');
const Zip=require('../src/archive.js');
const sample=require('../campaign.json');
// Synthetic test-only source and timeline keep the instructional starter free of fabricated source dates.
const clone=()=>({...structuredClone(sample),sources:[{id:'example-source',title:'Synthetic test source',url:'https://example.com/test-source',publisher:'Test fixture',checked:'2026-01-01'}],timeline:[{date:'Test date label',text:'Synthetic test timeline entry',sourceId:'example-source'}]});

test('hostile editable text stays inert in public render and embedded data',()=>{
 const c=clone();
 const hostile='</script><img src=x onerror="alert(1)"><script>alert(2)</script> & "text"';
 c.title=hostile;c.summary=hostile;c.introduction=hostile;c.action=hostile;
 c.sections=[{heading:hostile,body:hostile}];
 c.contacts[0].name=hostile;c.contacts[0].group=hostile;c.contacts[0].role=hostile;
 c.sources[0].title=hostile;c.sources[0].publisher=hostile;
 c.timeline[0].text=hostile;
 c.messages.subject=hostile;c.messages.body=hostile;
 assert.deepEqual(Kit.validate(c).errors,[]);
 const html=Kit.html(c,'',p=>p,true);
 assert(!html.includes('<img src=x'));
 assert(!html.includes('<script>alert'));
 assert(html.includes('&lt;img src=x'));
 assert(Kit.script(c).includes('\\u003c/script>'));
});

test('public export never contains editor controls or inline editing state',()=>{
 const c=clone(), html=Kit.html(c,'');
 assert(!/contenteditable|data-edit-path|data-kit-edit|postMessage\(|editor\.js|editor\.css/.test(html));
 assert(!/contenteditable|postMessage\(|parent\./.test(Kit.script(c)));
 assert(html.includes('scripts/site.js'));
 assert(html.includes('styles/site.css'));
});

test('contact group, overrides, IDs, ordering and image data survive editable backup round trip',()=>{
 const c=clone();
 c.contacts[0].group='Local representatives';
 c.contacts[0].subject='Please hear {{recipient}}';
 c.contacts[0].body='Dear {{recipient}},\n{{personalMessage}}\n{{name}}';
 c.contacts.push({...c.contacts[0],id:'second-office',name:'Second fictional office',email:'second@example.com',group:'Public bodies'});
 c.contacts.reverse();
 const image=Uint8Array.from([137,80,78,71,13,10,26,10,12,33]);
 c.assets=[{path:'assets/example.png',creator:'Fictional example',sourceUrl:'',permission:'Test fixture only'}];
 c.poster='assets/example.png';c.socialImage=c.poster;c.posterAlt='Fictional fixture';
 assert.deepEqual(Kit.validate(c,{'assets/example.png':image}).errors,[]);
 const read=Zip.read(Zip.write({'campaign.json':JSON.stringify(c,null,2),'assets/example.png':image}));
 assert.deepEqual(JSON.parse(new TextDecoder().decode(read['campaign.json'])),c);
 assert.deepEqual(read['assets/example.png'],image);
});

test('editable URL surfaces reject executable schemes, credential URLs, and unexpected keys',()=>{
 const badUrls=['javascript:alert(1)','data:text/html,<script>alert(1)</script>','file:///etc/passwd','https://user:password@example.com/'];
 for(const url of badUrls){
  for(const mutate of [c=>c.siteUrl=url,c=>c.petitionUrl=url,c=>c.contacts[0].sourceUrl=url,c=>c.sources[0].url=url,c=>c.socialLinks=[{label:'Link',url}]]){
   const c=clone();mutate(c);assert(Kit.validate(c).errors.length, url);
  }
 }
 for(const key of ['__proto__','constructor','prototype']){
  const c=clone();Object.defineProperty(c.messages,key,{value:{polluted:true},enumerable:true});
  assert(Kit.validate(c).errors.length,key);
 }
 assert.equal({}.polluted,undefined);
});

test('broken cross-references are rejected before render or export',()=>{
 const c=clone();c.sources=[];
 assert(Kit.validate(c).errors.some(s=>s.includes('existing source')));
 const d=clone();d.event={label:'Fictional event',dateTime:'2030-01-01T00:00:00Z',sourceId:'missing',afterText:'Completed'};
 assert(Kit.validate(d).errors.some(s=>s.includes('event.sourceId')));
});

const Visual=require('../setup/visual.js');
test('visual bridge rejects unknown paths, stale tokens, wrong types and invalid Unicode',()=>{
 const c=clone();
 for(const patch of [{path:'__proto__.polluted'},{path:'constructor.prototype.polluted'},{path:'sources.999.title'},{path:'contacts.0.email'},{token:'stale'},{value:{}},{value:'\ud800'},{value:'a\u0000b'},{value:'x'.repeat(301)}]){
  assert.equal(Visual.acceptEdit(c,{type:'kit:edit',token:'active',path:'title',value:'Safe title',...patch},'active'),null);
 }
 assert.equal(Visual.acceptEdit(c,{type:'kit:edit',token:'active',path:'title',value:'New\nTitle'},'active').value,'New Title');
 assert.equal({}.polluted,undefined);
});

test('edit preview sanitation is non-mutating and does not weaken export validation',()=>{
 const c=clone();c.siteUrl='javascript:alert(1)';c.sources[0].url='data:text/html,hello';c.theme.accent='red; background:url(https://example.com)';
 const before=JSON.stringify(c), safe=Visual.safeCampaign(c);
 assert.equal(JSON.stringify(c),before);
 assert.equal(safe.siteUrl,'');assert.equal(safe.sources[0].url,'');assert.equal(safe.theme.accent,'#245844');
 assert(Kit.validate(c).errors.length);
});

test('edit document serializes hostile labels without an executable script escape',()=>{
 const c=clone();c.title='</script><script>globalThis.compromised=true</script>';
 const html=Visual.document(c,'',{},'token','title');
 assert(!html.includes('<script>globalThis.compromised=true</script>'));
 assert(html.includes('\\u003c/script>'));
 assert(!html.includes('allow-same-origin'));
});

test('simulated edit bridge makes external links inert and keeps visitor inputs read-only',()=>{
 const vm=require('node:vm'), docEvents={},winEvents={},sent=[];
 function element(kind){return {kind,dataset:{},style:{},attrs:{href:'https://example.com/',target:'_blank'},classList:{toggle(){}},handlers:{},setAttribute(k,v){this.attrs[k]=v;},removeAttribute(k){delete this.attrs[k];},addEventListener(k,f){this.handlers[k]=f;},matches(selector){return selector.split(',').includes(this.kind);}};}
 const link=element('a'),visitor=element('input'),select=element('select');
 const parent={postMessage(value){sent.push(value);}};
 const document={querySelector(){return null;},querySelectorAll(selector){return selector==='input,textarea,select,button,a'?[link,visitor,select]:[];},addEventListener(name,fn){docEvents[name]=fn;}};
 const window={addEventListener(name,fn){winEvents[name]=fn;},scrollTo(){},scrollY:0};
 const html=Visual.document(clone(),'',{},'token','title');
 const code=html.match(/<script>([\s\S]*)<\/script>/)[1];
 vm.runInNewContext(code,{document,window,parent,requestAnimationFrame:fn=>fn()});
 assert.equal(link.attrs.href,undefined);assert.equal(link.attrs.target,undefined);assert.equal(visitor.readOnly,true);assert.equal(select.style.pointerEvents,'none');
 let prevented=false;
 docEvents.click({target:{closest(selector){return selector==='a,button,select,input,textarea'?link:null;}},preventDefault(){prevented=true;},stopPropagation(){}});
 assert.equal(prevented,true);
 assert(sent.some(x=>x.type==='kit:ready'&&x.token==='token'));
});

test('one selected hero renders while previous image files remain in editable backup',()=>{
 const c=clone(), first=Uint8Array.from([1,2,3]), second=Uint8Array.from([4,5,6]);
 c.assets=['first','second'].map(name=>({path:'assets/'+name+'.png',creator:'Fictional fixture',sourceUrl:'',permission:'Test only'}));
 c.poster='assets/second.png';c.posterAlt='Second fictional image';
 const assets={'assets/first.png':first,'assets/second.png':second};
 assert.deepEqual(Kit.validate(c,assets).errors,[]);
 const html=Kit.render(c);
 assert.equal((html.match(/<img /g)||[]).length,1);
 assert(html.includes('src="assets/second.png"'));
 assert(!html.includes('src="assets/first.png"'));
 const read=Zip.read(Zip.write({...assets,'campaign.json':JSON.stringify(c)}));
 assert.deepEqual(read['assets/first.png'],first);assert.deepEqual(read['assets/second.png'],second);
 assert.equal(JSON.parse(new TextDecoder().decode(read['campaign.json'])).poster,'assets/second.png');
});
