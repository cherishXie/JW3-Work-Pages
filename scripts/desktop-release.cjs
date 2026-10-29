/* Pure release metadata and distribution manifest validation. No network access. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const TARGETS=['win-x64','mac-arm64','mac-x64'];
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
function artifactNames(version,target){
  if(!TARGETS.includes(target))throw new Error('未知桌面目标：'+target);
  const platform=target==='win-x64'?'Windows':'macOS',arch=target.split('-')[1],ext=target==='win-x64'?'exe':'dmg';
  return [`JW3-Workbench-${platform}-${arch}-v${version}.${ext}`];
}
function metadata({version,ref,sha,runNumber}){
  if(!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z]+(?:[.-][0-9A-Za-z]+)*)?$/.test(version))throw new Error('无效应用版本');
  if(!/^[a-f0-9]{40}$/.test(sha))throw new Error('缺少可信源提交 SHA');
  if(!/^[1-9]\d*$/.test(String(runNumber)))throw new Error('缺少构建编号');
  const tagged=ref?.startsWith('refs/tags/');
  if(tagged&&ref!=='refs/tags/v'+version)throw new Error('发布标签必须与 package.json 版本一致');
  if(!tagged&&!['refs/heads/main','refs/heads/dev'].includes(ref))throw new Error('仅 dev、main 或版本标签可以发布桌面版本');
  const stable=tagged||ref==='refs/heads/main';
  const prerelease=!stable||version.includes('-'),tag=stable?'v'+version:`desktop-dev-v${version}-build.${runNumber}`;
  return {version,sha,tag,prerelease,title:stable?`剑网三工作台 ${version}`:`剑网三工作台 ${version} 开发构建 #${runNumber}`};
}
function fileBytes(directory,name){
  const file=path.join(directory,name),stat=fs.lstatSync(file);
  if(!stat.isFile()||stat.isSymbolicLink())throw new Error('发行文件必须是普通文件：'+name);
  return fs.readFileSync(file);
}
function collect(directory,{version,electron,sha}){
  const expected=TARGETS.flatMap(target=>[...artifactNames(version,target),`BUILD-INFO-${target}.json`,`SHA256SUMS-${target}.txt`]);
  const extras=fs.readdirSync(directory).filter(name=>!expected.includes(name)&&!['BUILD-INFO.json','SHA256SUMS.txt','RELEASE-NOTES.md'].includes(name));
  if(extras.length)throw new Error('发行附件出现未审核文件：'+extras.join(', '));
  for(const name of fs.readdirSync(directory)){const stat=fs.lstatSync(path.join(directory,name));if(!stat.isFile()||stat.isSymbolicLink())throw new Error('发行文件必须是普通文件：'+name);}
  const artifacts=[];
  for(const target of TARGETS){
    const manifest=JSON.parse(fileBytes(directory,`BUILD-INFO-${target}.json`));
    if(manifest.version!==version||manifest.electron!==electron||manifest.target!==target||manifest.sourceCommit!==sha||manifest.signed!==false||manifest.cloudSync!==false)throw new Error('目标清单的版本、源提交或能力不一致：'+target);
    const names=artifactNames(version,target);
    if(!Array.isArray(manifest.artifacts)||manifest.artifacts.length!==names.length||manifest.artifacts.some(a=>!names.includes(a.name))||new Set(manifest.artifacts.map(a=>a.name)).size!==names.length)throw new Error('目标附件清单不完整：'+target);
    for(const name of names){
      const record=manifest.artifacts.find(a=>a.name===name),bytes=fileBytes(directory,name);
      if(bytes.length<=1024*1024||record.bytes!==bytes.length||record.sha256!==hash(bytes))throw new Error('附件大小或摘要不匹配：'+name);
      artifacts.push({name,bytes:bytes.length,sha256:record.sha256});
    }
    const sums=manifest.artifacts.map(a=>a.sha256+'  '+a.name).join('\n')+'\n';
    if(fileBytes(directory,`SHA256SUMS-${target}.txt`).toString()!==sums)throw new Error('目标校验和清单不一致：'+target);
  }
  return {version,electron,sourceCommit:sha,signed:false,cloudSync:false,artifacts};
}
function prepare(directory,meta,electron,repository){
  const manifest=collect(directory,{version:meta.version,electron,sha:meta.sha});
  fs.writeFileSync(path.join(directory,'BUILD-INFO.json'),JSON.stringify(manifest,null,2)+'\n');
  fs.writeFileSync(path.join(directory,'SHA256SUMS.txt'),manifest.artifacts.map(a=>a.sha256+'  '+a.name).join('\n')+'\n');
  const notes=[`源提交：${meta.sha}`,'发布前已通过三平台原生构建与校验。','',
    '## 按系统下载安装包','','| 平台 | 下载文件 |','| --- | --- |',...manifest.artifacts.map(a=>`| ${a.name.includes('Windows-x64')?'Windows x64':a.name.includes('macOS-arm64')?'macOS Apple Silicon (arm64)':'macOS Intel (x64)'} | [${a.name}](https://github.com/${repository}/releases/download/${meta.tag}/${a.name}) |`),'',
    '各系统独立下载：Windows 使用 EXE 安装器，macOS 按芯片选择 arm64（Apple Silicon）或 x64（Intel）的 DMG。无需下载合集压缩包。页面底部由 GitHub 自动提供的 Source code (zip / tar.gz) 是网页源码，不是客户端，请下载上表中的 EXE 或 DMG。SHA256SUMS.txt 与 BUILD-INFO.json 用于核对完整性和源版本。','',
    '本版没有发布者签名、Apple 公证和自动更新。数据保存在本机，尚未实现云同步；首次迁移请在原网页导出 JSON，再在桌面版的「工作台设置 → 数据管理」导入。',
    '各平台原生 runner 已完成应用启动、导入保存、重启恢复、离线 OCR 与资源隔离检查。安装向导和卸载流程仍需按实际系统人工验收。',
    '安装包不包含个人账号、角色、截图、测试夹具、备份或源仓库历史。'];
  if(!meta.prerelease){const changelog=fs.readFileSync(path.join(__dirname,'../CHANGELOG.md'),'utf8'),section=changelog.split('## ['+meta.version+']')[1]?.split('\n## ')[0];if(!section)throw Error('正式版本缺少更新记录');notes.push('','## 更新内容',section.trim());}
  fs.writeFileSync(path.join(directory,'RELEASE-NOTES.md'),notes.join('\n')+'\n');
  return [...manifest.artifacts.map(a=>a.name),'SHA256SUMS.txt','BUILD-INFO.json'];
}
module.exports={TARGETS,hash,artifactNames,metadata,collect,prepare};
if(require.main===module){
  const pkg=require('../package.json');
  if(process.argv[2]!=='metadata')throw new Error('Usage: node scripts/desktop-release.cjs metadata');
  const meta=metadata({version:pkg.version,ref:process.env.GITHUB_REF,sha:process.env.GITHUB_SHA,runNumber:process.env.GITHUB_RUN_NUMBER});
  if(process.env.GITHUB_OUTPUT)fs.appendFileSync(process.env.GITHUB_OUTPUT,`tag=${meta.tag}\nversion=${meta.version}\nprerelease=${meta.prerelease}\n`);
  console.log(JSON.stringify(meta));
}
