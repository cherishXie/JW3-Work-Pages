/* Only verified binaries and manifests are uploaded, after all native jobs passed. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const {metadata,prepare,hash}=require('./desktop-release.cjs');
function publish(directory,{repository,publicSha,meta,electron,run}){
  if(repository!=='cherishXie/JW3-Work-Pages')throw new Error('桌面 Release 仅允许发布到指定公共仓库');
  if(!/^[a-f0-9]{40}$/.test(publicSha))throw new Error('缺少经过网页发布验证的公共提交 SHA');
  const info=JSON.parse(run(['api','repos/'+repository]));
  if(info.private!==false)throw new Error('桌面 Release 目标必须是公共仓库');
  const commit=JSON.parse(run(['api',`repos/${repository}/commits/${publicSha}`]));
  if(commit.sha!==publicSha)throw new Error('公共提交无法核实');
  const names=prepare(directory,meta,electron,repository);
  // REST lookup by tag excludes unpublished drafts. Resolve the draft with gh,
  // then read it by numeric release ID so upload verification works before publish.
  const readRelease=()=>{
    const reference=JSON.parse(run(['release','view',meta.tag,'--repo',repository,'--json','apiUrl']));
    const prefix=`https://api.github.com/repos/${repository}/releases/`,url=reference.apiUrl;
    if(typeof url!=='string'||!url.toLowerCase().startsWith(prefix.toLowerCase())||!/^\d+$/.test(url.slice(prefix.length)))throw new Error('Release API 地址不属于预期仓库');
    return JSON.parse(run(['api',`repos/${repository}/releases/${url.slice(prefix.length)}`]));
  };
  let existing;
  try{existing=readRelease();}
  catch(error){if(!/404|release not found/i.test(error.message))throw error;}
  if(existing){
    if(existing.target_commitish!==publicSha)throw new Error('已有 Release 指向不同公共提交，拒绝覆盖');
    if(!existing.draft){
      if(existing.prerelease!==meta.prerelease||existing.assets.length!==names.length||names.some(name=>{
        const asset=existing.assets.find(a=>a.name===name),bytes=fs.readFileSync(path.join(directory,name));
        return !asset||asset.size!==bytes.length||asset.digest!=='sha256:'+hash(bytes);
      }))throw new Error('已有已发布 Release 与本次产物不一致，拒绝改写已发布附件');
      return existing.html_url;
    }
  }else{
    run(['release','create',meta.tag,'--repo',repository,'--draft','--target',publicSha,'--title',meta.title,'--notes-file',path.join(directory,'RELEASE-NOTES.md'),'--latest=false',...(meta.prerelease?['--prerelease']:[])]);
  }
  run(['release','upload',meta.tag,'--repo',repository,'--clobber',...names.map(name=>path.join(directory,name))]);
  const uploaded=readRelease();
  if(uploaded.assets.length!==names.length||names.some(name=>{
    const asset=uploaded.assets.find(a=>a.name===name),bytes=fs.readFileSync(path.join(directory,name));
    return !asset||asset.size!==bytes.length||asset.digest!=='sha256:'+hash(bytes);
  }))throw new Error('上传附件的大小或服务端摘要校验失败，Release 保持草稿');
  run(['release','edit',meta.tag,'--repo',repository,'--draft=false','--title',meta.title,'--notes-file',path.join(directory,'RELEASE-NOTES.md'),'--prerelease='+meta.prerelease,'--latest='+!meta.prerelease]);
  const published=readRelease();
  if(published.draft||published.prerelease!==meta.prerelease)throw new Error('Release 状态未正确发布');
  return published.html_url;
}
module.exports={publish};
if(require.main===module){
  const pkg=require('../package.json'),directory=path.resolve(process.argv[2]||'release-assets');
  const meta=metadata({version:pkg.version,ref:process.env.GITHUB_REF,sha:process.env.GITHUB_SHA,runNumber:process.env.GITHUB_RUN_NUMBER});
  const run=args=>{try{return cp.execFileSync('gh',args,{encoding:'utf8',stdio:['ignore','pipe','pipe']});}catch(error){throw new Error(error.stderr?.toString()||error.message);}};
  const url=publish(directory,{repository:process.env.DESKTOP_RELEASE_REPOSITORY,publicSha:process.env.DESKTOP_PUBLIC_SHA,meta,electron:pkg.devDependencies.electron,run});
  if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,`## Desktop Release\n\n[${meta.title}](${url})\n\nWindows x64 / macOS arm64 / macOS x64 已构建并通过原生应用验证。\n`);
  console.log('Desktop Release published: '+url);
}
