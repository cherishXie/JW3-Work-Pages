'use strict';
const {contextBridge,ipcRenderer}=require('electron');
function call(action,key,value){
  const result=ipcRenderer.sendSync('workbench:storage',{action,key,value});
  if(!result?.ok)throw new Error(result?.error||'桌面存储不可用');
  return result.value;
}
contextBridge.exposeInMainWorld('workbenchDesktop',Object.freeze({os:process.platform,
  updates:Object.freeze(Object.fromEntries(['check','prepare','activate','ready','openInstaller'].map(name=>[name,id=>ipcRenderer.invoke('workbench:updates',name==='openInstaller'?'installer':name,name==='ready'?id:undefined)]))),
  storage:Object.freeze({getItem:key=>call('get',key),setItem:(key,value)=>call('set',key,value),removeItem:key=>call('remove',key)})
}));
