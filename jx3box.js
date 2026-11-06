/* Public JX3BOX item catalogue and auction snapshots. Never sends role/account data. */
(function(root,factory){const api=factory();if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.WorkbenchJX3Box=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const itemPattern=/^\d+_\d+$/;
  async function request(url,options={}){
    const target=new URL(url);
    if(!((target.origin==='https://node.jx3box.com'&&target.pathname.startsWith('/item_merged/name/')&&!options.method)||(target.origin==='https://next2.jx3box.com'&&target.pathname==='/api/auction/'&&options.method==='POST')))throw new Error('JX3BOX 请求地址不在只读查询白名单');
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
    try{const res=await fetch(url,{...options,credentials:'omit',signal:controller.signal});if(!res.ok)throw new Error('JX3BOX 返回 HTTP '+res.status);return await res.json();}
    catch(e){throw new Error(e.name==='AbortError'?'JX3BOX 查询超时，请重试':e.message.startsWith('JX3BOX')?e.message:'无法连接 JX3BOX。请检查网络；网页域名可能尚未获得跨域授权，可查看来源页或手工登记报价。');}
    finally{clearTimeout(timer);}
  }
  function items(data){
    if(!data||!Array.isArray(data.list)||!Number.isInteger(data.pages)||data.pages<0)throw new Error('JX3BOX 物品资料格式变化，请查看来源页');
    return {pages:data.pages,total:data.total,rows:data.list.filter(x=>itemPattern.test(x.id)&&typeof x.Name==='string'&&x.Name.trim()).map(x=>({id:x.id,name:x.Name,tradable:x.CanTrade===false?false:x.CanTrade===true?true:null,quality:x.Quality,level:x.Level,bindType:x.BindType,type:x.TypeLabel||'类型待补'}))};
  }
  async function search(name,page=1){const q=name.trim();if(!q||q.length>80)throw new Error('请填写 1–80 字的物品名称');return items(await request('https://node.jx3box.com/item_merged/name/'+encodeURIComponent(q)+'?'+new URLSearchParams({client:'std',per:12,page})));}
  function prices(data,server,ids,now=Date.now()){
    if(!Array.isArray(data))throw new Error('JX3BOX 行情格式变化，请查看来源页');
    const result=new Map();
    for(const x of data){if(!ids.includes(x.item_id)||x.server!==server||typeof x.price!=='number'||!Number.isFinite(x.price)||x.price<=0||typeof x.timestamp!=='number'||!Number.isFinite(x.timestamp)||x.timestamp<=0||x.timestamp*1000>now+60000)continue;
      const quote={itemId:x.item_id,server,price:x.price/10000,unit:1,observedAt:new Date(x.timestamp*1000).toISOString(),sampleCount:Number.isInteger(x.sample)&&x.sample>0?x.sample:null};
      if(!result.has(x.item_id)||result.get(x.item_id).observedAt<quote.observedAt)result.set(x.item_id,quote);
    }return [...result.values()];
  }
  async function auction(server,ids){if(!server?.trim())throw new Error('请先补全所属角色的区服');if(!ids.length||ids.length>100||ids.some(id=>!itemPattern.test(id)))throw new Error('请选择 JX3BOX 物品，单次最多查询 100 项');return prices(await request('https://next2.jx3box.com/api/auction/',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({server:server.trim(),item_ids:[...new Set(ids)],aggregate_type:'hourly'})}),server.trim(),ids);}
  function source(id){return 'https://www.jx3box.com/item/view/'+encodeURIComponent(id);}
  return {search,auction,items,prices,source};
});
