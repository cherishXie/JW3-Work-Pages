/* Explicit operations events. Inventory estimates never become realized income. */
(function(root,factory){const api=factory(typeof module!=='undefined'&&module.exports?require('./model.js'):root.Workbench);if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.WorkbenchDaily=api;})(typeof globalThis!=='undefined'?globalThis:this,function(M){
 'use strict';
 function doneIndices(s,p,taskId){return M.recordedBatchIndices(s,p,taskId);}
 function remaining(s,p,taskId=p.taskId){return M.pendingBatchIndices(s,p,taskId);}
 function reconcile(s,p){p.executedTaskIds=(p.routeTaskIds||[p.taskId]).filter(id=>doneIndices(s,p,id).length===p.batches.length);p.executed=p.executedTaskIds.length===(p.routeTaskIds||[p.taskId]).length;p.ended=(p.routeTaskIds||[p.taskId]).every(id=>!remaining(s,p,id).length);}
 // Original completion facts keep backfills and note edits from changing order.
 function completedTime(s,p,taskId=null,index=null){
  const facts=p.completionFacts||[],records=s.records.filter(r=>r.planId===p.id);
  const matches=r=>(taskId===null||r.taskId===taskId)&&(index===null||!r.planBatchIndices||r.planBatchIndices.includes(index));
  const entries=[...facts.filter(matches),...records.filter(matches).filter(r=>!(index===null?(r.planBatchIndices||p.batches.map((_,i)=>i)):[index]).every(i=>facts.some(f=>f.taskId===r.taskId&&f.planBatchIndices.includes(i))))];
  const timestamp=r=>{for(const value of [r.endedAt,r.createdAt,r.startedAt,r.date]){const n=Date.parse(value);if(Number.isFinite(n))return n;}return 0;};
  return Math.max(0,...entries.map(timestamp))||timestamp({date:p.date});
 }
 // Retained accounts keep their relative slots; newcomers take vacated slots.
 // Compact smaller batches without adding absent accounts or mutating party order.
 function batchAccountSlots(s,p,index,taskId=p.taskId){
  const roles=ids=>ids.map(id=>s.roles.find(r=>r.id===id)).filter(Boolean);
  let order=[];
  for(let i=0;i<=index;i++){
   const current=roles(p.batches[i]||[]),accounts=current.map(r=>r.accountId),active=new Set(accounts),newcomers=accounts.filter(id=>!order.includes(id));
   const next=[];
   for(const account of order){if(active.has(account))next.push(account);else if(newcomers.length)next.push(newcomers.shift());}
   order=[...next,...newcomers];
  }
  const players=roles(p.batches[index]||[]),previous=roles((p.routeTaskIds||[p.taskId]).indexOf(taskId)>0?p.batches[index]||[]:p.batches[index-1]||[]),change=M.batchTransition(previous,players);
  return order.map(accountId=>{const role=players.find(r=>r.accountId===accountId);return {accountId,role,action:change.login.some(r=>r.id===role.id)?'login':change.switchRole.some(x=>x.to.id===role.id)?'switch':'stay'};});
 }
 function hasExecution(s,p){return M.executionRecords(s).some(r=>r.planId===p.id);}
 function canRegisterPlannedRole(s,t,id,when){const r=s.roles.find(r=>r.id===id);if(!r||M.cdRecord(s,t,id,when))return false;const progress=M.effectiveProgress(s,t,r,when);return progress.manualStatus!=='skipped'&&progress.actualCompleted<progress.target;}
 function checkBatch(s,p,taskId,index,when){
  const t=M.savedPartyTask(M.taskForVersion(s,s.tasks.find(t=>t.id===taskId)||{}),p),ids=p.batches[index],members=ids?.map(id=>M.eligible(s,{...t,roleIds:ids}).find(r=>r.id===id));
  if(p.cancelled||!t.enabled||!(p.routeTaskIds||[p.taskId]).includes(taskId)||!remaining(s,p,taskId).includes(index))throw new Error('该批次已结束');
  if(!M.planExecutionValid(s,p,t,when))throw new Error('执行日期或刷新周期不同，请先调整该批次日期');
  if(members.some(r=>!r||!canRegisterPlannedRole(s,t,r.id,when)))throw new Error('成员资格或剩余 CD 已变化，请先调整批次');
  if(new Set(members.map(r=>r.accountId)).size!==members.length||members.length>Math.min(t.maxParallel,s.config.concurrency))throw new Error('同账号冲突或超过并行上限');
  if(['daily5','raid10'].includes(t.partyRule))M.validateParty(M.partyTask(t,p.teamConfigs?.[index]),members,p.companionAssignments?.[index]||[],s.config.concurrency);
  else if(t.type==='team'&&!M.teamCandidates({...t,runs:1},members,[],s.config.concurrency).teams.length)throw new Error('队伍职责或区服不满足');
  return t;
 }
 // Team locks protect membership and scheduling; execution remains available.
 function assertBatchEditable(s,p,index){
  if(!p||!Number.isInteger(index)||!p.batches[index])throw new Error('排程批次不存在');
  if(p.lockedBatches?.includes(index))throw new Error('第 '+(index+1)+' 批队伍已锁定，请先解锁');
  if(p.cancelled||(p.routeTaskIds||[p.taskId]).some(id=>!remaining(s,p,id).includes(index)))throw new Error('该队伍已有执行或已结束，不能修改成员');
 }
 function assertPlanUnlocked(p){if(p?.lockedBatches?.length)throw new Error('排程包含锁定队伍，请先解锁后再调整');}
 function setBatchLocked(s,p,index,locked){
  if(!p||!Number.isInteger(index)||!p.batches[index])throw new Error('排程批次不存在');
  if(locked)assertBatchEditable(s,{...p,lockedBatches:[]},index);
  p.lockedBatches=[...new Set([...(p.lockedBatches||[]).filter(i=>i!==index),...(locked?[index]:[])])].sort((a,b)=>a-b);p.updatedAt=new Date().toISOString();
 }
 function lockedRoleIds(s,p){
  const tasks=(p.routeTaskIds||[p.taskId]).map(id=>s.tasks.find(t=>t.id===id));
  return new Set([p,...s.plans.filter(x=>x.id!==p.id&&!x.cancelled&&(x.routeTaskIds||[x.taskId]).some(id=>{const t=s.tasks.find(t=>t.id===id);return t&&tasks.some(q=>q&&M.cdKey(q)===M.cdKey(t)&&M.cycle(q,M.planStart(s,p,q.id))===M.cycle(t,M.planStart(s,x,id)));}))].flatMap(x=>(x.lockedBatches||[]).flatMap(i=>x.batches[i]||[])));
 }
 function executionTiming(date,input={},accountCount=1){
  const instant=(value,day)=>value?/^\d{2}:\d{2}(:\d{2})?$/.test(value)?day+'T'+value+(value.length===5?':00':'')+'+08:00':/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(value)?value+(value.length===16?':00':'')+'+08:00':value:null;
  const start=instant(input.startedAt||input.startTime,date),end=instant(input.endedAt||input.endTime,input.endDate||date);
  if(start&&(!Number.isFinite(Date.parse(start))||M.dateKey(new Date(start))!==date))throw new Error('开始时间必须属于执行日期（北京时间）');
  if(end&&(!start||!Number.isFinite(Date.parse(end))||Date.parse(end)<Date.parse(start)))throw new Error('结束时间必须有效且不早于开始时间；跨天请调整结束日期');
  const result={startedAt:start?new Date(start).toISOString():null,endedAt:end?new Date(end).toISOString():null};
  if(start&&end){result.minutes=(Date.parse(end)-Date.parse(start))/60000;result.onlineMinutes=result.minutes*accountCount;}
  return result;
 }
 function saveExecutionDraft(s,planId,taskId,index,input={}){
  const p=s.plans.find(p=>p.id===planId);if(!p)throw new Error('排程不存在');
  const fact=(p.completionFacts||[]).find(f=>f.taskId===taskId&&f.planBatchIndices.includes(index));
  executionTiming(input.date||fact?.date||p.date,input);
  if(!fact)checkBatch(s,p,taskId,index,M.planStart(s,p,taskId));
  if(s.records.some(r=>r.planId===planId&&r.taskId===taskId&&(!r.planBatchIndices||r.planBatchIndices.includes(index))))throw new Error('本批已有实测，请使用调整完成记录');
  for(const key of ['gold','minutes','onlineMinutes','otherCost'])if(input[key]!==''&&input[key]!=null)M.number(input[key],key);
  const draft={taskId,index,roleIds:[...p.batches[index]],values:JSON.parse(JSON.stringify(input)),updatedAt:new Date().toISOString()};
  p.executionDrafts=(p.executionDrafts||[]).filter(d=>d.taskId!==taskId||d.index!==index);p.executionDrafts.push(draft);p.updatedAt=draft.updatedAt;return draft;
 }
 // Opening a pending batch persists its clock even when the dialog is cancelled.
 function openExecutionDraft(s,planId,taskId,index,defaults={},now=new Date()){
  const p=s.plans.find(p=>p.id===planId);if(!p)throw new Error('排程不存在');
  const fact=(p.completionFacts||[]).find(f=>f.taskId===taskId&&f.planBatchIndices[0]===index);
  const draft=p.executionDrafts?.find(d=>d.taskId===taskId&&d.index===index&&JSON.stringify(d.roleIds)===JSON.stringify(p.batches[index]))?.values||{};
  const values={...defaults,...draft},day=M.dateKey(now),time=new Date(now.getTime()+8*3600000).toISOString().slice(11,19);
  if(fact?.startedAt){values.date=fact.date;values.startTime=new Date(Date.parse(fact.startedAt)+8*3600000).toISOString().slice(11,19);values.startedAt=fact.startedAt;}
  if(values.startTime||values.startedAt){values.date=values.date||fact?.date||p.date;values.endDate=day;values.endTime=time;delete values.endedAt;}
  else{values.date=day;values.startTime=time;values.endDate=day;values.endTime='';delete values.endedAt;}
  return saveExecutionDraft(s,planId,taskId,index,values);
 }
 // Return an entirely validated candidate. No state is written on a failed swap.
 function replaceBatchRole(s,p,index,fromRoleId,toRoleId){
  assertBatchEditable(s,p,index);
  if(!p.batches[index].includes(fromRoleId)||!toRoleId||fromRoleId===toRoleId)throw new Error('请选择不同的换入角色');
  if(lockedRoleIds(s,p).has(toRoleId))throw new Error('换入角色属于锁定批次，请先解锁该队伍');
  if(p.batches[index].includes(toRoleId))throw new Error('换入角色已在本队');
  const next=JSON.parse(JSON.stringify(p)),affected=[index];
  const other=p.batches.findIndex((b,i)=>i!==index&&b.includes(toRoleId)&&(p.routeTaskIds||[p.taskId]).every(id=>remaining(s,p,id).includes(i)));
  if(other>=0){assertBatchEditable(s,p,other);next.batches[other]=next.batches[other].map(id=>id===toRoleId?fromRoleId:id);affected.push(other);}
  next.batches[index]=next.batches[index].map(id=>id===fromRoleId?toRoleId:id);
  next.companionAssignments=next.batches.map((_,i)=>next.companionAssignments?.[i]||[]);
  for(const i of affected){
   const members=next.batches[i].map(id=>s.roles.find(r=>r.id===id));
   if(members.some(r=>!r))throw new Error('换入角色不存在');
   const t=M.partyTask(M.savedPartyTask(M.taskForVersion(s,s.tasks.find(t=>t.id===p.taskId)),p),next.teamConfigs?.[i]);
   M.validateDailyGongzhan(t,members);
   if(['daily5','raid10'].includes(t.partyRule)){
    const companions=M.companionAssignments(t,members,t.partyRule==='daily5'?5:10);
    if(!companions)throw new Error('换人后职责或侠客不足');next.companionAssignments[i]=companions;
   }
   for(const taskId of next.routeTaskIds||[next.taskId])checkBatch(s,next,taskId,i,M.planStart(s,next,taskId));
  }
  M.validatePlanCapacity(s,next);next.updatedAt=new Date().toISOString();return next;
 }
 function removeBatchRole(s,p,index,roleId){
  assertBatchEditable(s,p,index);
  if(!p.batches[index].includes(roleId))throw new Error('角色不在本队');
  if(p.batches[index].length<=1)throw new Error('不能移除最后一名角色，请删除批次或整个任务');
  const next=JSON.parse(JSON.stringify(p));next.batches[index]=next.batches[index].filter(id=>id!==roleId);
  const members=next.batches[index].map(id=>s.roles.find(r=>r.id===id)),base=M.savedPartyTask(M.taskForVersion(s,s.tasks.find(t=>t.id===p.taskId)),p);
  if(base.partyRule==='raid10'){
   next.teamConfigs=next.batches.map((batch,i)=>i===index?{...(p.teamConfigs?.[i]||{name:'第 '+(i+1)+' 队',tankMode:base.tankMode||'auto'}),playerSeats:batch.length}:p.teamConfigs?.[i]||null);
  }
  const task=M.partyTask(base,next.teamConfigs?.[index]);M.validateDailyGongzhan(task,members);
  next.companionAssignments=next.batches.map((_,i)=>p.companionAssignments?.[i]||[]);
  if(['daily5','raid10'].includes(task.partyRule)){
   const companions=M.companionAssignments(task,members,task.partyRule==='daily5'?5:10);
   if(!companions)throw new Error('移除后职责或已有侠客不足，请先调整队伍');next.companionAssignments[index]=companions;
  }
  for(const taskId of next.routeTaskIds||[next.taskId])checkBatch(s,next,taskId,index,M.planStart(s,next,taskId));
  M.validatePlanCapacity(s,next);
  if(next.executionDrafts)next.executionDrafts=next.executionDrafts.filter(d=>d.index!==index);
  next.updatedAt=new Date().toISOString();return next;
 }
 // Validate arbitrary roster edits atomically. Completed and locked batches are immutable.
 function setBatchRosters(s,p,batches){
  if(!Array.isArray(batches)||!batches.length||batches.length>100)throw new Error('请保留 1–100 个队伍');
  if(batches.length<p.batches.length)throw new Error('已有批次请通过删除批次处理');
  const next=JSON.parse(JSON.stringify(p)),affected=[],protectedRoles=lockedRoleIds(s,p);
  for(let i=0;i<batches.length;i++){
   const ids=batches[i];if(!Array.isArray(ids)||!ids.length||new Set(ids).size!==ids.length)throw new Error('第 '+(i+1)+' 队至少需要一名角色，且不能重复');
   if(JSON.stringify(ids)!==JSON.stringify(p.batches[i]||[])){if(p.batches[i])assertBatchEditable(s,p,i);if(ids.some(id=>!p.batches[i]?.includes(id)&&protectedRoles.has(id)))throw new Error('角色属于锁定队伍，请先解锁');affected.push(i);}
  }
  next.batches=batches.map(ids=>[...ids]);next.teamConfigs=next.batches.map((_,i)=>p.teamConfigs?.[i]||null);next.companionAssignments=next.batches.map((_,i)=>p.companionAssignments?.[i]||[]);
  for(const i of affected){
   const members=next.batches[i].map(id=>s.roles.find(r=>r.id===id));if(members.some(r=>!r))throw new Error('角色不存在');
   const base=M.savedPartyTask(M.taskForVersion(s,s.tasks.find(t=>t.id===p.taskId)),p);
   if(base.partyRule==='raid10')next.teamConfigs[i]={...(next.teamConfigs[i]||{name:'第 '+(i+1)+' 队',tankMode:base.tankMode||'auto'}),playerSeats:members.length};
   const task=M.partyTask(base,next.teamConfigs[i]);M.validateDailyGongzhan(task,members);
   if(['daily5','raid10'].includes(task.partyRule)){const companions=M.companionAssignments(task,members,task.partyRule==='daily5'?5:10);if(!companions)throw new Error('第 '+(i+1)+' 队职责或已有侠客不足');next.companionAssignments[i]=companions;}
   for(const id of next.routeTaskIds||[next.taskId])checkBatch(s,next,id,i,M.planStart(s,next,id));
  }
  for(const id of next.routeTaskIds||[next.taskId])if(next.taskSnapshots?.[id])next.taskSnapshots[id].roleIds=[...new Set([...(next.taskSnapshots[id].roleIds||[]),...next.batches.flat()])];
  M.validatePlanCapacity(s,next);if(next.executionDrafts)next.executionDrafts=next.executionDrafts.filter(d=>!affected.includes(d.index));next.updatedAt=new Date().toISOString();return next;
 }
 function registerBatch(s,planId,taskId,index,input={}){
  const copy=JSON.parse(JSON.stringify(s)),p=copy.plans.find(p=>p.id===planId);if(!p)throw new Error('排程不存在');
  const date=input.date||(p.completionFacts||[]).find(f=>f.taskId===taskId&&f.planBatchIndices[0]===index)?.date||p.date;
  const timing=executionTiming(date,input,new Set((p.batches[index]||[]).map(id=>copy.roles.find(r=>r.id===id)?.accountId)).size);
  let fact=(p.completionFacts||[]).find(f=>f.taskId===taskId&&f.planBatchIndices[0]===index);
  if(copy.records.some(r=>r.planId===planId&&r.taskId===taskId&&(!r.planBatchIndices||r.planBatchIndices.includes(index))))throw new Error('本批已有实测，请勿重复登记');
  const values=['gold','minutes','onlineMinutes'].map(k=>input[k]!==undefined&&input[k]!==''&&input[k]!==null);
  if(fact&&!values.some(Boolean))throw new Error('已登记完成，请填写金额或耗时后补录');
  if(!fact){
   const when=timing.startedAt||date,t=checkBatch(copy,p,taskId,index,when),ids=[...p.batches[index]],accounts=new Set(ids.map(id=>copy.roles.find(r=>r.id===id).accountId));
   fact={id:M.id('completion'),completionOnly:true,planId,taskId,taskName:t.name,date,startedAt:timing.startedAt,cycle:M.cycle(t,when),roleIds:ids,batches:1,planBatchIndices:[index],source:'完成登记',createdAt:new Date().toISOString(),note:input.note||'',snapshot:M.pricingConfig(copy,when),billingAccounts:copy.accounts.filter(a=>accounts.has(a.id)).map(a=>({...a})),...(t.dungeonId?{dungeonId:t.dungeonId,dungeonName:t.dungeonName,difficulty:t.difficulty,cdSnapshot:{period:t.period,resetDays:t.resetDays||[t.resetDay],resetDay:t.resetDay,resetHour:t.resetHour}}:{})};
   fact.cycleSnapshot={period:t.period,resetDays:t.resetDays||[t.resetDay],resetDay:t.resetDay,resetHour:t.resetHour};M.freezeRecord(copy,fact);p.completionFacts??=[];p.completionFacts.push(fact);
  }
  if(timing.startedAt&&fact.startedAt&&fact.startedAt!==timing.startedAt)throw new Error('补录须沿用完成登记的开始时刻；需要改期请先撤销完成');
  if(timing.startedAt&&!fact.startedAt){if(M.cycle(fact.cycleSnapshot||fact.cdSnapshot||copy.tasks.find(t=>t.id===taskId),timing.startedAt)!==fact.cycle)throw new Error('开始时间属于另一刷新周期，请先撤销完成并改期');fact.startedAt=timing.startedAt;}
  if(timing.endedAt)fact.endedAt=timing.endedAt;
  const previousMeasurements=fact.measurements||{},measurements={...previousMeasurements,financialAllocation:input.financialAllocation||previousMeasurements.financialAllocation||'none'};
  for(const k of ['gold','minutes','onlineMinutes','otherCost'])if(input[k]!==undefined&&input[k]!==''&&input[k]!==null)measurements[k]=M.number(input[k],k);
  if(['gold','minutes','onlineMinutes'].some(k=>measurements[k]!=null))fact.measurements=measurements;
  const complete=['gold','minutes','onlineMinutes'].every(k=>measurements[k]!=null);
  input={...input,...measurements};
  let record=null;
  if(complete){
   const pref={timeAllocation:input.timeAllocation||copy.recordingPreferences?.timeAllocation||'attendance',financialAllocation:input.financialAllocation||copy.recordingPreferences?.financialAllocation||'none'},n=fact.roleIds.length;
   record={...fact,id:M.id('record'),completionOnly:false,completionId:fact.id,gold:M.number(input.gold,'实际金币'),minutes:M.number(input.minutes,'实际操作分钟'),onlineMinutes:M.number(input.onlineMinutes,'账号在线分钟'),otherCost:M.number(input.otherCost??0,'其他成本'),accountMinutes:{},measurementStatus:'confirmed',source:'手工实测',note:input.note||fact.note||'',attendanceWeights:Object.fromEntries(fact.roleIds.map(id=>[id,1]))};delete record.billingAccounts;
   if(pref.timeAllocation==='attendance'||pref.financialAllocation==='attendance'){record.roleOnlineMinutes={};if(pref.financialAllocation==='attendance'){record.roleAllocations={};record.allocationMethod='attendance';}for(const id of fact.roleIds){const account=fact.roleAccounts[id],online=record.onlineMinutes/n;record.roleOnlineMinutes[id]=online;record.accountMinutes[account]=(record.accountMinutes[account]||0)+online;if(record.roleAllocations)record.roleAllocations[id]={gold:record.gold/n,minutes:record.minutes/n,onlineMinutes:online,otherCost:record.otherCost/n};}}
   const pricingState={...copy,config:fact.snapshot,accounts:fact.billingAccounts,roles:copy.roles.map(r=>fact.roleAccounts[r.id]?{...r,accountId:fact.roleAccounts[r.id]}:r)},billing=M.executionPricing(pricingState,record,[fact.roleIds]);record.snapshot=billing.config;record.billableAccountMinutes=billing.billableAccountMinutes;record.coveredAccountMinutes=billing.coveredAccountMinutes;record.billingWarnings=billing.billingWarnings;
   copy.records.push(record);copy.recordingPreferences=pref;
  }
  p.executionDrafts=(p.executionDrafts||[]).filter(d=>d.taskId!==taskId||d.index!==index);
  p.updatedAt=new Date().toISOString();reconcile(copy,p);M.validateState(copy);Object.assign(s,copy);return record||fact;
 }
 function reuseRaidTeams(s,source,taskIds,date,{indices=null,startTime='',excludePlanId=null}={}){
  const tasks=taskIds.map(id=>s.tasks.find(t=>t.id===id)).map(t=>t&&M.planningTask(M.taskForVersion(s,t)));
  if(!source||!tasks.length||tasks.some(t=>!t?.enabled||t.partyRule!=='raid10')||!(source.routeTaskIds||[source.taskId]).every(id=>s.tasks.find(t=>t.id===id)?.partyRule==='raid10'))throw new Error('请选择十人副本队伍及启用的目标副本');
  indices??=source.batches.map((_,i)=>i);
  if(new Set(tasks.map(M.cdKey)).size!==tasks.length)throw new Error('同一路线不能重复选择相同副本 CD');
  if(!indices.length||new Set(indices).size!==indices.length||indices.some(i=>!Number.isInteger(i)||!source.batches[i]))throw new Error('请勾选要沿用的队伍');
  if(tasks.some(t=>indices.length>t.runs))throw new Error('所选队伍数超过目标副本的目标团队数，请先增加团队数或减少勾选');
  const first=tasks[0],p={id:M.id('plan'),taskId:first.id,taskName:first.name,routeTaskIds:tasks.length>1?tasks.map(t=>t.id):undefined,date,startedAt:startTime?date+'T'+startTime+':00+08:00':null,batches:indices.map(i=>[...source.batches[i]]),teamConfigs:indices.map(i=>source.teamConfigs?.[i]?JSON.parse(JSON.stringify(source.teamConfigs[i])):{name:'团队 '+(i+1),playerSeats:source.batches[i].length,tankMode:'auto'}),companionAssignments:[],rulesSnapshot:{fillCompanionSlots:true},executed:false};
  for(const [i,batch]of p.batches.entries()){
   const members=batch.map(id=>s.roles.find(r=>r.id===id));if(members.some(r=>!r))throw new Error('原队伍角色已移除，请重新配置');
   const combined={...first,tank:Math.max(...tasks.map(t=>t.tank||0)),heal:Math.max(...tasks.map(t=>t.heal||0)),allowCompanions:tasks.every(t=>t.allowCompanions!==false),companionLimit:Math.min(...tasks.map(t=>t.companionLimit??3))};
   const companions=M.companionAssignments(M.partyTask(combined,p.teamConfigs[i]),members,10);if(!companions)throw new Error('第 '+(i+1)+' 队已有侠客或职责不足，无法补满 10 席');p.companionAssignments.push(companions);
  }
  M.validatePlanCapacity(s,p,excludePlanId);for(const task of tasks)for(const i of p.batches.keys())checkBatch(s,p,task.id,i,M.planStart(s,p,task.id));
  return p;
 }
 function reusePlan(s,source,date,{fullRaid=false}={}){
  const ids=source.routeTaskIds||[source.taskId],reasons=[],next={id:M.id('plan'),taskId:source.taskId,taskName:source.taskName,routeTaskIds:source.routeTaskIds?[...ids]:undefined,rulesSnapshot:source.rulesSnapshot?JSON.parse(JSON.stringify(source.rulesSnapshot)):undefined,date,batches:[],companionAssignments:[],teamConfigs:source.teamConfigs?[]:undefined,createdAt:new Date().toISOString(),executed:false};
  const primary=s.tasks.find(t=>t.id===source.taskId);if(fullRaid&&primary?.partyRule==='raid10')next.rulesSnapshot={...next.rulesSnapshot,fillCompanionSlots:true};
  for(const [i,batch]of source.batches.entries()){
   const trial={...next,batches:[...next.batches,[...batch]],companionAssignments:[...next.companionAssignments,source.companionAssignments?.[i]||[]],teamConfigs:next.teamConfigs?[...next.teamConfigs,source.teamConfigs[i]]:undefined};
   try{if(primary)M.validateDailyGongzhan(primary,batch.map(id=>s.roles.find(r=>r.id===id)));if(fullRaid&&primary?.partyRule==='raid10'){const members=batch.map(id=>s.roles.find(r=>r.id===id)),task=M.partyTask(M.planningTask(M.taskForVersion(s,primary)),source.teamConfigs?.[i]),companions=M.companionAssignments(task,members,10);if(!companions)throw new Error('已拥有侠客不足，无法补满 10 席');trial.companionAssignments[trial.batches.length-1]=companions;}M.validatePlanCapacity(s,trial);for(const taskId of ids)checkBatch(s,trial,taskId,trial.batches.length-1,M.planStart(s,trial,taskId));Object.assign(next,trial);}catch(e){reasons.push('第 '+(i+1)+' 批：'+e.message);}
  }
  return {plan:next,reasons};
 }
 function changeRemaining(s,p,taskId,indices,{action='move',date=p.date,startTime='',fromRoleId='',toRoleId='',reason=''}={}){
  if(!['move','stop'].includes(action)||!reason.trim())throw new Error('请选择操作并填写调整原因');
  for(const i of indices)if(p.lockedBatches?.includes(i))throw new Error('第 '+(i+1)+' 批队伍已锁定，请先解锁');
  if(toRoleId&&lockedRoleIds(s,p).has(toRoleId))throw new Error('换入角色属于锁定批次，请先解锁该队伍');
  const pending=remaining(s,p,taskId);if(!indices.length||new Set(indices).size!==indices.length||indices.some(i=>!pending.includes(i)))throw new Error('只能调整尚未执行的批次');
  const copy=JSON.parse(JSON.stringify(s)),original=copy.plans.find(x=>x.id===p.id),task=copy.tasks.find(t=>t.id===taskId);
  original.closedBatches??={};original.closedBatches[taskId]=[...(original.closedBatches[taskId]||[]),...indices];
  let next=null;if(action==='move'){
   if(fromRoleId&&!toRoleId||toRoleId&&!fromRoleId)throw new Error('换人需同时选择原角色和替换角色');
   if(fromRoleId&&!indices.some(i=>p.batches[i].includes(fromRoleId)))throw new Error('原角色不在所选批次中');
   next={...JSON.parse(JSON.stringify(p)),id:M.id('plan'),taskId,taskName:task.name,routeTaskIds:undefined,executedTaskIds:[],completionFacts:undefined,favorite:undefined,closedBatches:undefined,lockedBatches:[],changes:undefined,date,startedAt:startTime?date+'T'+startTime+':00+08:00':null,batches:indices.map(i=>p.batches[i].map(id=>id===fromRoleId?toRoleId:id)),teamConfigs:p.teamConfigs?indices.map(i=>p.teamConfigs[i]):undefined,executed:false,ended:false,cancelled:false,parentPlanId:p.id,createdAt:new Date().toISOString()};
   next.companionAssignments=next.batches.map((batch,i)=>{const members=batch.map(id=>copy.roles.find(r=>r.id===id)),t=M.partyTask(M.savedPartyTask(M.taskForVersion(copy,task),p),next.teamConfigs?.[i]);if(new Set(batch).size!==batch.length||new Set(members.map(r=>r?.accountId)).size!==members.length||members.length>Math.min(t.maxParallel,copy.config.concurrency))throw new Error('替换后角色重复、同账号冲突或超过并行上限');if(fromRoleId)M.validateDailyGongzhan(t,members);if(['daily5','raid10'].includes(t.partyRule)){const companions=M.companionAssignments(t,members,t.partyRule==='daily5'?5:10);if(!companions)throw new Error('换人后职责或侠客不足');M.validateParty(t,members,companions,copy.config.concurrency);return companions;}if(t.type==='team'&&!M.teamCandidates({...t,runs:1},members,[],copy.config.concurrency).teams.length)throw new Error('队伍条件不满足');return [];});
   M.validatePlanCapacity(copy,next);copy.plans.push(next);
  }
  original.updatedAt=new Date().toISOString();if(next)next.updatedAt=original.updatedAt;original.changes??=[];original.changes.push({taskId,indices:[...indices],action,date:action==='move'?date:null,reason:reason.trim(),nextPlanId:next?.id||null,at:new Date().toISOString()});reconcile(copy,original);M.validateState(copy);
  Object.assign(p,original);if(next)s.plans.push(next);return next;
 }
 function wage(s,r){const claim=(s.wageClaims||[]).find(c=>c.recordId===r.id),receipts=(s.wageReceipts||[]).filter(c=>c.recordId===r.id),paid=r.gold+receipts.reduce((n,c)=>n+c.gold,0);return {claim,receipts,paid,expected:claim?.expectedGold??null,unpaid:claim?Math.max(0,claim.expectedGold-paid):null};}
 function inventory(s,m){const sales=(s.materialSales||[]).filter(x=>x.materialId===m.id),sold=sales.reduce((n,x)=>n+x.quantity,0),left=m.quantity-sold;return {sales,sold,left,estimate:m.tradable!==false&&m.unitPrice!=null?left*m.unitPrice:null,realized:sales.reduce((n,x)=>n+x.quantity*x.unitGold-x.feeGold,0)};}
 function uniqueEvent(s,key){if(!key?.trim())throw new Error('请填写到账 / 出售凭据编号，避免同一事件重复计账');if(['wageReceipts','materialSales','ledger'].some(k=>(s[k]||[]).some(x=>x.eventKey?.trim()===key.trim())))throw new Error('该凭据已登记，请核对原记录');}
 function ledger(s,e,gold,category){if(e.roleId)s.ledger.push({id:'ledger_'+e.id,roleId:e.roleId,date:e.date,gold,direction:'in',category,linkedEventId:e.id,note:e.note||e.eventKey,source:'分账事件'});}
 function receipt(s,e){uniqueEvent(s,e.eventKey);s.wageReceipts??=[];const r=s.records.find(r=>r.id===e.recordId);if(!r)throw new Error('工资关联执行不存在');if(e.roleId&&!r.roleIds.includes(e.roleId))throw new Error('到账角色不在执行成员中');M.freezeRecord(s,r);e.roleAccounts={...r.roleAccounts};e.roleGroups={...r.roleGroups};e.snapshot={...M.pricingConfig(s,e.date),saleRate:1};s.wageReceipts.push(e);ledger(s,e,e.gold,'reward');M.validateState(s);}
 function sale(s,e){uniqueEvent(s,e.eventKey);const m=(s.materials||[]).find(m=>m.id===e.materialId);if(!m||m.tradable===false)throw new Error('该材料不存在或不可交易');if(e.quantity>inventory(s,m).left+1e-6)throw new Error('出售数量超过库存');if(m.roleId&&e.roleId!==m.roleId)throw new Error('出售归属应与库存所有者一致');const record=s.records.find(r=>r.id===m.recordId);if(record){M.freezeRecord(s,record);e.roleAccounts={...record.roleAccounts};e.roleGroups={...record.roleGroups};}else if(e.roleId){const role=s.roles.find(r=>r.id===e.roleId);e.roleAccounts={[e.roleId]:role.accountId};e.roleGroups={[e.roleId]:s.accounts.find(a=>a.id===role.accountId)?.group||''};}e.snapshot={...M.pricingConfig(s,e.date),saleRate:1};s.materialSales??=[];s.materialSales.push(e);ledger(s,e,e.quantity*e.unitGold-e.feeGold,'sale');M.validateState(s);}
 function cdRows(s,date,scope={}){const tasks=[...new Map(s.tasks.filter(t=>t.dungeonId).map(t=>[M.cdKey(t),t])).values()],roles=s.roles.filter(r=>(!scope.role||r.id===scope.role)&&(!scope.account||r.accountId===scope.account)&&(!scope.group||s.accounts.find(a=>a.id===r.accountId)?.group===scope.group));return roles.flatMap(role=>tasks.map(task=>{const p=M.getProgress(s,task,role,date),record=M.cdRecord(s,task,role.id,date),eligible=M.eligible(s,task).some(r=>r.id===role.id),status=record||p?.completed>0||p?.status==='completed'?'used':p?.status==='skipped'?'skipped':!eligible||!task.enabled?'ineligible':p?.status==='planned'||p?.status==='progressing'?'available':'unknown';let reset=date;for(let i=1;i<=8;i++){const next=M.addDays(date,i);if(M.cycle(task,next)!==M.cycle(task,date)){reset=next;break;}}return {role,task,p,record,status,reset,expiring:status==='available'&&reset===M.addDays(date,1)};}));}
 function expense(s,e){uniqueEvent(s,e.eventKey);if(e.direction!=='out'||['transfer','adjustment'].includes(e.category))throw new Error('经营费用必须是非转账的流出');M.number(e.gold,'费用金币',{min:.000001});const role=s.roles.find(r=>r.id===e.roleId),record=s.records.find(r=>r.id===e.recordId);if(record)M.freezeRecord(s,record);e={...e,roiCost:true,snapshot:{...M.pricingConfig(s,e.date),fee:0,saleRate:1},roleAccounts:{[e.roleId]:record?.roleAccounts[e.roleId]||role?.accountId},roleGroups:{[e.roleId]:record?.roleGroups[e.roleId]??s.accounts.find(a=>a.id===role?.accountId)?.group??''}};M.validateState({...s,ledger:[...s.ledger,e]});s.ledger.push(e);return e;}
 // A measured entry can cover several batches. Corrections always operate on that
 // entire entry so totals are never guessed or split between batches.
 function executionGroup(s,planId,taskId,index){
  const p=s.plans.find(p=>p.id===planId);if(!p||!(p.routeTaskIds||[p.taskId]).includes(taskId)||!Number.isInteger(index)||!p.batches[index])throw new Error('排程批次不存在');
  const record=s.records.find(r=>r.planId===planId&&r.taskId===taskId&&(!r.planBatchIndices||r.planBatchIndices.includes(index))),fact=(p.completionFacts||[]).find(f=>f.taskId===taskId&&f.planBatchIndices.includes(index));
  const indices=record?(record.planBatchIndices||p.batches.map((_,i)=>i)):fact?[index]:doneIndices(s,p,taskId).includes(index)?p.batches.map((_,i)=>i):[];
  if(!indices.length)throw new Error('本批尚未完成');return {p,record,fact,indices};
 }
 function editExecution(s,planId,taskId,index,input={}){
  const copy=JSON.parse(JSON.stringify(s)),{record:r,fact,p}=executionGroup(copy,planId,taskId,index);
  if(!r){if(!fact)throw new Error('旧完成标记没有实测明细，请撤销完成后重新登记');if(['gold','minutes','onlineMinutes'].some(k=>input[k]!==''&&input[k]!=null))return registerBatch(s,planId,taskId,index,input);fact.note=input.note??fact.note;fact.updatedAt=new Date().toISOString();}
  else{
   M.freezeRecord(copy,r);
   const previous=JSON.parse(JSON.stringify(r));
   if(['startTime','endTime','startedAt','endedAt','endDate'].some(k=>input[k]!==undefined)){
    const timing=executionTiming(r.date,{...input,startedAt:input.startedAt??(input.startTime!==undefined?null:r.startedAt),endedAt:input.endedAt??(input.endTime!==undefined?null:r.endedAt)});
    const task=copy.tasks.find(t=>t.id===r.taskId);if(M.cycle(r.cdSnapshot||fact?.cycleSnapshot||task,timing.startedAt||r.date)!==(r.cycle||M.cycle(r.cdSnapshot||fact?.cycleSnapshot||task,previous.startedAt||r.date)))throw new Error('开始时间属于另一刷新周期，请先撤销完成并改期');
    r.startedAt=timing.startedAt;r.endedAt=timing.endedAt;if(fact){fact.startedAt=r.startedAt;fact.endedAt=r.endedAt;}
   }
   for(const key of ['gold','minutes','onlineMinutes','otherCost'])r[key]=M.number(input[key]??r[key]??0,key);
   // Preserve the historical attribution and pricing basis, including accounts
   // whose current owner or billing package has since changed.
   const scale=(map,total,oldTotal,weights)=>Object.fromEntries(Object.entries(map||{}).map(([id,n])=>[id,oldTotal?n/oldTotal*total:(weights[id]||0)*total]));
   const attendance=r.attendanceWeights||Object.fromEntries(r.roleIds.map(id=>[id,1])),weightTotal=Object.values(attendance).reduce((n,v)=>n+v,0),roleWeights=Object.fromEntries(r.roleIds.map(id=>[id,attendance[id]/weightTotal]));
   const accountWeights={};for(const id of r.roleIds){const account=r.roleAccounts[id];accountWeights[account]=(accountWeights[account]||0)+roleWeights[id];}
   if(Object.keys(previous.accountMinutes||{}).length){r.accountMinutes=scale(previous.accountMinutes,r.onlineMinutes,previous.onlineMinutes,accountWeights);for(const key of ['billableAccountMinutes','coveredAccountMinutes'])if(previous[key])r[key]=scale(previous[key],r.onlineMinutes,previous.onlineMinutes,key==='billableAccountMinutes'?accountWeights:{});}
   if(previous.onlineMinutes===0&&previous.billableAccountMinutes){const base=previous.snapshot.cardPrice*previous.snapshot.discount/previous.snapshot.cardMinutes;for(const [account,minutes]of Object.entries(r.accountMinutes)){const ratio=base?Math.max(0,Math.min(1,(previous.snapshot.accountBillingRates?.[account]??base)/base)):1;r.billableAccountMinutes[account]=minutes*ratio;r.coveredAccountMinutes[account]=minutes-r.billableAccountMinutes[account];}}
   if(previous.roleOnlineMinutes)r.roleOnlineMinutes=scale(previous.roleOnlineMinutes,r.onlineMinutes,previous.onlineMinutes,roleWeights);
   if(previous.roleAllocations)for(const id of r.roleIds)for(const key of ['gold','minutes','onlineMinutes','otherCost'])r.roleAllocations[id][key]=previous[key]?previous.roleAllocations[id][key]/previous[key]*r[key]:roleWeights[id]*r[key];
   if(input.gold!==undefined&&input.gold!=='')r.measurementStatus='confirmed';
   r.note=input.note??r.note;r.updatedAt=new Date(Math.max(Date.now(),Date.parse(previous.updatedAt||'')+1||0)).toISOString();r.correctionRevision=(r.correctionRevision||0)+1;r.corrections??=[];const {corrections,...snapshot}=previous;r.corrections.push({at:r.updatedAt,reason:input.reason?.trim()||'用户调整实测',before:snapshot});
  }
  p.updatedAt=new Date().toISOString();M.validateState(copy);Object.assign(s,copy);return r||fact;
 }
 const recycleKeys=['plans','records','progress','wageClaims','wageReceipts','materials','materialSales','ledger'];
 function archiveChange(before,after,label,reason){
  const changes=[];for(const key of recycleKeys){const old=new Map((before[key]||[]).map(x=>[x.id,x])),next=new Map((after[key]||[]).map(x=>[x.id,x]));for(const id of new Set([...old.keys(),...next.keys()]))if(JSON.stringify(old.get(id))!==JSON.stringify(next.get(id)))changes.push(JSON.parse(JSON.stringify({key,id,before:old.get(id)||null,after:next.get(id)||null})));}
  if(!changes.length)throw new Error('没有可删除或撤销的内容');
  const entry={id:M.id('recycle'),kind:'task-recycle',label,reason:reason?.trim()||'用户调整任务',changes,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),restoredAt:null};after.notes.push(entry);return entry;
 }
 function removeLinked(s,ids){
  const materials=new Set((s.materials||[]).filter(x=>ids.has(x.recordId)).map(x=>x.id)),events=new Set([...(s.wageReceipts||[]).filter(x=>ids.has(x.recordId)),...(s.materialSales||[]).filter(x=>materials.has(x.materialId))].map(x=>x.id));
  for(const key of ['wageClaims','wageReceipts','materials'])s[key]=(s[key]||[]).filter(x=>!ids.has(x.recordId));
  s.materialSales=(s.materialSales||[]).filter(x=>!materials.has(x.materialId));s.ledger=s.ledger.filter(x=>!ids.has(x.recordId)&&!events.has(x.linkedEventId));s.records=s.records.filter(r=>!ids.has(r.id));
 }
 function retractProgress(s,events){
  const counts=new Map();for(const e of events){if(e.progressManaged===false)continue;const t=s.tasks.find(t=>t.id===e.taskId);for(const id of e.roleIds){const role=s.roles.find(r=>r.id===id),p=M.getProgress(s,{...t,...(e.cycleSnapshot||e.cdSnapshot||{})},role,e.startedAt||e.date);if(!p||p.source!=='手工'||p.date!==e.date)continue;counts.set(p.id,(counts.get(p.id)||0)+(e.attendanceWeights?.[id]??(e.planBatchIndices?e.planBatchIndices.filter(i=>s.plans.find(p=>p.id===e.planId)?.batches[i]?.includes(id)).length:1)));}}
  for(const [id,n]of counts){const p=s.progress.find(p=>p.id===id);p.completed=Math.max(0,p.completed-n);p.status=p.completed>=p.target&&p.completed>0?'completed':p.completed?'progressing':'planned';p.updatedAt=new Date().toISOString();}
 }
 function planEvents(s,p){
  const events=M.executionRecords(s).filter(r=>r.planId===p.id);
  for(const taskId of p.routeTaskIds||[p.taskId]){const rows=events.filter(e=>e.taskId===taskId),indices=doneIndices(s,p,taskId).filter(i=>!rows.some(e=>!e.planBatchIndices||e.planBatchIndices.includes(i)));if(!indices.length)continue;const t=s.tasks.find(t=>t.id===taskId),roleIds=[...new Set(indices.flatMap(i=>p.batches[i]))];events.push({planId:p.id,taskId,date:p.date,startedAt:M.planStart(s,p,taskId),cycle:M.cycle(t,M.planStart(s,p,taskId)),roleIds,planBatchIndices:indices,attendanceWeights:Object.fromEntries(roleIds.map(id=>[id,indices.filter(i=>p.batches[i].includes(id)).length]))});}
  return events;
 }
 function reopenExecution(s,planId,taskId,index,{reason='',syncProgress=true}={}){
  const copy=JSON.parse(JSON.stringify(s)),{p,indices}=executionGroup(copy,planId,taskId,index),selected=new Set(indices),events=planEvents(copy,p).filter(r=>r.taskId===taskId&&(!r.planBatchIndices||r.planBatchIndices.some(i=>selected.has(i))));
  if(syncProgress)retractProgress(copy,events);
  removeLinked(copy,new Set(copy.records.filter(r=>events.some(e=>e.id===r.id)).map(r=>r.id)));
  p.completionFacts=(p.completionFacts||[]).filter(f=>f.taskId!==taskId||!f.planBatchIndices.some(i=>selected.has(i)));p.executedTaskIds=(p.routeTaskIds||[p.taskId]).filter(id=>id!==taskId&&doneIndices(copy,p,id).length===p.batches.length);p.executed=false;p.cancelled=false;
  reconcile(copy,p);p.updatedAt=new Date().toISOString();delete p.requiresReview;
  archiveChange(s,copy,'撤销完成 · '+(copy.tasks.find(t=>t.id===taskId)?.name||taskId)+' · 第 '+indices.map(i=>i+1).join('、')+' 批',reason);M.validateState(copy);Object.assign(s,copy);return indices;
 }
 function deletePlan(s,planId,{reason='',syncProgress=true}={}){
  const copy=JSON.parse(JSON.stringify(s)),p=copy.plans.find(p=>p.id===planId);if(!p)throw new Error('排程不存在');
  assertPlanUnlocked(p);
  const events=planEvents(copy,p);if(syncProgress)retractProgress(copy,events);removeLinked(copy,new Set(copy.records.filter(r=>r.planId===planId).map(r=>r.id)));copy.plans=copy.plans.filter(p=>p.id!==planId);
  const entry=archiveChange(s,copy,'删除排程 · '+(p.taskName||copy.tasks.find(t=>t.id===p.taskId)?.name||p.taskId)+' · '+p.date,reason);M.validateState(copy);Object.assign(s,copy);return entry;
 }
 function deletePendingBatch(s,planId,taskId,index,reason=''){
  const copy=JSON.parse(JSON.stringify(s)),p=copy.plans.find(p=>p.id===planId);if(!p)throw new Error('排程不存在');changeRemaining(copy,p,taskId,[index],{action:'stop',reason:reason.trim()||'删除未执行批次'});archiveChange(s,copy,'删除批次 · '+p.date+' · 第 '+(index+1)+' 批',reason);M.validateState(copy);Object.assign(s,copy);
 }
 function restoreDeleted(s,id){
  const copy=JSON.parse(JSON.stringify(s)),entry=copy.notes.find(n=>n.id===id&&n.kind==='task-recycle'&&!n.restoredAt);if(!entry)throw new Error('回收记录不存在或已经恢复');
  for(const c of entry.changes){const current=(copy[c.key]||[]).find(x=>x.id===c.id);if(!M.sameHistoryRow(copy,c.key,current||null,c.after))throw new Error('相关排程或记录已有后续修改，请先撤销后续调整，避免覆盖新数据');}
  for(const c of entry.changes){copy[c.key]=(copy[c.key]||[]).filter(x=>x.id!==c.id);if(c.before)copy[c.key].push(JSON.parse(JSON.stringify(c.before)));}
  // Refuse recovery if roles have since been arranged or completed elsewhere.
  const restoredPlans=new Set(entry.changes.filter(c=>c.key==='plans'&&c.before).map(c=>c.id));
  for(const p of copy.plans.filter(p=>restoredPlans.has(p.id))){if(!p.cancelled)M.validatePlanCapacity(copy,p);for(const e of M.executionRecords(copy).filter(e=>e.planId===p.id)){const t=copy.tasks.find(t=>t.id===e.taskId),when=e.startedAt||e.date;for(const id of e.roleIds){const other=M.executionRecords(copy).filter(x=>x.planId!==p.id&&x.roleIds.includes(id)&&(x.dungeonId?M.cdKey(x)===M.cdKey(t):x.taskId===t.id)&&(x.cycle||M.cycle(t,x.startedAt||x.date))===(e.cycle||M.cycle(t,when)));if(t.dungeonId&&other.length)throw new Error('该副本 CD 已被其他执行占用，无法恢复');const r=copy.roles.find(r=>r.id===id),progress=M.effectiveProgress(copy,t,r,when);if(progress.completed+M.reservedCount(copy,t,id,when)>progress.target)throw new Error(r.name+' 的目标已被其他排程或执行占用，无法恢复');}}}
  entry.restoredAt=new Date(Math.max(Date.now(),Date.parse(entry.updatedAt)+1)).toISOString();entry.updatedAt=entry.restoredAt;M.validateState(copy);Object.assign(s,copy);return entry;
 }
 function isPendingPlan(s,p){return !p.cancelled&&(p.routeTaskIds||[p.taskId]).some(id=>remaining(s,p,id).length);}
 function queueCompare(s,a,b,referenceDate=M.dateKey()){
  const ap=isPendingPlan(s,a),bp=isPendingPlan(s,b);if(ap!==bp)return ap?-1:1;
  if(!ap)return (Date.parse(b.createdAt)||0)-(Date.parse(a.createdAt)||0)||s.plans.indexOf(b)-s.plans.indexOf(a);
  // Today and upcoming dates first; earlier dates follow in calendar order.
  const pastA=a.date<referenceDate,pastB=b.date<referenceDate;if(pastA!==pastB)return pastA?1:-1;
  const dateOrder=(a.date||'').localeCompare(b.date||'');if(dateOrder)return dateOrder;
  if(!!a.queuePinned!==!!b.queuePinned)return a.queuePinned?-1:1;
  const ar=Number.isFinite(a.queuePosition),br=Number.isFinite(b.queuePosition);if(ar!==br)return ar?1:-1;
  if(ar&&a.queuePosition!==b.queuePosition)return a.queuePosition-b.queuePosition;
  return (Date.parse(b.createdAt)||0)-(Date.parse(a.createdAt)||0)||s.plans.indexOf(b)-s.plans.indexOf(a);
 }
 function reorderQueue(s,sourceId,targetId){
  const source=s.plans.find(p=>p.id===sourceId),target=s.plans.find(p=>p.id===targetId);
  if(!source||!target||source===target||!isPendingPlan(s,source)||!isPendingPlan(s,target))throw new Error('只能调整未完成排程的顺序');
  if(source.date!==target.date)throw new Error('请在同一排程日期内调整顺序');
  if(!!source.queuePinned!==!!target.queuePinned)throw new Error('请在同一置顶分组内拖动，或先调整置顶状态');
  const list=s.plans.filter(p=>isPendingPlan(s,p)).sort((a,b)=>queueCompare(s,a,b)),from=list.indexOf(source),to=list.indexOf(target);list.splice(from,1);list.splice(to,0,source);
  list.forEach((p,i)=>{p.queuePosition=i;p.updatedAt=new Date().toISOString();});return list.map(p=>p.id);
 }
 return {isPendingPlan,queueCompare,reorderQueue,batchAccountSlots,completedTime,canRegisterPlannedRole,executionTiming,saveExecutionDraft,openExecutionDraft,reuseRaidTeams,assertBatchEditable,assertPlanUnlocked,setBatchLocked,lockedRoleIds,setBatchRosters,replaceBatchRole,removeBatchRole,registerBatch,checkBatch,reusePlan,hasExecution,changeRemaining,expense,doneIndices,remaining,reconcile,wage,inventory,uniqueEvent,receipt,sale,cdRows,executionGroup,editExecution,reopenExecution,deletePlan,deletePendingBatch,restoreDeleted};
});
