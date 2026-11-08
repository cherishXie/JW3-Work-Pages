/* Local-only save preparation. No user records leave this worker or device. */
'use strict';
const snapshot=new URL(self.location.href).searchParams.get('snapshot'),suffix=/^[a-f0-9]{64}$/.test(snapshot)?'?snapshot='+snapshot:'';
importScripts(...['catalog.js','raid-catalog.js','model.js','storage.js'].map(file=>file+suffix));
self.onmessage=({data})=>{
  try{
    const store=WorkbenchStorage.withState(data.store,data.state),raw=JSON.stringify(store),compact=JSON.stringify(WorkbenchStorage.pack(store));
    self.postMessage({id:data.id,store,raw,compact:compact.length<raw.length?compact:null});
  }catch(error){self.postMessage({id:data.id,error:error.message});}
};
