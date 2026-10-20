/* Maintainer-only rebuild. Organizers open editor.html directly. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),root=path.resolve(__dirname,'..');
const {bundle,readAssets,readSources,template}=require('./project-bundle.cjs');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const campaign=JSON.parse(read('campaign.json')),schema=JSON.parse(read('campaign.schema.json'));
fs.writeFileSync(path.join(root,'src/schema.js'),'/* Generated from campaign.schema.json. */\n(function(r){r.KitSchema='+JSON.stringify(schema)+';if(typeof module!=="undefined")module.exports=r.KitSchema;})(globalThis);\n');
fs.writeFileSync(path.join(root,'setup/bundle.js'),bundle(campaign,read('src/site.css'),readAssets(root,campaign)));
fs.writeFileSync(path.join(root,'setup/project-template.js'),template(readSources(root)));
const site=require('../src/project.js').websiteFiles(campaign,readAssets(root,campaign),read('src/site.css'));
for(const [name,value] of Object.entries(site)){if(name.endsWith('/')){fs.mkdirSync(path.join(root,name),{recursive:true});continue;}fs.mkdirSync(path.dirname(path.join(root,name)),{recursive:true});fs.writeFileSync(path.join(root,name),value);}
console.log('Rebuilt root website, local editor bundle, source template and schema. No dependencies or network required.');
