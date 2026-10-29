/* Only the configured public Pages channel supplies renderer assets, never host code. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),https=require('node:https'),crypto=require('node:crypto');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function validate(manifest,channel){
 if(!manifest||manifest.channel!==channel||!/^[a-f0-9]{64}$/.test(manifest.id)||!/^[a-f0-9]{40}$/.test(manifest.sourceCommit)||!/^\d+\.\d+\.\d+(?:-[\w.-]+)?$/.test(manifest.version)||!Number.isInteger(manifest.protocol)||manifest.protocol<1)throw Error('更新清单无效');
 if(!Array.isArray(manifest.files)||manifest.files.length>150)throw Error('更新文件数量无效');
 let total=0;const seen=new Set();
 for(const f of manifest.files){if(typeof f.name!=='string'||! /^(?:vendor\/ocr\/|vendor\/)?[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)*\.(?:js|css|html|webmanifest|png|wasm|gz|txt|json)$/.test(f.name)||f.name.endsWith('.cjs')||seen.has(f.name)||!/^[a-f0-9]{64}$/.test(f.sha256)||!Number.isSafeInteger(f.bytes)||f.bytes<1||f.bytes>16*1024*1024)throw Error('更新包含未允许的文件');seen.add(f.name);total+=f.bytes;}
 if(total>64*1024*1024||!['index.html','version.js','update.js','app.js'].every(f=>seen.has(f)))throw Error('更新资源不完整');
 return manifest;
}
function get(url,limit){return new Promise((resolve,reject)=>{const request=https.get(url,{headers:{'Cache-Control':'no-cache'}},response=>{if(response.statusCode!==200){response.resume();reject(Error('更新服务器暂不可用'));return;}const chunks=[];let size=0;response.on('data',b=>{size+=b.length;if(size>limit){request.destroy(Error('更新资源超出限制'));return;}chunks.push(b);});response.on('end',()=>resolve(Buffer.concat(chunks)));response.on('error',reject);});request.setTimeout(30000,()=>request.destroy(Error('更新下载超时')));request.on('error',reject);});}
function createUpdater({directory,bundledRoot,read=get}){
 const bundled=JSON.parse(fs.readFileSync(path.join(bundledRoot,'update-manifest.json'),'utf8')),channel=bundled.channel;
 const base='https://cherishxie.github.io/JW3-Work-Pages/'+(channel==='dev'?'dev/':'');
 const pointer=path.join(directory,'active.json');fs.mkdirSync(directory,{recursive:true});
 let active={manifest:bundled,root:bundledRoot},previous=null,prepared=null,checking=null,preparing=null;
 const checkedRoot=(id)=>{if(!/^[a-f0-9]{64}$/.test(id))throw Error('无效更新目录');const root=path.join(directory,id),manifest=validate(JSON.parse(fs.readFileSync(path.join(root,'update-manifest.json'),'utf8')),channel);if(manifest.id!==id||manifest.protocol!==1||(manifest.sourceTimestamp||0)<(bundled.sourceTimestamp||0))throw Error('更新版本不兼容');for(const f of manifest.files){const b=fs.readFileSync(path.join(root,f.name));if(b.length!==f.bytes||hash(b)!==f.sha256)throw Error('本地更新资源损坏');}return {root,manifest};};
 const writePointer=value=>{fs.writeFileSync(pointer+'.tmp',JSON.stringify(value));fs.renameSync(pointer+'.tmp',pointer);};
 try{if(fs.existsSync(pointer)){const p=JSON.parse(fs.readFileSync(pointer,'utf8'));if(p.pending){if(p.previous)active=checkedRoot(p.previous);writePointer({id:active.manifest.id,pending:false});}else if(p.id!==bundled.id)active=checkedRoot(p.id);}}catch{active={manifest:bundled,root:bundledRoot};fs.rmSync(pointer,{force:true});}
 function current(){return active;}
 async function check(){if(!checking)checking=(async()=>validate(JSON.parse((await read(base+'update-manifest.json?check='+Date.now(),256*1024)).toString()),channel))().finally(()=>{checking=null;});return checking;}
 async function prepare(){
  if(preparing)return preparing;
  preparing=(async()=>{
   const manifest=await check();if(manifest.protocol!==1)throw Error('此版本需要更新桌面安装包');
   if(manifest.id===active.manifest.id)return active.manifest;
   if(prepared?.manifest.id===manifest.id)return prepared.manifest;
   const staging=path.join(directory,manifest.id+'.partial'),destination=path.join(directory,manifest.id);
   fs.rmSync(staging,{recursive:true,force:true});fs.mkdirSync(staging,{recursive:true});
   try{let next=0;const results=await Promise.allSettled(Array.from({length:4},async()=>{for(;;){const f=manifest.files[next++];if(!f)return;const b=await read(base+f.name+'?snapshot='+manifest.id,f.bytes+1);if(b.length!==f.bytes||hash(b)!==f.sha256)throw Error('更新资源校验失败，请重试');const file=path.join(staging,f.name);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,b);}}));
    const failed=results.find(r=>r.status==='rejected');if(failed)throw failed.reason;
    fs.writeFileSync(path.join(staging,'update-manifest.json'),JSON.stringify(manifest));
    fs.rmSync(destination,{recursive:true,force:true});fs.renameSync(staging,destination);prepared=checkedRoot(manifest.id);return manifest;
   }catch(error){fs.rmSync(staging,{recursive:true,force:true});throw error;}
  })().finally(()=>{preparing=null;});return preparing;
 }
 function activate(){if(!prepared)throw Error('请先完整下载更新');previous=active;writePointer({id:prepared.manifest.id,previous:previous.root===bundledRoot?null:previous.manifest.id,pending:true});active=prepared;prepared=null;return active.manifest;}
 function ready(){writePointer({id:active.manifest.id,pending:false});previous=null;}
 function rollback(){if(previous){active=previous;previous=null;writePointer({id:active.manifest.id,pending:false});}return active;}
 return {current,check,prepare,activate,ready,rollback};
}
module.exports={validate,hash,createUpdater};
