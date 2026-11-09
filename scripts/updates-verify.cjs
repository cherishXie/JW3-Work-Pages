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
  // New shells accept their bundled protocol; old resource snapshots cannot override it.
  const root2=path.join(tmp,'bundled2'),dir2=path.join(tmp,'updates2'),base2=fixture('d','dev',2);fs.mkdirSync(root2);
  for(const [name,bytes]of base2.files)fs.writeFileSync(path.join(root2,name),bytes);fs.writeFileSync(path.join(root2,'update-manifest.json'),JSON.stringify(base2.manifest));
  incoming=fixture('e','dev',2);const nextShell=createUpdater({directory:dir2,bundledRoot:root2,read});await nextShell.prepare();nextShell.activate();nextShell.ready();assert.equal(createUpdater({directory:dir2,bundledRoot:root2,read}).current().manifest.id,incoming.manifest.id);
  incoming=fixture('f','dev',1);await assert.rejects(nextShell.prepare(),/安装包/);
  assert(requested.every(url=>!url.includes('data/')));
  console.log('PASS updates: channel isolation, GET-only fixed origin, path/size/hash rejection, offline preservation, staged activation, crash and corruption rollback, persistent successful update.');
 }finally{fs.rmSync(tmp,{recursive:true,force:true});}
})().catch(error=>{console.error(error);process.exitCode=1;});

{
 const {releaseNotes,generate}=require('./update-build.cjs'),cp=require('node:child_process');
 const text='## [未发布]\n- 开发改进\n\n## [0.6.0]\n- 正式改进\n\n## [0.5.0]\n- 旧内容\n';
 const added=text.replace('- 开发改进','- 修复任务保存\n- 开发改进'),context={previousMarkdown:text,summary:'调整副本目录颜色'};
 assert.deepEqual(releaseNotes(added,'dev','0.6.0-dev.2',context),{title:'本次更新',items:['修复任务保存']});
 assert.deepEqual(releaseNotes(text,'dev','0.6.0-dev.3',context).items,['调整副本目录颜色']);
 assert.deepEqual(releaseNotes(text.replace('开发改进','修订开发说明'),'dev','0.6.0-dev.4',context).items,['修订开发说明']);
 assert.deepEqual(releaseNotes(text.replace('- 开发改进',''),'dev','0.6.0-dev.5',context).items,['调整副本目录颜色']);
 assert.deepEqual(releaseNotes(text,'dev','0.6.0-dev.1',{summary:'首个构建'}).items,['首个构建']);
 assert.deepEqual(releaseNotes(text,'dev','0.6.0-dev.1').items,[]);
 assert.deepEqual(releaseNotes(text,'main','0.6.0',context),{title:'0.6.0',items:['正式改进']});
 assert.deepEqual(releaseNotes(text,'main','0.7.0',context).items,[]);
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'jw3-update-notes-')),out=path.join(tmp,'build'),envNames=['GITHUB_REF_NAME','GITHUB_SHA','GITHUB_RUN_NUMBER'],saved=Object.fromEntries(envNames.map(k=>[k,process.env[k]]));
 const git=args=>cp.execFileSync('git',args,{cwd:tmp,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
 const commit=summary=>{git(['add','CHANGELOG.md']);git(['-c','user.name=Update test','-c','user.email=qa@example.invalid','-c','commit.gpgsign=false','-c','core.hooksPath=/dev/null','commit','--allow-empty','-m',summary]);process.env.GITHUB_SHA=git(['rev-parse','HEAD']);};
 try{
  git(['init','-b','dev']);fs.mkdirSync(out);fs.writeFileSync(path.join(tmp,'package.json'),JSON.stringify({version:'0.6.0'}));fs.writeFileSync(path.join(tmp,'pwa-worker.js'),'/* synthetic worker */');fs.writeFileSync(path.join(out,'app.js'),'/* synthetic public source */');fs.writeFileSync(path.join(tmp,'CHANGELOG.md'),text);
  process.env.GITHUB_REF_NAME='dev';process.env.GITHUB_RUN_NUMBER='1';commit('首次构建说明');
  assert.deepEqual(generate(tmp,out,['app.js']).releaseNotes.items,['首次构建说明']);
  commit('修正目录主题颜色');assert.deepEqual(generate(tmp,out,['app.js']).releaseNotes.items,['修正目录主题颜色']);
  fs.writeFileSync(path.join(tmp,'CHANGELOG.md'),added);commit('修复更新文案生成');const meta=generate(tmp,out,['app.js']);
  assert.deepEqual(meta.releaseNotes.items,['修复任务保存']);assert.deepEqual(generate(tmp,out,['app.js']).releaseNotes,meta.releaseNotes);
  const manifest=JSON.parse(fs.readFileSync(path.join(out,'update-manifest.json')));assert.deepEqual(manifest.releaseNotes,meta.releaseNotes);assert(fs.readFileSync(path.join(out,'version.js'),'utf8').includes(JSON.stringify(meta.releaseNotes)));assert(fs.readFileSync(path.join(out,'sw.js'),'utf8').includes(JSON.stringify(meta.releaseNotes)));
 }finally{for(const name of envNames)if(saved[name]===undefined)delete process.env[name];else process.env[name]=saved[name];fs.rmSync(tmp,{recursive:true,force:true});}
 console.log('PASS update notes: per-commit changelog delta, revised/removed/unchanged notes, commit-summary fallback, missing history, reproducible builds, manifest/version/worker consistency and main version isolation.');
}
