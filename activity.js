/* Weekly activity and financial dimensions; unknown attribution stays unknown. */
(function(root,factory){const api=factory(typeof module!=='undefined'&&module.exports?require('./model.js'):root.Workbench,typeof module!=='undefined'&&module.exports?require('./raid-catalog.js'):root.JX3Raids);if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.WorkbenchActivity=api;})(typeof globalThis!=='undefined'?globalThis:this,function(M,R){
  'use strict';
  function roles(s,scope={}){return s.roles.filter(r=>(!scope.role||r.id===scope.role)&&(!scope.account||r.accountId===scope.account)&&(!scope.group||s.accounts.find(a=>a.id===r.accountId)?.group===scope.group));}
  function attribution(s,record,roleId){const scoped=M.scopedRecord(s,record,{role:roleId});return scoped?M.recordResult(scoped):null;}
  function online(s,record,roleId){
    if(record.roleOnlineMinutes?.[roleId]!==undefined)return record.roleOnlineMinutes[roleId];
    const role=s.roles.find(r=>r.id===roleId),accountId=M.recordAccount(s,record,roleId);if(record.roleIds.length===1)return record.onlineMinutes;
    if(role&&record.roleIds.filter(id=>M.recordAccount(s,record,id)===accountId).length===1&&record.accountMinutes?.[accountId]!==undefined)return record.accountMinutes[accountId];
    return null;
  }
  function events(s,start,end,scope={}){
    const selected=new Set(roles(s,scope).map(r=>r.id)),out=[];
    for(const rec of s.records.filter(r=>r.date>=start&&r.date<=end)){
      const task=s.tasks.find(t=>t.id===rec.taskId),dungeonId=rec.dungeonId||'',dungeon=R.find(dungeonId);
      for(const roleId of M.selectedRecordRoles(s,rec,scope))out.push({id:rec.id+'_'+roleId,recordId:rec.id,roleId,accountId:M.recordAccount(s,rec,roleId),date:rec.date,startedAt:rec.startedAt||null,taskId:rec.taskId,name:rec.taskName||task?.name||'历史任务',dungeonId,dungeonName:rec.dungeonName||dungeon?.fullName||task?.dungeonName||'',difficulty:rec.difficulty||task?.difficulty||'',cycle:rec.cycle||(task?M.cycle(task,rec.date):''),status:'completed',actual:true,onlineMinutes:online(s,rec,roleId),groupMinutes:rec.minutes,result:attribution(s,rec,roleId),note:rec.note||''});
    }
    for(const rec of M.completionRecords(s).filter(r=>r.date>=start&&r.date<=end))for(const roleId of M.selectedRecordRoles(s,rec,scope))out.push({id:rec.id+'_'+roleId,roleId,accountId:M.recordAccount(s,rec,roleId),date:rec.date,startedAt:rec.startedAt,taskId:rec.taskId,name:rec.taskName,dungeonId:rec.dungeonId||'',difficulty:rec.difficulty||'',cycle:rec.cycle,status:'completed',completionOnly:true,actual:false,onlineMinutes:null,groupMinutes:null,result:null,note:'已完成 · 实收与耗时待补'});
    for(const p of s.progress.filter(p=>p.date>=start&&p.date<=end&&selected.has(p.roleId))){
      const progressTask=s.tasks.find(t=>t.id===p.taskId),progressKey=p.cdKeySnapshot||M.cdKey(progressTask||{});
      if(out.some(e=>e.roleId===p.roleId&&M.cdKey(e.dungeonId?{dungeonId:e.dungeonId,difficulty:e.difficulty}: {id:e.taskId})===progressKey&&e.cycle===p.cycle))continue;
      const task=s.tasks.find(t=>t.id===p.taskId);if(!task)continue;
      out.push({id:p.id,roleId:p.roleId,date:p.date,startedAt:null,taskId:task.id,name:p.taskName||task.name,dungeonId:p.dungeonId??task.dungeonId??'',dungeonName:p.dungeonName??task.dungeonName??R.find(task.dungeonId)?.fullName??'',difficulty:p.difficulty??task.difficulty??'',cycle:p.cycle,status:p.status,completed:p.completed,actual:false,onlineMinutes:null,groupMinutes:null,result:null,note:p.source||''});
    }
    return out.sort((a,b)=>a.date.localeCompare(b.date)||(a.startedAt||'').localeCompare(b.startedAt||'')||a.id.localeCompare(b.id));
  }
  function dimensions(s,start,end,scope={}){
    const all=events(s,start,end,scope),financial=M.incomeRecords(s).filter(r=>r.date>=start&&r.date<=end),selected=new Set([...roles(s,scope).map(r=>r.id),...financial.flatMap(r=>M.selectedRecordRoles(s,r,scope))]),roster=s.roles.filter(r=>selected.has(r.id));
    const roleRows=roster.map(role=>{
      const list=all.filter(e=>e.roleId===role.id),actual=list.filter(e=>e.actual),allocated=actual.filter(e=>e.result),known=actual.filter(e=>e.onlineMinutes!==null),money=financial.filter(r=>M.selectedRecordRoles(s,r,scope).includes(role.id)).map(r=>attribution(s,r,role.id)).filter(Boolean);
      return {role,accountIds:[...new Set(financial.filter(r=>M.selectedRecordRoles(s,r,scope).includes(role.id)).map(r=>M.recordAccount(s,r,role.id)))],events:list,actual:actual.length,observed:list.filter(e=>!e.actual).length,tasks:[...new Set(list.filter(e=>e.actual||(e.status==='completed'||e.completed>0)).map(e=>e.name))],cds:[...new Set(list.filter(e=>e.dungeonId&&(e.actual||(e.status==='completed'||e.completed>0))).map(e=>e.dungeonId+'|'+e.difficulty+'|'+e.cycle))],onlineMinutes:known.reduce((n,e)=>n+e.onlineMinutes,0),missingTime:actual.length-known.length+list.filter(e=>!e.actual&&(e.status==='completed'||e.completed>0)).length,unallocated:financial.filter(r=>M.selectedRecordRoles(s,r,scope).includes(role.id)&&!attribution(s,r,role.id)).length,result:money.length?M.sum(money,s.config):null};
    });
    const accounts=s.accounts.filter(a=>roleRows.some(r=>r.role.accountId===a.id)||financial.some(r=>M.selectedRecordRoles(s,r,scope).some(id=>M.recordAccount(s,r,id)===a.id))).map(account=>{
      const rows=roleRows.filter(r=>r.role.accountId===account.id||all.some(e=>e.roleId===r.role.id&&e.accountId===account.id)),activity=all.filter(e=>(e.accountId||s.roles.find(r=>r.id===e.roleId)?.accountId)===account.id),actual=activity.filter(e=>e.actual),values=financial.map(r=>M.scopedRecord(s,r,{...scope,account:account.id})).filter(Boolean);
      return {account,roles:rows,tasks:[...new Set(activity.map(e=>e.name))],cds:new Set(activity.filter(e=>e.dungeonId).map(e=>e.roleId+'|'+e.dungeonId+'|'+e.cycle)).size,actual:actual.length,onlineMinutes:actual.reduce((n,e)=>n+(e.onlineMinutes||0),0),missingTime:actual.filter(e=>e.onlineMinutes===null).length,unallocated:financial.filter(r=>M.selectedRecordRoles(s,r,{...scope,account:account.id}).length&&!M.scopedRecord(s,r,{...scope,account:account.id})).length,result:values.length?M.sum(values.map(M.recordResult),s.config):null};
    });
    const recordIds=new Set(all.filter(e=>e.actual).map(e=>e.recordId));
    return {events:all,roles:roleRows,accounts,recordCount:recordIds.size,cdCount:roleRows.reduce((n,r)=>n+r.cds.length,0),actual:M.summary(s,start,end,scope,'actual')};
  }
  function taskStats(s,start,end,scope={},mode='estimated'){
    const estimated=new Map(M.summary(s,start,end,scope,mode==='template'?'template':'estimated').tasks.map(row=>[row.task.id,row]));
    const summary=M.summary(s,start,end,scope,'actual'),actualRows=M.incomeRecords(s).filter(r=>r.date>=start&&r.date<=end);
    return summary.tasks.map(({task,...actual})=>{
      const records=s.records.filter(r=>r.taskId===task.id&&r.date>=start&&r.date<=end&&M.selectedRecordRoles(s,r,scope).length),financial=actualRows.filter(r=>r.taskId===task.id&&M.selectedRecordRoles(s,r,scope).length);
      return {task,samples:records.length,visits:records.reduce((n,r)=>n+M.selectedRecordRoles(s,r,scope).length,0),unallocated:financial.filter(r=>!M.scopedRecord(s,r,scope)).length,actual:actual.hasData?actual:null,estimated:estimated.get(task.id)||M.sum([],s.config)};
    });
  }
  function allocate(s,record,weights,financial=false){
    M.freezeRecord(s,record);const total=record.roleIds.reduce((n,id)=>n+(weights[id]||1),0),accountMinutes={},roleOnlineMinutes={},roleAllocations={};
    for(const id of record.roleIds){const weight=(weights[id]||1)/total,accountId=M.recordAccount(s,record,id),onlineMinutes=record.onlineMinutes*weight;roleOnlineMinutes[id]=onlineMinutes;accountMinutes[accountId]=(accountMinutes[accountId]||0)+onlineMinutes;if(financial)roleAllocations[id]={gold:record.gold*weight,minutes:record.minutes*weight,onlineMinutes,otherCost:(record.otherCost||0)*weight};}
    return {roleAccounts:record.roleAccounts,roleGroups:record.roleGroups,accountMinutes,roleOnlineMinutes,...(financial?{roleAllocations,allocationMethod:'attendance'}:{})};
  }
  return {roles,events,dimensions,taskStats,attribution,online,allocate};
});
