/* Read-only update transport. Business archives never leave local storage. */
(()=>{
 'use strict';
 const current=globalThis.WorkbenchVersion;if(!current)return;
 const desktop=globalThis.workbenchDesktop?.updates,base=new URL('./',document.baseURI);
 const banner=document.getElementById('app-update'),tag=document.getElementById('update-tag'),message=document.getElementById('update-message'),detail=document.getElementById('update-detail'),action=document.getElementById('update-apply'),dismiss=document.getElementById('update-dismiss'),checkButton=document.getElementById('update-check'),version=document.getElementById('app-version');
 let target=null,registration=null,busy=false,dismissed='',lastCheck=0,updating=false,updateFailure='',notesTimer,notesPinned=false;
 const notesButton=document.createElement('button');notesButton.id='update-notes-toggle';notesButton.type='button';notesButton.className='small update-notes-toggle';notesButton.textContent='更新内容';notesButton.setAttribute('aria-expanded','false');notesButton.setAttribute('aria-controls','update-notes');banner.querySelector('.update-heading').append(notesButton);
 const notes=document.createElement('section');notes.id='update-notes';notes.className='update-notes';notes.hidden=true;notes.tabIndex=0;notes.setAttribute('aria-labelledby','update-notes-title');banner.append(notes);
 const progress=document.createElement('div');progress.className='update-progress';progress.hidden=true;progress.innerHTML='<div class="update-progress-heading"><span id="update-stage" role="status" aria-live="polite"></span><b id="update-percent"></b></div><progress id="update-progress-bar" max="100" aria-label="更新资源准备进度"></progress><small id="update-progress-detail"></small>';detail.after(progress);
 const stage=progress.querySelector('#update-stage'),percent=progress.querySelector('#update-percent'),bar=progress.querySelector('progress'),progressDetail=progress.querySelector('small');
 function hideNotes(){notesPinned=false;clearTimeout(notesTimer);notes.hidden=true;notesButton.setAttribute('aria-expanded','false');}
 function openNotes(){if(banner.hidden)return;clearTimeout(notesTimer);notes.hidden=false;notesButton.setAttribute('aria-expanded','true');}
 function renderNotes(meta){
  notes.replaceChildren();const heading=document.createElement('h3');heading.id='update-notes-title';heading.textContent='更新内容 / '+label(meta);notes.append(heading);
  const items=Array.isArray(meta.releaseNotes?.items)?meta.releaseNotes.items.filter(x=>typeof x==='string').slice(0,100):[];
  if(items.length){const list=document.createElement('ul');for(const text of items){const item=document.createElement('li');item.textContent=text.slice(0,10000);list.append(item);}notes.append(list);}else{const empty=document.createElement('p');empty.textContent='此版本未附更新内容。';notes.append(empty);}
 }
 notesButton.addEventListener('click',()=>{if(notesPinned)hideNotes();else{notesPinned=true;openNotes();}});
 banner.addEventListener('pointerenter',e=>{if(e.pointerType!=='touch')openNotes();});banner.addEventListener('pointerleave',()=>{notesTimer=setTimeout(()=>{if(!notesPinned&&!banner.contains(document.activeElement))hideNotes();},120);});
 notesButton.addEventListener('focus',openNotes);banner.addEventListener('focusout',()=>{notesTimer=setTimeout(()=>{if(!notesPinned&&!banner.matches(':hover')&&!banner.contains(document.activeElement))hideNotes();},120);});
 banner.addEventListener('keydown',e=>{if(e.key==='Escape'&&!notes.hidden){e.preventDefault();e.stopPropagation();hideNotes();notesButton.focus({preventScroll:true});hideNotes();}});
 function paintProgress(data){
  const titles={preparing:'正在检查可复用资源',downloading:'正在下载并核对资源',verifying:'正在核对资源完整性',ready:'资源已就绪，正在准备切换',switching:'正在切换到新版本'};
  progress.hidden=false;stage.textContent=titles[data.phase]||'正在准备更新';
  if(Number.isFinite(data.total)&&data.total>0&&Number.isFinite(data.loaded)){const value=data.phase==='ready'||data.phase==='switching'?100:Math.min(99,Math.floor(data.loaded/data.total*100));bar.value=Math.max(0,value);percent.textContent=value+'%';}else{bar.removeAttribute('value');percent.textContent='';}
  const mb=n=>(n/1048576).toFixed(1)+' MB';progressDetail.textContent=Number.isFinite(data.count)?'已核对 '+data.completed+' / '+data.count+' 个资源'+(Number.isFinite(data.total)?' / '+mb(Math.min(data.loaded,data.total))+' / '+mb(data.total):'')+(data.reused?' / '+data.reused+' 个使用已校验缓存':''):'下载完成后会核对完整性，本机数据会保留。';
 }
 function receiveProgress(data){if(!busy||data?.type!=='UPDATE_PROGRESS'||data.id!==target?.id)return;if(data.phase==='error'){updateFailure=data.error||'资源准备失败';return;}paintProgress(data);}
 if('serviceWorker'in navigator)navigator.serviceWorker.addEventListener('message',e=>{if(e.source?.scriptURL&&new URL(e.source.scriptURL).href!==new URL('sw.js',base).href)return;receiveProgress(e.data);});
 function queryWorker(worker,type){return new Promise(resolve=>{if(!worker)return resolve(null);const channel=new MessageChannel(),timer=setTimeout(()=>{channel.port1.close();resolve(null);},1000);channel.port1.onmessage=e=>{clearTimeout(timer);channel.port1.close();resolve(e.data);};worker.postMessage({type},[channel.port2]);});}

 const label=m=>m.version+' '+(m.channel==='dev'?'开发版':'正式版')+' '+m.sourceCommit.slice(0,7);
 version.textContent=label(current);
 function show(title,description,button='立即更新',state='available'){banner.dataset.state=state;tag.textContent={available:'有新版本',progress:'更新中',attention:'待处理',error:'需重试',current:'已是最新'}[state];banner.hidden=false;banner.setAttribute('aria-busy',String(busy));message.textContent=title;detail.textContent=description;action.textContent=button;action.hidden=!button;action.disabled=busy;dismiss.disabled=busy;progress.hidden=state!=='progress';renderNotes(state==='current'?current:target||current);}
 function guard(){const event=new CustomEvent('workbench:before-update',{cancelable:true});if(!document.dispatchEvent(event)){show('请先保存当前内容','完成或退出当前编辑与排程后，再点击更新。','立即更新','attention');return false;}return true;}
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
   if(latest.id!==current.id&&(force||dismissed!==latest.id))show(label(latest),'更新后重新打开工作台，本机数据会保留。',desktop&&latest.protocol!==current.protocol?'下载安装包':'立即更新');
   else if(force)show('当前版本',label(current),'','current');
  }catch(error){if(force)show('更新检查未完成',navigator.onLine===false?'当前离线，可继续使用已缓存的版本。':error.message,'重试','error');}
  finally{checkButton.disabled=false;}
 }
 async function apply(){
  if(busy)return;if(!target||target.id===current.id){await check(true);return;}if(!guard())return;
  if(desktop&&target.protocol!==current.protocol){await desktop.openInstaller();return;}
  busy=true;updateFailure='';checkButton.disabled=true;hideNotes();show('正在准备更新','完成核对后切换版本，请保持工作台打开。','更新中','progress');paintProgress({phase:'preparing'});
  try{
   if(desktop){paintProgress({phase:'downloading'});await desktop.prepare();if(!guard())return;paintProgress({phase:'switching',loaded:1,total:1});await desktop.activate();}
   else{
    const reg=await worker;if(!reg)throw Error('当前浏览器无法离线更新，请使用 HTTPS 地址或更换浏览器');
    await reg.update();
    const activeId=(await queryWorker(reg.active,'GET_BUILD'))?.id;
    if(activeId===target.id){if(guard()){paintProgress({phase:'switching',loaded:1,total:1});location.reload();}return;}
    const waiting=await new Promise((resolve,reject)=>{const started=Date.now();let checking=false;
     const poll=async()=>{if(checking)return;checking=true;try{
       if(updateFailure)return reject(Error(updateFailure));
       const candidate=reg.waiting||reg.installing;if(candidate){const data=await queryWorker(candidate,'GET_UPDATE_PROGRESS');receiveProgress(data);if(updateFailure)return reject(Error(updateFailure));}
       if(reg.waiting){const build=await queryWorker(reg.waiting,'GET_BUILD');if(build?.id===target.id)return resolve(reg.waiting);if(build?.id)return reject(Error('服务器版本已变化，请重新检查更新'));}
       if(Date.now()-started>90000)return reject(Error('资源准备超时，请检查网络后重试'));
       if(Date.now()-started>15000)detail.textContent='正在处理离线资源，进度会随下载与校验更新；当前版本与本机数据保留。';
       setTimeout(poll,500);
      }catch(error){reject(error);}finally{checking=false;}};poll();});
    if(!guard())return;
    // Only the clicked tab reloads. Other tabs keep their pinned resource snapshot.
    paintProgress({phase:'switching',loaded:1,total:1});updating=true;waiting.postMessage({type:'ACTIVATE_UPDATE'});
   }
  }catch(error){show('更新未完成',error.message+'，当前版本和本机数据已保留。','重试','error');}
  finally{busy=false;banner.setAttribute('aria-busy','false');action.disabled=false;dismiss.disabled=false;checkButton.disabled=false;}
 }
 action.addEventListener('click',apply);dismiss.addEventListener('click',()=>{dismissed=target?.id||'';banner.hidden=true;hideNotes();checkButton.focus();});checkButton.addEventListener('click',()=>check(true));
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)check();});window.addEventListener('online',()=>check());window.addEventListener('focus',()=>check());
 setInterval(()=>{if(!document.hidden)check();},10*60*1000);
 if(desktop){let confirmed=false;const confirm=()=>{if(!confirmed){confirmed=true;desktop.ready(current.id).catch(()=>{});}};document.addEventListener('workbench:ready',confirm,{once:true});const ready=setInterval(()=>{if(!document.getElementById('workbench-boot')){clearInterval(ready);confirm();}},100);}
 if(location.protocol!=='file:')check();
})();
