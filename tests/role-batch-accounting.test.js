/* Run with: node --test tests/role-batch-accounting.test.js
 * Synthetic fixture only. No personal character or account data.
 */
'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const M=require('../model.js'),Daily=require('../daily.js'),Activity=require('../activity.js');
const DATE='2026-10-24';
function near(actual,expected,message){
  assert.ok(Math.abs(actual-expected)<1e-6,message+': expected '+expected+', got '+actual);
}
function fixture(){
  const state=M.demo(DATE);
  state.records=[];state.progress=[];state.plans=[];
  state.roles=state.roles.slice(0,3);
  state.tasks=[{...state.tasks[0],target:2,gold:100,shared:60,minutes:10,onlineExtra:2,
    prepare:2,otherCost:0,dungeonRewardMode:'manual',roleIds:state.roles.map(r=>r.id)}];
  state.config.concurrency=3;
  state.plans=[{id:'planA',taskId:'t1',taskName:'大战',date:DATE,startedAt:'2026-10-24T04:00:00.000Z',
    createdAt:'2026-10-24T01:00:00.000Z',batches:[['r1','r2'],['r1','r3']]}];
  return state;
}
function actualRecord(state){
  const record={id:'syntheticActual',taskId:'t1',planId:'planA',planBatchIndices:[0,1],date:DATE,
    roleIds:['r1','r2','r3'],gold:520,minutes:22,onlineMinutes:48,otherCost:0,batches:2,
    accountMinutes:{a1:24,a2:12,a3:12},snapshot:M.pricingConfig(state,DATE),
    measurementStatus:'confirmed',taskName:'大战'};
  M.freezeRecord(state,record);state.records=[record];return record;
}
test('confirmed multi-batch: role visits, direct income, shared income and costs',()=>{
  const s=fixture(),global=M.summary(s,DATE,DATE,{},'estimated');
  const role=s.roles.map(r=>M.summary(s,DATE,DATE,{role:r.id},'estimated'));
  [260,130,130].forEach((n,i)=>near(role[i].gold,n,'role gold'));
  [24,12,12].forEach((n,i)=>near(role[i].onlineMinutes,n,'role online'));
  for(const key of ['gold','minutes','onlineMinutes','card','net']){
    near(role.reduce((n,r)=>n+r[key],0),global[key],key+' conservation');
  }
});
test('each differently sized batch splits shared gold and group operations',()=>{
  const s=fixture();s.plans[0].batches=[['r1','r2'],['r3']];
  const global=M.summary(s,DATE,DATE,{},'estimated'),role=s.roles.map(r=>M.summary(s,DATE,DATE,{role:r.id},'estimated'));
  [130,130,160].forEach((n,i)=>near(role[i].gold,n,'reward split'));
  near(global.gold,420,'full reward');
  near(role[0].minutes,5+2/3,'batch 1 minute share');
  near(role[1].minutes,5+2/3,'batch 1 minute share');
  near(role[2].minutes,10+2/3,'batch 2 minute share');
  near(role.reduce((n,r)=>n+r.minutes,0),global.minutes,'group operation time conservation');
});
test('legacy confirmed records without roleAllocations derive role-level reports',()=>{
  const s=fixture(),record=actualRecord(s);
  const overall=M.summary(s,DATE,DATE,{},'actual'),rows=s.roles.map(r=>M.summary(s,DATE,DATE,{role:r.id},'actual'));
  [260,130,130].forEach((n,i)=>near(rows[i].gold,n,'historical allocation'));
  near(rows.reduce((n,r)=>n+r.card,0),overall.card,'historical card reconciliation');
  near(rows.reduce((n,r)=>n+r.minutes,0),overall.minutes,'historical group time reconciliation');
  assert.equal(Activity.online(s,record,'r1'),24);
  assert.equal(M.confirmedGoldEvents(s).filter(e=>e.recordId===record.id).length,3);
});
test('new completed batch records persist role gold, online minutes and billed minutes',()=>{
  const s=fixture();s.plans[0].batches=[['r1','r2']];
  const r=Daily.registerBatch(s,'planA','t1',0,{date:DATE,gold:260,minutes:10,onlineMinutes:24,otherCost:0});
  near(r.roleAllocations.r1.gold,130,'direct/shared role gold');
  near(r.roleOnlineMinutes.r1,12,'role online');
  near(r.roleBillableMinutes.r2,12,'role billed');
  assert.ok(M.validateState(s));
});
test('monthly expiry between batches charges the role present after expiry',()=>{
  const s=fixture();s.roles[2].accountId='a1';
  s.plans[0].batches=[['r1','r2'],['r3','r2']];
  s.accounts[0].billingType='monthly';s.accounts[0].monthlyExpiresAt='2026-10-24T04:15:00.000Z';
  const all=M.summary(s,DATE,DATE,{},'estimated'),roles=s.roles.map(r=>M.summary(s,DATE,DATE,{role:r.id},'estimated'));
  near(roles[0].card,0,'first role monthly covered');
  near(roles[2].card,9*30/4000,'second role billable');
  near(all.billableAccountMinutes.a1,9,'total account billed');
  near(roles.reduce((n,r)=>n+r.card,0),all.card,'all card charges');
});
test('actual account and role totals reconcile to global, no duplicate booking',()=>{
  const s=fixture();actualRecord(s);
  const all=M.summary(s,DATE,DATE,{},'actual'),roles=s.roles.map(r=>M.summary(s,DATE,DATE,{role:r.id},'actual'));
  const accounts=s.accounts.slice(0,3).map(a=>M.summary(s,DATE,DATE,{account:a.id},'actual'));
  for(const key of ['gold','card','net','onlineMinutes']){
    near(roles.reduce((n,r)=>n+r[key],0),all[key],'roles '+key);
    near(accounts.reduce((n,r)=>n+r[key],0),all[key],'accounts '+key);
  }
  near(Activity.dimensions(s,DATE,DATE).roles.reduce((n,r)=>n+(r.result?.gold||0),0),520,'contribution panel sum');
});
test('incomplete observations preserve unknown ROI and never invent real income',()=>{
  const s=fixture(),r={taskId:'t1',roleIds:['r1','r2'],gold:240,minutes:0,onlineMinutes:0,
    otherCost:0,batches:1,snapshot:M.pricingConfig(s,DATE),incompleteMeasurement:true};
  const role=M.recordResult(M.scopedRecord(s,r,{role:'r1'}),s.config);
  near(role.gold,120,'known gold');
  assert.equal(role.net,null);
});
