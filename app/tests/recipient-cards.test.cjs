'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const Kit=require('../src/core.js'),Visual=require('../setup/visual.js'),Project=require('../src/project.js');
const css=fs.readFileSync(require('node:path').join(__dirname,'../src/site.css'),'utf8');
function fixture(){const c=structuredClone(require('../../campaign.json'));c.contacts=[{...c.contacts[0],name:'Example office A',role:'Example role A',group:'Example group',email:'a@example.com',sourceUrl:'https://example.com/contact',verified:'2026-10-20',priority:'Example priority'},{...c.contacts[0],id:'second',name:'Example office B',role:'Example role B',group:'',email:'b@example.com',subject:'For {{recipient}}',body:'Dear {{recipient}}\n{{name}}\n{{personalMessage}}'}];return c;}
test('all recipient details are static, escaped, native radio cards, without a select box',()=>{
 const c=fixture();c.contacts[1].name='<Office & "B">';const html=Kit.render(c);
 assert(!html.includes('<select'));assert.equal((html.match(/class="recipient-card"/g)||[]).length,2);
 for(const text of ['Example office A','Example role A','Example group','a@example.com','Example priority','Verified 2026-10-20','Public source ↗','&lt;Office &amp; &quot;B&quot;&gt;'])assert(html.includes(text),text);
 assert(html.includes('type="radio" name="recipient" id="recipient-0" value="0" checked'));assert(html.includes('for="recipient-1"'));assert(html.includes('<legend>Choose one recipient</legend>'));
 c.contacts[0].sourceUrl='javascript:alert(1)';assert(!Kit.render(c).includes('href="javascript:'));assert(Kit.validate(c).errors.length);
 c.contacts=[];assert(!Kit.render(c).includes('recipient-picker'));
});
test('native radio change updates selected recipient, overrides, personalization, mailto and copy',async()=>{
 const c=fixture(),nodes={},radios=c.contacts.map((_,i)=>({value:String(i),checked:i===1,handlers:{},addEventListener(e,fn){this.handlers[e]=fn;}})),copied=[];
 for(const id of ['visitor-name','personal-message','email-subject','email-body','open-email','email-status','contact-detail'])nodes[id]={value:'',textContent:'',handlers:{},append(){},addEventListener(e,fn){this.handlers[e]=fn;}};
 const buttons=['recipient','email-subject','email-body'].map(copy=>({dataset:{copy},addEventListener(e,fn){this.click=fn;}}));
 vm.runInNewContext(Kit.script(c),{document:{getElementById:id=>nodes[id],querySelectorAll:s=>s==='input[name="recipient"]'?radios:s==='[data-copy]'?buttons:[],createElement:()=>({})},navigator:{clipboard:{writeText:async value=>copied.push(value)}},Date,encodeURIComponent,URL});
 assert(nodes['contact-detail'].textContent.includes('Example office B'),'restored checked radio controls the initial draft');assert(nodes['open-email'].href.startsWith('mailto:b%40example.com?'));
 radios[1].checked=false;radios[0].checked=true;radios[0].handlers.change();assert.equal(nodes['email-subject'].value,c.messages.subject);assert(nodes['contact-detail'].textContent.includes('Example office A'));assert(nodes['open-email'].href.startsWith('mailto:a%40example.com?'));await buttons[0].click();assert.equal(copied.pop(),'a@example.com');
 nodes['visitor-name'].value='Visitor & friend';nodes['personal-message'].value='My own words';radios[0].checked=false;radios[1].checked=true;radios[1].handlers.change();
 assert.equal(nodes['email-subject'].value,'For Example office B');assert.equal(nodes['email-body'].value,'Dear Example office B\nVisitor & friend\nMy own words');assert(nodes['contact-detail'].textContent.includes('Example office B'));assert(nodes['open-email'].href.startsWith('mailto:b%40example.com?'));assert(nodes['open-email'].href.includes('Visitor%20%26%20friend'));
 await buttons[0].click();assert.equal(copied[0],'b@example.com');nodes['email-body'].value='Manual edit';nodes['email-body'].handlers.input();assert(nodes['open-email'].href.endsWith('Manual%20edit'));
});
test('preview, root website and export share cards; edit canvas keeps contextual targets and inert actions',()=>{
 const c=fixture(),render=Kit.render(c),preview=Kit.html(c,css,p=>p,true),files=Project.websiteFiles(c,{},css);
 assert(preview.includes(render));assert(files['index.html'].includes(render));assert.equal(files['scripts/site.js'],Kit.script(c));
 assert(fs.readFileSync(require('node:path').join(__dirname,'../../index.html'),'utf8').includes('class="recipient-cards"'));
 const visual=Visual.document(c,css,{},'test','contacts:1');assert(visual.includes(render));assert(!visual.includes(Kit.script(c)));assert(visual.includes('el.disabled=true'));assert(visual.includes("el.removeAttribute('href')"));
 assert(Visual.targets(c).some(t=>t.selector==='.recipient-card:nth-child(2)'&&t.key==='contacts:1'));
 assert(css.includes('minmax(min(100%,280px),1fr)'));assert(css.includes('overflow-wrap:anywhere'));
});
