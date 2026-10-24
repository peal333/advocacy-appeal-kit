'use strict';
// Render/source contracts, not browser visual verification.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const Kit=require('../src/core.js');
const css=fs.readFileSync(require('node:path').join(__dirname,'../src/site.css'),'utf8');
function campaign(){const c=structuredClone(require('../../campaign.json'));c.siteUrl='https://example.com/campaign?x=1&y=2';c.display={...(c.display||{}),sharing:true,shareText:'Example & support'};return c;}
test('five inline share icons have accessible labels and decorative SVGs',()=>{
 const html=Kit.html(campaign(),'');const nav=html.match(/<nav class="share-tools"[\s\S]*?<\/nav>/)[0];
 assert.equal((nav.match(/<svg /g)||[]).length,5);
 assert.equal((nav.match(/aria-hidden="true" focusable="false"/g)||[]).length,5);
 for(const label of ['Copy link','Share on WhatsApp','Share on Facebook','Share on X','More sharing options'])assert.ok(nav.includes(`aria-label="${label}" title="${label}"`));
 assert.match(nav,/id="share-native"[^>]* hidden>/);
 assert.match(nav,/id="share-copy"/);assert.match(nav,/id="share-status" role="status"/);
 assert.match(nav,/https:\/\/wa.me\/\?text=Example%20%26%20support%20https%3A%2F%2Fexample.com/);
 assert.equal((nav.match(/rel="noopener noreferrer"/g)||[]).length,3);
});
test('sharing remains optional and requires a safe published URL',()=>{
 const c=campaign();c.display.sharing=false;assert.ok(!Kit.html(c,'').includes('class="share-tools"'));
 c.display.sharing=true;c.siteUrl='javascript:alert(1)';assert.ok(!Kit.render(c).includes('class="share-tools"'));
});
test('compact timer and icon hit-area contracts preserve hidden native control',()=>{
 assert.match(css,/\.share-tools \.share-icon\{width:44px;min-width:44px;height:44px;min-height:44px/);
 assert.match(css,/\.share-tools \.share-icon\[hidden\]\{display:none\}/);
 assert.match(css,/#header-countdown\{font-size:1rem;line-height:1.35\}/);
 assert.match(css,/\.share-tools \.share-icon:focus-visible\{outline:3px/);
});
