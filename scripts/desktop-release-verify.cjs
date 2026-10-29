'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const R=require('./desktop-release.cjs'),{publish}=require('./publish-desktop-release.cjs');
const directory=fs.mkdtempSync(path.join(os.tmpdir(),'jw3-release-test-'));
const version='0.2.0',electron='45.0.0',sha='a'.repeat(40),repository='cherishXie/JW3-Work-Pages',publicSha='c'.repeat(40);
const meta=R.metadata({version,ref:'refs/heads/dev',sha,runNumber:'12'});
function fixture(){
  for(const name of fs.readdirSync(directory))fs.rmSync(path.join(directory,name),{recursive:true,force:true});
  for(const target of R.TARGETS){
    const artifacts=R.artifactNames(version,target).map((name,i)=>{const bytes=Buffer.alloc(1024*1024+1,i+1);fs.writeFileSync(path.join(directory,name),bytes);return {name,bytes:bytes.length,sha256:R.hash(bytes)};});
    fs.writeFileSync(path.join(directory,`BUILD-INFO-${target}.json`),JSON.stringify({version,electron,target,sourceCommit:sha,signed:false,cloudSync:false,artifacts}));
    fs.writeFileSync(path.join(directory,`SHA256SUMS-${target}.txt`),artifacts.map(a=>a.sha256+'  '+a.name).join('\n')+'\n');
  }
}
function fake(options={}){
  const calls=[];let release=options.release||null;
  return {calls,get release(){return release;},run(args){
    calls.push(args);
    if(args[0]==='api'&&args[1]==='repos/'+repository)return JSON.stringify({private:options.private===true});
    if(args[0]==='api'&&args[1]===`repos/${repository}/commits/${publicSha}`)return JSON.stringify({sha:options.badCommit?'d'.repeat(40):publicSha});
    if(args[0]==='release'&&args[1]==='view'){if(!release)throw new Error('release not found');return JSON.stringify({apiUrl:options.apiUrl||`https://api.github.com/repos/${repository}/releases/1`});}
    if(args[0]==='api'&&args[1].includes('/releases/tags/'))throw new Error('HTTP 404: drafts are not available by tag');
    if(args[0]==='api'){if(!release)throw new Error('HTTP 404');return JSON.stringify(release);}
    if(args[1]==='create')release={draft:true,prerelease:meta.prerelease,target_commitish:publicSha,assets:[],html_url:'https://example.test/release'};
    if(args[1]==='upload'){
      release.assets=args.slice(args.indexOf('--clobber')+1).map(file=>{const bytes=fs.readFileSync(file);return {name:path.basename(file),size:bytes.length,digest:'sha256:'+R.hash(bytes)};});
      if(options.corrupt)release.assets[0].digest='sha256:broken';
    }
    if(args[1]==='edit')release.draft=false;
    return '';
  }};
}
try{
  assert.equal(meta.tag,'desktop-dev-v0.2.0-build.12');assert(meta.prerelease);
  assert.equal(R.metadata({version,ref:'refs/heads/main',sha,runNumber:13}).tag,'v0.2.0');
  assert.equal(R.metadata({version,ref:'refs/tags/v0.2.0',sha,runNumber:13}).prerelease,false);
  assert(R.metadata({version:'0.3.0-beta.1',ref:'refs/tags/v0.3.0-beta.1',sha,runNumber:13}).prerelease);
  for(const ref of ['refs/heads/feature','refs/tags/v9.0.0'])assert.throws(()=>R.metadata({version,ref,sha,runNumber:12}));
  assert.throws(()=>R.metadata({version,ref:'refs/heads/main',sha:'untrusted',runNumber:12}));
  assert.deepEqual(R.TARGETS.flatMap(target=>R.artifactNames(version,target)),['JW3-Workbench-Windows-x64-v0.2.0.exe','JW3-Workbench-macOS-arm64-v0.2.0.dmg','JW3-Workbench-macOS-x64-v0.2.0.dmg']);
  fixture();assert.equal(R.collect(directory,{version,electron,sha}).artifacts.length,3);
  const name=R.artifactNames(version,'win-x64')[0];fs.appendFileSync(path.join(directory,name),'tamper');assert.throws(()=>R.collect(directory,{version,electron,sha}),/摘要/);
  fixture();assert.throws(()=>R.collect(directory,{version,electron,sha:'b'.repeat(40)}),/源提交/);
  fs.writeFileSync(path.join(directory,'private-data.json'),'secret');assert.throws(()=>R.collect(directory,{version,electron,sha}),/未审核/);
  fixture();fs.writeFileSync(path.join(directory,'all-platforms.zip'),'unexpected bundle');assert.throws(()=>R.collect(directory,{version,electron,sha}),/未审核/);
  fixture();fs.unlinkSync(path.join(directory,name));assert.throws(()=>R.collect(directory,{version,electron,sha}));
  fixture();const api=fake();assert.equal(publish(directory,{repository,publicSha,meta,electron,run:api.run}),'https://example.test/release');
  assert.equal(api.release.assets.length,5);assert.equal(api.release.draft,false);
  assert(api.calls.findIndex(a=>a[1]==='edit')>api.calls.findIndex(a=>a[1]==='upload'));
  assert(!api.calls.some(a=>a[0]==='api'&&a[1].includes('/releases/tags/')));
  const noMutation=calls=>!calls.some(a=>a[0]==='release'&&['create','upload','edit'].includes(a[1]));
  const retry=fake({release:api.release});publish(directory,{repository,publicSha,meta,electron,run:retry.run});assert(noMutation(retry.calls));
  const wrong=fake({release:{...api.release,target_commitish:'b'.repeat(40)}});assert.throws(()=>publish(directory,{repository,publicSha,meta,electron,run:wrong.run}),/不同公共提交/);assert(noMutation(wrong.calls));
  const changed=fake({release:{...api.release,assets:[]}});assert.throws(()=>publish(directory,{repository,publicSha,meta,electron,run:changed.run}),/已发布/);assert(noMutation(changed.calls));
  const foreign=fake({release:api.release,apiUrl:'https://api.github.com/repos/other/repo/releases/1'});assert.throws(()=>publish(directory,{repository,publicSha,meta,electron,run:foreign.run}),/预期仓库/);assert(noMutation(foreign.calls));
  fixture();const corrupt=fake({corrupt:true});assert.throws(()=>publish(directory,{repository,publicSha,meta,electron,run:corrupt.run}),/保持草稿/);assert(corrupt.release.draft);assert(!corrupt.calls.some(a=>a[1]==='edit'));
  const privateRepo=fake({private:true});assert.throws(()=>publish(directory,{repository,publicSha,meta,electron,run:privateRepo.run}),/公共仓库/);assert.equal(privateRepo.calls.length,1);
  const untrusted=fake();assert.throws(()=>publish(directory,{repository:'other/public',publicSha,meta,electron,run:untrusted.run}),/指定公共仓库/);assert.equal(untrusted.calls.length,0);
  assert.throws(()=>publish(directory,{repository,publicSha:sha.slice(0,12),meta,electron,run:untrusted.run}),/公共提交 SHA/);
  const missing=fake({badCommit:true});assert.throws(()=>publish(directory,{repository,publicSha,meta,electron,run:missing.run}),/公共提交无法核实/);assert(noMutation(missing.calls));
  assert(api.calls.some(a=>a[1]==='create'&&a[a.indexOf('--target')+1]===publicSha));
  assert(!api.calls.some(a=>a.includes('--verify-tag')));
  const notes=fs.readFileSync(path.join(directory,'RELEASE-NOTES.md'),'utf8');assert(notes.includes('/JW3-Work-Pages/releases/download/'));assert(!notes.includes('/JW3-Work/actions/'));
  const workflow=fs.readFileSync(path.join(__dirname,'../.github/workflows/build-desktop.yml'),'utf8');
  assert(workflow.includes('needs: [prepare, build, pages]'));assert(workflow.includes('DESKTOP_PUBLIC_SHA: ${{ github.sha }}'));assert(workflow.includes('GH_TOKEN: ${{ github.token }}'));assert(workflow.includes('contents: write'));

  console.log('PASS desktop release: trigger/version gates, complete three-target manifests, source identity, tamper/missing/private-file rejection, draft-first publication, server digests, immutable published releases, allowlisted public repository and public commit boundary.');
}finally{fs.rmSync(directory,{recursive:true,force:true});}
