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
    if(raw!==null)return {store:validate(unpack(JSON.parse(raw))),migrated:false};
    const legacy=storage.getItem(LEGACY_KEY);
    if(legacy===null)return {store:empty(),migrated:false};
    const state=M.validateState(JSON.parse(legacy)),time=new Date(state.updatedAt);
    return {store:withState(empty(),state,Number.isFinite(time.getTime())?time:new Date()),migrated:true};
  }
  // Snapshots and recycle entries share most of their content. Intern equal JSON
  // subtrees only when the ordinary representation exceeds the browser quota.
  // Array references are unambiguous: every original array/object lives in nodes.
  function pack(value){
    const nodes=[],known=new Map();
    function encode(value){
      if(value===null||typeof value!=='object')return value;
      const node=Array.isArray(value)?value.map(encode):Object.fromEntries(Object.entries(value).map(([k,v])=>[k,encode(v)]));
      const key=JSON.stringify(node);
      if(known.has(key))return [known.get(key)];
      const id=nodes.length;nodes.push(node);known.set(key,id);return [id];
    }
    const root=encode(value);return {storageEncoding:'shared-json-v1',root,nodes};
  }
  function unpack(value){
    if(value?.storageEncoding!=='shared-json-v1')return value;
    const {nodes,root}=value;
    if(!Array.isArray(nodes))throw new Error('本地去重数据格式无效');
    const decoded=[];
    function decode(value,limit){
      if(value===null||typeof value!=='object')return value;
      if(!Array.isArray(value)||value.length!==1||!Number.isInteger(value[0])||value[0]<0||value[0]>=limit)throw new Error('本地去重数据引用无效');
      // Each occurrence must be independent, as in an ordinary JSON round trip.
      return copy(decoded[value[0]]);
    }
    for(const node of nodes){
      if(!node||typeof node!=='object')throw new Error('本地去重数据节点无效');
      decoded.push(Array.isArray(node)?node.map(v=>decode(v,decoded.length)):Object.fromEntries(Object.entries(node).map(([k,v])=>[k,decode(v,decoded.length)])));
    }
    return decode(root,decoded.length);
  }
  function quotaError(e){return e?.name==='QuotaExceededError'||e?.name==='NS_ERROR_DOM_QUOTA_REACHED'||e?.code===22||e?.code===1014;}
  function write(storage,store){
    const raw=JSON.stringify(validate(store));
    try{storage.setItem(KEY,raw);return;}catch(e){if(!quotaError(e))throw e;}
    const compact=JSON.stringify(pack(JSON.parse(raw)));
    if(compact.length<raw.length){
      try{storage.setItem(KEY,compact);return;}catch(e){if(!quotaError(e))throw e;}
    }
    // setItem is atomic. Never remove the previous value or discard archives.
    throw new Error('浏览器本地存储空间不足，无损去重后仍无法保存；原数据已保留。请先导出全部日期档案备份，再在数据和验证中管理历史档案');
  }
  function restore(store,id){const row=store.snapshots.find(x=>x.id===id);if(!row)throw new Error('日期档案不存在');const next=copy(store);next.active=copy(row.data);return validate(next);}
  function mergeArchives(current,incoming){
    validate(incoming);const next=copy(current);
    for(const row of incoming.snapshots){const old=next.snapshots.find(x=>x.id===row.id);if(!old)next.snapshots.push(copy(row));else if(row.savedAt>old.savedAt)Object.assign(old,copy(row));}
    return validate(next);
  }
  return {KEY,LEGACY_KEY,empty,hasData,validate,withState,read,write,restore,mergeArchives};
});
