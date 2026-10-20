'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),cp=require('node:child_process');
const Export=require('../tools/export-campaign.cjs'),Zip=require('../src/archive.js'),Kit=require('../src/core.js');
const starter=require('../../campaign.json');
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a9xkAAAAASUVORK5CYII=','base64');
function fixture(t){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'appeal-ai-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const root=path.join(dir,'project');fs.mkdirSync(root);fs.mkdirSync(path.join(root,'assets'));
 const c=structuredClone(starter);c.id='fictional-garden';c.title='Fictional garden campaign';
 c.assets=['hero','social','unused'].map(name=>({path:'assets/'+name+'.png',creator:'Fictional '+name,sourceUrl:'',permission:'Synthetic test fixture'}));
 c.poster='assets/hero.png';c.socialImage='assets/social.png';c.posterAlt='A synthetic test pixel';
 for(const a of c.assets)fs.writeFileSync(path.join(root,a.path),png);
 function save(){fs.writeFileSync(path.join(root,'campaign.json'),JSON.stringify(c));}save();return {dir,root,c,save};
}
function entries(bytes){const b=Buffer.from(bytes),files={};let p=0;while(b.readUInt32LE(p)===0x04034b50){const size=b.readUInt32LE(p+18),n=b.readUInt16LE(p+26),extra=b.readUInt16LE(p+28),start=p+30+n+extra;files[b.toString('utf8',p+30,p+30+n)]=b.subarray(start,start+size);p=start+size;}assert.equal(b.readUInt32LE(p),0x02014b50);return files;}
test('AI exporter uses shared renderer, filters public assets, and round trips full editable backup',t=>{
 const {root,dir,c}=fixture(t),before=fs.readFileSync(path.join(root,'campaign.json')),r=Export.generate(root),site=entries(r.website),backup=Zip.read(r.editable);
 assert.deepEqual(Object.keys(site).sort(),['assets/hero.png','assets/social.png','index.html','scripts/site.js','styles/site.css'].sort());
 const publicC=structuredClone(c);publicC.assets=publicC.assets.slice(0,2);
 assert.equal(site['index.html'].toString(),Kit.html(publicC,fs.readFileSync(path.join(__dirname,'../src/site.css'),'utf8')));
 assert.equal(site['scripts/site.js'].toString(),Kit.script(publicC));assert(!site['scripts/site.js'].toString().includes('unused'));
 assert.deepEqual(JSON.parse(Buffer.from(backup['campaign.json']).toString()),c);for(const a of c.assets)assert.deepEqual(Buffer.from(backup[a.path]),png);
 const file=path.join(dir,'restore.zip');fs.writeFileSync(file,r.editable);const again=Export.generate(file);assert.deepEqual(again.editable,r.editable);assert.deepEqual(again.website,r.website);
 assert.deepEqual(fs.readFileSync(path.join(root,'campaign.json')),before);assert.match(r.report,/not decoding/);
});
test('accepts single top-level GitHub-style directory and supports no-image output',t=>{
 const {dir,root,c,save}=fixture(t);c.assets=[];c.poster='';c.socialImage='';save();
 assert.equal(Export.projectRoot(dir),root);const files=entries(Export.generate(dir).website);assert(files['assets/']);assert.equal(Object.keys(files).length,4);
});
test('rejects unsafe paths, missing images, symlinks, wrong image signatures, invalid schema and unlisted backup media',t=>{
 const {dir,root,c,save}=fixture(t);
 c.assets[0].path='../escape.png';save();assert.throws(()=>Export.generate(root),/safe raster|invalid format/);
 c.assets[0].path='assets/hero.png';save();fs.unlinkSync(path.join(root,c.assets[0].path));assert.throws(()=>Export.generate(root),/ENOENT/);
 fs.symlinkSync(path.join(root,'assets/social.png'),path.join(root,c.assets[0].path));assert.throws(()=>Export.generate(root),/symlink/);fs.unlinkSync(path.join(root,c.assets[0].path));
 fs.writeFileSync(path.join(root,c.assets[0].path),'not an image');assert.throws(()=>Export.generate(root),/does not match/);fs.writeFileSync(path.join(root,c.assets[0].path),png);
 c.schemaVersion=99;save();assert.throws(()=>Export.generate(root),/unsupported version/);c.schemaVersion=1;save();
 const zip=path.join(dir,'extra.zip');fs.writeFileSync(zip,Zip.write({'campaign.json':JSON.stringify(c),'assets/unlisted.png':png}));assert.throws(()=>Export.generate(zip),/Unlisted image/);
 fs.writeFileSync(zip,Zip.write({'campaign.json':JSON.stringify(c),'../escape.png':png}));assert.throws(()=>Export.generate(zip),/Unsafe/);
});
test('CLI creates cause-specific ZIPs and refuses existing output folders',t=>{
 const {dir,root,c}=fixture(t),out=path.join(dir,'output'),tool=path.join(__dirname,'../tools/export-campaign.cjs');
 const first=cp.spawnSync(process.execPath,[tool,root,out],{encoding:'utf8'});assert.equal(first.status,0,first.stderr);
 assert.deepEqual(fs.readdirSync(out).sort(),['REVIEW.md',c.id+'-project.zip',c.id+'-editable-backup.zip',c.id+'-website.zip'].sort());
 const second=cp.spawnSync(process.execPath,[tool,root,out],{encoding:'utf8'});assert.equal(second.status,1);assert.match(second.stderr,/EEXIST/);
});
test('oversized media fails before creating output and social-only export omits unused hero',t=>{
 const {dir,root,c,save}=fixture(t);c.poster='';save();const files=entries(Export.generate(root).website);
 assert(files['assets/social.png']);assert(!files['assets/hero.png']);assert(!files['assets/unused.png']);
 fs.writeFileSync(path.join(root,'assets/unused.png'),Buffer.alloc(Kit.MAX_IMAGE+1));
 const out=path.join(dir,'output');assert.throws(()=>Export.main([root,out]),/size limit/);assert(!fs.existsSync(out));
});
test('generated editable ZIP imports through real editor handler in simulated DOM and preserves every image',async t=>{
 // This checks the application import path, not an actual browser or image decoder.
 const {root,c}=fixture(t),generated=Export.generate(root),vm=require('node:vm');
 const file=path.join(__dirname,'editor-integration.test.cjs');
 const declarations=fs.readFileSync(file,'utf8').split("test('editor boots")[0];
 const context={Buffer,require:require('node:module').createRequire(file),__dirname,module:{exports:{}},structuredClone,setTimeout,clearTimeout,TextEncoder,TextDecoder,Blob,queueMicrotask};
 vm.runInNewContext(declarations+'\nmodule.exports={setup};',context);const editor=context.module.exports.setup();
 editor.ids.import.files=[{name:'generated-editable-backup.zip',size:generated.editable.length,arrayBuffer:async()=>generated.editable.buffer}];
 await editor.ids.import.onchange.call(editor.ids.import);
 assert.equal(editor.ids.status.textContent,'Project opened. Your campaign text and images are ready to edit.');
 await editor.ids['download-project'].onclick();const restored=entries(await editor.downloads.at(-1).blob.arrayBuffer());
 assert.deepEqual(JSON.parse(Buffer.from(restored['campaign.json']).toString()),c);
 for(const asset of c.assets)assert.deepEqual(Buffer.from(restored[asset.path]),png);
 const site=entries(Zip.write(require('../src/project.js').websiteFiles(c,Object.fromEntries(c.assets.map(a=>[a.path,restored[a.path]])),fs.readFileSync(path.join(__dirname,'../src/site.css'),'utf8'))));
 assert.deepEqual(site,entries(generated.website));
});
function extractProject(bytes,target){
 fs.mkdirSync(target);const files=entries(bytes);
 for(const [name,content] of Object.entries(files)){
  assert(!name.startsWith('/')&&!name.includes('\\')&&!name.split('/').includes('..'));assert(!name.endsWith('/'));
  const file=path.join(target,name);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,content,{flag:'wx'});
 }
 return files;
}
test('portable project carries only allowlisted toolkit and media, then regenerates after a contact edit without original toolkit',t=>{
 const {dir,root,c}=fixture(t);fs.writeFileSync(path.join(root,'PRIVATE-NOTES.txt'),'must not ship');fs.writeFileSync(path.join(root,'assets/stale.png'),png);
 const r=Export.generate(root),portable=path.join(dir,'portable'),files=extractProject(r.project,portable);
 assert(!files['PRIVATE-NOTES.txt']);assert(!files['assets/stale.png']);assert(!Object.keys(files).some(name=>name.endsWith('.zip')));
 for(const name of Export.PROJECT_FILES)assert(files[name]);
 assert.deepEqual(Object.keys(files).filter(name=>!name.includes('/')&&name.endsWith('.md')).sort(),['AGENTS.md','README.md','SECURITY.md']);
 const promptNames=['README.md','BRISTOL_COMMUNITY_CLEANUP.md','GUIDED_WORKFLOW.md'].map(name=>'prompts/'+name);
 for(const name of promptNames)assert.equal(files[name].toString(),fs.readFileSync(path.join(__dirname,'../..',name),'utf8'));
 assert(!Object.keys(entries(r.website)).some(name=>name.startsWith('prompts/')));
 let check=cp.spawnSync(process.execPath,['app/tools/check-release.cjs'],{cwd:portable,encoding:'utf8'});assert.equal(check.status,0,check.stderr);
 const loaded=JSON.parse(files['campaign.json']);assert.deepEqual(loaded,c);
 loaded.contacts[0].email='updated@example.com';fs.writeFileSync(path.join(portable,'campaign.json'),JSON.stringify(loaded));
 const output=path.join(dir,'second');const run=cp.spawnSync(process.execPath,['app/tools/export-campaign.cjs','.',output],{cwd:portable,encoding:'utf8'});assert.equal(run.status,0,run.stderr);
 const second=entries(fs.readFileSync(path.join(output,c.id+'-project.zip')));assert.deepEqual(JSON.parse(second['campaign.json']),loaded);
 for(const a of c.assets)assert.deepEqual(second[a.path],png);
 for(const name of promptNames)assert.deepEqual(second[name],files[name]);
 const publicFiles=entries(fs.readFileSync(path.join(output,c.id+'-website.zip')));assert(publicFiles['scripts/site.js'].toString().includes('updated@example.com'));assert(!publicFiles['assets/unused.png']);
 const thirdRoot=path.join(dir,'second-project');extractProject(fs.readFileSync(path.join(output,c.id+'-project.zip')),thirdRoot);
 check=cp.spawnSync(process.execPath,['app/tools/check-release.cjs'],{cwd:thirdRoot,encoding:'utf8'});assert.equal(check.status,0,check.stderr);
});
test('failed output write removes only this invocation’s files and new directory',t=>{
 const {dir,root}=fixture(t),out=path.join(dir,'output'),originalWrite=fs.writeFileSync;let calls=0;
 fs.writeFileSync=(...args)=>{if(++calls===2)throw Error('simulated ENOSPC');return originalWrite(...args);};
 try{assert.throws(()=>Export.main([root,out]),/simulated ENOSPC/);}finally{fs.writeFileSync=originalWrite;}
 assert(!fs.existsSync(out));
});
test('portable editor boots with customized data and all embedded images without import; startup gates edits',async t=>{
 const {root,c}=fixture(t);
 // Exercise the maximum accepted binary size: old grouped base64 regex overflowed V8’s stack.
 const large=Buffer.alloc(Kit.MAX_IMAGE);png.copy(large);fs.writeFileSync(path.join(root,'assets/unused.png'),large);
 const files=entries(Export.generate(root).project),vm=require('node:vm');
 const file=path.join(__dirname,'editor-integration.test.cjs');let declarations=fs.readFileSync(file,'utf8').split("test('editor boots")[0];
 const boot={};vm.runInNewContext(files['app/setup/bundle.js'].toString(),{window:boot});
 declarations=declarations.replace('function setup(){','function setup(bundle){').replace("vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../setup/editor.js'),'utf8'),ctx);", "ctx.KitBundle=bundle;ctx.atob=binary=>Buffer.from(binary,'base64').toString('binary');vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../setup/editor.js'),'utf8'),ctx);");
 const context={Buffer,require:require('node:module').createRequire(file),__dirname,module:{exports:{}},structuredClone,setTimeout,clearTimeout,TextEncoder,TextDecoder,Blob,queueMicrotask};
 vm.runInNewContext(declarations+'\nmodule.exports={setup};',context);const editor=context.module.exports.setup(boot.KitBundle);
 assert.equal(editor.ids.workspace.inert,true);assert.equal(editor.ids.import.disabled,true);assert.equal(editor.ids['download-project'].disabled,true);
 await editor.ids['download-project'].onclick();assert.equal(editor.downloads.length,0);
 for(let i=0;i<20&&editor.ids.workspace.inert;i++)await new Promise(resolve=>setImmediate(resolve));
 assert.equal(editor.ids.workspace.inert,false);assert.equal(editor.field('title').value,c.title);assert.match(editor.ids.status.textContent,/bundled images are ready/);
 assert(editor.ids.preview.srcdoc.includes('data:image/png;base64,'));
 await editor.ids['download-project'].onclick();const restored=entries(await editor.downloads.at(-1).blob.arrayBuffer());
 assert.deepEqual(JSON.parse(Buffer.from(restored['campaign.json']).toString()),c);for(const a of c.assets)assert.deepEqual(Buffer.from(restored[a.path]),a.path==='assets/unused.png'?large:png);
});
test('portable project preserves approved conventional legal notices when present and rejects symlink notices',t=>{
 const {dir,root,c}=fixture(t),generated=Export.generate(root),source=path.join(dir,'source');extractProject(generated.project,source);
 const css=fs.readFileSync(path.join(source,'app/src/site.css'),'utf8'),assets=Object.fromEntries(c.assets.map(a=>[a.path,png]));
 let files=Export.projectFiles(c,assets,css,source);assert(!files.LICENSE);
 const notice='Synthetic packaging-test notice. Not a license grant.';fs.writeFileSync(path.join(source,'LICENSE'),notice);
 files=Export.projectFiles(c,assets,css,source);assert.equal(files.LICENSE.toString(),notice);assert(files.SHA256SUMS.includes('./LICENSE\n'));
 fs.unlinkSync(path.join(source,'LICENSE'));fs.symlinkSync(path.join(source,'README.md'),path.join(source,'LICENSE'));
 assert.throws(()=>Export.projectFiles(c,assets,css,source),/symlink/);
});

test('portable source reader rejects symlinks at every app directory level',t=>{
 const {dir,root}=fixture(t),generated=Export.generate(root),source=path.join(dir,'nested-source');extractProject(generated.project,source);
 const {readSources}=require('../tools/project-bundle.cjs');
 for(const relative of ['app/setup','app']){
  const original=path.join(source,relative),outside=path.join(dir,relative.replaceAll('/','-')+'-outside');
  fs.renameSync(original,outside);fs.symlinkSync(outside,original,'dir');
  assert.throws(()=>readSources(source),/Source directory must not be a symlink/);
  fs.unlinkSync(original);fs.renameSync(outside,original);
 }
 assert(readSources(source)['app/setup/editor.js']);
});
