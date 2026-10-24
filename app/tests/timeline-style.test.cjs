'use strict';
// Source/layout-contract checks only; these are not browser visual verification.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const Kit=require('../src/core.js');
const css=fs.readFileSync(path.join(__dirname,'../src/site.css'),'utf8');

test('timeline uses accent lines and places sources under the description',()=>{
 assert.match(css,/\.timeline\{list-style:none;padding:0;margin:25px 0;display:grid;gap:18px\}/);
 assert.match(css,/\.timeline li\{[^}]*grid-template-columns:200px minmax\(0,1fr\)[^}]*border-left:3px solid var\(--accent,#245844\)[^}]*overflow-wrap:anywhere/);
 assert.match(css,/\.timeline li>p\{grid-column:2;grid-row:1;margin:0\}/);
 assert.match(css,/\.timeline li>a\{grid-column:2;grid-row:2;justify-self:start\}/);
 assert.match(css,/@media\(max-width:600px\)\{\.timeline li\{grid-template-columns:minmax\(0,1fr\);gap:5px\}\.timeline li>strong,\.timeline li>p,\.timeline li>a\{grid-column:1;grid-row:auto\}\}/);
});

test('timeline markup retains the date, description and source order needed by its layout',()=>{
 const c=structuredClone(require('../../campaign.json'));
 c.sources=[{id:'timeline-source',title:'Fictional record',url:'https://example.com/record',publisher:'Example',checked:'2026-01-01'}];
 c.timeline=[{date:'Example date',text:'Example timeline description',sourceId:'timeline-source'}];
 const html=Kit.html(c,'');
 assert.match(html,/<ol class="timeline"><li><strong>Example date<\/strong><p>Example timeline description<\/p><a [^>]*href="https:\/\/example.com\/record"[^>]*>Read source ↗<\/a><\/li><\/ol>/);
});

test('complete timeline dates use Month day, Year in legacy and optional bottom layouts without changing data',()=>{
 const c=structuredClone(require('../../campaign.json'));
 const cases=[['2026-10-23','October 23, 2026'],['2024-02-29','February 29, 2024'],['2000-02-29','February 29, 2000'],['2026-01-01','January 1, 2026'],['2026-12-31','December 31, 2026'],['0099-03-01','March 1, 0099']];
 c.timeline=cases.map(([date])=>({date,text:'Fictional event',sourceId:''}));
 const original=JSON.stringify(c.timeline);
 for(const display of [undefined,{timeline:{enabled:true,title:'Example dates'}}]){
  c.display=display;const html=Kit.render(c);
  for(const [,expected] of cases)assert(html.includes('<strong>'+expected+'</strong>'),expected);
  assert.equal(JSON.stringify(c.timeline),original);
  if(display)assert(html.indexOf('Example dates')>html.indexOf('recipient-picker'),'optional timeline remains below contacts');
 }
});

test('partial, approximate, malformed and invalid calendar timeline dates remain unchanged and escaped',()=>{
 const c=structuredClone(require('../../campaign.json'));
 const unchanged=['2026-10','2026','Early October 2026','2026-02-29','1900-02-29','2024-02-30','2026-04-31','2026-00-01','2026-13-01','2026-01-00','2026-01-32','2026-1-01','2026-01-01T00:00:00Z',' 2026-01-01','<Approximate & date>'];
 c.timeline=unchanged.map(date=>({date,text:'Fictional event',sourceId:''}));
 for(const display of [undefined,{timeline:{enabled:true}}]){
  c.display=display;const html=Kit.render(c);
  for(const value of unchanged)assert(html.includes('<strong>'+Kit.esc(value)+'</strong>'),value);
 }
});

test('timeline full-date formatting is identical across positive and negative local time zones',()=>{
 const {execFileSync}=require('node:child_process');
 const source=`const Kit=require(${JSON.stringify(path.join(__dirname,'../src/core.js'))});const c=require(${JSON.stringify(path.join(__dirname,'../../campaign.json'))});c.timeline=[{date:'2026-01-01',text:'Example',sourceId:''},{date:'2024-02-29',text:'Example',sourceId:''}];process.stdout.write(Kit.render(c));`;
 const outputs=['UTC','America/Los_Angeles','Pacific/Kiritimati'].map(TZ=>execFileSync(process.execPath,['-e',source],{env:{...process.env,TZ},encoding:'utf8'}));
 assert(outputs.every(html=>html===outputs[0]));
 assert(outputs[0].includes('<strong>January 1, 2026</strong>'));
 assert(outputs[0].includes('<strong>February 29, 2024</strong>'));
});
