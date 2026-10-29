/* Synchronous storage port for the existing transactional UI. No renderer file access. */
'use strict';
const fs=require('node:fs'),path=require('node:path');
const KEYS=new Set(['jx3-workbench-data-v2','jx3-workbench-v1','jx3-workbench-experience-v1',
  'jx3-task-view-v1','jx3-privacy-mask','jx3-workbench-currency','jx3-default-page',
  'jx3-workbench-theme-v1','jx3-mumu-bindings-v1']);
const MAX_BYTES=128*1024*1024;
function key(value){if(typeof value!=='string'||!KEYS.has(value))throw new Error('不支持的工作台存储键');return value;}
function validate(value){
  if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('桌面数据格式无效');
  for(const [k,v]of Object.entries(value)){key(k);if(typeof v!=='string')throw new Error('桌面数据值无效');}
  return value;
}
function createStore(directory,io=fs){
  io.mkdirSync(directory,{recursive:true});
  const file=path.join(directory,'workbench-storage.json'),backup=file+'.bak';
  // Refuse startup on corruption; never overwrite a damaged archive with empty state.
  const values=Object.assign(Object.create(null),io.existsSync(file)?validate(JSON.parse(io.readFileSync(file,'utf8'))):{});
  function persist(next){
    const bytes=JSON.stringify(next);if(Buffer.byteLength(bytes)>MAX_BYTES)throw new Error('桌面数据超过 128 MB，请导出并整理历史档案');
    const temporary=file+'.tmp';let fd;
    try{
      fd=io.openSync(temporary,'w',0o600);io.writeFileSync(fd,bytes);io.fsyncSync(fd);io.closeSync(fd);fd=undefined;
      if(io.existsSync(file))io.copyFileSync(file,backup);
      io.renameSync(temporary,file);
    }catch(error){if(fd!==undefined)io.closeSync(fd);try{io.unlinkSync(temporary);}catch{}throw error;}
    for(const k of Object.keys(values))delete values[k];Object.assign(values,next);
  }
  return Object.freeze({file,backup,
    getItem:k=>values[key(k)]??null,
    setItem:(k,v)=>{key(k);if(typeof v!=='string')throw new Error('桌面数据值须为文本');persist({...values,[k]:v});},
    removeItem:k=>{key(k);const next={...values};delete next[k];persist(next);}
  });
}
module.exports={createStore,KEYS,MAX_BYTES};
