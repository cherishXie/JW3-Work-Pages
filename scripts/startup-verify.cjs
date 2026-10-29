'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..'),boot=fs.readFileSync(path.join(root,'boot.js'),'utf8');
function harness({mounted=true,cacheFailure=false}={}){
 const elements=new Map(),events={},windowEvents={},timers=[],downloads=[],deleted=[],unregistered=[],navigation=[];
 const raw=new Map([['jx3-workbench-data-v2','{broken but recoverable'],['jx3-workbench-v1','{"version":1}'],['jx3-workbench-experience-v1','demo bytes']]);
 const element=id=>({id,hidden:true,textContent:'',attributes:{},setAttribute(k,v){this.attributes[k]=v;},remove(){this.removed=true;}});
 const mount=()=>['workbench-boot','boot-status','boot-elapsed','boot-retry','boot-recovery','boot-backup','boot-repair','boot-hint','boot-error','boot-error-detail'].forEach(id=>elements.set(id,element(id)));
 if(mounted)mount();
 const scope='https://example.test/work/dev/',storage={getItem:k=>raw.get(k)??null};
 class TestURL extends URL{}TestURL.createObjectURL=blob=>{downloads.push(blob);return 'blob:test';};TestURL.revokeObjectURL=()=>{};
 let clock=0;
 const context={URL:TestURL,Blob,Event,console,performance:{now:()=>clock},matchMedia:()=>({matches:true,addEventListener(){}}),setInterval:fn=>{timers.push(fn);return 1;},clearInterval(){},setTimeout(){},localStorage:storage,
  location:{protocol:'https:',href:scope,reload:()=>navigation.push('reload'),replace:url=>navigation.push(url)},
  navigator:{serviceWorker:{getRegistrations:async()=>[scope,'https://example.test/work/'].map(scope=>({scope,unregister:async()=>unregistered.push(scope)}))}},
  caches:{keys:async()=>['jw3-pwa:'+scope+':build','jw3-pwa:'+scope+':clients','jw3-pwa:https://example.test/work/:stable','unrelated'],delete:async k=>{if(cacheFailure)throw Error('cache denied');deleted.push(k);}},
  document:{baseURI:scope,getElementById:id=>elements.get(id),addEventListener:(n,fn)=>{events[n]=fn;},dispatchEvent(){},body:{classList:{add(){}}},createElement:()=>({click(){}})},
  window:{addEventListener:(n,fn)=>{windowEvents[n]=fn;}}
 };
 vm.runInNewContext(boot,context,{filename:'boot.js'});
 return {context,elements,events,windowEvents,timers,downloads,deleted,unregistered,navigation,raw,mount,setClock:n=>clock=n,click:id=>events.click({target:{closest:()=>elements.get(id)}})};
}
(async()=>{
 const c={JX3Catalog:require('../catalog.js'),JX3Raids:require('../raid-catalog.js'),structuredClone:undefined};vm.runInNewContext(fs.readFileSync(path.join(root,'model.js'),'utf8'),c);
 const original={roles:[{name:'synthetic',level:50}],optional:null},copy=c.Workbench.clone(original);assert.equal(JSON.stringify(copy),JSON.stringify(original));copy.roles[0].level=30;assert.equal(original.roles[0].level,50);assert.equal(c.Workbench.clone(undefined),undefined);assert.equal(c.structuredClone,undefined);
 console.log('PASS startup clone: JSON workspace fallback preserves values and independence without replacing browser APIs');
 const h=harness(),before=[...h.raw];h.context.WorkbenchBoot.stage('正在准备默认任务');h.windowEvents.error({error:Error('synthetic startup error')});assert.equal(h.elements.get('boot-status').textContent,'工作台未能启动');assert.equal(h.elements.get('workbench-boot').attributes['aria-busy'],'false');assert.match(h.elements.get('boot-error-detail').textContent,/正在准备默认任务\nsynthetic startup error/);assert.equal(h.elements.get('boot-recovery').hidden,false);await h.click('boot-backup');assert.equal(h.downloads.length,1,h.elements.get('boot-hint').textContent);const backup=JSON.parse(await h.downloads[0].text());assert.equal(backup.current,h.raw.get('jx3-workbench-data-v2'));assert.equal(backup.legacy,h.raw.get('jx3-workbench-v1'));assert.equal(backup.experience,h.raw.get('jx3-workbench-experience-v1'));assert.deepEqual([...h.raw],before);
 await h.click('boot-repair');assert.deepEqual(h.deleted,['jw3-pwa:https://example.test/work/dev/:build','jw3-pwa:https://example.test/work/dev/:clients']);assert.deepEqual(h.unregistered,['https://example.test/work/dev/']);assert.equal(new URL(h.navigation[0]).pathname,'/work/dev/');assert(new URL(h.navigation[0]).searchParams.has('startup-recovery'));assert.deepEqual([...h.raw],before);
 console.log('PASS startup error: explicit stage/error, lossless raw backup, scoped cache repair and user archives unchanged');
 const early=harness({mounted:false});early.windowEvents.error({message:'early script failure'});early.mount();early.events.DOMContentLoaded();assert.match(early.elements.get('boot-error-detail').textContent,/early script failure/);
 const rejected=harness();rejected.windowEvents.unhandledrejection({reason:Error('async failure')});assert.match(rejected.elements.get('boot-error-detail').textContent,/async failure/);
 const missing=harness();missing.events.error({target:{tagName:'SCRIPT',getAttribute:()=> 'model.js'}});assert.match(missing.elements.get('boot-error-detail').textContent,/model.js/);
 const slow=harness();slow.events.DOMContentLoaded();slow.setClock(16000);slow.timers[0]();assert.equal(slow.elements.get('boot-recovery').hidden,false);assert.deepEqual(slow.navigation,[]);
 const denied=harness({cacheFailure:true});await denied.click('boot-repair');assert.match(denied.elements.get('boot-hint').textContent,/cache denied/);assert.equal(denied.navigation.length,0);assert.equal(denied.elements.get('boot-repair').disabled,false);
 const ready=harness();ready.context.WorkbenchBoot.finish();ready.windowEvents.error({error:Error('later application error')});assert.equal(ready.elements.get('workbench-boot').removed,true);assert.equal(ready.elements.get('boot-recovery').hidden,true);
 console.log('PASS startup lifecycle: early and async errors, missing script, slow startup actions, failed repair, no loading overlay after ready');
})().catch(error=>{console.error(error);process.exitCode=1;});
