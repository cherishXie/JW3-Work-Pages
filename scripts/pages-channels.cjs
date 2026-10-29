'use strict';
const fs=require('node:fs'),path=require('node:path');
const {publicFiles,publicDocuments}=require('./public-assets.cjs');
const assets=[...publicFiles,...publicDocuments,'.nojekyll'];
function walk(dir,prefix=''){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>{if(!prefix&&e.name==='.git')return [];const name=prefix+e.name;if(e.isSymbolicLink())throw Error('Symlink rejected: '+name);if(e.isDirectory())return walk(path.join(dir,e.name),name+'/');if(!e.isFile())throw Error('Invalid file: '+name);return [name];});}
function merge(source,target,branch,sha,version){
 if(!['dev','main'].includes(branch)||!/^[a-f0-9]{40}$/.test(sha))throw Error('Invalid deployment channel or SHA');
 const allowed=new Set([...assets,'.jw3-public-only.json','.gitattributes','version.json',...assets.map(f=>'dev/'+f),'dev/version.json']);
 for(const f of walk(target))if(!allowed.has(f))throw Error('Unknown deployment file: '+f);
 const incoming=walk(source);if(incoming.length!==assets.length||incoming.some(f=>!assets.includes(f)))throw Error('Invalid Pages artifact');
 const dest=branch==='dev'?path.join(target,'dev'):target;
 // Update only the selected channel. Never delete the other channel.
 for(const f of [...assets,'version.json'])fs.rmSync(path.join(dest,f),{force:true});
 for(const f of assets){const to=path.join(dest,f);fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(path.join(source,f),to);}
 fs.writeFileSync(path.join(dest,'version.json'),JSON.stringify({branch,sourceCommit:sha,version},null,2)+'\n');
}
function exportSite(target,out){fs.rmSync(out,{recursive:true,force:true});for(const f of walk(target).filter(f=>!['.jw3-public-only.json','.gitattributes'].includes(f))){const to=path.join(out,f);fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(path.join(target,f),to);}}
module.exports={merge,exportSite,walk};
if(require.main===module){const root=path.resolve(__dirname,'..'),target=path.resolve(process.argv[2]),branch=process.argv[3],sha=process.argv[4];merge(path.join(root,'.pages-dist'),target,branch,sha,require('../package.json').version);exportSite(target,path.join(root,'.pages-site'));console.log('Updated only '+branch+'; other channel preserved.');}
