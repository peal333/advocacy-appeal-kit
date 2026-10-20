/* Portable browser save regressions. DOM simulation is not browser acceptance. */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto'),os=require('node:os'),cp=require('node:child_process');
const Project=require('../src/project.js'),Zip=require('../src/archive.js'),{readSources}=require('../tools/project-bundle.cjs');
const root=path.resolve(__dirname,'..'),starter=require('../campaign.json'),css=fs.readFileSync(path.join(root,'src/site.css'),'utf8');
function entries(input){const b=Buffer.from(input),out={};let p=0;while(b.readUInt32LE(p)===0x04034b50){const size=b.readUInt32LE(p+18),n=b.readUInt16LE(p+26),start=p+30+n+b.readUInt16LE(p+28);out[b.toString('utf8',p+30,p+30+n)]=b.subarray(start,start+size);p=start+size;}assert.equal(b.readUInt32LE(p),0x02014b50);return out;}
function editor(bundle,sources){
 const file=path.join(__dirname,'editor-integration.test.cjs');let declarations=fs.readFileSync(file,'utf8').split("test('editor boots")[0];
 declarations=declarations.replace('function setup(){','function setup(bundle,sources){').replace("vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../setup/editor.js'),'utf8'),ctx);", "ctx.KitBundle=bundle;ctx.KitProjectSources=sources;ctx.atob=binary=>Buffer.from(binary,'base64').toString('binary');vm.runInNewContext(sources['setup/editor.js'],ctx);");
 const context={Buffer,require:require('node:module').createRequire(file),__dirname,module:{exports:{}},structuredClone,setTimeout,clearTimeout,TextEncoder,TextDecoder,Blob,queueMicrotask};vm.runInNewContext(declarations+'\nmodule.exports={setup};',context);return context.module.exports.setup(bundle,sources);
}
function verifyManifest(files){const manifest=files.SHA256SUMS.toString();for(const [name,value] of Object.entries(files)){if(name==='SHA256SUMS')continue;assert(manifest.includes(crypto.createHash('sha256').update(value).digest('hex')+'  ./'+name+'\n'),name);}assert.equal(manifest.trim().split('\n').length,Object.keys(files).length-1);}
test('offline SHA256 matches native SHA256 for padding boundaries, unicode and binary data',()=>{
 for(const value of ['', 'abc','Unicode résumé 🌿',...Array.from({length:130},(_,n)=>Buffer.alloc(n,0xff)),Buffer.alloc(1024*1024,137)])assert.equal(Project.sha256(value),crypto.createHash('sha256').update(value).digest('hex'));
});
test('source template excludes generated/private/stale files and repeated browser packaging does not grow recursively',()=>{
 const sources=readSources(root);assert(!sources['setup/project-template.js']);assert(!sources['setup/bundle.js']);assert(!sources['campaign.json']);assert(!sources.SHA256SUMS);assert(!sources['index.html']);assert(!sources['styles/site.css']);assert(!sources['scripts/site.js']);assert(sources['editor.html']);
 assert.throws(()=>Project.projectFiles(starter,{},css,{...sources,'PRIVATE-NOTES.txt':'secret'}),/Unlisted project source/);
 const c=structuredClone(starter);const marker=crypto.randomBytes(16).toString('hex');c.title=marker;let files=Project.projectFiles(c,{},css,sources),previousTemplate=files['setup/project-template.js'];
 for(let i=0;i<4;i++){
  const context={window:{}};vm.runInNewContext(files['setup/project-template.js'],context);c.title=marker+i;files=Project.projectFiles(c,{},css,context.window.KitProjectSources);
  assert.equal(files['setup/project-template.js'],previousTemplate);verifyManifest(entries(Zip.write(files)));
  assert(!files['setup/project-template.js'].includes(marker));
 }
});
test('browser Save flushes latest canvas edits; extracted project reopens and resaves independently with all images and valid checksums',async t=>{
 const c=structuredClone(starter),png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a9xkAAAAASUVORK5CYII=','base64');
 c.assets=['hero','unused'].map(n=>({path:'assets/'+n+'.png',creator:'Synthetic test',sourceUrl:'',permission:'Test pixel'}));c.poster=c.assets[0].path;c.posterAlt='Synthetic pixel';
 const assets=Object.fromEntries(c.assets.map(a=>[a.path,png])),sources=readSources(root),boot={};vm.runInNewContext(Project.bundle(c,css,assets),{window:boot});
 const e=editor(boot.KitBundle,sources);assert.equal(e.ids['download-project'].disabled,true);await e.ids['download-project'].onclick();assert.equal(e.downloads.length,0);
 for(let i=0;i<30&&e.ids.workspace.inert;i++)await new Promise(resolve=>setImmediate(resolve));assert.equal(e.ids.workspace.inert,false);
 e.queued.title='Latest inline text before Save';await e.ids['download-project'].onclick();assert.equal(e.downloads.length,1);assert.equal(e.downloads[0].name,c.id+'-project.zip');
 const first=entries(await e.downloads[0].blob.arrayBuffer());verifyManifest(first);assert.equal(JSON.parse(first['campaign.json']).title,e.queued.title);assert.match(first['index.html'].toString(),/Latest inline text before Save/);assert.match(first['scripts/site.js'].toString(),/Latest inline text before Save/);assert(!first['scripts/site.js'].includes(Buffer.from('assets/unused.png')));assert(first['editor.html']);for(const a of c.assets)assert.deepEqual(first[a.path],png);
 assert.equal(e.ids['save-state'].textContent,'Project download prepared');assert.match(e.ids.status.textContent,/original ZIP and folder have not changed/);
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'browser-project-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));for(const [name,b] of Object.entries(first)){const file=path.join(dir,name);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,b);}
 const check=cp.spawnSync(process.execPath,['tools/check-release.cjs'],{cwd:dir,encoding:'utf8'});assert.equal(check.status,0,check.stderr);
 const restored={};vm.runInNewContext(first['setup/bundle.js'].toString(),{window:restored});vm.runInNewContext(first['setup/project-template.js'].toString(),{window:restored});
 const secondEditor=editor(restored.KitBundle,restored.KitProjectSources);for(let i=0;i<30&&secondEditor.ids.workspace.inert;i++)await new Promise(resolve=>setImmediate(resolve));
 secondEditor.queued.title='Second independent save';await secondEditor.ids['download-project'].onclick();const second=entries(await secondEditor.downloads[0].blob.arrayBuffer());verifyManifest(second);
 assert.equal(JSON.parse(second['campaign.json']).title,'Second independent save');assert.match(second['index.html'].toString(),/Second independent save/);assert.deepEqual(first['setup/project-template.js'],second['setup/project-template.js']);for(const a of c.assets)assert.deepEqual(second[a.path],png);
 const out=path.join(dir,'cli-output');const run=cp.spawnSync(process.execPath,['tools/export-campaign.cjs','.',out],{cwd:dir,encoding:'utf8'});assert.equal(run.status,0,run.stderr);const cli=entries(fs.readFileSync(path.join(out,c.id+'-project.zip')));verifyManifest(cli);assert.match(cli['index.html'].toString(),/Latest inline text before Save/);assert(cli['editor.html']);assert.deepEqual(cli['assets/unused.png'],png);const publicSite=entries(fs.readFileSync(path.join(out,c.id+'-website.zip')));assert(!publicSite['editor.html']);assert(!publicSite['assets/unused.png']);
});
test('failed project save leaves unsaved edits and download guards intact',async()=>{
 const e=editor({campaign:structuredClone(starter),css},{'setup/editor.js':fs.readFileSync(path.join(root,'setup/editor.js'),'utf8')});e.queued.title='Keep this unsaved text';await e.ids['download-project'].onclick();assert.equal(e.downloads.length,0);assert.match(e.ids.status.textContent,/Missing project source/);assert.equal(e.ids['save-state'].textContent,'Unsaved changes');assert.equal(e.ids.workspace.inert,false);
});

test('project limit is separate from the 20 MiB backup ceiling and oversized source inventory is refused',()=>{
 const c=structuredClone(starter),sources=readSources(root),assets={};
 c.assets=Array.from({length:4},(_,i)=>({path:'assets/large-'+i+'.png',creator:'Test',sourceUrl:'',permission:'Synthetic fixture'}));
 c.poster=c.socialImage='';
 c.assets.forEach((a,i)=>assets[a.path]=Buffer.alloc((i===3?4:5)*1024*1024));
 const files=Project.projectFiles(c,assets,css,sources),zip=Zip.write(files);assert(zip.length>20*1024*1024);assert(zip.length<Project.PROJECT_MAX);
 const oversized={...sources};for(const name of Project.PROJECT_FILES)if(name!=='campaign.schema.json')oversized[name]='x'.repeat(1024*1024);
 assert.throws(()=>Project.projectFiles(starter,{},css,oversized),/50 MiB/);
});
test('pending image decoding blocks project Save until upload completes',async()=>{
 const e=editor({campaign:structuredClone(starter),css},readSources(root));e.ids['nav-hero'].onclick();
 const input=e.ids.properties.children.flatMap(function walk(el){return [el,...el.children.flatMap(walk)];}).find(el=>el.type==='file');assert(input);
 let finish; e.ctx.Image=class{constructor(){this.width=1;this.height=1;}set src(value){finish=()=>this.onload();}};
 const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a9xkAAAAASUVORK5CYII=','base64');
 input.files=[{name:'pending.png',size:png.length,arrayBuffer:async()=>png}];const pending=input.onchange();
 for(let i=0;i<10&&!finish;i++)await new Promise(resolve=>setImmediate(resolve));assert(finish);assert.equal(e.ids['download-project'].disabled,true);
 await e.ids['download-project'].onclick();assert.equal(e.downloads.length,0);finish();await pending;
 await e.ids['download-project'].onclick();assert.equal(e.downloads.length,1);const files=entries(await e.downloads[0].blob.arrayBuffer());assert.deepEqual(files['assets/pending.png'],png);
});


test('root entries are a rendered cause website and directly usable local editor, with legacy editor parity',()=>{
 const main=fs.readFileSync(path.join(root,'index.html'),'utf8'),page=fs.readFileSync(path.join(root,'editor.html'),'utf8'),legacy=fs.readFileSync(path.join(root,'setup/index.html'),'utf8');
 assert.match(main,/<title>Your campaign title<\/title>/);assert(!main.includes('id="download-project"'));assert(!main.includes('<iframe'));
 assert.match(page,/id="download-project"[^>]*>Save to ZIP</);assert.match(page,/id="properties"/);for(const source of [page,fs.readFileSync(path.join(root,'setup/index.html'),'utf8')]){assert.equal((source.match(/id="download-[^"]+"/g)||[]).length,1);assert.match(source,/id="download-project"[^>]*>Save to ZIP</);assert(!/download-(backup|site|json)|advanced-save/.test(source));}assert(!/type="module"|https?:\/\/|<base/.test(page));
 const scripts=[...page.matchAll(/<script src="([^"]+)"/g)].map(m=>m[1]);
 assert.deepEqual(scripts,['src/schema.js','src/core.js','src/archive.js','src/project.js','setup/project-template.js','setup/bundle.js','setup/visual.js','setup/editor.js']);
 for(const entry of ['index.html','editor.html','setup/index.html']){
  const html=fs.readFileSync(path.join(root,entry),'utf8');
  for(const match of html.matchAll(/(?:src|href)="([^"]+)"/g)){
   if(/^[a-z]+:|^#/.test(match[1]))continue;
   assert(fs.existsSync(path.resolve(root,path.dirname(entry),match[1])),entry+' resource '+match[1]);
  }
 }
 assert.equal(page,legacy.replace('href="editor.css"','href="setup/editor.css"').replaceAll('src="../src/','src="src/').replace(/src="(project-template|bundle|visual|editor)\.js"/g,'src="setup/$1.js"'));
 const site=Project.websiteFiles(starter,{},css);assert.equal(main,site['index.html']);assert.equal(fs.readFileSync(path.join(root,'scripts/site.js'),'utf8'),site['scripts/site.js']);
});
