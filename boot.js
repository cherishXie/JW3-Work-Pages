/* Small startup controller. Script downloads and data preparation report real stages. */
(() => {
  const started=performance.now(),motion=matchMedia('(prefers-reduced-motion: reduce)');
  let ready=false,last='正在加载工作台',timer,exit;
  const label=()=>document.getElementById('boot-status');
  function stage(message){last=message;const el=label();if(el)el.textContent=message;}
  function tick(){const elapsed=document.getElementById('boot-elapsed');if(elapsed)elapsed.textContent='已等待 '+Math.floor((performance.now()-started)/1000)+' 秒';const retry=document.getElementById('boot-retry');if(retry&&performance.now()-started>15000)retry.hidden=false;}
  function finish(){if(ready)return;ready=true;clearInterval(timer);const el=document.getElementById('workbench-boot');if(!el)return;stage('工作台已就绪');el.setAttribute('aria-busy','false');document.body.classList.add('workbench-ready');const cleanup=()=>el.remove();if(!motion.matches&&typeof el.animate==='function'){exit=el.animate([{opacity:1},{opacity:0}],{duration:320,easing:'ease-out'});exit.finished.catch(()=>{}).finally(cleanup);}else cleanup();}
  const modules=new Map(),globals={zip:'JSZip',ocr:'Tesseract',verification:'Verification'};
  function loadModule(name){
    if(!Object.hasOwn(globals,name))return Promise.reject(new Error('未知工作台组件'));
    if(globalThis[globals[name]])return Promise.resolve();
    if(!modules.has(name)){const source=document.querySelector('script[data-workbench-module="'+name+'"]');if(!source)return Promise.reject(new Error('组件未打包，请刷新工作台'));
      modules.set(name,new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=source.getAttribute('src');script.onload=()=>resolve();script.onerror=()=>{modules.delete(name);script.remove();reject(new Error('工作台组件加载失败，请重试'));};document.head.append(script);}));}
    return modules.get(name);
  }
  globalThis.WorkbenchBoot={stage,finish,started,loadModule};
  document.addEventListener('load',e=>{if(e.target.tagName==='SCRIPT'&&!ready){const name=(e.target.getAttribute('src')||'').split('/').pop();stage(name?.startsWith('app.js')?'正在准备本地档案':'正在加载工作台组件');}},true);
  document.addEventListener('error',e=>{if(e.target.tagName==='SCRIPT'&&!ready){stage('组件加载未完成，请检查网络后重试');const retry=document.getElementById('boot-retry');if(retry)retry.hidden=false;}},true);
  document.addEventListener('click',e=>{if(e.target.closest('#boot-retry'))location.reload();});
  document.addEventListener('DOMContentLoaded',()=>{stage(last);tick();if(!ready)timer=setInterval(tick,1000);});
  motion.addEventListener?.('change',()=>{if(motion.matches)exit?.cancel();});
})();
