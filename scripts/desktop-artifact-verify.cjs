/* Verify every embedded application file matches the approved staging tree. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),asar=require('@electron/asar');
const root=path.resolve(__dirname,'..'),release=path.join(root,'release');
const {TARGETS,artifactNames}=require('./desktop-release.cjs');
const args=process.argv.slice(2);
if(args.length>1||args.some(a=>!a.startsWith('--target=')))throw new Error('Usage: desktop-artifact-verify.cjs [--target=win-x64|mac-arm64|mac-x64]');
const selected=args.length?args[0].slice('--target='.length):null;
if(selected&&!TARGETS.includes(selected))throw new Error('未知桌面目标：'+selected);
const web=require('./public-assets.cjs').publicFiles;
const expected=['package.json','assets.json','main.cjs','preload.cjs','store.cjs','security.cjs','updater.cjs',...web.map(p=>'web/'+p)];
const targets=[['mac-arm64/剑网三工作台.app/Contents/Resources/app.asar','mac-arm64'],['mac/剑网三工作台.app/Contents/Resources/app.asar','mac-x64'],['win-unpacked/resources/app.asar','win-x64']];
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
// ASAR's API traverses with the host path separator, even though manifests use '/'.
const archiveName=relative=>relative.split('/').join(path.sep);
for(const [name,target]of targets){
  if(selected&&selected!==target)continue;
  const file=path.join(release,name);
  const actual=asar.listPackage(file).map(p=>p.replaceAll('\\','/').replace(/^\//,'')).filter(p=>!asar.statFile(file,archiveName(p)).files);
  assert.deepEqual(actual.sort(),[...expected].sort(),target+' private file boundary');
  for(const relative of expected)assert.equal(hash(asar.extractFile(file,archiveName(relative))),hash(fs.readFileSync(path.join(root,'.desktop-stage',relative))),target+' stale embedded file: '+relative);
  console.log('PASS '+target+' exact application allowlist and current source hashes');
}
if(!selected||selected==='win-x64'){
const exe=fs.readFileSync(path.join(release,'win-unpacked/剑网三工作台.exe'));
assert.equal(exe.subarray(0,2).toString(),'MZ');const pe=exe.readUInt32LE(0x3c);assert.equal(exe.readUInt32LE(pe),0x4550);assert.equal(exe.readUInt16LE(pe+4),0x8664);
}
const version=require('./desktop-release.cjs').currentVersion(),names=(selected?[selected]:TARGETS).flatMap(target=>artifactNames(version,target));
const artifacts=names.map(name=>{const bytes=fs.readFileSync(path.join(release,name));assert(bytes.length>1024*1024);return {name,bytes:bytes.length,sha256:hash(bytes)};});
const suffix=selected?'-'+selected:'';
fs.writeFileSync(path.join(release,'SHA256SUMS'+suffix+'.txt'),artifacts.map(x=>x.sha256+'  '+x.name).join('\n')+'\n');
fs.writeFileSync(path.join(release,'BUILD-INFO'+suffix+'.json'),JSON.stringify({version,electron:require('../package.json').devDependencies.electron,...(selected?{target:selected}:{}),sourceCommit:process.env.GITHUB_SHA||null,signed:false,cloudSync:false,artifacts},null,2)+'\n');
console.log('PASS '+(selected||'all platforms')+' distribution artifacts and SHA-256 manifest.');
