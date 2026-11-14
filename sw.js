const BUILD={"id":"75c2e8f3205536c4f37b5e26d7dd29dabe1e5a8bc18219417931ee2a592d1681","version":"0.10.0","channel":"main","sourceCommit":"7bc6e3baafddfb46012926d73e741816f176dd72","sourceTimestamp":1794636983,"protocol":2,"releaseNotes":{"title":"0.10.0","items":["修复新建或编辑自定义队伍后任务安排列表未立即显示的问题：保存成功后同步队伍性质、人数与所在分页，清除旧搜索条件并刷新列表，可直接应用到当前任务与副本。","自定义队伍分为固定与临时两类：固定队伍跨人数检查账号与角色占用，临时队伍允许复用；旧队伍按固定队伍保留，实际排程仍检查同队登录、资格、区服、职责和 CD。任务安排压缩顶部与操作区，已确认信息默认折叠，宽屏并排展示副本池与路线、队伍筛选与列表，保留四步流程及选择。","大战分批规则支持拖拽、键盘与上下移动排序，默认依次为账号连续使用、门派增益与 DPS 协同、T 分散、装分均衡、远近战均衡；可恢复默认并记住偏好，生成与复核使用相同顺序，已保存排程保留当时规则；账号互斥、资格、CD、区服、职责及共战等约束始终校验。","大战自动分批先尽量沿用相邻批次账号、减少重新登录与角色切换，再组合当前赛季可核实的门派增益和输出协同，远近战比例降为末级参考；同类效果去重、阵法只选一个，条件奇穴以低权重潜力参考，阵容复核可查看提供者、受益角色与版本依据；保留职责、共战、账号互斥、区服、固定成员和原有历史排程。","角色侠客配置标明苍生铸世赛季，纳入新增侠客何其鲜并标注赛季来源；账号角色分析同级新增生活技艺分析，按技艺查看专精、未专精、待补与等级分布，点击分布可搜索、分页查看角色及编辑档案，区分未知和零等级，沿用模块独立范围。"]},"files":[{"name":"recover.html","bytes":792,"sha256":"01446ebc275a21641514d9636c1b65a01d7e853a4fa43c5f8d2d9d5b02de0cbb"},{"name":"recovery.js","bytes":1005,"sha256":"1cffe7d6ec962be656f6b88f2d2741d0a1f4111a14f697d6978d8e87ab256c15"},{"name":"update.js","bytes":11317,"sha256":"683d75be0d82c988793494e13cc6c567c601c30c4fabfe6e810d07aa08176c82"},{"name":"manifest.webmanifest","bytes":558,"sha256":"ddcc4ae18491270596fead2a23936920cdbabff4225183f573968aa560acecf3"},{"name":"app-icon.png","bytes":10227,"sha256":"c5848b98691ea72c88d811edfa03a3d1dd66b5f2988c6c6e9d1d3d45bd0b28b2"},{"name":"app-icon-192.png","bytes":6423,"sha256":"5693fddf44cb3c93ab0f21ad527eb2c5c0b19942b059b85ab454c6d59c7ab0ea"},{"name":"app-icon-512.png","bytes":17971,"sha256":"e8071fa01086140f1ebb5c1fc262643aab7b0b6ab4f7901f95d5131f06cba263"},{"name":"screenshot.js","bytes":33036,"sha256":"c5e24693e1971c0dd12a22fa10c419f8358fa86d74ad9bee6c027aa279e4f87e"},{"name":"vendor/ocr/CORE-LICENSE.txt","bytes":11358,"sha256":"c6596eb7be8581c18be736c846fb9173b69eccf6ef94c5135893ec56bd92ba08"},{"name":"vendor/ocr/DATA-LICENSE.txt","bytes":11358,"sha256":"cfc7749b96f63bd31c3c42b5c471bf756814053e847c10f3eb003417bc523d30"},{"name":"vendor/ocr/LICENSE.txt","bytes":11357,"sha256":"b40930bbcf80744c86c46a12bc9da056641d722716c378f5659b9e555ef833e1"},{"name":"vendor/ocr/chi_sim.traineddata.gz","bytes":1730011,"sha256":"3aa140069a09796b8cb8d3ccd0c052e8ed67f20cddb24b70ffa3344b3b94346b"},{"name":"vendor/ocr/tesseract-core-lstm.wasm","bytes":2871085,"sha256":"220e2e87551edccb85519796a170469f8ab2a8055216789e3b8b1ada18b7bc2b"},{"name":"vendor/ocr/tesseract-core-lstm.wasm.js","bytes":3954181,"sha256":"775a35df6f2ae100e02609443e6bd5cafcd07983dd6175454ca4a432a7730687"},{"name":"vendor/ocr/tesseract-core-simd-lstm.wasm","bytes":2871377,"sha256":"187d76742dfc0d8929f0b49a619f145bb6370730776c7bd0d3e20c6b2098808d"},{"name":"vendor/ocr/tesseract-core-simd-lstm.wasm.js","bytes":3954569,"sha256":"9d7c43fb206dc9f48475228b46bf35f888fa9e6259da2e67d5a75c77049f2dc7"},{"name":"vendor/ocr/tesseract.min.js","bytes":62961,"sha256":"10fff78484067759c43028a02a72d76d0b90eb17302bb23b58a9ec5410bc928b"},{"name":"vendor/ocr/worker.min.js","bytes":111162,"sha256":"38645599043239c0eb6db08a6504a92dcdc292200535f3e9339cd77c4443b842"},{"name":"vendor/sql-wasm.js","bytes":48788,"sha256":"694ca5b36aa3e6e71f417819d7df390b65343665fcfa5c69015ca33d93d291b3"},{"name":"vendor/sql-wasm.wasm","bytes":659806,"sha256":"0734155c83e493983d1f2ff5b09a4fab6e35a32e9449c7e4e545756439f62d73"},{"name":"vendor/sql-js-LICENSE.txt","bytes":2199,"sha256":"60a3f6e4d7b29b4321359e683b36cf198d24f58e24582070f56e6fa89d5ee2be"},{"name":"index.html","bytes":6377,"sha256":"10907f0b21a2425cc8dbe8ad06f978c0f4fd79efb3b392ace21912f4122b4d06"},{"name":"boot.js","bytes":5720,"sha256":"bb00936e12a31404be1af7f3236340858032e04fd60b2dcbdd79071b00ef6943"},{"name":"platform.js","bytes":1023,"sha256":"b2c0e38bc718fa1d22209063df55df7fd03642e883b47e2400b76aea0952b047"},{"name":"styles.css","bytes":328626,"sha256":"a1d5e1e4ad55217168684f123e3b011f179a64ed6d371e730ff005b08ebec003"},{"name":"themes.js","bytes":12928,"sha256":"6d3b1b790a8c88f0a3340c1961ace3c12732a22fa60f30ba697c074cca86a89b"},{"name":"catalog.js","bytes":10552,"sha256":"f3ddfc8ecb06d4eb74f102e1dde8faa3221eaec4fff3d31fe4eecd3c98cc3166"},{"name":"raid-catalog.js","bytes":24472,"sha256":"ea9207b81b5c296d03fcfa43cf9dcc156afdc6583c348b4ca83c1146069dcf25"},{"name":"model.js","bytes":205737,"sha256":"8e9f098d2f545c4d85dcb14b45771aba24c6d2f798974773eb2ebf198ed8947a"},{"name":"operations.js","bytes":15568,"sha256":"78cb17ede09ed38682f5d57d0614a2d91012b2c96b9e1e818272fc4b22506860"},{"name":"activity.js","bytes":16707,"sha256":"adcc9c2cf14850e46a943d4cf6c7e146ab0c66fdebbd60af0f9688ea9c71390d"},{"name":"storage.js","bytes":6358,"sha256":"8cc400cd317fec512cc9ceaee85396386151a49860be264cde89fc9cb34044a6"},{"name":"storage-worker.js","bytes":675,"sha256":"248a2bbb4f52d974eb1052f0111317cfeeec43c2ae95e6311d0919674902b71b"},{"name":"verification.js","bytes":51043,"sha256":"0a6aaedf54b8401d96fa0ba636c619a584feb90592f179c2202a0e726061401b"},{"name":"vendor/jszip.min.js","bytes":97630,"sha256":"acc7e41455a80765b5fd9c7ee1b8078a6d160bbbca455aeae854de65c947d59e"},{"name":"daily.js","bytes":57531,"sha256":"322632c06431cda735e9d04571193a112a0fe66426a2128790ea6b88512ab026"},{"name":"execution.js","bytes":5388,"sha256":"74819c9fc4c0bd35916b1739a7aba4f15127a7041974440316d2c29ae2f578cc"},{"name":"importer.js","bytes":22561,"sha256":"9136160c7ca23c054757e308bba47b0e864194e054d3f846a53bc21ce087098f"},{"name":"roi.js","bytes":18593,"sha256":"f9ceb49392be2731e6e2cb47fae88ea54706cab9b421b81cdd201e37449f56b0"},{"name":"jx3box.js","bytes":3460,"sha256":"3c8a3067ad788d37094f64fa4ed6cef7ca01fccd5f7546c467dec02d075cec0a"},{"name":"app.js","bytes":760481,"sha256":"b754eb87795439eb83211a9f616638fb3f0bddd98b112fe9c52845d939ab03e4"},{"name":"version.js","bytes":2017,"sha256":"192755d80e9448c7f4b67820abd139a8e8f8345cafd8d461538d653a80cc178c"}]};
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
