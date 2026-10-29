'use strict';
const cp=require('node:child_process'),allowed=new Set(require('./public-source.cjs'));
const ref=process.argv[2];if(ref&&!/^[a-f0-9]{40}$/.test(ref))throw Error('Invalid source ref');
const args=ref?['ls-tree','-rz','--name-only',ref]:['ls-files','-z'];
const files=cp.execFileSync('git',args,{encoding:'utf8',cwd:require('node:path').resolve(__dirname,'..')}).split('\0').filter(Boolean);
const rejected=files.filter(f=>!allowed.has(f));if(rejected.length)throw Error('Public source allowlist rejected: '+rejected.join(', '));
console.log('PASS public source allowlist: '+files.length+' tracked files, no private paths.');
