'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function generate(root,out,sourceFiles){
 const git=args=>cp.execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
 const channel=process.env.GITHUB_REF_NAME||git(['branch','--show-current']);
 if(!['main','dev'].includes(channel))throw Error('Updates require main or dev channel');
 const sourceCommit=process.env.GITHUB_SHA||git(['rev-parse','HEAD']),version=require(path.join(root,'package.json')).version;
 const records=sourceFiles.map(name=>{const b=fs.readFileSync(path.join(out,name));return {name,bytes:b.length,sha256:hash(b)};});
 const id=hash(JSON.stringify({channel,sourceCommit,version,records}));
 const sourceTimestamp=Number(git(['show','-s','--format=%ct',sourceCommit]));
 const meta={id,version,channel,sourceCommit,sourceTimestamp,protocol:1};
 fs.writeFileSync(path.join(out,'version.js'),'globalThis.WorkbenchVersion=Object.freeze('+JSON.stringify(meta)+');\n');
 const v=fs.readFileSync(path.join(out,'version.js'));records.push({name:'version.js',bytes:v.length,sha256:hash(v)});
 const manifest={...meta,files:records};
 fs.writeFileSync(path.join(out,'update-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
 fs.writeFileSync(path.join(out,'sw.js'),'const BUILD='+JSON.stringify(manifest)+';\n'+fs.readFileSync(path.join(root,'pwa-worker.js'),'utf8'));
 return meta;
}
module.exports={generate,hash};
