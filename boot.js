/* Startup diagnostics and recovery. Application caches never contain user archives. */
(() => {
  const started=performance.now(),motion=matchMedia('(prefers-reduced-motion: reduce)');
  let ready=false,failed=false,failure,last='正在加载工作台',timer,exit;
  const el=id=>document.getElementById(id),message=error=>error?.message||String(error||'浏览器未提供错误详情');
  function stage(text){if(failed)return;last=text;if(el('boot-status'))el('boot-status').textContent=text;}
  function recovery(){if(el('boot-retry'))el('boot-retry').hidden=false;if(el('boot-recovery'))el('boot-recovery').hidden=false;if(el('boot-repair'))el('boot-repair').hidden=!['http:','https:'].includes(location.protocol);}
  function tick(){const elapsed=performance.now()-started;if(el('boot-elapsed'))el('boot-elapsed').textContent='已等待 '+Math.floor(elapsed/1000)+' 秒';if(elapsed>15000){recovery();if(el('boot-hint')){el('boot-hint').hidden=false;el('boot-hint').textContent='启动用时较长，可先导出原始备份；重新下载应用只清理此页面的应用缓存，不删除本机档案。';}}}
  function fail(error){
    if(ready)return;if(!failed){failed=true;failure=error;}clearInterval(timer);
    if(el('boot-status'))el('boot-status').textContent='工作台未能启动';
    el('workbench-boot')?.setAttribute('aria-busy','false');
    if(el('boot-error'))el('boot-error').hidden=false;
    if(el('boot-error-detail'))el('boot-error-detail').textContent=last+'\n'+message(failure);
    if(el('boot-hint')){el('boot-hint').hidden=false;el('boot-hint').textContent='本机原始档案仍保留。请先导出备份，再尝试重新加载或重新下载应用。';}
    recovery();
  }
  function finish(){if(ready)return;ready=true;failed=false;clearInterval(timer);document.dispatchEvent(new Event('workbench:ready'));const root=el('workbench-boot');if(!root)return;stage('工作台已就绪');root.setAttribute('aria-busy','false');document.body.classList.add('workbench-ready');const cleanup=()=>root.remove();if(!motion.matches&&typeof root.animate==='function'){exit=root.animate([{opacity:1},{opacity:0}],{duration:320,easing:'ease-out'});exit.finished.catch(()=>{}).finally(cleanup);}else cleanup();}
  const modules=new Map(),globals={zip:'JSZip',ocr:'Tesseract',verification:'Verification'};
  function loadModule(name){
    if(!Object.prototype.hasOwnProperty.call(globals,name))return Promise.reject(new Error('未知工作台组件'));
    if(globalThis[globals[name]])return Promise.resolve();
    if(!modules.has(name)){const source=document.querySelector('script[data-workbench-module="'+name+'"]');if(!source)return Promise.reject(new Error('组件未打包，请刷新工作台'));
      modules.set(name,new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=source.getAttribute('src');script.onload=()=>resolve();script.onerror=()=>{modules.delete(name);script.remove();reject(new Error('工作台组件加载失败，请重试'));};document.head.append(script);}));}
    return modules.get(name);
  }
  function backup(){
    const storage=globalThis.WorkbenchPlatform?.storage||globalThis.workbenchDesktop?.storage||globalThis.localStorage;
    const raw={format:'jx3-startup-recovery-v1',savedAt:new Date().toISOString(),current:storage.getItem('jx3-workbench-data-v2'),legacy:storage.getItem('jx3-workbench-v1'),experience:storage.getItem('jx3-workbench-experience-v1')};
    const url=URL.createObjectURL(new Blob([JSON.stringify(raw,null,2)],{type:'application/json'})),link=document.createElement('a');link.href=url;link.download='JX3_startup_raw_backup.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  async function repair(){
    const base=new URL('./',document.baseURI).href,prefix='jw3-pwa:'+base+':';
    // Scope checks protect the independent stable/dev channel and other apps.
    if('serviceWorker'in navigator)for(const registration of await navigator.serviceWorker.getRegistrations())if(registration.scope===base)await registration.unregister();
    if('caches'in globalThis)for(const key of await caches.keys())if(key.startsWith(prefix))await caches.delete(key);
    const url=new URL(location.href);url.searchParams.set('startup-recovery',Date.now());location.replace(url.href);
  }
  globalThis.WorkbenchBoot={stage,fail,finish,started,loadModule};
  window.addEventListener('error',event=>{if(event.error||event.message)fail(event.error||event.message);});
  window.addEventListener('unhandledrejection',event=>fail(event.reason));
  document.addEventListener('load',event=>{if(event.target.tagName==='SCRIPT'&&!ready){const name=(event.target.getAttribute('src')||'').split('/').pop();stage(name?.startsWith('app.js')?'正在准备本地档案':'正在加载工作台组件');}},true);
  document.addEventListener('error',event=>{if(event.target.tagName==='SCRIPT'&&!ready)fail(new Error('应用组件加载失败：'+(event.target.getAttribute('src')||'未知组件')));},true);
  document.addEventListener('click',async event=>{
    const button=event.target.closest?.('#boot-retry,#boot-backup,#boot-repair');if(!button)return;
    try{if(button.id==='boot-retry')location.reload();else if(button.id==='boot-backup')backup();else{button.disabled=true;await repair();}}
    catch(error){button.disabled=false;if(el('boot-hint')){el('boot-hint').hidden=false;el('boot-hint').textContent='操作未完成：'+message(error)+'。本机档案未删除。';}}
  });
  document.addEventListener('DOMContentLoaded',()=>{if(failed)fail(failure);else{stage(last);tick();if(!ready)timer=setInterval(tick,1000);}});
  motion.addEventListener?.('change',()=>{if(motion.matches)exit?.cancel();});
})();
