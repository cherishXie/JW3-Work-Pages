/* Batch launch preparation only. No processes, network, or business-state writes. */
(function(root,factory){
  const node=typeof module!=='undefined'&&module.exports;
  const api=factory(node?require('./model.js'):root.Workbench,node?require('./daily.js'):root.WorkbenchDaily);
  if(node)module.exports=api;else root.WorkbenchExecution=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(M,Daily){
  'use strict';
  const KEY='jx3-mumu-bindings-v1',VERSION=1;
  const empty=()=>({version:VERSION,platform:'windows',bindings:[]});
  function validate(input){
    if(!input||input.version!==VERSION||input.platform!=='windows'||!Array.isArray(input.bindings))throw new Error('MuMu 本机配置格式不支持');
    const seen=new Set();
    const bindings=input.bindings.map(b=>{
      if(!b||typeof b.accountId!=='string'||!b.accountId.trim()||seen.has(b.accountId))throw new Error('账号绑定重复或无效');
      seen.add(b.accountId);
      const instanceId=String(b.instanceId??'').trim(),packageName=String(b.packageName??'').trim();
      if(!/^(0|[1-9]\d{0,5})$/.test(instanceId))throw new Error('MuMu 实例索引须为 0–999999 的整数');
      if(!/^[A-Za-z][A-Za-z0-9_]*(?:\.[A-Za-z][A-Za-z0-9_]*)+$/.test(packageName))throw new Error('请填写有效的 Android 游戏包名');
      // Explicit projection: never retain passwords, tokens, paths, or shell commands.
      return {accountId:b.accountId,instanceId,packageName};
    });
    return {version:VERSION,platform:'windows',bindings};
  }
  function read(storage){const raw=storage.getItem(KEY);return raw===null?empty():validate(JSON.parse(raw));}
  function write(storage,input){const value=validate(input);storage.setItem(KEY,JSON.stringify(value));return value;}
  function bind(config,accountId,instanceId,packageName){return validate({...config,bindings:[...config.bindings.filter(b=>b.accountId!==accountId),{accountId,instanceId,packageName}]});}
  function unbind(config,accountId){return validate({...config,bindings:config.bindings.filter(b=>b.accountId!==accountId)});}
  function prepare(s,config,{planId,taskId,batchIndex},now=new Date()){
    config=validate(config);
    const p=s.plans.find(p=>p.id===planId);
    if(!p||!Number.isInteger(batchIndex)||!p.batches[batchIndex])throw new Error('排程批次不存在');
    const t=s.tasks.find(t=>t.id===taskId);
    const issues=[];
    const add=(code,message,roleId=null)=>issues.push({code,message,roleId});
    try{Daily.checkBatch(s,p,taskId,batchIndex,now.toISOString());}catch(e){add('batch-invalid',e.message);}
    if(!p.batches[batchIndex].length)add('empty-batch','批次没有角色');
    if(new Set(p.batches[batchIndex]).size!==p.batches[batchIndex].length)add('duplicate-role','批次包含重复角色');
    const instances=new Set(),accounts=new Set();
    const targets=p.batches[batchIndex].map(roleId=>{
      const r=s.roles.find(r=>r.id===roleId),a=s.accounts.find(a=>a.id===r?.accountId),b=config.bindings.find(b=>b.accountId===a?.id);
      if(!r||!a)add('missing-member','角色或账号已不存在',roleId);
      if(a&&accounts.has(a.id))add('account-conflict','本批包含同一账号的多个角色',roleId);
      if(a)accounts.add(a.id);
      if(!b)add('binding-missing',(a?.name||'未知账号')+' 尚未绑定 MuMu 实例',roleId);
      if(!r?.name?.trim()||!r?.server?.trim())add('role-locator-missing','请补齐角色名和区服',roleId);
      if(r&&s.roles.some(other=>other.id!==r.id&&other.accountId===r.accountId&&other.name===r.name&&other.server===r.server))add('role-ambiguous','同账号同服存在同名角色，请先核对档案',roleId);
      if(b&&instances.has(b.instanceId))add('instance-conflict','本批多个账号绑定了同一个 MuMu 实例 '+b.instanceId,roleId);
      if(b)instances.add(b.instanceId);
      return {accountId:a?.id||null,accountName:a?.name||'',roleId,roleName:r?.name||'',server:r?.server||'',instanceId:b?.instanceId??null,packageName:b?.packageName||null};
    });
    // This is a complete review snapshot, not an executable command or authorization.
    return {protocolVersion:VERSION,kind:'mumu-batch-preparation',platform:'windows',createdAt:now.toISOString(),
      batch:{planId,taskId,batchIndex,date:p.date,taskName:t?.name||p.taskName||''},targets,issues,
      status:issues.length?'blocked':'prepared',executable:false};
  }
  // A future bridge must supply fresh, verified observations. A previous plan is
  // never evidence of which account/role is currently logged into an instance.
  function nextAction(target,observation,now=new Date()){
    const age=now.getTime()-Date.parse(observation?.observedAt);
    if(!observation||observation.instanceId!==target.instanceId||!Number.isFinite(age)||age<0||age>15000)return 'inspect';
    if(observation.running===false)return 'start-instance';
    if(observation.running!==true)return 'inspect';
    if(observation.packageName!==target.packageName)return 'open-game';
    if(observation.accountVerified!==true)return 'verify-account';
    if(observation.accountId!==target.accountId)return 'manual-login';
    if(observation.roleVerified!==true)return 'verify-role';
    if(observation.roleId!==target.roleId||observation.server!==target.server)return 'switch-role';
    return 'ready';
  }
  return {KEY,VERSION,empty,validate,read,write,bind,unbind,prepare,nextAction};
});
