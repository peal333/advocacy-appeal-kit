'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const Kit=require('../src/core.js');
// Deterministic DOM simulation only; not rendered-browser evidence.
test('only a checked radio change moves to the heading after preparing its draft',()=>{
 const c=structuredClone(require('../../campaign.json'));
 c.contacts=[{...c.contacts[0],name:'Example office A'},{...c.contacts[0],id:'b',name:'Example office B',email:'b@example.com',subject:'For {{recipient}}'}];
 const make=extra=>({handlers:{},addEventListener(event,fn){this.handlers[event]=fn;},...extra}),nodes={},calls=[];
 for(const id of ['visitor-name','personal-message','email-subject','email-body','open-email','email-status','contact-detail','draft-status'])nodes[id]=make({value:'',textContent:'',append(){},focus(){throw Error('Must not focus an editable field');}});
 nodes['appeal-heading']={focus(options){calls.push(['focus',options.preventScroll]);assert.equal(nodes['email-subject'].value,'For Example office B');assert(nodes['open-email'].href.startsWith('mailto:b%40example.com?'));},scrollIntoView(options){calls.push(['scroll',options.block]);}};
 const radios=c.contacts.map((p,i)=>make({checked:i===0,value:String(i)}));
 const listeners=[];
 vm.runInNewContext(Kit.script(c),{document:{getElementById:id=>nodes[id],querySelectorAll:selector=>selector==='input[name="recipient"]'?radios:[],createElement:()=>({}),addEventListener:event=>listeners.push(event)},window:{addEventListener:event=>listeners.push(event)},navigator:{},Date,encodeURIComponent,URL});
 assert.deepEqual(calls,[],'startup never jumps');
 radios[1].handlers.change();assert.deepEqual(calls,[],'unchecked changes never jump');
 nodes['visitor-name'].value='Visitor';nodes['visitor-name'].handlers.input();nodes['personal-message'].value='My words';nodes['personal-message'].handlers.input();
 assert.deepEqual(calls,[],'personalization does not navigate');
 radios[0].checked=false;radios[1].checked=true;radios[1].handlers.change();
 assert.deepEqual(calls,[['focus',true],['scroll','start']]);
 radios[1].handlers.change();assert.equal(calls.length,4,'repeated changes remain safe');
 assert.deepEqual(listeners,[],'no scroll, resize, focus or viewport listeners for removed bars');
});
test('markup and styling omit review bars and reserved space while retaining heading focus target',()=>{
 const c=structuredClone(require('../../campaign.json')),html=Kit.render(c),script=Kit.script(c),css=fs.readFileSync(path.join(__dirname,'../src/site.css'),'utf8');
 assert.match(html,/<h3 id="appeal-heading" tabindex="-1">/);
 for(const marker of ['recipient-review-bar','review-message','selected-recipient-name','--review-bar-space']){assert(!html.includes(marker));assert(!css.includes(marker));assert(!script.includes(marker));}
 for(const marker of ['visualViewport','ResizeObserver','requestAnimationFrame'])assert(!script.includes(marker));
 assert.equal((html.match(/id="open-email"/g)||[]).length,1);
});
