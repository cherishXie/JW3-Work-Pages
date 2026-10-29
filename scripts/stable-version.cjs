'use strict';
const fs=require('node:fs'),cp=require('node:child_process');
function validate(version,previous,changelog){
 const parse=v=>{if(!/^\d+\.\d+\.\d+$/.test(v))throw Error('main 必须使用正式版本号');return v.split('.').map(Number);};
 const next=parse(version),old=parse(previous);
 if(!(next[0]>old[0]||(next[0]===old[0]&&next[1]>old[1])))throw Error('main 仅接收 major 或 minor 版本升级；日常修改请推送 dev');
 const section=changelog.split('## ['+version+']')[1]?.split('\n## ')[0];
 if(!section||!/^\s*-\s+\S/m.test(section))throw Error('请在 CHANGELOG.md 记录本次正式版本的更新内容');
}
function check(ref){
 if(!/^[A-Za-z0-9_./^~-]+$/.test(ref))throw Error('Invalid base ref');
 const exists=cp.execFileSync('git',['ls-tree','--name-only',ref,'package.json'],{encoding:'utf8'}).trim();
 const previous=exists?JSON.parse(cp.execFileSync('git',['show',ref+':package.json'],{encoding:'utf8'})).version:'0.2.0';
 validate(require('../package.json').version,previous,fs.readFileSync('CHANGELOG.md','utf8'));
 console.log('Stable version and changelog verified.');
}
module.exports={validate,check};
if(require.main===module)check(process.argv[2]||'origin/main');
