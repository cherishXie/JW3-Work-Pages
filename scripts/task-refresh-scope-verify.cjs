'use strict';
const assert=require('node:assert/strict'),M=require('../model'),D=require('../daily'),O=require('../operations'),R=require('../raid-catalog');
function fixture(partyRule='daily5',period='daily'){
 const s=M.blank();s.configurationConfirmed=true;s.partyRulesVersion=3;
 s.accounts=[{id:'a',name:'验证账号',enabled:true}];s.roles=[{id:'r',name:'验证角色',accountId:'a',level:M.CURRENT_LEVEL_CAP,enabled:true,school:'万花',stance:'花间游',server:'验证服',companionIds:[]}];
 s.tasks=[M.withPartyRule({...O.defaults('daily',['r']),id:'t',partyRule,period,resetHour:7,resetDay:1,resetDays:period==='weekly'?[1]:undefined,days:[0,1,2,3,4,5,6]})];
 s.plans=[{id:'p',taskId:'t',date:'2026-11-09',batches:[['r']],companionAssignments:[[]]}];return s;
}
for(const rule of ['daily5','none']){
 const s=fixture(rule),p=s.plans[0],t=s.tasks[0],before='2026-11-10T06:59:59+08:00',after='2026-11-10T07:00:00+08:00';
 assert(M.planExecutionValid(s,p,t,before));assert(!M.planTaskOverdue(s,p,t.id,before));assert(!M.planExecutionValid(s,p,t,after));assert(M.planTaskOverdue(s,p,t.id,after));
 const raw=JSON.stringify(s);assert.throws(()=>D.registerBatch(s,'p','t',0,{date:'2026-11-10',startTime:'07:00'}),/刷新周期/);assert.equal(JSON.stringify(s),raw);
 D.registerBatch(s,'p','t',0,{date:'2026-11-10',startTime:'06:59:59'});M.validateState(s);const f=s.plans[0].completionFacts[0];assert.equal(f.date,'2026-11-10');assert.equal(f.cycle,'2026-11-09');assert.equal(M.effectiveProgress(s,t,s.roles[0],before).completed,1);assert.equal(M.effectiveProgress(s,t,s.roles[0],after).completed,0);
}
const weekly=fixture('none','weekly');assert(M.planExecutionValid(weekly,weekly.plans[0],weekly.tasks[0],'2026-11-15T20:00:00+08:00'));assert(!M.planTaskOverdue(weekly,weekly.plans[0],'t','2026-11-16T06:59:59+08:00'));assert(M.planTaskOverdue(weekly,weekly.plans[0],'t','2026-11-16T07:00:00+08:00'));
const s=fixture();O.ensureDefaults(s);for(const d of R.dispatchDungeons)for(const difficulty of d.difficulties)s.tasks.push({...s.tasks[0],id:'retired_'+d.id+difficulty,partyRule:'raid10',dungeonId:d.id,dungeonName:d.name,difficulty,enabled:true});
const tasks=O.planningTasks(s,'2026-11-10','teams');assert(tasks.every(t=>!R.isDispatched(t)));for(const category of ['raid10','normal25','challenge25'])assert(tasks.some(t=>R.categoryOf(t)===category));
console.log('PASS daily/weekly refresh boundaries, after-midnight completion and cycle attribution, atomic rejection after refresh, independent next cycle and dispatch exclusions');

// A late execution retains its planned baseline, actual income date and one CD.
const late=fixture('none','weekly');
const forecast=M.summary(late,'2026-11-09','2026-11-09',{},'estimated').gold;
assert(forecast>0);
assert.equal(M.summary(late,'2026-11-11','2026-11-11',{},'estimated').gold,0);
D.registerBatch(late,'p','t',0,{date:'2026-11-11',startTime:'20:00',endTime:'20:30'});
assert.equal(late.plans[0].date,'2026-11-09');
assert.equal(M.summary(late,'2026-11-11','2026-11-11',{},'actual').hasData,false);
D.registerBatch(late,'p','t',0,{date:'2026-11-11',startTime:'20:00',endTime:'20:30',gold:1234,minutes:30,onlineMinutes:30});
assert.equal(late.records[0].date,'2026-11-11');
assert.equal(late.records[0].cycle,'2026-11-09');
assert.equal(M.summary(late,'2026-11-09','2026-11-09',{},'actual').gold,0);
assert.equal(M.summary(late,'2026-11-11','2026-11-11',{},'actual').gold,1234);
assert.equal(M.summary(late,'2026-11-09','2026-11-15',{},'actual').gold,1234);
assert.equal(M.summary(late,'2026-11-09','2026-11-09',{},'estimated').gold,forecast);
assert.equal(M.summary(late,'2026-11-11','2026-11-11',{},'estimated').gold,0);
assert.equal(M.executionRecords(late).length,1);
assert.equal(M.effectiveProgress(late,late.tasks[0],late.roles[0],'2026-11-11').completed,1);
assert.throws(()=>D.registerBatch(late,'p','t',0,{date:'2026-11-11',gold:1234,minutes:30}),/重复登记/);
console.log('PASS late completion and measurement: planned forecast, actual-date income, no duplicate income/completion/CD');
