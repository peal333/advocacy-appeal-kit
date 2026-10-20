/* AI/maintainer-only, dependency-free export. Never sends or publishes. */
'use strict';
const fs=require('node:fs'),path=require('node:path');
const Kit=require('../src/core.js'),Zip=require('../src/archive.js');
const {readSources}=require('./project-bundle.cjs');
const Project=require('../src/project.js');
const toolkit=path.resolve(__dirname,'../..');
function fail(message){throw Error(message);}
function regular(file,max){
 const stat=fs.lstatSync(file);
 if(!stat.isFile()||stat.isSymbolicLink())fail('Expected a regular file, not a symlink: '+file);
 if(stat.size>max)fail('File exceeds size limit: '+file);
 return fs.readFileSync(file);
}
function directory(dir){const stat=fs.lstatSync(dir);if(!stat.isDirectory()||stat.isSymbolicLink())fail('Expected a directory, not a symlink: '+dir);}
function projectRoot(input){
 directory(input);
 if(fs.existsSync(path.join(input,'campaign.json')))return input;
 // A GitHub source ZIP normally adds one containing directory. Never recurse arbitrarily.
 const entries=fs.readdirSync(input);
 if(entries.length===1){const child=path.join(input,entries[0]);directory(child);if(fs.existsSync(path.join(child,'campaign.json')))return child;}
 fail('Choose the extracted project folder containing campaign.json (or its single wrapper folder).');
}
function json(bytes){return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}
function validate(c,assets){const result=Kit.validate(c,assets);if(result.errors.length)fail(result.errors.join('\n'));return result;}
function image(bytes,name){
 if(bytes.length>Kit.MAX_IMAGE)fail('Image exceeds 5 MiB: '+name);
 const png=bytes.length>=8&&[137,80,78,71,13,10,26,10].every((x,i)=>bytes[i]===x);
 const jpg=bytes.length>=3&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
 const webp=bytes.length>=12&&Buffer.from(bytes.subarray(0,4)).toString()==='RIFF'&&Buffer.from(bytes.subarray(8,12)).toString()==='WEBP';
 if(!((/\.png$/i.test(name)&&png)||(/\.jpe?g$/i.test(name)&&jpg)||(/\.webp$/i.test(name)&&webp)))fail('Image content does not match extension: '+name);
 // Header checks are not decoding. The report requires browser image review.
}
function load(input){
 input=path.resolve(input);let c,assets=Object.create(null);
 if(fs.lstatSync(input).isDirectory()){
  const root=projectRoot(input);c=json(regular(path.join(root,'campaign.json'),1024*1024));validate(c);
  if(c.assets.length)directory(path.join(root,'assets'));
  let total=0;
  for(const a of c.assets){assets[a.path]=regular(path.join(root,a.path),Kit.MAX_IMAGE);total+=assets[a.path].length;if(total>19*1024*1024)fail('Project media exceeds 19 MiB.');}
 }else{
  const files=Zip.read(regular(input,Kit.MAX));c=json(files['campaign.json']);validate(c);
  const listed=new Set(c.assets.map(a=>a.path));
  for(const [name,bytes] of Object.entries(files))if(name!=='campaign.json'){if(!listed.has(name))fail('Unlisted image in backup: '+name);assets[name]=bytes;}
 }
 if(Object.values(assets).reduce((n,b)=>n+b.length,0)>19*1024*1024)fail('Project media exceeds 19 MiB.');
 const result=validate(c,assets);for(const [name,bytes] of Object.entries(assets))image(bytes,name);
 return {campaign:c,assets,warnings:result.warnings};
}
// Explicit distributable inventory: never glob the workspace, source media or old outputs.
const {PROJECT_FILES,OPTIONAL_PROJECT_FILES,PROJECT_MAX}=Project;
function projectFiles(c,assets,css,source=toolkit){return Project.projectFiles(c,assets,css,readSources(source));}
function generate(input){
 const {campaign:c,assets,warnings}=load(input),css=fs.readFileSync(path.join(toolkit,'app/src/site.css'),'utf8');
 const site=Project.websiteFiles(c,assets,css);
 const backup={...assets,'campaign.json':JSON.stringify(c,null,2)};
 const website=Zip.write(site),editable=Zip.write(backup);
 const project=Zip.write(projectFiles(c,assets,css));if(project.length>PROJECT_MAX)fail('Portable project ZIP exceeds 50 MiB.');
 if(website.length>Kit.MAX||editable.length>Kit.MAX)fail('ZIP exceeds 20 MiB; remove images or shorten content.');
 // Exercise the actual importer format before returning any deliverable.
 const restored=Zip.read(editable);validate(json(restored['campaign.json']),restored);
 const report=[
  '# Export review: '+c.id,'','These are draft files, not an approved or published campaign.',
  '','## Automated checks completed',
  '- Shared schema/semantic validator; safe asset paths, file sizes and matching image signatures.',
  '- Shared website renderer and ZIP writer; editable backup read back through the shared ZIP reader.',
  '- Public website includes only poster/socialImage asset records and files; backup retains every listed image.',
  '','## Human checks still required',
  '- Approve the copy, facts, quotations, public recipients, source checks/dates, consent and image permissions.',
  '- Inspect every public field and image metadata. Included image bytes are unchanged; other campaign fields are public.',
  '- Open the backup in editor.html and inspect Visitor preview. Node checks image headers, not decoding or the browser’s 40-megapixel limit.',
  '- Extract the website ZIP and inspect index.html, images, layout, links and visitor-controlled email/copy behavior.',
  '- No browser, factual verification, delivery, deployment or publication has been performed by this command.',
  '','## Validator warnings',...warnings.map(w=>'- '+w),'',
  '## Files',`- ${c.id}-project.zip: MAIN reusable project. Reupload this to an assistant, or extract and open editor.html. Includes toolkit, campaign, all media and refreshed checksums. Never publish this ZIP.`,
  `- ${c.id}-website.zip: public hosting upload; index.html is at the root.`,
  `- ${c.id}-editable-backup.zip: private editing handoff; contains campaign.json and ALL listed media. Do not publish it.`,
  '- This review file is separate from the ZIPs. It does not certify that the campaign is ready to publish.',''
 ].join('\n');
 return {id:c.id,website,editable,project,report};
}
function main(args){
 if(args.length!==2)fail('Usage: node app/tools/export-campaign.cjs <project-directory-or-editable-backup.zip> <NEW-output-directory>');
 const result=generate(args[0]),out=path.resolve(args[1]);
 // Exclusive creation owns only this new directory. Roll back our own writes on any failure.
 fs.mkdirSync(out);const created=[];
 const write=(name,bytes)=>{const file=path.join(out,name),fd=fs.openSync(file,'wx');created.push(file);try{fs.writeFileSync(fd,bytes);}finally{fs.closeSync(fd);}};
 try{
  write(result.id+'-project.zip',result.project);
  write(result.id+'-website.zip',result.website);
  write(result.id+'-editable-backup.zip',result.editable);
  write('REVIEW.md',result.report);
 }catch(error){
  for(const file of created){
   try{fs.unlinkSync(file);}catch(cleanup){if(cleanup.code!=='ENOENT')error.message+='; cleanup failed: '+cleanup.message;}
  }
  try{fs.rmdirSync(out);}catch(cleanup){error.message+='; output directory cleanup failed: '+cleanup.message;}
  throw error;
 }
 console.log('Created reusable project ZIP, draft website ZIP, editable backup ZIP and REVIEW.md in '+out+'. Human review is required; nothing was published.');
}
if(require.main===module){try{main(process.argv.slice(2));}catch(error){console.error('Export failed: '+error.message);process.exitCode=1;}}
module.exports={load,generate,main,projectRoot,projectFiles,PROJECT_FILES,OPTIONAL_PROJECT_FILES,PROJECT_MAX};
