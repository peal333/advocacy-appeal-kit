/* Shared file:// editor bundle builder. No network or dependencies. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),Kit=require('../src/core.js');
function readAssets(root,campaign){
 const assets=Object.create(null);const result=Kit.validate(campaign);if(result.errors.length)throw Error(result.errors.join('\n'));
 if(campaign.assets.length){const stat=fs.lstatSync(path.join(root,'assets'));if(!stat.isDirectory()||stat.isSymbolicLink())throw Error('Assets directory must not be a symlink.');}
 let total=0;
 for(const item of campaign.assets){const file=path.join(root,item.path),stat=fs.lstatSync(file);if(!stat.isFile()||stat.isSymbolicLink()||stat.size>Kit.MAX_IMAGE)throw Error('Unsafe or oversized image: '+item.path);total+=stat.size;if(total>19*1024*1024)throw Error('Project media exceeds 19 MiB.');assets[item.path]=fs.readFileSync(file);}
 return assets;
}
const Project=require('../src/project.js');
function readSources(root){
 const sources=Object.create(null);
 const stat=fs.lstatSync(root);if(!stat.isDirectory()||stat.isSymbolicLink())throw Error('Expected a directory, not a symlink: '+root);
 for(const name of [...Project.PROJECT_FILES,...Project.OPTIONAL_PROJECT_FILES].sort()){
  const file=path.join(root,name);let stat;try{stat=fs.lstatSync(file);}catch(error){if(error.code==='ENOENT'&&Project.OPTIONAL_PROJECT_FILES.includes(name))continue;throw error;}
  const parent=path.dirname(name);if(parent!=='.'){const d=fs.lstatSync(path.join(root,parent));if(!d.isDirectory()||d.isSymbolicLink())throw Error('Source directory must not be a symlink: '+parent);}
  if(!stat.isFile()||stat.isSymbolicLink()||stat.size>2*1024*1024)throw Error('Expected a regular source file, not a symlink or oversized file: '+name);
  sources[name]=new TextDecoder('utf-8',{fatal:true}).decode(fs.readFileSync(file));
 }
 return sources;
}
module.exports={bundle:Project.bundle,readAssets,readSources,template:Project.template};
