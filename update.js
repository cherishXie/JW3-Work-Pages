/* Read-only update transport. Business archives never leave local storage. */
(()=>{
 'use strict';
 const current=globalThis.WorkbenchVersion;if(!current)return;
 const desktop=globalThis.workbenchDesktop?.updates,base=new URL('./',document.baseURI);
 const banner=document.getElementById('app-update'),message=document.getElementById('update-message'),detail=document.getElementById('update-detail'),action=document.getElementById('update-apply'),dismiss=document.getElementById('update-dismiss'),checkButton=document.getElementById('update-check'),version=document.getElementById('app-version');
 let target=null,registration=null,busy=false,dismissed='',lastCheck=0,updating=false;
 const label=m=>m.version+' '+(m.channel==='dev'?'开发版':'正式版')+' '+m.sourceCommit.slice(0,7);
 version.textContent=label(current);
 function show(title,description,button='立即更新'){banner.hidden=false;banner.setAttribute('aria-busy',String(busy));message.textContent=title;detail.textContent=description;action.textContent=button;action.hidden=!button;action.disabled=busy;dismiss.disabled=busy;}
 function guard(){const event=new CustomEvent('workbench:before-update',{cancelable:true});if(!document.dispatchEvent(event)){show('请先保存当前内容','完成或退出当前编辑与排程后，再点击更新。');return false;}return true;}
 async function sw(){
  if(desktop||location.protocol==='file:'||!('serviceWorker'in navigator))return null;
  registration=await navigator.serviceWorker.register(new URL('sw.js',base),{scope:base.href,updateViaCache:'none'});
  navigator.serviceWorker.controller?.postMessage({type:'PIN_BUILD',id:current.id});
  navigator.serviceWorker.addEventListener('controllerchange',()=>{navigator.serviceWorker.controller?.postMessage({type:'PIN_BUILD',id:current.id});if(updating)location.reload();});
  return registration;
 }
 const worker=sw().catch(()=>null);
 async function check(force=false){
  if(busy||(!force&&Date.now()-lastCheck<60000))return;lastCheck=Date.now();checkButton.disabled=true;
  try{
   const latest=desktop?await desktop.check():await(async()=>{const r=await fetch(new URL('update-manifest.json?check='+Date.now(),base),{cache:'no-store',credentials:'omit'});if(!r.ok)throw Error('暂时无法检查更新');return r.json();})();
   if(!latest||!/^[a-f0-9]{64}$/.test(latest.id)||latest.channel!==current.channel||!/^\d+\.\d+\.\d+/.test(latest.version)||!/^[a-f0-9]{40}$/.test(latest.sourceCommit))throw Error('更新信息无效');
   target=latest;
   if(latest.id!==current.id&&(force||dismissed!==latest.id))show('发现新版本 '+label(latest),'更新后重新打开工作台，本机数据会保留。',desktop&&latest.protocol>1?'下载安装包':'立即更新');
   else if(force)show('已是最新版本',label(current),'');
  }catch(error){if(force)show('更新检查未完成',navigator.onLine===false?'当前离线，可继续使用已缓存的版本。':error.message,'重试');}
  finally{checkButton.disabled=false;}
 }
 async function apply(){
  if(busy)return;if(!target||target.id===current.id){await check(true);return;}if(!guard())return;
  if(desktop&&target.protocol>1){await desktop.openInstaller();return;}
  busy=true;checkButton.disabled=true;show('正在准备更新','下载并核对资源，请保持工作台打开。','更新中');
  try{
   if(desktop){await desktop.prepare();if(!guard())return;await desktop.activate();}
   else{
    const reg=await worker;if(!reg)throw Error('当前浏览器无法离线更新，请使用 HTTPS 地址或更换浏览器');
    await reg.update();
    const activeId=await new Promise(resolve=>{if(!reg.active)return resolve(null);const channel=new MessageChannel();channel.port1.onmessage=e=>resolve(e.data?.id);reg.active.postMessage({type:'GET_BUILD'},[channel.port2]);setTimeout(()=>resolve(null),1000);});
    if(activeId===target.id){if(guard())location.reload();return;}
    const waiting=await new Promise((resolve,reject)=>{const started=Date.now();const poll=()=>{if(reg.waiting)return resolve(reg.waiting);if(Date.now()-started>90000)return reject(Error('更新资源暂未就绪，请稍后重试'));setTimeout(poll,250);};poll();});
    if(!guard())return;
    // Only the clicked tab reloads. Other tabs keep their pinned resource snapshot.
    updating=true;waiting.postMessage({type:'ACTIVATE_UPDATE'});
   }
  }catch(error){show('更新未完成',error.message+'，当前版本和本机数据已保留。','重试');}
  finally{busy=false;banner.setAttribute('aria-busy','false');action.disabled=false;dismiss.disabled=false;checkButton.disabled=false;}
 }
 action.addEventListener('click',apply);dismiss.addEventListener('click',()=>{dismissed=target?.id||'';banner.hidden=true;checkButton.focus();});checkButton.addEventListener('click',()=>check(true));
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)check();});window.addEventListener('online',()=>check());window.addEventListener('focus',()=>check());
 setInterval(()=>{if(!document.hidden)check();},10*60*1000);
 if(desktop){let confirmed=false;const confirm=()=>{if(!confirmed){confirmed=true;desktop.ready(current.id).catch(()=>{});}};document.addEventListener('workbench:ready',confirm,{once:true});const ready=setInterval(()=>{if(!document.getElementById('workbench-boot')){clearInterval(ready);confirm();}},100);}
 if(location.protocol!=='file:')check();
})();
