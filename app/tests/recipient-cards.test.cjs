'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const Kit=require('../src/core.js'),Visual=require('../setup/visual.js'),Project=require('../src/project.js');
const css=fs.readFileSync(require('node:path').join(__dirname,'../src/site.css'),'utf8');
function fixture(){const c=structuredClone(require('../../campaign.json'));c.poster='';c.socialImage='';c.assets=[];c.contacts=[{...c.contacts[0],country:'',name:'Example office A',role:'Example role A',group:'Example group',email:'a@example.com',sourceUrl:'https://example.com/contact',verified:'2026-10-20',priority:'Example priority'},{...c.contacts[0],country:'',id:'second',name:'Example office B',role:'Example role B',group:'',email:'b@example.com',subject:'For {{recipient}}',body:'Dear {{recipient}}\n{{name}}\n{{personalMessage}}'}];return c;}
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


test('country is optional, bounded, escaped and displayed immediately after role',()=>{
 const c=fixture();assert.deepEqual(Kit.validate(c).errors,[]);
 c.contacts[0].country='Example <Country> & region';assert.deepEqual(Kit.validate(c).errors,[]);
 assert.match(Kit.render(c),/recipient-role">Example role A<\/p><p class="recipient-country">Example &lt;Country&gt; &amp; region<\/p>/);
 c.contacts[0].country='';assert(!Kit.render(c).includes('recipient-country'));
 for(const value of [null,42,'x'.repeat(201)]){c.contacts[0].country=value;assert(Kit.validate(c).errors.some(e=>e.includes('country')));}
});

test('group filters preserve saved order, omit empty groups and distinguish named Uncategorized safely',()=>{
 const c=fixture();c.groups=['Empty','Later','Uncategorized','<Group & "one">'];
 c.contacts[0].group='<Group & "one">';c.contacts[1].group='Uncategorized';
 c.contacts.push({...c.contacts[0],id:'third',group:'Later'},{...c.contacts[1],id:'fourth',group:''});
 const html=Kit.render(c),filters=html.match(/<div class="recipient-filters"[\s\S]*?<\/div>/)[0];
 assert(filters.includes('aria-label="Filter contacts by group" hidden'));
 assert(!filters.includes('>Empty'));assert(filters.indexOf('>Later')<filters.indexOf('>Uncategorized'));
 assert(filters.includes('&lt;Group &amp; &quot;one&quot;&gt;'));
 assert(filters.includes('data-contact-group="group-2"'));assert(filters.includes('data-contact-group="ungrouped"'));
 assert.equal((filters.match(/Uncategorized \(1\)/g)||[]).length,2);
 assert.equal((filters.match(/type="button"/g)||[]).length,5);
 assert(!filters.includes('role="tab"'),'native buttons provide Enter/Space activation without a partial ARIA tabs pattern');
 assert.equal((html.match(/<article class="recipient-card"/g)||[]).length,4);
 assert(!/<article[^>]*\shidden/.test(html),'all cards are readable without JavaScript');
 c.contacts=c.contacts.filter(p=>p.group);assert(!Kit.render(c).includes('data-contact-group="ungrouped"'));
 c.contacts=[{...c.contacts[0],group:''}];assert(Kit.render(c).includes('Uncategorized (1)'));assert(!Kit.render(c).includes('data-contact-group="group-'));
 c.contacts=[];assert(!Kit.render(c).includes('recipient-filters'));
});

test('group filters only change visible cards and preserve selected recipient and draft',()=>{
 const c=fixture();c.groups=['Example group','Uncategorized'];c.contacts.push({...c.contacts[1],id:'third',group:'Uncategorized',email:'third@example.com'});
 const nodes={},make=extra=>({handlers:{},addEventListener(e,fn){this.handlers[e]=fn;},setAttribute(k,v){this[k]=v;},...extra});
 for(const id of ['visitor-name','personal-message','email-subject','email-body','open-email','email-status','contact-detail'])nodes[id]=make({value:'',textContent:'',append(){}});
 nodes['recipient-filters']={hidden:true};
 nodes['visitor-name'].value='Example visitor';nodes['personal-message'].value='Keep my words';
 const radios=c.contacts.map((p,i)=>make({value:String(i),checked:i===0}));
 const cards=['group-0','ungrouped','group-1'].map(key=>make({dataset:{contactGroupKey:key},hidden:false}));
 const buttons=['all','group-0','group-1','ungrouped'].map(key=>make({dataset:{contactGroup:key}}));
 vm.runInNewContext(Kit.script(c),{document:{getElementById:id=>nodes[id],querySelectorAll:s=>s==='input[name="recipient"]'?radios:s==='.recipient-card'?cards:s==='[data-contact-group]'?buttons:[],createElement:()=>({})},navigator:{},Date,encodeURIComponent,URL});
 assert.equal(nodes['recipient-filters'].hidden,false);
 buttons[3].handlers.click();
 assert.deepEqual(cards.map(c=>c.hidden),[true,false,true]);assert.deepEqual(radios.map(r=>r.disabled),[true,false,true]);
 assert.deepEqual(radios.map(r=>r.checked),[true,false,false]);assert.equal(buttons[3]['aria-pressed'],'true');
 assert(nodes['open-email'].href.startsWith('mailto:a%40example.com?'));assert(nodes['email-body'].value.includes('Keep my words'));
 nodes['email-body'].value='Visitor edited draft';nodes['email-body'].handlers.input();
 buttons[0].handlers.click();
 assert.deepEqual(cards.map(c=>c.hidden),[false,false,false]);assert.deepEqual(radios.map(r=>r.disabled),[false,false,false]);
 assert.equal(nodes['email-body'].value,'Visitor edited draft','same visible recipient retains manual draft');
 buttons[2].handlers.click();buttons[2].handlers.click();assert(nodes['open-email'].href.startsWith('mailto:a%40example.com?'));
 assert.deepEqual(radios.map(r=>r.checked),[true,false,false]);assert.equal(nodes['email-body'].value,'Visitor edited draft');
 assert(nodes['contact-detail'].textContent.includes('Example office A'),'form identifies the selected recipient even when the card is filtered out');
 buttons[0].handlers.click();radios.forEach((r,i)=>r.checked=i===0);radios[0].handlers.change();
 assert(nodes['open-email'].href.startsWith('mailto:a%40example.com?'));
 assert.equal(buttons[0]['aria-pressed'],'true');assert.equal(buttons[2]['aria-pressed'],'false');
});

test('appeal fields precede every contact; no floating review bar or repeated email CTAs',()=>{
 const c=fixture();c.contacts[0].name='<Example & office> '+ 'Long name '.repeat(15);
 const html=Kit.render(c);
 for(const id of ['visitor-name','personal-message','email-subject','email-body'])assert(html.indexOf(`id="${id}"`)<html.indexOf('class="recipient-picker"'));
 assert(html.includes('id="appeal-heading" tabindex="-1"'));
 assert(!html.includes('data-compose-recipient'));assert(!html.includes('Email this recipient'));
 assert(!html.includes('review-message'));assert(!html.includes('recipient-review-bar'));
 assert(!html.includes('selected-recipient-name'));
 assert(html.includes('&lt;Example &amp; office&gt;'));
 assert(html.includes('Select a contact to go straight to the message form above'));
 assert(html.includes('reloading clears them'));
 assert(html.includes('<noscript>'));assert(!/<article[^>]*\shidden/.test(html));
 c.contacts=[];assert(!Kit.render(c).includes('recipient-review-bar'));
});

test('radio selection returns to the heading and restores per-recipient edits without losing personalization',()=>{
 const c=fixture(),nodes={},make=extra=>({handlers:{},addEventListener(e,fn){this.handlers[e]=fn;},setAttribute(k,v){this[k]=v;},...extra});
 for(const id of ['visitor-name','personal-message','email-subject','email-body','open-email','email-status','contact-detail','draft-status'])nodes[id]=make({value:'',textContent:'',append(){}});
 const focus=[];nodes['appeal-heading']={focus:options=>focus.push(['focus',options.preventScroll]),scrollIntoView:options=>focus.push(['scroll',options.block])};
 nodes['recipient-filters']={hidden:true};
 const radios=c.contacts.map((p,i)=>make({value:String(i),checked:i===0}));
 const cards=['group-0','ungrouped'].map(key=>make({dataset:{contactGroupKey:key},hidden:false}));
 const filters=['all','group-0','ungrouped'].map(key=>make({dataset:{contactGroup:key}}));
 vm.runInNewContext(Kit.script(c),{document:{getElementById:id=>nodes[id],querySelectorAll:s=>s==='input[name="recipient"]'?radios:s==='.recipient-card'?cards:s==='[data-contact-group]'?filters:[],createElement:()=>({})},navigator:{},Date,encodeURIComponent,URL});
 const select=i=>{radios.forEach((r,j)=>r.checked=j===i);radios[i].handlers.change();};
 const edit=(id,value)=>{nodes[id].value=value;nodes[id].handlers.input();};
 edit('visitor-name','Example Visitor');edit('personal-message','My words');
 edit('email-subject','Custom A');edit('email-body','My manual A');
 select(1);
 assert.equal(nodes['email-subject'].value,'For Example office B');
 assert.equal(nodes['email-body'].value,'Dear Example office B\nExample Visitor\nMy words');
 assert.deepEqual(radios.map(r=>r.checked),[false,true]);assert(nodes['contact-detail'].textContent.includes('Example office B'));
 
 assert.deepEqual(focus,[['focus',true],['scroll','start']],'selection focuses only the heading then scrolls');
 assert(nodes['open-email'].href.startsWith('mailto:b%40example.com?'));
 edit('email-body','');
 edit('visitor-name','Updated name');edit('personal-message','Updated words');
 assert.equal(nodes['email-body'].value,'');
 select(0);
 assert.equal(nodes['email-subject'].value,'Custom A');assert.equal(nodes['email-body'].value,'My manual A');
 assert.equal(nodes['visitor-name'].value,'Updated name');assert.equal(nodes['personal-message'].value,'Updated words');
 assert(nodes['draft-status'].textContent.includes('preserved'));
 select(0);assert.equal(nodes['email-body'].value,'My manual A','repeated selection is nondestructive');
 const beforeFilters=focus.length;filters[2].handlers.click();assert.equal(nodes['email-body'].value,'My manual A','filters do not select B');
 filters[1].handlers.click();assert.equal(nodes['email-body'].value,'My manual A');
 assert.equal(focus.length,beforeFilters,'filters never focus or scroll');
 select(1);assert.equal(nodes['email-body'].value,'','an intentionally empty B draft survives switching and filtering');
 select(0);assert(nodes['open-email'].href.startsWith('mailto:a%40example.com?'));
 assert.equal(focus.length,10,'five recipient selections return to the heading');
});

// This event model intentionally checks only deterministic application state.
// It does not establish browser focus order, layout, pointer or AT behavior.
function searchableFixture(){
 const c=fixture();c.contacts[1].country='Example country';c.contacts[1].name='<Office & B> '+ 'Very long name '.repeat(20);
 const nodes={},jumps=[],scrolls=[];let focused;
 const make=(extra={})=>({handlers:{},attributes:{},children:[],value:'',textContent:'',hidden:false,dataset:{},
  addEventListener(type,fn){this.handlers[type]=fn;},setAttribute(key,value){this.attributes[key]=value;},removeAttribute(key){delete this.attributes[key];},
  append(child){this.children.push(child);},replaceChildren(){this.children=[];},contains(node){return node===this||Object.values(nodes).includes(node)&&['recipient-query','recipient-toggle','recipient-options'].some(id=>nodes[id]===node);},
  classList:{toggle(){}},scrollIntoView(options){scrolls.push(options);},focus(){if(focused!==this){focused=this;this.handlers.focus?.();}},...extra});
 for(const id of ['visitor-name','personal-message','email-subject','email-body','open-email','email-status','contact-detail','draft-status','recipient-search','recipient-query','recipient-options','recipient-toggle','recipient-search-status','recipient-filters'])nodes[id]=make();
 nodes['appeal-heading']=make({focus:()=>jumps.push('focus'),scrollIntoView:()=>jumps.push('scroll')});
 const radios=c.contacts.map((p,i)=>make({value:String(i),checked:i===0})),cards=['group-0','ungrouped'].map(key=>make({dataset:{contactGroupKey:key}})),filters=['all','group-0','ungrouped'].map(key=>make({dataset:{contactGroup:key}}));
 vm.runInNewContext(Kit.script(c),{document:{getElementById:id=>nodes[id],querySelectorAll:s=>s==='input[name="recipient"]'?radios:s==='.recipient-card'?cards:s==='[data-contact-group]'?filters:[],createElement:()=>make()},navigator:{},Date,encodeURIComponent,URL});
 const edit=(id,value)=>{nodes[id].value=value;nodes[id].handlers.input();};
 const key=value=>{let prevented=false;nodes['recipient-query'].handlers.keydown({key:value,preventDefault(){prevented=true;}});return prevented;};
 const clickOption=index=>nodes['recipient-options'].children[index].handlers.click();
 return {c,nodes,radios,cards,filters,jumps,scrolls,edit,key,clickOption};
}
test('combobox browses every contact and safely filters name, role, group, country and email',()=>{
 const {c,nodes,edit,key}=searchableFixture(),query=nodes['recipient-query'],list=nodes['recipient-options'];
 assert.equal(query.value,c.contacts[0].name);assert.equal(query.attributes['aria-expanded'],'false');assert.equal(list.hidden,true);
 query.focus();assert.equal(query.value,'');assert.equal(list.children.length,2);assert.equal(query.attributes['aria-expanded'],'true');
 assert.equal(list.children[0].attributes['aria-selected'],'true');assert.equal(list.children[1].textContent.includes('<Office & B>'),true,'unsafe names remain text content, not markup');
 for(const term of ['OFFICE & B','role B','example country','b@example.com']){edit('recipient-query',term);assert.equal(list.children.length,1);assert.equal(list.children[0].id,'recipient-option-1');}
 edit('recipient-query','Example group');assert.equal(list.children.length,1);assert.equal(list.children[0].id,'recipient-option-0');
 edit('recipient-query','not-a-listed-person@example.com');assert.equal(list.children.length,0);assert.match(nodes['recipient-search-status'].textContent,/No contacts found/);
 assert(nodes['open-email'].href.startsWith('mailto:a%40example.com?'),'free text is never an email recipient');
 key('ArrowDown');key('ArrowUp');key('Enter');assert(nodes['open-email'].href.startsWith('mailto:a%40example.com?'));
 assert.equal(key('Escape'),true);assert.equal(query.value,c.contacts[0].name);assert.equal(list.hidden,true);assert.equal(query.attributes['aria-activedescendant'],undefined);
 query.handlers.click();assert.equal(list.children.length,2,'reopening after no results browses all');
 edit('recipient-query','role B');nodes['recipient-search'].handlers.focusout({relatedTarget:null});assert.equal(query.value,c.contacts[0].name);assert.equal(list.hidden,true);
});
test('combobox keyboard commits only highlighted listed options, restores cancelled queries and never jumps',()=>{
 const {c,nodes,radios,jumps,key,edit}=searchableFixture(),query=nodes['recipient-query'];
 query.focus();key('Enter');assert.deepEqual(radios.map(r=>r.checked),[true,false],'Enter with no active result cannot silently choose');
 key('ArrowUp');assert.equal(query.attributes['aria-activedescendant'],'recipient-option-1');
 key('ArrowDown');assert.equal(query.attributes['aria-activedescendant'],'recipient-option-0');
 key('ArrowDown');key('Enter');assert.deepEqual(radios.map(r=>r.checked),[false,true]);assert.equal(query.value,c.contacts[1].name);assert.equal(query.attributes['aria-expanded'],'false');
 assert(nodes['contact-detail'].textContent.includes(c.contacts[1].name));assert(nodes['open-email'].href.startsWith('mailto:b%40example.com?'));assert.deepEqual(jumps,[]);
 query.handlers.click();edit('recipient-query','a@example.com');key('Tab');assert.equal(query.value,c.contacts[1].name);assert.deepEqual(radios.map(r=>r.checked),[false,true]);
 query.handlers.click();nodes['recipient-search'].handlers.focusout({relatedTarget:nodes['recipient-toggle']});assert.equal(query.attributes['aria-expanded'],'true','internal focus movement does not dismiss');
 nodes['recipient-toggle'].handlers.click();assert.equal(query.attributes['aria-expanded'],'false');nodes['recipient-toggle'].handlers.click();assert.equal(query.attributes['aria-expanded'],'true');assert.equal(nodes['recipient-options'].children.length,2);
});
test('dropdown choices sync filtered-out radios without changing filters or losing separate empty and edited drafts',()=>{
 const {nodes,radios,cards,filters,jumps,edit,clickOption}=searchableFixture();
 edit('visitor-name','Visitor');edit('personal-message','My words');edit('email-subject','Manual A');edit('email-body','');
 filters[1].handlers.click();assert.deepEqual(cards.map(c=>c.hidden),[false,true]);
 nodes['recipient-query'].focus();clickOption(1);
 assert.deepEqual(radios.map(r=>r.checked),[false,true]);assert.equal(radios[1].disabled,true);assert.deepEqual(cards.map(c=>c.hidden),[false,true]);assert.equal(filters[1].attributes['aria-pressed'],'true');
 assert(nodes['email-body'].value.includes('Visitor\nMy words'));edit('email-body','Manual B');
 nodes['recipient-query'].handlers.click();clickOption(0);assert.equal(nodes['email-subject'].value,'Manual A');assert.equal(nodes['email-body'].value,'');
 nodes['recipient-query'].handlers.click();clickOption(1);assert.equal(nodes['email-body'].value,'Manual B');assert.equal(nodes['visitor-name'].value,'Visitor');assert.equal(nodes['personal-message'].value,'My words');assert.deepEqual(jumps,[]);
});
test('card body selects and jumps; source links stay independent and native radio label semantics remain',()=>{
 const {nodes,radios,cards,jumps}=searchableFixture();
 const target=kind=>({closest:selector=>selector.split(',').includes(kind)?{}:null});
 cards[1].handlers.click({target:target('a')});assert.deepEqual(jumps,[]);assert.deepEqual(radios.map(r=>r.checked),[true,false]);
 cards[1].handlers.click({target:target('p')});assert.deepEqual(radios.map(r=>r.checked),[false,true]);assert.equal(jumps.length,2);assert(nodes['open-email'].href.startsWith('mailto:b%40example.com?'));
 cards[1].handlers.click({target:target('p')});assert.equal(jumps.length,4,'reselecting any noninteractive card area still jumps');
 cards[1].handlers.click({target:target('input')});assert.equal(jumps.length,6,'already-selected radio activation jumps');
 cards[0].handlers.click({target:target('label')});assert.equal(jumps.length,6,'label delegates to native radio rather than double navigating');
 radios[0].checked=true;radios[1].checked=false;cards[0].handlers.click({target:target('input')});assert.equal(jumps.length,6);radios[0].handlers.change();assert.equal(jumps.length,8);
 assert.equal(nodes['recipient-query'].value,'Example office A');assert.equal(nodes['recipient-options'].hidden,true);
});
test('composer markup puts personalization left, recipient search and details with message right, and stacks responsively',()=>{
 const html=Kit.render(fixture());
 assert(html.indexOf('class="composer-personal"')<html.indexOf('id="visitor-name"'));
 assert(html.indexOf('id="personal-message"')<html.indexOf('class="composer-message"'));
 assert(html.indexOf('class="composer-message"')<html.indexOf('id="recipient-query"'));
 assert(html.indexOf('id="recipient-query"')<html.indexOf('id="contact-detail"'));
 assert(html.indexOf('id="contact-detail"')<html.indexOf('id="email-subject"'));
 for(const text of ['role="combobox"','aria-autocomplete="list"','aria-controls="recipient-options"','role="listbox"','id="recipient-search-status"','id="recipient-search" hidden'])assert(html.includes(text));
 assert(css.includes('minmax(0,1fr) minmax(0,1.4fr)'));assert(css.includes('@media(max-width:700px){.composer{grid-template-columns:minmax(0,1fr)}}'));
});
