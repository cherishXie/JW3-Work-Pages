const assert=require('node:assert/strict'),M=require('../model.js'),S=require('../storage.js');
const checks=[];
function check(name,run){run();checks.push(name);console.log('PASS '+name);}
function memory(initial={}){const map=new Map(Object.entries(initial));return {getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)};}
function fixture(name='自有账号'){const s=M.blank();s.accounts.push({id:'own_account',name,balance:0,enabled:true});return s;}
check('首次读取不创建数据、不加载示例',()=>{const storage=memory(),r=S.read(storage);assert.equal(r.store.active,null);assert.equal(S.hasData(M.blank()),false);assert.equal(storage.getItem(S.KEY),null);});
check('旧版真实数据完整迁移、旧源保留',()=>{const state=fixture();state.updatedAt='2026-10-12T17:00:00Z';const storage=memory({[S.LEGACY_KEY]:JSON.stringify(state)}),r=S.read(storage);assert.equal(r.migrated,true);assert.deepEqual(r.store.active,state);assert.equal(r.store.snapshots[0].date,'2026-10-13');S.write(storage,r.store);assert.ok(storage.getItem(S.LEGACY_KEY));});
check('北京时间跨午夜分开归档、同日更新不改旧日',()=>{let store=S.withState(S.empty(),fixture('前一天'),new Date('2026-10-13T15:59:00Z'));store=S.withState(store,fixture('今天'),new Date('2026-10-13T16:01:00Z'));store=S.withState(store,fixture('今天更新'),new Date('2026-10-14T03:00:00Z'));assert.equal(store.snapshots.length,2);assert.equal(store.snapshots[0].date,'2026-10-13');assert.equal(store.snapshots[0].data.accounts[0].name,'前一天');assert.equal(store.snapshots[1].date,'2026-10-14');});
check('加载历史完整恢复，历史快照独立于当前编辑',()=>{const store=S.withState(S.empty(),fixture(),new Date('2026-10-12T00:00:00Z')),loaded=S.restore(store,store.snapshots[0].id);loaded.active.accounts[0].name='修改';assert.equal(loaded.snapshots[0].data.accounts[0].name,'自有账号');assert.equal(store.active.accounts[0].name,'自有账号');});
check('日期档案合并不改当前状态、只接纳较新同 ID',()=>{const old=S.withState(S.empty(),fixture('旧'),new Date('2026-10-13T01:00:00Z')),newer=S.withState(S.empty(),fixture('新'),new Date('2026-10-13T02:00:00Z')),merged=S.mergeArchives(old,newer);assert.equal(merged.active.accounts[0].name,'旧');assert.equal(merged.snapshots[0].data.accounts[0].name,'新');assert.equal(S.mergeArchives(merged,old).snapshots[0].data.accounts[0].name,'新');});
check('日期档案备份可完整往返且保留扩展字段',()=>{const state=fixture();state.custom={note:'独立备份'};const store=S.withState(S.empty(),state);assert.deepEqual(S.validate(JSON.parse(JSON.stringify(store))),store);});
check('损坏数据拒绝读取，原存储未被覆盖',()=>{const storage=memory({[S.KEY]:'broken'});assert.throws(()=>S.read(storage));assert.equal(storage.getItem(S.KEY),'broken');});
check('非法日期、重复档案 ID 和断裂引用拒绝',()=>{const store=S.withState(S.empty(),fixture());const bad=structuredClone(store);bad.snapshots[0].date='2026-02-30';assert.throws(()=>S.validate(bad));const duplicate=structuredClone(store);duplicate.snapshots.push(structuredClone(duplicate.snapshots[0]));assert.throws(()=>S.validate(duplicate));const refs=structuredClone(store);refs.snapshots[0].data.roles.push({id:'role',accountId:'missing',name:'角色'});assert.throws(()=>S.validate(refs));});
check('重置为空白阻止旧版本数据复活，完整快照可撤销',()=>{const storage=memory({[S.LEGACY_KEY]:JSON.stringify(fixture())}),before=S.read(storage).store;S.write(storage,S.empty());assert.equal(S.read(storage).store.active,null);S.write(storage,before);assert.deepEqual(S.read(storage).store,before);});
check('参数已确认即作为用户配置加载',()=>{const state=M.blank();state.configurationConfirmed=true;assert.equal(S.hasData(state),true);});
function limited(initial,limit){const storage=memory(initial),set=storage.setItem;storage.setItem=(k,v)=>{if(v.length>limit){const e=new Error('quota');e.name='QuotaExceededError';throw e;}set(k,v);};return storage;}
check('容量不足时无损去重，完整日期档案往返且各快照独立',()=>{
  const state=fixture();state.custom={text:'重复数据'.repeat(2000),array:[0,null,[],{storageEncoding:'shared-json-v1',root:[0]}]};
  let store=S.empty();for(let i=1;i<=5;i++)store=S.withState(store,state,new Date(`2026-10-0${i}T00:00:00Z`));
  const raw=JSON.stringify(store),storage=limited({},raw.length*.6);S.write(storage,store);
  assert.equal(JSON.parse(storage.getItem(S.KEY)).storageEncoding,'shared-json-v1');assert.deepEqual(S.read(storage).store,store);
  const loaded=S.read(storage).store;loaded.active.custom.array[3].root[0]=99;assert.equal(loaded.snapshots[0].data.custom.array[3].root[0],0);
  S.write(storage,loaded);assert.deepEqual(S.read(storage).store,loaded);
});
check('接近容量上限时删除排程，刷新和回收站恢复均保留历史',()=>{
  const D=require('../daily'),O=require('../operations'),state=fixture();state.partyRulesVersion=3;
  state.roles=[{id:'r',accountId:'own_account',name:'角色',level:130,enabled:true}];
  state.tasks=[{...O.defaults('sect',['r']),id:'t'}];state.plans=[{id:'p',taskId:'t',date:'2026-10-20',batches:[['r']]}];
  state.custom={text:'保留历史内容'.repeat(2000)};
  const before=S.withState(S.empty(),state,new Date('2026-10-19T00:00:00Z')),raw=JSON.stringify(before),storage=limited({[S.KEY]:raw},raw.length+10);
  D.deletePlan(state,'p');const after=S.withState(before,state,new Date('2026-10-20T00:00:00Z'));S.write(storage,after);
  const loaded=S.read(storage).store;assert.deepEqual(loaded,after);assert.equal(loaded.active.plans.length,0);assert.equal(loaded.snapshots[0].data.plans.length,1);
  D.restoreDeleted(loaded.active,loaded.active.notes.find(n=>n.kind==='task-recycle').id);assert.equal(loaded.active.plans[0].id,'p');
  S.write(storage,S.withState(loaded,loaded.active));assert.equal(S.read(storage).store.active.plans[0].id,'p');
});
check('去重后仍超限时保护旧数据和调用者对象，显示可操作的提示',()=>{
  const old=JSON.stringify(S.empty()),storage=limited({[S.KEY]:old},old.length),next=S.withState(S.empty(),fixture()),before=JSON.stringify(next);
  assert.throws(()=>S.write(storage,next),/空间不足.*原数据已保留/);assert.equal(storage.getItem(S.KEY),old);assert.equal(JSON.stringify(next),before);
});
check('非容量错误原样抛出，损坏去重引用拒绝读取并保护原存储',()=>{
  const denied=new Error('denied');denied.name='SecurityError';let attempts=0;
  assert.throws(()=>S.write({setItem(){attempts++;throw denied;}},S.empty()),e=>e===denied);assert.equal(attempts,1);
  for(const nodes of [[{self:[0]}],[{bad:[9]}],[{bad:[-1]}]]){const raw=JSON.stringify({storageEncoding:'shared-json-v1',root:[0],nodes}),storage=memory({[S.KEY]:raw});assert.throws(()=>S.read(storage),/引用无效/);assert.equal(storage.getItem(S.KEY),raw);}
});
console.log(checks.length+'/'+checks.length+' storage checks passed');
