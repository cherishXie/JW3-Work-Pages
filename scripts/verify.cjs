'use strict';
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
for(const file of require('./public-assets.cjs').publicFiles.filter(f=>f.endsWith('.js')&&!f.startsWith('vendor/')&&!require('./public-assets.cjs').generatedFiles.includes(f)))new vm.Script(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),{filename:file});
const results=require('../verification.js').run();
for(const r of results)console.log(`${r.pass?'PASS':'FAIL'} ${r.id} ${r.name}${r.error?' — '+r.error:''}`);
if(results.some(r=>!r.pass))process.exitCode=1;
for(const test of ['storage-verify','desktop-verify','desktop-release-verify','screenshot-ocr-loader-verify','pages-channels-verify','updates-verify'])require('./'+test+'.cjs');

require('./check-public-source.cjs');
