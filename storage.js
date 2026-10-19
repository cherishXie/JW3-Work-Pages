/* User data is independent of the application and grouped by Beijing save date. */
(function(root,factory){
  const api=factory(typeof module!=='undefined'&&module.exports?require('./model.js'):root.Workbench);
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.WorkbenchStorage=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(M){
  'use strict';
  const KEY='jx3-workbench-data-v2',LEGACY_KEY='jx3-workbench-v1';
  const copy=value=>JSON.parse(JSON.stringify(value));
  const empty=()=>({storeVersion:1,active:null,snapshots:[]});
  const hasData=s=>!!s&&(['accounts','roles','progress','records','ledger','cash','equipment','plans','imports','scenarios','notes','balanceSnapshots','wageClaims','wageReceipts','materials','materialSales','sourceArchives','priceQuotes','energyRecipes','roiComparisons'].some(k=>s[k]?.length)||s.tasks?.some(t=>!t.presetKey||t.updatedAt)||s.configurationConfirmed===true);
  function validDate(date){return typeof date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(date)&&Number.isFinite(new Date(date+'T12:00:00+08:00').getTime())&&M.dateKey(new Date(date+'T12:00:00+08:00'))===date;}
  function validate(store){
    if(!store||store.storeVersion!==1||!Array.isArray(store.snapshots))throw new Error('不支持的日期数据档案');
    if(store.active!==null)M.validateState(store.active);
    const ids=new Set();
    for(const row of store.snapshots){
      if(!row||typeof row.id!=='string'||!/^[-_a-zA-Z0-9]+$/.test(row.id)||ids.has(row.id)||!validDate(row.date)||typeof row.savedAt!=='string'||!Number.isFinite(new Date(row.savedAt).getTime()))throw new Error('日期档案包含非法或重复记录');
      ids.add(row.id);M.validateState(row.data);
    }
    return store;
  }
  function withState(store,state,now=new Date()){
    const next=copy(store),date=M.dateKey(now),data=copy(M.validateState(state));
    next.active=data;
    const id='daily_'+date.replaceAll('-',''),row={id,date,savedAt:now.toISOString(),data:copy(data)};
    const at=next.snapshots.findIndex(x=>x.id===id);
    if(at<0)next.snapshots.push(row);else next.snapshots[at]=row;
    return validate(next);
  }
  function read(storage){
    const raw=storage.getItem(KEY);
    if(raw!==null)return {store:validate(JSON.parse(raw)),migrated:false};
    const legacy=storage.getItem(LEGACY_KEY);
    if(legacy===null)return {store:empty(),migrated:false};
    const state=M.validateState(JSON.parse(legacy)),time=new Date(state.updatedAt);
    return {store:withState(empty(),state,Number.isFinite(time.getTime())?time:new Date()),migrated:true};
  }
  function write(storage,store){storage.setItem(KEY,JSON.stringify(validate(store)));}
  function restore(store,id){const row=store.snapshots.find(x=>x.id===id);if(!row)throw new Error('日期档案不存在');const next=copy(store);next.active=copy(row.data);return validate(next);}
  function mergeArchives(current,incoming){
    validate(incoming);const next=copy(current);
    for(const row of incoming.snapshots){const old=next.snapshots.find(x=>x.id===row.id);if(!old)next.snapshots.push(copy(row));else if(row.savedAt>old.savedAt)Object.assign(old,copy(row));}
    return validate(next);
  }
  return {KEY,LEGACY_KEY,empty,hasData,validate,withState,read,write,restore,mergeArchives};
});
