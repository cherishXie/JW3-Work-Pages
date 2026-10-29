/* Generated sw.js prepends BUILD. Only complete, hash-checked snapshots activate. */
'use strict';
const BASE=self.registration.scope,PREFIX='jw3-pwa:'+BASE+':',CACHE=PREFIX+BUILD.id,PINS=PREFIX+'clients';
const records=new Map(BUILD.files.map(f=>[new URL(f.name,BASE).href,f]));
const pinKey=id=>BASE+'__client__/'+encodeURIComponent(id);
async function pin(id,build){if(id)await(await caches.open(PINS)).put(pinKey(id),new Response(build));}
async function clientCache(id){const p=id&&await(await caches.open(PINS)).match(pinKey(id));return p?PREFIX+await p.text():CACHE;}
const digest=async b=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',b))].map(v=>v.toString(16).padStart(2,'0')).join('');
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const cache=await caches.open(CACHE);
 try{for(const [url,record]of records){const response=await fetch(url+'?snapshot='+BUILD.id,{cache:'no-store'});if(!response.ok)throw Error('Update download failed');const bytes=await response.clone().arrayBuffer();if(bytes.byteLength!==record.bytes||await digest(bytes)!==record.sha256)throw Error('Update integrity mismatch');await cache.put(url,response);}}
 catch(error){await caches.delete(CACHE);throw error;}
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 await self.clients.claim();
 const store=await caches.open(PINS),live=await self.clients.matchAll({includeUncontrolled:true});
 const retained=new Set([CACHE,PINS]);for(const client of live){const p=await store.match(pinKey(client.id));if(p)retained.add(PREFIX+await p.text());}
 for(const key of await caches.keys())if(key.startsWith(PREFIX)&&!retained.has(key))await caches.delete(key);
})()));
self.addEventListener('message',event=>{
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
 if(['update-manifest.json','version.json','sw.js'].includes(relative)){event.respondWith(fetch(event.request,{cache:'no-store'}));return;}
 const navigation=event.request.mode==='navigate'&&(relative===''||relative==='index.html');
 event.respondWith((async()=>{
  if(navigation){await pin(event.resultingClientId||event.clientId,BUILD.id);return(await caches.open(CACHE)).match(new URL('index.html',BASE).href);}
  const cache=await caches.open(await clientCache(event.clientId));
  return await cache.match(url.origin+url.pathname)||fetch(event.request);
 })());
});
