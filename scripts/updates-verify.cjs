'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {validate,hash,createUpdater}=require('../desktop/updater.cjs');
(async()=>{
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'jw3-updates-'));
 function fixture(id,channel='dev',protocol=1){const files=new Map(['index.html','version.js','app.js','update.js'].map(name=>[name,Buffer.from(name+id)]));return {files,manifest:{id:id.repeat(64),version:'0.2.1',channel,sourceCommit:'a'.repeat(40),protocol,files:[...files].map(([name,b])=>({name,bytes:b.length,sha256:hash(b)}))}};}
 try{
  const a=fixture('a'),b=fixture('b'),root=path.join(tmp,'bundled'),dir=path.join(tmp,'updates');fs.mkdirSync(root);
  for(const [name,bytes]of a.files)fs.writeFileSync(path.join(root,name),bytes);fs.writeFileSync(path.join(root,'update-manifest.json'),JSON.stringify(a.manifest));
  let incoming=b,corrupt=false,offline=false;const requested=[];
  const read=async url=>{requested.push(url);assert(url.startsWith('https://cherishxie.github.io/JW3-Work-Pages/dev/'));if(offline)throw Error('offline');const name=new URL(url).pathname.split('/').pop();return name==='update-manifest.json'?Buffer.from(JSON.stringify(incoming.manifest)):corrupt?Buffer.from('tampered'):incoming.files.get(name);};
  const make=()=>createUpdater({directory:dir,bundledRoot:root,read});let updater=make();assert.equal((await updater.check()).id,b.manifest.id);assert.equal(updater.current().manifest.id,a.manifest.id);
  corrupt=true;await assert.rejects(updater.prepare(),/校验/);assert.equal(updater.current().manifest.id,a.manifest.id);assert(!fs.existsSync(path.join(dir,'active.json')));assert(!fs.existsSync(path.join(dir,b.manifest.id+'.partial')));
  corrupt=false;offline=true;await assert.rejects(updater.check(),/offline/);assert.equal(updater.current().root,root);offline=false;
  for(const name of ['../main.cjs','data/private.json','https://evil.test/app.js','vendor/../../app.js','main.cjs']){const m=structuredClone(b.manifest);m.files[0].name=name;assert.throws(()=>validate(m,'dev'));}
  const duplicate=structuredClone(b.manifest);duplicate.files.push(duplicate.files[0]);assert.throws(()=>validate(duplicate,'dev'));assert.throws(()=>validate(b.manifest,'main'));
  incoming=fixture('c','dev',2);await assert.rejects(updater.prepare(),/安装包/);incoming=b;
  await updater.prepare();assert.equal(updater.current().manifest.id,a.manifest.id);updater.activate();assert.equal(updater.current().manifest.id,b.manifest.id);
  // A crash before the renderer reports ready falls back on the next launch.
  updater=make();assert.equal(updater.current().manifest.id,a.manifest.id);
  await updater.prepare();updater.activate();updater.ready();updater=make();assert.equal(updater.current().manifest.id,b.manifest.id);
  incoming=fixture('c');await updater.prepare();updater.activate();assert.equal(updater.rollback().manifest.id,b.manifest.id);
  fs.writeFileSync(path.join(dir,b.manifest.id,'app.js'),'corrupt local cache');assert.equal(make().current().manifest.id,a.manifest.id);
  assert(requested.every(url=>!url.includes('data/')));
  console.log('PASS updates: channel isolation, GET-only fixed origin, path/size/hash rejection, offline preservation, staged activation, crash and corruption rollback, persistent successful update.');
 }finally{fs.rmSync(tmp,{recursive:true,force:true});}
})().catch(error=>{console.error(error);process.exitCode=1;});
