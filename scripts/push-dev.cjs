'use strict';
const cp=require('node:child_process');
const run=args=>cp.execFileSync('git',args,{encoding:'utf8'}).trim();
if(run(['branch','--show-current'])!=='dev')throw Error('日常发布仅允许 dev 分支');
if(run(['remote','get-url','origin'])!=='https://github.com/cherishXie/JW3-Work-Pages.git')throw Error('origin 不是指定公共仓库');
cp.execFileSync('npm',['test'],{stdio:'inherit'});
cp.execFileSync('git',['push','origin','HEAD:dev'],{stdio:'inherit'});
