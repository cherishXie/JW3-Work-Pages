/* Platform ports. Business rules and archive formats never depend on Electron. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.WorkbenchPlatform=api.create(root);
})(typeof globalThis==='object'?globalThis:this,function(){
  'use strict';
  function create(host){
    const desktop=host.workbenchDesktop;
    // Resolve browser storage lazily so blocked storage still reaches the existing recovery UI.
    const source=()=>desktop?desktop.storage:host.localStorage;
    const storage=Object.freeze({
      getItem:key=>source().getItem(key),
      setItem:(key,value)=>source().setItem(key,String(value)),
      removeItem:key=>source().removeItem(key)
    });
    return Object.freeze({kind:desktop?'electron':'web',os:desktop?.os||'browser',storage,
      capabilities:Object.freeze({localPersistence:true,cloudSync:false}),
      storageLabel:desktop?'数据保存在此电脑':'数据保存在此浏览器'});
  }
  return {create};
});
