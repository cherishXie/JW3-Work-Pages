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
   const cache=await caches.open(navigation?CACHE:await clientCache(event.clientId));
   const index=await cache.match(new URL('index.html',BASE).href);
   if(index){
    if(navigation){await pin(event.resultingClientId||event.clientId,BUILD.id).catch(()=>{});return index;}
    const response=await cache.match(url.origin+url.pathname);if(response)return response;
   }
  }catch{}
  return fetch(event.request,{cache:'no-store'});
 })());
});
