'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function noteSections(markdown){
 return [...markdown.matchAll(/^## \[([^\]]+)\][^\n]*\n([\s\S]*?)(?=^## |$(?![\s\S]))/gm)].map(m=>({title:m[1],items:m[2].split('\n').filter(line=>/^[-*] /.test(line)).map(line=>line.replace(/^[-*] /,''))}));
}
function releaseNotes(markdown,channel,version,{previousMarkdown,summary}={}){
 const sections=noteSections(markdown);
 if(channel!=='dev')return sections.find(s=>s.title===version.replace(/-.*$/,''))||{title:version,items:[]};
 // An unchanged cumulative Unreleased section is not a description of this build.
 // Without parent history, use the source commit's summary rather than old notes.
 const previous=typeof previousMarkdown==='string'?new Set(noteSections(previousMarkdown).find(s=>s.title==='未发布')?.items||[]):null;
 const added=previous?(sections.find(s=>s.title==='未发布')?.items||[]).filter(item=>!previous.has(item)):[];
 return {title:'本次更新',items:added.length?[...new Set(added)]:typeof summary==='string'&&summary.trim()?[summary.trim()]:[]};
}
function generate(root,out,sourceFiles){
 const git=args=>cp.execFileSync('git',args,{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
 const channel=process.env.GITHUB_REF_NAME||git(['branch','--show-current']);
 if(!['main','dev'].includes(channel))throw Error('Updates require main or dev channel');
 const sourceCommit=process.env.GITHUB_SHA||git(['rev-parse','HEAD']),version=require('./desktop-release.cjs').channelVersion(require(path.join(root,'package.json')).version,channel,process.env.GITHUB_RUN_NUMBER||'0');
 const records=sourceFiles.map(name=>{const b=fs.readFileSync(path.join(out,name));return {name,bytes:b.length,sha256:hash(b)};});
 const id=hash(JSON.stringify({channel,sourceCommit,version,records}));
 const sourceTimestamp=Number(git(['show','-s','--format=%ct',sourceCommit]));
 let previousMarkdown,summary;
 if(channel==='dev'){
  try{previousMarkdown=git(['show',sourceCommit+'^:CHANGELOG.md']);}catch{/* Root/shallow checkout: the commit summary remains specific to this build. */}
  summary=git(['show','-s','--format=%s',sourceCommit]);
 }
 const notes=releaseNotes(fs.readFileSync(path.join(root,'CHANGELOG.md'),'utf8'),channel,version,{previousMarkdown,summary});
 const meta={id,version,channel,sourceCommit,sourceTimestamp,protocol:2,releaseNotes:notes};
 fs.writeFileSync(path.join(out,'version.js'),'globalThis.WorkbenchVersion=Object.freeze('+JSON.stringify(meta)+');\n');
 const v=fs.readFileSync(path.join(out,'version.js'));records.push({name:'version.js',bytes:v.length,sha256:hash(v)});
 const manifest={...meta,files:records};
 fs.writeFileSync(path.join(out,'update-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
 fs.writeFileSync(path.join(out,'sw.js'),'const BUILD='+JSON.stringify(manifest)+';\n'+fs.readFileSync(path.join(root,'pwa-worker.js'),'utf8'));
 return meta;
}
module.exports={generate,hash,releaseNotes};
