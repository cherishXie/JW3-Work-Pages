/* Weekly activity and financial dimensions; unknown attribution stays unknown. */
(function(root,factory){const api=factory(typeof module!=='undefined'&&module.exports?require('./model.js'):root.Workbench,typeof module!=='undefined'&&module.exports?require('./raid-catalog.js'):root.JX3Raids);if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.WorkbenchActivity=api;})(typeof globalThis!=='undefined'?globalThis:this,function(M,R){
  'use strict';
  function roles(s,scope={}){return s.roles.filter(r=>(!scope.role||r.id===scope.role)&&(!scope.account||r.accountId===scope.account)&&(!scope.group||s.accounts.find(a=>a.id===r.accountId)?.group===scope.group));}
  function attribution(s,record,roleId){const scoped=M.scopedRecord(s,record,{role:roleId});return scoped?M.recordResult(scoped,s.config):null;}
  function online(s,record,roleId){
    if(record.roleOnlineMinutes?.[roleId]!==undefined)return record.roleOnlineMinutes[roleId];
    const role=s.roles.find(r=>r.id===roleId),accountId=M.recordAccount(s,record,roleId);if(record.roleIds.length===1)return record.onlineMinutes;
    if(role&&record.roleIds.filter(id=>M.recordAccount(s,record,id)===accountId).length===1&&record.accountMinutes?.[accountId]!==undefined)return record.accountMinutes[accountId];
    return M.roleShares(s,record)[roleId]?.onlineMinutes??null;
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
      return {account,roles:rows,tasks:[...new Set(activity.map(e=>e.name))],cds:new Set(activity.filter(e=>e.dungeonId).map(e=>e.roleId+'|'+e.dungeonId+'|'+e.cycle)).size,actual:actual.length,onlineMinutes:actual.reduce((n,e)=>n+(e.onlineMinutes||0),0),missingTime:actual.filter(e=>e.onlineMinutes===null).length,unallocated:financial.filter(r=>M.selectedRecordRoles(s,r,{...scope,account:account.id}).length&&!M.scopedRecord(s,r,{...scope,account:account.id})).length,result:values.length?M.sum(values.map(r=>M.recordResult(r,s.config)),s.config):null};
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
    M.freezeRecord(s,record);
    const shares=M.roleShares(s,{...record,attendanceWeights:weights,roleAllocations:undefined});
    const roleOnlineMinutes={},accountMinutes={};
    for(const id of record.roleIds){const minutes=shares[id]?.onlineMinutes||0,accountId=M.recordAccount(s,record,id);
      roleOnlineMinutes[id]=minutes;accountMinutes[accountId]=(accountMinutes[accountId]||0)+minutes;}
    return {roleAccounts:record.roleAccounts,roleGroups:record.roleGroups,accountMinutes,roleOnlineMinutes,
      ...(financial?{roleAllocations:shares,allocationMethod:'task-rule'}:{})};
  }

  // Display-only forecast allocation; never writes a financial attribution.
  function onlineAnalysis(s,start,end,scope={},mode='estimated'){
    const forecast=M.confirmedForecast(s,start,end),remaining={start,end,onlineMinutes:0,accountMinutes:{},billableAccountMinutes:{},coveredAccountMinutes:{}};
    const roleRows=new Map(s.roles.map(role=>[role.id,{role,minutes:0,billable:0,covered:0,card:0,gross:0,net:0,gold:0,netGold:0,hasIncome:false,missingTime:0,unallocated:0,accountIds:new Set()}]));
    const accountRows=new Map(s.accounts.map(account=>[account.id,{account,minutes:0,billable:0,covered:0,card:0,gross:0,net:0,gold:0,netGold:0,hasIncome:false,missingTime:0,unallocated:0}]));
    const matches=(roleId,accountId,group)=>{const a=s.accounts.find(a=>a.id===accountId);return (!scope.role||scope.role===roleId)&&(!scope.account||scope.account===accountId)&&(!scope.group||(group??a?.group)===scope.group);};
    const visitUsage=(entry,member,batchIndex)=>{const account=s.accounts.find(a=>a.id===member.accountId),minutes=entry.onlinePerVisit,at=Date.parse(entry.startedAt)+(entry.prepare+batchIndex*entry.batchMinutes)*60000,expiry=account?.monthlyExpiresAt?Date.parse(account.monthlyExpiresAt):null;
      const covered=account?.billingType==='monthly'&&expiry!==null?Math.min(minutes,Math.max(0,(expiry-at)/60000)):0,billable=minutes-covered;return {minutes,billable,covered,card:billable*s.config.cardPrice*s.config.discount/s.config.cardMinutes};};
    const pendingRoles=new Map();
    for(const entry of forecast.participation){const plan=s.plans.find(p=>p.id===entry.planId),pending=new Set(M.pendingBatchIndices(s,plan,entry.taskId));
      entry.batches.forEach((batch,i)=>{if(!pending.has(entry.batchIndices[i]))return;for(const member of batch){const u=visitUsage(entry,member,i);remaining.onlineMinutes+=u.minutes;for(const [key,value]of [['accountMinutes',u.minutes],['billableAccountMinutes',u.billable],['coveredAccountMinutes',u.covered]])remaining[key][member.accountId]=(remaining[key][member.accountId]||0)+value;if(matches(member.roleId,member.accountId))pendingRoles.set(member.roleId,(pendingRoles.get(member.roleId)||0)+u.minutes);}});
    }
    const budget=M.budget(s,remaining);
    const addMoney=(row,result)=>{row.gross+=result.gross;row.net+=result.net;row.gold+=result.gold||0;row.netGold=row.netGold===null||result.netGold===null?null:row.netGold+(result.netGold||0);row.hasIncome=true;};
    const billing=(record,id,m,roleId=null)=>{const config=record.snapshot,base=config.cardPrice*config.discount/config.cardMinutes,pricing=M.recordPricing(record,s.config),rate=pricing.accountBillingRates?.[id]??pricing.cardPrice*pricing.discount/pricing.cardMinutes,am=record.accountMinutes?.[id]||m,ratio=am?m/am:0;
      if(roleId&&record.roleBillableMinutes?.[roleId]!==undefined){
        const billable=record.roleBillableMinutes[roleId],covered=record.roleCoveredMinutes?.[roleId]||0,unit=pricing.cardPrice*pricing.discount/pricing.cardMinutes;
        return {billable,covered,card:billable*unit};
      }
      const billable=record.billableAccountMinutes?(record.billableAccountMinutes[id]||0)*ratio:base>0?m*Math.max(0,Math.min(1,(config.accountBillingRates?.[id]??base)/base)):m;
      const covered=record.coveredAccountMinutes?(record.coveredAccountMinutes[id]||0)*ratio:m-billable;return {billable,covered,card:m*rate};};
    let unknownOnline=0;
    if(mode==='estimated'){
      for(const entry of forecast.participation){
        const visits=entry.batches.flatMap((batch,i)=>batch.map(member=>({...member,batchIndex:i}))),v=entry.result,plan=s.plans.find(p=>p.id===entry.planId);
        const roster=[...new Set(visits.map(x=>x.roleId))],accountByRole=Object.fromEntries(visits.map(x=>[x.roleId,x.accountId]));
        const projected={planId:entry.planId,taskId:entry.taskId,planBatchIndices:entry.batchIndices,roleIds:roster,roleAccounts:accountByRole,
          gold:v.gold,minutes:v.minutes,onlineMinutes:v.onlineMinutes,otherCost:v.other,accountMinutes:v.accountMinutes,snapshot:v.billingConfig};
        const shares=M.roleShares(s,projected),perRoleUsage=new Map(roster.map(id=>[id,{minutes:0,billable:0,covered:0,card:0}]));
        for(const member of visits){const current=perRoleUsage.get(member.roleId),usage=visitUsage(entry,member,member.batchIndex);
          if(!current)continue;for(const key of ['minutes','billable','covered','card'])current[key]+=usage[key];}
        for(const id of roster){const accountId=accountByRole[id];if(!matches(id,accountId))continue;
          const row=roleRows.get(id),account=accountRows.get(accountId),usage=perRoleUsage.get(id),allocation=shares[id];
          if(!row||!account||!allocation)continue;
          const gross=allocation.gold*s.config.goldPrice/s.config.goldUnit*s.config.saleRate,
            fee=gross*s.config.fee,net=gross-fee-usage.card-allocation.otherCost,
            money={gross,gold:allocation.gold,net,netGold:s.config.goldPrice>0?net*s.config.goldUnit/s.config.goldPrice:null};
          for(const target of [row,account]){for(const key of ['minutes','billable','covered','card'])target[key]+=usage[key];addMoney(target,money);}
          row.accountIds.add(accountId);
        }
      }
    }else{
      const records=s.records.filter(r=>r.date>=start&&r.date<=end);
      for(const record of records){const selected=record.roleIds.filter(id=>matches(id,M.recordAccount(s,record,id),record.roleGroups?.[id]));if(!selected.length)continue;
        const known=selected.map(id=>({id,accountId:M.recordAccount(s,record,id),minutes:online(s,record,id)}));
        for(const entry of known){const row=roleRows.get(entry.id);row.included=true;const account=accountRows.get(entry.accountId),m=entry.minutes;row.accountIds.add(entry.accountId);
          if(m===null){row.missingTime++;if(account)account.missingTime++;continue;}
          const b=billing(record,entry.accountId,m,entry.id);row.minutes+=m;row.billable+=b.billable;row.covered+=b.covered;row.card+=b.card;
        }
        for(const [id,a]of accountRows){const members=known.filter(x=>x.accountId===id);if(!members.length)continue;const allMembers=record.roleIds.filter(rid=>M.recordAccount(s,record,rid)===id),full=members.length===allMembers.length;
          const m=full&&record.accountMinutes?.[id]!==undefined?record.accountMinutes[id]:members.reduce((n,x)=>n+(x.minutes||0),0),am=record.accountMinutes?.[id]||m,ratio=am?m/am:0;
          const b=billing(record,id,m);a.minutes+=m;a.billable+=b.billable;a.covered+=b.covered;a.card+=b.card;
        }
        if(selected.length===record.roleIds.length){const ids=new Set(known.map(x=>x.accountId));const allocated=[...ids].reduce((n,id)=>n+(record.accountMinutes?.[id]??known.filter(x=>x.accountId===id).reduce((sum,x)=>sum+(x.minutes||0),0)),0);unknownOnline+=Math.max(0,record.onlineMinutes-allocated);}
      }
      for(const event of events(s,start,end,scope).filter(e=>!e.actual&&(e.completionOnly||e.status==='completed'||e.completed>0))){const row=roleRows.get(event.roleId),id=event.accountId||row.role.accountId;row.missingTime++;row.included=true;row.accountIds.add(id);if(accountRows.has(id))accountRows.get(id).missingTime++;}
      for(const record of M.incomeRecords(s).filter(r=>r.date>=start&&r.date<=end)){
        const selected=M.selectedRecordRoles(s,record,scope);if(!selected.length)continue;
        for(const id of selected){const row=roleRows.get(id);row.included=true;row.accountIds.add(M.recordAccount(s,record,id));const value=M.scopedRecord(s,record,{...scope,role:id});if(value)addMoney(row,M.recordResult(value,s.config));else row.unallocated++;}
        for(const [id,a]of accountRows){if(!selected.some(rid=>M.recordAccount(s,record,rid)===id))continue;const value=M.scopedRecord(s,record,{...scope,account:id});if(value)addMoney(a,M.recordResult(value,s.config));else a.unallocated++;}
      }
    }

    const rows=[...roleRows.values()].filter(row=>{const ids=[...row.accountIds];return row.included||ids.some(id=>matches(row.role.id,id))||!ids.length&&matches(row.role.id,row.role.accountId);}).map(row=>({...row,accountIds:[...row.accountIds],pendingMinutes:pendingRoles.get(row.role.id)||0}));
    const accountIds=new Set(rows.flatMap(row=>[...row.accountIds,...(matches(row.role.id,row.role.accountId)?[row.role.accountId]:[])]));
    return {roles:rows,accounts:[...accountRows.values()].filter(row=>accountIds.has(row.account.id)).map(row=>({...row,budget:budget.find(b=>b.account.id===row.account.id)})),unknownOnline,forecast,remaining};
  }
  return {roles,events,dimensions,taskStats,attribution,online,allocate,onlineAnalysis};
});
