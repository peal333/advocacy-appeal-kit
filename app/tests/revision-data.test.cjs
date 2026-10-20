'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm');
const Kit=require('../src/core.js'),Zip=require('../src/archive.js'),schema=require('../../campaign.schema.json'),sample=require('../../campaign.json');
const clone=()=>structuredClone(sample);
const contact=c=>c.contacts[0];

test('contact source URL and verification date are optional independently and together',()=>{
 for(const sourceUrl of [undefined,'','   ','https://example.com/contact']){
  for(const verified of [undefined,'','   ','2026-10-20']){
   const c=clone();
   if(sourceUrl===undefined)delete contact(c).sourceUrl;else contact(c).sourceUrl=sourceUrl;
   if(verified===undefined)delete contact(c).verified;else contact(c).verified=verified;
   assert.deepEqual(Kit.validate(c).errors,[],JSON.stringify({sourceUrl,verified}));
  }
 }
 const required=schema.properties.contacts.items.required;
 assert(!required.includes('sourceUrl'));
 assert(!required.includes('verified'));
});

test('provided contact provenance still rejects unsafe URLs, impossible dates and wrong types',()=>{
 for(const sourceUrl of ['javascript:alert(1)','data:text/html,unsafe','file:///etc/passwd','https://user:secret@example.com/', 'not a URL']){
  const c=clone();contact(c).sourceUrl=sourceUrl;
  assert(Kit.validate(c).errors.includes('contacts[0].sourceUrl must use http or https.'),sourceUrl);
 }
 for(const verified of ['2026-02-30','2026-13-01','2026-1-01','yesterday']){
  const c=clone();contact(c).verified=verified;
  assert(Kit.validate(c).errors.includes('contacts[0].verified must be a valid YYYY-MM-DD date.'),verified);
 }
 for(const field of ['sourceUrl','verified'])for(const value of [null,false,123,{},[]]){
  const c=clone();contact(c)[field]=value;
  assert(Kit.validate(c).errors.some(message=>message.includes('contacts[0].'+field)));
 }
});

test('contact name and email validation identify the precise failing field',()=>{
 const c=clone();contact(c).name='  ';contact(c).email='';
 assert.deepEqual(Kit.validate(c).errors,[
  'contacts[0].name is required.',
  'contacts[0].email must be one valid email address.'
 ]);
});

test('supporting content validation identifies every field needed by review links',()=>{
 const c=clone();
 c.sources=[{id:'bad id',title:' ',url:'',publisher:'',checked:''}];
 c.timeline=[{date:' ',text:' ',sourceId:'missing'}];
 c.sections=[{heading:' ',body:' '}];
 c.socialLinks=[{label:' ',url:''}];
 c.event={label:' ',dateTime:'',sourceId:'missing',afterText:' '};
 c.messages={subject:' ',body:' '};
 const errors=Kit.validate(c).errors;
 for(const field of [
  'sources[0].id','sources[0].title','sources[0].url','sources[0].checked',
  'timeline[0].date','timeline[0].text','timeline[0].sourceId',
  'sections[0].heading','sections[0].body',
  'socialLinks[0].label','socialLinks[0].url',
  'event.label','event.dateTime','event.sourceId','event.afterText',
  'messages.subject','messages.body'
 ])assert(errors.some(message=>message.startsWith(field+' ')),field);
});

function runtimeFor(c){
 const elements={};
 const radios=c.contacts.map((_,i)=>({value:String(i),checked:i===0,handlers:{},addEventListener(name,fn){this.handlers[name]=fn;}}));
 elements.radios=radios;
 for(const id of ['recipient','visitor-name','personal-message','email-subject','email-body','open-email','email-status','contact-detail']){
  elements[id]={value:id==='recipient'?'0':'',children:[],_text:'',handlers:{},
   set textContent(value){this._text=String(value);this.children=[];},
   get textContent(){return this._text+this.children.map(child=>child.textContent).join('');},
   addEventListener(name,fn){this.handlers[name]=fn;},
   append(child){this.children.push(child);}
  };
 }
 vm.runInNewContext(Kit.script(c),{
  document:{getElementById:id=>elements[id],querySelectorAll:selector=>selector==='input[name="recipient"]'?radios:[],createElement:()=>({})},
  Date,encodeURIComponent,URL
 });
 return elements;
}

test('public site omits empty contact source links and missing verification claims',()=>{
 for(const value of [undefined,'','   ']){
  const c=clone();
  if(value===undefined){delete contact(c).sourceUrl;delete contact(c).verified;}
  else {contact(c).sourceUrl=value;contact(c).verified=value;}
  const html=Kit.render(c),elements=runtimeFor(c);
  assert(!html.includes('Public source'));
  assert(!html.includes('href=""'));
  assert(!elements['contact-detail'].textContent.includes('Verified'));
  assert.equal(elements['contact-detail'].children.length,0);
 }
});

test('public provenance displays each supplied value independently and resets on recipient change',()=>{
 const c=clone();
 contact(c).sourceUrl='https://example.com/contact';delete contact(c).verified;
 c.contacts.push({...contact(c),id:'dated',sourceUrl:'',verified:'2026-10-20'});
 const html=Kit.render(c),elements=runtimeFor(c),detail=elements['contact-detail'];
 assert.equal((html.match(/Public source/g)||[]).length,1);
 assert.equal(detail.children.length,1);
 assert.equal(detail.children[0].href,'https://example.com/contact');
 assert(!detail.textContent.includes('Verified'));
 elements.radios[1].checked=true;elements.radios[1].handlers.change();
 assert.equal(detail.children.length,0);
 assert(detail.textContent.includes('Verified 2026-10-20'));
});

test('blank or omitted poster alt warns without blocking valid preview and website or backup data',()=>{
 const image=Uint8Array.from([137,80,78,71,13,10,26,10]);
 for(const posterAlt of [undefined,'','   ']){
  const c=clone();
  c.assets=[{path:'assets/test.png',creator:'Test fixture',sourceUrl:'',permission:'Test only'}];
  c.poster='assets/test.png';
  if(posterAlt===undefined)delete c.posterAlt;else c.posterAlt=posterAlt;
  const validation=Kit.validate(c,{'assets/test.png':image});
  assert.deepEqual(validation.errors,[]);
  assert(validation.warnings.some(message=>message.includes('alternative text')));
  assert(Kit.html(c,'',p=>p,true).includes('src="assets/test.png"'));
  const files=Zip.read(Zip.write({'campaign.json':JSON.stringify(c),'assets/test.png':image}));
  assert.deepEqual(Kit.validate(JSON.parse(new TextDecoder().decode(files['campaign.json'])),files).errors,[]);
 }
 const c=clone();delete c.posterAlt;
 assert(!Kit.validate(c).warnings.some(message=>message.includes('alternative text')));
});

test('groups persist independently of contacts and remain optional for legacy version-1 campaigns',()=>{
 const c=clone();c.groups=['Empty group','Public bodies'];contact(c).group='Contact-derived legacy group';
 const before=JSON.stringify(c);
 assert.deepEqual(Kit.validate(c).errors,[]);
 assert.equal(JSON.stringify(c),before,'Validation must not rewrite imported data.');
 const files=Zip.read(Zip.write({'campaign.json':JSON.stringify(c)}));
 const restored=JSON.parse(new TextDecoder().decode(files['campaign.json']));
 assert.deepEqual(restored.groups,['Empty group','Public bodies']);
 assert.equal(restored.contacts[0].group,'Contact-derived legacy group');
 delete c.groups;
 assert.deepEqual(Kit.validate(c).errors,[]);
 assert(!schema.required.includes('groups'));
 assert.equal(schema.properties.groups.uniqueItems,true);
});

test('group lists require unique, nonblank, bounded plain-text names',()=>{
 for(const groups of [null,{},'Group',[''],[' '],[' Leading'],['Trailing '],['Line\nbreak'],['A\u0000B'],['A\u007fB'],['Same','Same'],['x'.repeat(201)],Array.from({length:101},(_,i)=>'Group '+i),[12],[{}],[null]]){
  const c=clone();c.groups=groups;
  assert(Kit.validate(c).errors.some(message=>message.includes('groups')),JSON.stringify(groups));
 }
 for(const groups of [[],['A'],['Local representatives','Group & partners'],['地域の代表','Équipe']]){
  const c=clone();c.groups=groups;
  assert.deepEqual(Kit.validate(c).errors,[],JSON.stringify(groups));
 }
});

test('starter is instructional, generic and does not invent campaign sources or verification',()=>{
 assert.equal(sample.id,'my-campaign');
 assert.equal(sample.title,'Your campaign title');
 assert(!/Willow|garden briefing|fictional council/i.test(JSON.stringify(sample)));
 assert.deepEqual(sample.sources,[]);
 assert.deepEqual(sample.timeline,[]);
 assert.equal(sample.event,null);
 assert.deepEqual(sample.assets,[]);
 assert(sample.contacts.length>0);
 for(const entry of sample.contacts){
  assert(entry.email.endsWith('@example.com'));
  assert(/example|replace/i.test(entry.name));
  assert(!entry.sourceUrl);
  assert(!entry.verified);
 }
 assert.deepEqual(Kit.validate(sample,{}).errors,[]);
});
