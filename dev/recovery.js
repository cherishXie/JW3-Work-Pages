/* Standalone entry: remains reachable when an older worker loses its HTML cache. */
(()=>{
 'use strict';
 const status=document.getElementById('recovery-status'),retry=document.getElementById('recovery-retry');
 async function recover(){
  retry.hidden=true;
  const base=new URL('./',document.baseURI),prefix='jw3-pwa:'+base.href+':';
  try{
   if('serviceWorker'in navigator)for(const registration of await navigator.serviceWorker.getRegistrations())if(registration.scope===base.href)await registration.unregister();
   if('caches'in globalThis)for(const key of await caches.keys())if(key.startsWith(prefix))await caches.delete(key);
   status.textContent='缓存已重置，本机数据保持原样，正在返回工作台…';
   base.searchParams.set('recovered',Date.now());location.replace(base.href);
  }catch(error){status.textContent='恢复未完成：'+error.message+'。本机数据未修改，请重试。';retry.hidden=false;}
 }
 retry.addEventListener('click',recover);recover();
})();
