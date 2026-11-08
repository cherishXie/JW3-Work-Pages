'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
async function run(){
 const base='https://example.test/JW3-Work-Pages/dev/',id='a'.repeat(64),prefix='jw3-pwa:'+base+':',stores=new Map(),handlers=new Map(),requests=[];
 let blocked=false,offline=false;
 const caches={async open(name){if(blocked)throw Error('cache unavailable');if(!stores.has(name))stores.set(name,new Map());const data=stores.get(name);return {async match(key){return data.get(String(key))?.clone();},async put(key,response){data.set(String(key),response.clone());}};}};
 const context=vm.createContext({BUILD:{id,files:[]},self:{registration:{scope:base},addEventListener:(name,fn)=>handlers.set(name,fn)},caches,URL,Response,fetch:async request=>{if(offline)throw Error('offline');const url=typeof request==='string'?request:request.url;requests.push(url);return new Response(url.endsWith('app.js')?'network app':'network index');}});
 vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../pwa-worker.js'),'utf8'),context);
 async function get(path,mode='navigate',clientId='client'){let promise;handlers.get('fetch')({request:{url:base+path,method:'GET',mode},clientId,resultingClientId:mode==='navigate'?clientId:'',respondWith:p=>promise=p});return promise;}
 const snapshot=await caches.open(prefix+id);await snapshot.put(base+'index.html',new Response('cached index'));await snapshot.put(base+'app.js',new Response('cached app'));
 assert.equal(await(await get('')).text(),'cached index');assert.equal(await(await get('app.js','cors')).text(),'cached app');assert.equal(requests.length,0);
 stores.get(prefix+id).delete(base+'index.html');
 assert.equal(await(await get('')).text(),'network index','missing navigation cache must return a network Response');
 assert.equal(await(await get('app.js','cors')).text(),'network app','an incomplete snapshot must not mix old scripts with network HTML');
 stores.delete(prefix+id);assert.equal(await(await get('index.html')).text(),'network index');
 blocked=true;assert.equal(await(await get('')).text(),'network index','blocked CacheStorage must not block the website');blocked=false;
 const complete=await caches.open(prefix+id);await complete.put(base+'index.html',new Response('offline index'));offline=true;assert.equal(await(await get('')).text(),'offline index');offline=false;
 const old='b'.repeat(64),oldCache=await caches.open(prefix+old);await oldCache.put(base+'index.html',new Response('old index'));await oldCache.put(base+'app.js',new Response('old app'));await(await caches.open(prefix+'clients')).put(base+'__client__/old-client',new Response(old));assert.equal(await(await get('app.js','cors','old-client')).text(),'old app');
 assert.equal(await(await get('app.js?snapshot='+old,'cors')).text(),'old app');assert.equal((await get('app.js?snapshot='+'f'.repeat(64),'cors')).status,503);
 let intercepted=false;handlers.get('fetch')({request:{method:'GET',url:'https://example.test/outside/',mode:'navigate'},respondWith:()=>intercepted=true});assert.equal(intercepted,false);
 console.log('PASS PWA navigation: missing/evicted/blocked cache falls back to network, incomplete snapshots never mix resources, offline complete snapshots and pinned tabs preserved.');
}
run().catch(error=>{console.error(error);process.exitCode=1;});

async function verifyInstall(){
 const crypto=require('node:crypto'),base='https://example.test/dev/',id='c'.repeat(64),old='d'.repeat(64),prefix='jw3-pwa:'+base+':',events=[],handlers=new Map(),stores=new Map(),requests=[];
 const bodies=new Map([['index.html','new index'],['app.js','same app'],['styles.css','new css'],['worker.js','new worker']]),files=[...bodies].map(([name,text])=>({name,bytes:Buffer.byteLength(text),sha256:crypto.createHash('sha256').update(text).digest('hex')}));
 let active=0,peak=0,corrupt=false;
 const caches={async keys(){return [...stores.keys()];},async delete(k){return stores.delete(k);},async open(k){if(!stores.has(k))stores.set(k,new Map());const data=stores.get(k);return {async match(url){return data.get(String(url))?.clone();},async put(url,response){data.set(String(url),response.clone());}};}};
 const previous=await caches.open(prefix+old);await previous.put(base+'app.js',new Response('same app'));
 const context=vm.createContext({BUILD:{id,files},self:{registration:{scope:base},clients:{async matchAll(){return [{url:base,postMessage:p=>events.push(structuredClone(p))}];}},addEventListener:(name,fn)=>handlers.set(name,fn)},caches,URL,Response,Uint8Array,AbortController,setTimeout,clearTimeout,crypto:crypto.webcrypto,fetch:async url=>{requests.push(url);active++;peak=Math.max(peak,active);await new Promise(r=>setTimeout(r,10));active--;return new Response(corrupt?'tampered':bodies.get(new URL(url).pathname.split('/').pop()));}});
 vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../pwa-worker.js'),'utf8'),context);
 const install=()=>{let task;handlers.get('install')({waitUntil:p=>task=p});return task;};
 await install();assert.equal(requests.length,3);assert(!requests.some(url=>url.includes('/app.js?')));assert(peak>1&&peak<=4);const ready=events.at(-1);assert.equal(ready.phase,'ready');assert.equal(ready.reused,1);assert.equal(ready.completed,4);assert.equal(ready.loaded,ready.total);assert(events.every(e=>e.id===id&&e.loaded<=e.total));
 assert.equal(await(await(await caches.open(prefix+id)).match(base+'app.js')).text(),'same app');
 corrupt=true;stores.delete(prefix+id);stores.get(prefix+old).clear();await assert.rejects(install(),/校验|不匹配/);assert(!stores.has(prefix+id));assert(stores.has(prefix+old));assert.equal(events.at(-1).phase,'error');
 console.log('PASS PWA update: four-way bounded download, digest-verified cache reuse, real byte/file progress, complete-only ready and failed cache cleanup.');
}
verifyInstall().catch(error=>{console.error(error);process.exitCode=1;});
