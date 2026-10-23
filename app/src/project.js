/* Canonical portable-project packaging, shared by browser and CLI. No network. */
(function(root){'use strict';
const enc=new TextEncoder();
const PROJECT_FILES=[
 'AGENTS.md','CONTRIBUTING.md','README.md','SECURITY.md',
 'prompts/README.md','prompts/BRISTOL_COMMUNITY_CLEANUP.md','prompts/GUIDED_WORKFLOW.md','prompts/GUIDED_UPDATE_WORKFLOW.md','prompts/ALL_FEATURES_DEMO.md',
 'campaign.schema.json','editor.html','app/setup/editor.css','app/setup/editor.js','app/setup/index.html','app/setup/visual.js',
 'app/src/archive.js','app/src/core.js','app/src/project.js','app/src/site.css',
 'app/tests/TEST-REPORT.md','app/tests/ai-export.test.cjs','app/tests/core.test.cjs','app/tests/editor-integration.test.cjs',
 'app/tests/project-save.test.cjs','app/tests/public-export.test.cjs','app/tests/recipient-cards.test.cjs','app/tests/revision-data.test.cjs','app/tests/revision-review.test.cjs','app/tests/visual-review.test.cjs',
 'app/tools/build.cjs','app/tools/check-release.cjs','app/tools/export-campaign.cjs','app/tools/project-bundle.cjs',
 'app/workflow/ai.md','app/workflow/campaign-format.md','app/workflow/manual.md','app/workflow/publish-cloudflare.md',
 'app/workflow/release-checklist.md','app/workflow/release-verification.md','app/workflow/review-and-recovery.md','app/workflow/verification.md'
];
const OPTIONAL_PROJECT_FILES=['LICENSE','LICENSE.md','LICENSE.txt','NOTICE','NOTICE.md','NOTICE.txt','COPYING','COPYING.md','COPYING.txt'];
const PROJECT_MAX=50*1024*1024;

function bytes(value){return typeof value==='string'?enc.encode(value):new Uint8Array(value);}
function base64(value){let text='';const b=bytes(value);for(let i=0;i<b.length;i+=16384)text+=String.fromCharCode(...b.subarray(i,i+16384));return btoa(text);}
function bundle(campaign,css,assets){
 const data={campaign,css};
 if(campaign.assets.length)data.assets=Object.fromEntries(campaign.assets.map(a=>{if(!assets[a.path])throw Error('Missing image: '+a.path);return[a.path,base64(assets[a.path])];}));
 return '/* Local data and stylesheet bundle. No network or fetch required. */\nwindow.KitBundle = '+JSON.stringify(data)+';\n';
}
function template(sources){return '/* Generated distributable source inventory. Excludes this generated file and campaign/media bundle. */\nwindow.KitProjectSources = '+JSON.stringify(sources)+';\n';}
// SHA-256 works offline on file:// even where Web Crypto is unavailable.
function sha256(value){
 const b=bytes(value),length=Math.ceil((b.length+9)/64)*64,data=new Uint8Array(length);data.set(b);data[b.length]=128;
 const view=new DataView(data.buffer);view.setUint32(length-8,Math.floor(b.length/0x20000000));view.setUint32(length-4,(b.length*8)>>>0);
 const k=[0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
 const h=[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19],w=new Uint32Array(64),r=(v,n)=>(v>>>n)|(v<<(32-n));
 for(let offset=0;offset<length;offset+=64){
  for(let i=0;i<16;i++)w[i]=view.getUint32(offset+i*4);
  for(let i=16;i<64;i++){const x=w[i-15],y=w[i-2];w[i]=(w[i-16]+(r(x,7)^r(x,18)^(x>>>3))+w[i-7]+(r(y,17)^r(y,19)^(y>>>10)))>>>0;}
  let [a,b,c,d,e,f,g,j]=h;
  for(let i=0;i<64;i++){const t1=(j+(r(e,6)^r(e,11)^r(e,25))+((e&f)^(~e&g))+k[i]+w[i])>>>0,t2=((r(a,2)^r(a,13)^r(a,22))+((a&b)^(a&c)^(b&c)))>>>0;j=g;g=f;f=e;e=(d+t1)>>>0;d=c;c=b;b=a;a=(t1+t2)>>>0;}
  [a,b,c,d,e,f,g,j].forEach((v,i)=>h[i]=(h[i]+v)>>>0);
 }
 return h.map(v=>v.toString(16).padStart(8,'0')).join('');
}
function websiteFiles(c,assets,css){
 const kit=root.Kit||(typeof require!=='undefined'?require('./core.js'):null);
 const publicCampaign=JSON.parse(JSON.stringify(c)),used=new Set([c.poster,c.socialImage].filter(Boolean));
 publicCampaign.assets=publicCampaign.assets.filter(a=>used.has(a.path));
 const files=Object.fromEntries(publicCampaign.assets.map(a=>[a.path,assets[a.path]]));
 if(!Object.keys(files).length)files['assets/']=new Uint8Array();
 files['index.html']=kit.html(publicCampaign,css);files['styles/site.css']=css;files['scripts/site.js']=kit.script(publicCampaign);
 return files;
}
function projectFiles(c,assets,css,sources){
 const files=Object.create(null),clean=Object.create(null),allowed=new Set([...PROJECT_FILES,...OPTIONAL_PROJECT_FILES]);
 for(const name of PROJECT_FILES)if(typeof sources[name]!=='string')throw Error('Missing project source: '+name);
 for(const name of Object.keys(sources).sort()){
  if(!allowed.has(name))throw Error('Unlisted project source: '+name);
  if(typeof sources[name]!=='string'||bytes(sources[name]).length>2*1024*1024)throw Error('Invalid project source: '+name);
  files[name]=clean[name]=sources[name];
 }
 const kit=root.Kit||(typeof require!=='undefined'?require('./core.js'):null),check=kit.validate(c,assets);if(check.errors.length)throw Error(check.errors.join('\n'));
 if(bytes(JSON.stringify(c)).length>1024*1024)throw Error('Campaign JSON exceeds 1 MiB.');
 let mediaSize=0;for(const a of c.assets){const b=bytes(assets[a.path]);mediaSize+=b.length;if(b.length>kit.MAX_IMAGE)throw Error('Image exceeds 5 MiB: '+a.path);files[a.path]=b;}if(mediaSize>19*1024*1024)throw Error('Project media exceeds 19 MiB.');
 // The root is the current cause website; full media remains in this private toolkit.
 const website=websiteFiles(c,assets,css);delete website['assets/'];Object.assign(files,website);
 files['campaign.json']=JSON.stringify(c,null,2);
 if(bytes(files['campaign.json']).length>1024*1024)throw Error('Campaign JSON exceeds 1 MiB.');
 files['app/setup/bundle.js']=bundle(c,css,assets);
 files['app/setup/project-template.js']=template(clean);
 const schema=JSON.parse(files['campaign.schema.json']);
 files['app/src/schema.js']='/* Generated from campaign.schema.json. */\n(function(r){r.KitSchema='+JSON.stringify(schema)+';if(typeof module!=="undefined")module.exports=r.KitSchema;})(globalThis);\n';
 if(Object.values(files).reduce((n,value)=>n+bytes(value).length,0)>PROJECT_MAX)throw Error('Portable project contents exceed 50 MiB.');
 files.SHA256SUMS=Object.keys(files).sort().map(name=>sha256(files[name])+'  ./'+name).join('\n')+'\n';
 if(Object.values(files).reduce((n,value)=>n+bytes(value).length,0)>PROJECT_MAX)throw Error('Portable project contents exceed 50 MiB.');
 return files;
}
root.KitProject={PROJECT_FILES,OPTIONAL_PROJECT_FILES,PROJECT_MAX,bundle,template,websiteFiles,projectFiles,sha256};if(typeof module!=='undefined')module.exports=root.KitProject;
})(globalThis);

