/* Maintainer-only local checks. No network, archive creation or publication. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {bundle,readAssets,readSources,template}=require('./project-bundle.cjs');
const root=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
function walk(dir=''){
 return fs.readdirSync(path.join(root,dir)).sort().flatMap(name=>{
  if(name==='.git')return [];
  check(!name.startsWith('.'),'Review unexpected hidden entry: '+(dir?dir+'/':'')+name);
  const relative=dir?dir+'/'+name:name,stat=fs.lstatSync(path.join(root,relative));
  if(stat.isSymbolicLink())throw Error('Review unexpected symlink: '+relative);
  return stat.isDirectory()?walk(relative):[relative];
 });
}
function check(condition,message){if(!condition)throw Error(message);}
const files=walk().filter(name=>name!=='SHA256SUMS');
const campaign=JSON.parse(read('campaign.json')),schema=JSON.parse(read('campaign.schema.json'));
check(read('setup/bundle.js')===bundle(campaign,read('src/site.css'),readAssets(root,campaign)),'Generated bundle drift: run node tools/build.cjs');
check(read('src/schema.js')==='/* Generated from campaign.schema.json. */\n(function(r){r.KitSchema='+JSON.stringify(schema)+';if(typeof module!=="undefined")module.exports=r.KitSchema;})(globalThis);\n','Generated schema drift: run node tools/build.cjs');
check(read('setup/project-template.js')===template(readSources(root)),'Generated project template drift: run node tools/build.cjs');
const site=require('../src/project.js').websiteFiles(campaign,readAssets(root,campaign),read('src/site.css'));
for(const [name,value] of Object.entries(site))if(!name.endsWith('/'))check(Buffer.from(value).equals(fs.readFileSync(path.join(root,name))),'Generated website drift: '+name+'; run node tools/build.cjs');
const inventory=new Set([...require('../src/project.js').PROJECT_FILES,...require('../src/project.js').OPTIONAL_PROJECT_FILES,'campaign.json','src/schema.js','setup/bundle.js','setup/project-template.js',...Object.keys(site),...campaign.assets.map(a=>a.path)]);
for(const name of files)check(inventory.has(name),'Unlisted distributable file: '+name);
let references=0;
for(const name of files.filter(name=>name.endsWith('.md')||['setup/index.html','editor.html','index.html'].includes(name))){
 const text=read(name),pattern=name.endsWith('.md')?/\[[^\]]*\]\(([^\s)]+)(?:\s+"[^"]*")?\)/g:/(?:src|href)=["']([^"']+)["']/g;
 for(const match of text.matchAll(pattern)){
  const target=match[1];if(/^[a-z][a-z\d+.-]*:/i.test(target)||target.startsWith('#'))continue;
  const local=decodeURIComponent(target.split(/[?#]/)[0]),resolved=path.resolve(root,path.dirname(name),local);
  check(resolved.startsWith(root+path.sep),'Reference escapes toolkit: '+name+' -> '+target);
  check(fs.existsSync(resolved),'Missing local reference: '+name+' -> '+target);references++;
 }
}
const manifest=files.map(name=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,name))).digest('hex')+'  ./'+name).join('\n')+'\n';
check(process.argv.slice(2).every(arg=>arg==='--write-checksums'),'Only supported option: --write-checksums');
if(process.argv.includes('--write-checksums')){
 fs.writeFileSync(path.join(root,'SHA256SUMS'),manifest);
 console.log('Wrote SHA256SUMS for '+files.length+' files (excluding itself). Review inventory before packaging.');
}else check(read('SHA256SUMS')===manifest,'Checksum content or inventory differs. Review changes, then run with --write-checksums.');
console.log('PASS: generated files, '+references+' local references, '+files.length+' checksums. External URLs, Markdown anchors, privacy, licensing and browser behavior are not checked.');
