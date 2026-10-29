'use strict';
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
const {merge}=require('./pages-channels.cjs'),{validate}=require('./stable-version.cjs');
const files=[...require('./public-assets.cjs').publicFiles,...require('./public-assets.cjs').publicDocuments,'.nojekyll'];
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'jw3-channels-')),source=path.join(tmp,'source'),target=path.join(tmp,'target');
try{
 fs.mkdirSync(target);for(const f of files){fs.mkdirSync(path.dirname(path.join(source,f)),{recursive:true});fs.writeFileSync(path.join(source,f),'old');}
 merge(source,target,'main','a'.repeat(40),'0.2.0');
 for(const f of files)fs.writeFileSync(path.join(source,f),'dev');
 merge(source,target,'dev','b'.repeat(40),'0.2.0');
 for(const f of files){assert.equal(fs.readFileSync(path.join(target,f),'utf8'),'old');assert.equal(fs.readFileSync(path.join(target,'dev',f),'utf8'),'dev');}
 for(const f of files)fs.writeFileSync(path.join(source,f),'stable');
 merge(source,target,'main','c'.repeat(40),'0.3.0');
 for(const f of files){assert.equal(fs.readFileSync(path.join(target,f),'utf8'),'stable');assert.equal(fs.readFileSync(path.join(target,'dev',f),'utf8'),'dev');}
 assert.throws(()=>merge(source,target,'feature','a'.repeat(40),'1.0.0'));
 fs.writeFileSync(path.join(source,'private.json'),'secret');assert.throws(()=>merge(source,target,'dev','a'.repeat(40),'1.0.0'));fs.unlinkSync(path.join(source,'private.json'));
 fs.writeFileSync(path.join(target,'private.json'),'secret');assert.throws(()=>merge(source,target,'dev','a'.repeat(40),'1.0.0'));
 validate('0.3.0','0.2.0','## [0.3.0]\n- Release notes');
 for(const [v,notes]of [['0.2.0','- no bump'],['0.2.1','## [0.2.1]\n- patch'],['0.3.0','## [0.3.0]']])assert.throws(()=>validate(v,'0.2.0',notes));
 console.log('PASS Pages channels: dev preserves main bytes, main preserves dev bytes, private files rejected; main requires version upgrade and changelog.');
}finally{fs.rmSync(tmp,{recursive:true,force:true});}
