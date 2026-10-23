'use strict';
/* Real editor handlers in a simulated DOM, not a browser or image-decoding test. */
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const Zip=require('../src/archive.js'),Project=require('../src/project.js');
const css=fs.readFileSync(path.join(__dirname,'../src/site.css'),'utf8');
function publicFiles(campaign,image){return websiteFiles(Zip.write(Project.websiteFiles(campaign,Object.fromEntries(campaign.assets.map(a=>[a.path,image])),css)));}
function setup(){
 const file=path.join(__dirname,'editor-integration.test.cjs');
 const declarations=fs.readFileSync(file,'utf8').split("test('editor boots")[0];
 const context={Buffer,require:require('node:module').createRequire(file),__dirname,module:{exports:{}},structuredClone,setTimeout,clearTimeout,TextEncoder,TextDecoder,Blob,queueMicrotask};
 vm.runInNewContext(declarations+'\nmodule.exports={setup};',context);
 return context.module.exports.setup();
}
function websiteFiles(bytes){
 // Website exports deliberately have paths that the stricter backup reader rejects.
 const b=Buffer.from(bytes),files={};let offset=0;
 while(b.readUInt32LE(offset)===0x04034b50){
  const size=b.readUInt32LE(offset+18),nameLength=b.readUInt16LE(offset+26),extraLength=b.readUInt16LE(offset+28);
  const name=b.toString('utf8',offset+30,offset+30+nameLength),start=offset+30+nameLength+extraLength;
  files[name]=b.subarray(start,start+size);offset=start+size;
 }
 assert.equal(b.readUInt32LE(offset),0x02014b50);
 return files;
}
async function importedProject(poster='assets/hero.png',socialImage='assets/social.png'){
 const editor=setup(),campaign=structuredClone(require('../../campaign.json'));
 campaign.assets=['unused','hero','social'].map(name=>({path:'assets/'+name+'.png',creator:name+' creator',sourceUrl:'',permission:name+' permission'}));
 campaign.poster=poster;campaign.socialImage=socialImage;campaign.siteUrl='https://example.com/';
 // Image is only simulated-decoded by the shared harness.
 const image=Uint8Array.from(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a9xkAAAAASUVORK5CYII=','base64'));
 const bytes=Zip.write({'campaign.json':JSON.stringify(campaign),...Object.fromEntries(campaign.assets.map(a=>[a.path,image]))});
 editor.ids.import.files=[{name:'fixture.zip',size:bytes.length,arrayBuffer:async()=>bytes.buffer}];
 await editor.ids.import.onchange.call(editor.ids.import);
 assert.equal(editor.ids.status.textContent,'Project opened. Your campaign text and images are ready to edit.');
 return {editor,campaign,image};
}
test('public export excludes unused image files and metadata while backup and editor retain originals',async()=>{
 const {editor:e,campaign,image}=await importedProject();
 await e.ids['download-website'].onclick();
 const files=websiteFiles(await e.downloads.at(-1).blob.arrayBuffer());
 assert.equal(e.downloads.at(-1).name,campaign.id+'-website.zip');
 assert.deepEqual(Object.keys(files).sort(),['assets/hero.png','assets/social.png','index.html','styles/site.css','scripts/site.js'].sort());
 assert.deepEqual(files['assets/hero.png'],Buffer.from(image));
 assert.deepEqual(files['assets/social.png'],Buffer.from(image));
 for(const name of ['index.html','scripts/site.js']){
  const text=files[name].toString();
  for(const absent of ['assets/unused.png','unused creator','unused permission'])assert(!text.includes(absent),name+' disclosed '+absent);
  assert(text.includes('assets/hero.png'));assert(text.includes('assets/social.png'));
 }
 await e.ids['download-project'].onclick();
 const backup=websiteFiles(await e.downloads.at(-1).blob.arrayBuffer());
 assert.deepEqual(JSON.parse(new TextDecoder().decode(backup['campaign.json'])),campaign);
 for(const asset of campaign.assets)assert.deepEqual(backup[asset.path],Buffer.from(image));
});
test('public export retains a social-only image and exports no unused images when references are empty',async()=>{
 for(const social of ['assets/social.png','']){
  const {campaign,image}=await importedProject('',social);
  const files=publicFiles(campaign,image);
  assert(!files['assets/unused.png']);assert(!files['assets/hero.png']);
  assert.equal(!!files['assets/social.png'],!!social);
  if(!social)assert(files['assets/']);
  const script=files['scripts/site.js'].toString();
  assert(!script.includes('assets/unused.png'));assert(!script.includes('assets/hero.png'));
 }
});

