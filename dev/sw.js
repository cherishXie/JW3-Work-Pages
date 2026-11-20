const BUILD={"id":"9522ef70d04ed440927e041423119f0bc138554d18a48c87db57a8e8887fb623","version":"0.12.0-dev.73","channel":"dev","sourceCommit":"c3ca55331160f619677672055ad00e0188b9522b","sourceTimestamp":1795141920,"protocol":2,"releaseNotes":{"title":"本次更新","items":["按 `docs/design` 设计规范与模块交互规范落地统一界面基线：侧栏 256px、导航项 36px 高、页头 64px 粘顶模糊、页面内边距 24px；统一卡片语法（一卡一问、口径常驻、控件贴右上、最多两个操作）、32px 控件与 6px 圆角、表头 12px 无底色与 40px 密集行、数字等宽右对齐、首列固定。保留既有 Radix 色阶、0.5px 描边、不小于 12px 字号与全部业务功能。","总览首屏摘要卡改为随内容增高，不再以固定高度裁切口径与脚注；进度条填充在所有用法下可见；1024px 与 390px 分别保持三卡与单列排布，脚注不再截断。","账号与角色：取消左侧重复账号长列表，改为横排账号筛选；账号档案卡宽屏两列并排，新增期间摘要条；新增「角色」页签，以可点击角色卡展示门派心法、定位、净收益、净时薪、操作时间与装分，支持分页与查找。","收益分析移除与顶部筛选重复的日期工具条，期间与口径跟随顶部筛选；设置页「经营参数」与「工作空间与数据」宽屏并排，补充数据性质、保存时间与快捷入口。","侧栏新增「物价助手」快捷入口，在新标签页打开外部物价计算器。","修复大档案存储：浏览器存储接近上限时改用压缩写入，保留原数据并给出可操作提示；Excel 与茗伊导入上限放宽到 64 MB。","合成数据交互合同更新为当前顶栏筛选与任务查漏入口，继续覆盖无效日期保留已应用期间、跨页复选、主题与减少动态效果、截图重试、报价检索、移动端导航与导出等检查。"]},"files":[{"name":"recover.html","bytes":792,"sha256":"01446ebc275a21641514d9636c1b65a01d7e853a4fa43c5f8d2d9d5b02de0cbb"},{"name":"recovery.js","bytes":1005,"sha256":"1cffe7d6ec962be656f6b88f2d2741d0a1f4111a14f697d6978d8e87ab256c15"},{"name":"update.js","bytes":11317,"sha256":"683d75be0d82c988793494e13cc6c567c601c30c4fabfe6e810d07aa08176c82"},{"name":"manifest.webmanifest","bytes":558,"sha256":"ddcc4ae18491270596fead2a23936920cdbabff4225183f573968aa560acecf3"},{"name":"app-icon.png","bytes":10227,"sha256":"c5848b98691ea72c88d811edfa03a3d1dd66b5f2988c6c6e9d1d3d45bd0b28b2"},{"name":"app-icon-192.png","bytes":6423,"sha256":"5693fddf44cb3c93ab0f21ad527eb2c5c0b19942b059b85ab454c6d59c7ab0ea"},{"name":"app-icon-512.png","bytes":17971,"sha256":"e8071fa01086140f1ebb5c1fc262643aab7b0b6ab4f7901f95d5131f06cba263"},{"name":"screenshot.js","bytes":38757,"sha256":"fcf4bda1e29e5361380a4ba6b9c8bc887e331e87d7a86b92c3abb3a6f9a4d276"},{"name":"vendor/ocr/CORE-LICENSE.txt","bytes":11358,"sha256":"c6596eb7be8581c18be736c846fb9173b69eccf6ef94c5135893ec56bd92ba08"},{"name":"vendor/ocr/DATA-LICENSE.txt","bytes":11358,"sha256":"cfc7749b96f63bd31c3c42b5c471bf756814053e847c10f3eb003417bc523d30"},{"name":"vendor/ocr/LICENSE.txt","bytes":11357,"sha256":"b40930bbcf80744c86c46a12bc9da056641d722716c378f5659b9e555ef833e1"},{"name":"vendor/ocr/chi_sim.traineddata.gz","bytes":1730011,"sha256":"3aa140069a09796b8cb8d3ccd0c052e8ed67f20cddb24b70ffa3344b3b94346b"},{"name":"vendor/ocr/tesseract-core-lstm.wasm","bytes":2871085,"sha256":"220e2e87551edccb85519796a170469f8ab2a8055216789e3b8b1ada18b7bc2b"},{"name":"vendor/ocr/tesseract-core-lstm.wasm.js","bytes":3954181,"sha256":"775a35df6f2ae100e02609443e6bd5cafcd07983dd6175454ca4a432a7730687"},{"name":"vendor/ocr/tesseract-core-simd-lstm.wasm","bytes":2871377,"sha256":"187d76742dfc0d8929f0b49a619f145bb6370730776c7bd0d3e20c6b2098808d"},{"name":"vendor/ocr/tesseract-core-simd-lstm.wasm.js","bytes":3954569,"sha256":"9d7c43fb206dc9f48475228b46bf35f888fa9e6259da2e67d5a75c77049f2dc7"},{"name":"vendor/ocr/tesseract.min.js","bytes":62961,"sha256":"10fff78484067759c43028a02a72d76d0b90eb17302bb23b58a9ec5410bc928b"},{"name":"vendor/ocr/worker.min.js","bytes":111162,"sha256":"38645599043239c0eb6db08a6504a92dcdc292200535f3e9339cd77c4443b842"},{"name":"vendor/sql-wasm.js","bytes":48788,"sha256":"694ca5b36aa3e6e71f417819d7df390b65343665fcfa5c69015ca33d93d291b3"},{"name":"vendor/sql-wasm.wasm","bytes":659806,"sha256":"0734155c83e493983d1f2ff5b09a4fab6e35a32e9449c7e4e545756439f62d73"},{"name":"vendor/sql-js-LICENSE.txt","bytes":2199,"sha256":"60a3f6e4d7b29b4321359e683b36cf198d24f58e24582070f56e6fa89d5ee2be"},{"name":"index.html","bytes":6376,"sha256":"d0fdcbb1b8028c6cb1ee7817c0423d8ea84a3219010e713f7a5a2e199477c66c"},{"name":"boot.js","bytes":5720,"sha256":"bb00936e12a31404be1af7f3236340858032e04fd60b2dcbdd79071b00ef6943"},{"name":"platform.js","bytes":1023,"sha256":"b2c0e38bc718fa1d22209063df55df7fd03642e883b47e2400b76aea0952b047"},{"name":"styles.css","bytes":390830,"sha256":"845675c591fe928dd522b34c30a567e5c264155b2935808929a13b07b0abc5c6"},{"name":"themes.js","bytes":12409,"sha256":"5eae62ba5380fcde9ca23170c90c55264664defe61bd4dec7fc6147f2b2ca54c"},{"name":"catalog.js","bytes":10552,"sha256":"f3ddfc8ecb06d4eb74f102e1dde8faa3221eaec4fff3d31fe4eecd3c98cc3166"},{"name":"raid-catalog.js","bytes":24472,"sha256":"ea9207b81b5c296d03fcfa43cf9dcc156afdc6583c348b4ca83c1146069dcf25"},{"name":"model.js","bytes":212030,"sha256":"5b1266e5540a5f2306c89e27728d6234380423c29d4e9fc705b79b8cacd443c4"},{"name":"operations.js","bytes":15568,"sha256":"78cb17ede09ed38682f5d57d0614a2d91012b2c96b9e1e818272fc4b22506860"},{"name":"activity.js","bytes":16747,"sha256":"f2e4fbcb09b75b64ace2e37bbfac34a63216f83d7b44f8069288e56d63416f14"},{"name":"storage.js","bytes":9218,"sha256":"dfcd867207af54742694e839c0b1f24df42ee451d0cdef99fd26947387daf9ab"},{"name":"storage-worker.js","bytes":675,"sha256":"248a2bbb4f52d974eb1052f0111317cfeeec43c2ae95e6311d0919674902b71b"},{"name":"verification.js","bytes":58037,"sha256":"b57105a403a56de4ac2d0537a1b93631385e707de37a2ccb632cb3e86b880763"},{"name":"vendor/jszip.min.js","bytes":97630,"sha256":"acc7e41455a80765b5fd9c7ee1b8078a6d160bbbca455aeae854de65c947d59e"},{"name":"daily.js","bytes":57531,"sha256":"322632c06431cda735e9d04571193a112a0fe66426a2128790ea6b88512ab026"},{"name":"execution.js","bytes":5388,"sha256":"74819c9fc4c0bd35916b1739a7aba4f15127a7041974440316d2c29ae2f578cc"},{"name":"importer.js","bytes":22562,"sha256":"2750588b12b4d8789dd5504fd0121b2122ffaae0a5b7e9bf3d121a06c6f61cc2"},{"name":"roi.js","bytes":18593,"sha256":"f9ceb49392be2731e6e2cb47fae88ea54706cab9b421b81cdd201e37449f56b0"},{"name":"jx3box.js","bytes":3460,"sha256":"3c8a3067ad788d37094f64fa4ed6cef7ca01fccd5f7546c467dec02d075cec0a"},{"name":"app.js","bytes":843409,"sha256":"fdf34974ae7f46e29c0f6dd2e3b4c6e5673a73904fda4f2d0f5d44e6832217a0"},{"name":"version.js","bytes":1987,"sha256":"a1b26e79245ca12bc379df595871d6cfb0b4433d8843dfee05903749b5ab51a9"}]};
/* Generated sw.js prepends BUILD. Only complete, hash-checked snapshots activate. */
'use strict';
const BASE=self.registration.scope,PREFIX='jw3-pwa:'+BASE+':',CACHE=PREFIX+BUILD.id,PINS=PREFIX+'clients';
const records=new Map(BUILD.files.map(f=>[new URL(f.name,BASE).href,f]));
const pinKey=id=>BASE+'__client__/'+encodeURIComponent(id);
async function pin(id,build){if(id)await(await caches.open(PINS)).put(pinKey(id),new Response(build));}
async function clientCache(id){const p=id&&await(await caches.open(PINS)).match(pinKey(id));return p?PREFIX+await p.text():CACHE;}
const digest=async b=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',b))].map(v=>v.toString(16).padStart(2,'0')).join('');
let updateProgress={type:'UPDATE_PROGRESS',id:BUILD.id,phase:'preparing',loaded:0,total:BUILD.files.reduce((n,f)=>n+f.bytes,0),completed:0,count:BUILD.files.length,reused:0};
let lastProgress=0;
async function reportProgress(force=false){
 if(!force&&Date.now()-lastProgress<100)return;lastProgress=Date.now();
 try{for(const client of await self.clients.matchAll({includeUncontrolled:true}))if(client.url.startsWith(BASE))client.postMessage(updateProgress);}catch{}
}
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const cache=await caches.open(CACHE),older=(await caches.keys()).filter(k=>k.startsWith(PREFIX)&&k!==PINS&&k!==CACHE).reverse(),inflight=new Map();let next=0,verified=0,failed=false;
 const publish=(phase,force=false)=>{updateProgress={...updateProgress,phase,loaded:Math.min(updateProgress.total,verified+[...inflight.values()].reduce((n,b)=>n+b,0))};return reportProgress(force);};
 async function reusable(url,record){
  for(const name of older){try{const hit=await(await caches.open(name)).match(url);if(!hit)continue;const bytes=await hit.clone().arrayBuffer();if(bytes.byteLength===record.bytes&&await digest(bytes)===record.sha256)return hit;}catch{}}
  return null;
 }
 async function download(url,record){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),30000);
  try{const response=await fetch(url+'?snapshot='+BUILD.id,{cache:'no-store',signal:controller.signal});if(!response.ok)throw Error('更新资源下载失败');
   const body=response.clone(),chunks=[];let length=0;
   if(body.body?.getReader){const reader=body.body.getReader();for(;;){const {done,value}=await reader.read();if(done)break;chunks.push(value);length+=value.byteLength;if(length>record.bytes)throw Error('更新资源大小不匹配');inflight.set(url,length);await publish('downloading');}}
   else{const bytes=new Uint8Array(await body.arrayBuffer());chunks.push(bytes);length=bytes.length;}
   const bytes=new Uint8Array(length);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
   await publish('verifying');if(length!==record.bytes||await digest(bytes)!==record.sha256)throw Error('更新资源完整性校验失败');return response;
  }finally{clearTimeout(timer);}
 }
 try{
  await publish('preparing',true);
  const results=await Promise.allSettled(Array.from({length:4},async()=>{for(;;){if(failed)return;const entry=[...records][next++];if(!entry)return;const [url,record]=entry;try{let response=await reusable(url,record);if(response)updateProgress.reused++;else response=await download(url,record);await cache.put(url,response);inflight.delete(url);verified+=record.bytes;updateProgress.completed++;await publish('downloading',true);}catch(error){failed=true;throw error;}}}));
  const error=results.find(r=>r.status==='rejected');if(error)throw error.reason;
  updateProgress={...updateProgress,phase:'ready',loaded:updateProgress.total};await reportProgress(true);
 }catch(error){await caches.delete(CACHE);updateProgress={...updateProgress,phase:'error',error:error.message};await reportProgress(true);throw error;}
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 await self.clients.claim();
 const store=await caches.open(PINS),live=await self.clients.matchAll({includeUncontrolled:true});
 const retained=new Set([CACHE,PINS]);for(const client of live){const p=await store.match(pinKey(client.id));if(p)retained.add(PREFIX+await p.text());}
 for(const key of await caches.keys())if(key.startsWith(PREFIX)&&!retained.has(key))await caches.delete(key);
})()));
self.addEventListener('message',event=>{
 if(event.data?.type==='GET_UPDATE_PROGRESS')event.ports[0]?.postMessage(updateProgress);
 if(event.data?.type==='GET_BUILD')event.ports[0]?.postMessage({id:BUILD.id});
 if(event.data?.type==='ACTIVATE_UPDATE')event.waitUntil(self.skipWaiting());
 if(event.data?.type==='PIN_BUILD'&&/^[a-f0-9]{64}$/.test(event.data.id)&&event.source?.id)event.waitUntil(pin(event.source.id,event.data.id));
});
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;
 const url=new URL(event.request.url),base=new URL(BASE);
 if(url.origin!==base.origin||!url.href.startsWith(BASE))return;
 const relative=url.pathname.slice(base.pathname.length);
 // A root stable worker must never capture the independent dev channel.
 if(relative.startsWith('dev/'))return;
 if(['update-manifest.json','version.json','sw.js','recover.html','recovery.js'].includes(relative)){event.respondWith(fetch(event.request,{cache:'no-store'}));return;}
 const navigation=event.request.mode==='navigate'&&(relative===''||relative==='index.html');
 event.respondWith((async()=>{
  // CacheStorage can be evicted independently of the service worker registration.
  // Never resolve a navigation with undefined, or mix network HTML with an old
  // partial snapshot. Cache and pin failures must not prevent an online visit.
  try{
   const requested=url.searchParams.get('snapshot'),pinned=/^[a-f0-9]{64}$/.test(requested)?PREFIX+requested:null;
   const cache=await caches.open(pinned||(navigation?CACHE:await clientCache(event.clientId)));
   const index=await cache.match(new URL('index.html',BASE).href);
   if(index){
    if(navigation){await pin(event.resultingClientId||event.clientId,BUILD.id).catch(()=>{});return index;}
    const response=await cache.match(url.origin+url.pathname);if(response)return response;
   }
   if(pinned)return new Response('Pinned update resource unavailable',{status:503});
  }catch{if(/^[a-f0-9]{64}$/.test(url.searchParams.get('snapshot')))return new Response('Pinned update resource unavailable',{status:503});}
  return fetch(event.request,{cache:'no-store'});
 })());
});
