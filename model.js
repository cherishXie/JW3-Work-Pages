/* Shared, dependency-free business rules. Browser and Node use the same functions. */
(function (root, factory) {
  const api = factory(typeof module !== 'undefined' && module.exports ? require('./catalog.js') : root.JX3Catalog);
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Workbench = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (Catalog) {
  'use strict';
  const VERSION = 1;
  const id = (prefix = 'id') => prefix + '_' + (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
  const beijingDateFormat=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'});
  function dateKey(d = new Date()) { return beijingDateFormat.format(d); }
  function addDays(date, n) { const d = new Date(date + 'T12:00:00+08:00'); d.setUTCDate(d.getUTCDate() + n); return dateKey(d); }
  function weekday(date) { return new Date(date + 'T12:00:00+08:00').getUTCDay(); }
  function weekStart(date) { return addDays(date, -((weekday(date) + 6) % 7)); }
  function dates(start, end) { const list=[]; for(let d=start;d<=end;d=addDays(d,1)){list.push(d);if(list.length>366)throw new Error('统计期间最多 366 天');}return list; }
  function cycle(task, when) {
    const instant = when.length === 10 ? new Date(when+'T12:00:00+08:00') : new Date(when);
    if(!Number.isFinite(instant.getTime())) throw new Error('日期无效');
    const shifted = new Date(instant.getTime() - Number(task.resetHour || 0)*3600000);
    const d=dateKey(shifted);
    if(task.period==='daily')return d;
    const resetDays=task.resetDays?.length?task.resetDays:[Number(task.resetDay??5)];
    const delta=Math.min(...resetDays.map(day=>(weekday(d)-day+7)%7));
    return addDays(d,-delta);
  }
  const dungeonRewardDefaults={dailyBossEquipment:1,dailyEquipmentGold:25,dailyBossGold:10,raidBossEquipment:2,raidEquipmentGold:100,raidBossGold:100,gongzhanExtraEquipment:1,raidClearBoxes:2,raidWeeklyBoxes:1,raidBoxEquipmentGold:100};
  function dungeonRewards(t,players,c={}){
    if(!['daily5','raid10'].includes(t.partyRule)||t.dungeonRewardMode!=='auto')return null;
    const r={...dungeonRewardDefaults,...c},raid=t.partyRule==='raid10',bosses=t.bossCount??(raid?1:3),extra=players.some(p=>p.gongzhanBuff===true)?r.gongzhanExtraEquipment:0;
    return {direct:raid?(r.raidClearBoxes+(t.raidWeekly? r.raidWeeklyBoxes:0))*r.raidBoxEquipmentGold:t.components?.length?t.components.reduce((n,x)=>n+x.quantity*x.price,0):t.gold,
      shared:bosses*((raid?r.raidBossEquipment:r.dailyBossEquipment)+extra)*(raid?r.raidEquipmentGold:r.dailyEquipmentGold)+bosses*(raid?r.raidBossGold:r.dailyBossGold)};
  }
  function dungeonGold(t,batches,c){return batches.reduce((sum,players)=>{const r=dungeonRewards(t,players,c);return sum+(r?players.length*r.direct+r.shared:0);},0);}
  function blank() { return {version:VERSION, dataKind:'actual', updatedAt:new Date().toISOString(), config:{...dungeonRewardDefaults,levelCap:130,goldUnit:10000,goldPrice:8.5,fee:0.02,saleRate:1,concurrency:3,cardPrice:30,cardMinutes:4000,discount:1,hourlyValue:20},accounts:[],roles:[],tasks:[],progress:[],records:[],ledger:[],cash:[],equipment:[],plans:[],imports:[],scenarios:[],notes:[],wageClaims:[],wageReceipts:[],materials:[],materialSales:[],sourceArchives:[],priceQuotes:[],energyRecipes:[],roiComparisons:[]}; }
  function demo(today=dateKey()) {
    const s=blank();s.dataKind='simulated';s.config.concurrency=8;
    s.accounts=Array.from({length:8},(_,i)=>({id:'a'+(i+1),name:'账号 '+String(i+1).padStart(2,'0'),group:i<4?'主力组':'日常组',balance:i%3===0?800:1600,balanceExpiry:null,enabled:true}));
    const names=['听雨','云归','照月','长风','青川','暮雪','星河','知秋','南枝','枕流','望舒','归鸿'];
    const schools=['纯阳','七秀','天策','万花','唐门','五毒','藏剑','长歌'];
    const stances=['紫霞功','云裳心经','铁牢律','花间游','天罗诡道','毒经','问水诀','莫问'];
    s.roles=names.map((name,i)=>({id:'r'+(i+1),accountId:'a'+(i%8+1),name,server:'梦江南',school:schools[i%8],stance:stances[i%8],duty:i%8===1?'heal':i%8===2?'tank':'dps',companionIds:['kang-yanbie','mu-qingrou','tang-xiaoke'],level:130,score:85000+i*1200,enabled:true,openingGold:18000+i*2500,observedGold:18000+i*2500,tags:'',companion:i%3===0?'沈剑心':'',updatedAt:new Date().toISOString()}));
    s.tasks=[
      {id:'t1',name:'大战日常',period:'daily',type:'role',roleIds:s.roles.map(r=>r.id),days:[1,2,3,4,5,6,0],target:1,gold:1600,shared:0,sharedMode:'batch',minutes:12,prepare:2,onlineExtra:0,maxParallel:3,efficiency:1,otherCost:0,enabled:true,resetHour:7,resetDay:5,minLevel:120,minScore:0,tank:0,heal:0,teamSize:5,runs:1},
      {id:'t2',name:'矿跑 · 联合日常',period:'daily',type:'role',roleIds:s.roles.map(r=>r.id),days:[1,2,3,4,5],target:1,gold:900,shared:300,sharedMode:'batch',minutes:6,prepare:1,onlineExtra:0,maxParallel:8,efficiency:1,otherCost:0,enabled:true,resetHour:7,resetDay:5,minLevel:0,minScore:0,tank:0,heal:0,teamSize:5,runs:1,components:[]},
      {id:'t3',name:'10 人副本',period:'weekly',type:'team',roleIds:s.roles.map(r=>r.id),days:[6],target:1,gold:52000,shared:0,sharedMode:'batch',minutes:42,prepare:5,onlineExtra:0,maxParallel:8,efficiency:1,otherCost:2,enabled:true,resetHour:7,resetDay:5,minLevel:120,minScore:80000,tank:1,heal:1,teamSize:5,externalSeats:5,runs:2},
      {id:'t4',name:'周常 · 勤修不辍',period:'weekly',type:'role',roleIds:s.roles.slice(0,8).map(r=>r.id),days:[0],target:1,gold:4800,shared:0,sharedMode:'batch',minutes:15,prepare:2,onlineExtra:0,maxParallel:4,efficiency:1,otherCost:0,enabled:true,resetHour:7,resetDay:5,minLevel:0,minScore:0,tank:0,heal:0,teamSize:5,runs:1}
    ];
    upgradeState(s);
    // Demo completion observations are separate from demonstration execution records.
    const monday=weekStart(today);
    for(let d=monday;d<=today;d=addDays(d,1)){
      for(const t of s.tasks.filter(t=>t.type==='role'&&t.days.includes(weekday(d)))) {
        const roles=s.roles.filter(r=>t.roleIds.includes(r.id)).slice(0,d===today?4:s.roles.length);
        for(const r of roles)s.progress.push({id:id('p'),roleId:r.id,taskId:t.id,cycle:cycle(t,d),date:d,completed:1,status:'completed',target:1,source:'示例',updatedAt:new Date().toISOString()});
        if(roles.length){const calc=calculateRole(t,roles,s.config,1);if(calc.batches.length)s.records.push({id:id('rec'),date:d,taskId:t.id,taskName:t.name,roleIds:calc.batches.flat().map(r=>r.id),gold:calc.gold,minutes:calc.minutes,onlineMinutes:calc.onlineMinutes,batches:calc.batches.length,accountMinutes:calc.accountMinutes,snapshot:{...s.config},note:'示例实测；不代表真实游戏收益',source:'示例'});}
      }
    }
    s.cash=[{id:'c1',date:monday,type:'income',amount:65,note:'示例 · 金币兑现'},{id:'c2',date:monday,type:'expense',amount:30,note:'示例 · 点卡充值'}];
    return s;
  }
  function number(value,name,{min=0,max=Infinity,integer=false}={}) {if(value===''||value===null||!Number.isFinite(Number(value))||Number(value)<min||Number(value)>max||(integer&&!Number.isInteger(Number(value))))throw new Error(name+' 必须为'+(integer?'整数':'数字')+'，范围 '+min+'–'+(max===Infinity?'无上限':max));return Number(value);}
  function validateConfig(c) {for(const k of Object.keys(dungeonRewardDefaults))if(c[k]!==undefined)number(c[k],k,{integer:!k.endsWith("Gold")});if(c.levelCap!==undefined)number(c.levelCap,'当前版本满级',{min:1,integer:true});if(c.accountBillingRates)for(const [id,v]of Object.entries(c.accountBillingRates)){if(!/^[-_a-zA-Z0-9]+$/.test(id))throw new Error('账号计价快照 ID 无效');number(v,'账号在线单价');}number(c.goldUnit,'金币换算单位',{min:1});number(c.goldPrice,'人民币价格');number(c.concurrency,'最大并行账号数',{min:1,integer:true});number(c.cardMinutes,'点卡分钟数',{min:1});number(c.cardPrice,'点卡价格');number(c.discount,'点卡折扣',{min:0,max:1});number(c.fee,'手续费',{max:1});number(c.saleRate,'出售率',{max:1});number(c.hourlyValue,'人工时薪');if(c.goldPriceObservedAt&&(!/T/.test(c.goldPriceObservedAt)||!Number.isFinite(Date.parse(c.goldPriceObservedAt))))throw new Error('金币价格采集时点无效');return c;}
  function validateTask(t,s) {
    if(!t.name?.trim())throw new Error('请填写任务名称');
    if(!['role','team'].includes(t.type)||!['daily','weekly'].includes(t.period))throw new Error('不支持的任务类型或周期');
    for(const key of ['gold','shared','minutes','prepare','onlineExtra','otherCost','minScore','minLevel'])number(t[key]??0,key);
    if(t.dungeonRewardMode!==undefined&&!['auto','manual'].includes(t.dungeonRewardMode))throw new Error('副本收益模式无效');if(t.raidWeekly!==undefined&&typeof t.raidWeekly!=='boolean')throw new Error('周常任务选项无效');if(t.bossCount!=null)number(t.bossCount,'首领数量',{min:1,integer:true});if(t.partyRule==='raid10'&&t.presetKey&&!t.gameVersion?.trim())throw new Error('默认十人本必须绑定资料片版本');
    for(const key of ['target','runs'])number(t[key]??1,key,{integer:true});
    number(t.maxParallel,'任务并行上限',{min:1,integer:true});number(t.efficiency,'并行效率',{min:.01,max:1});number(t.resetHour,'刷新小时',{max:23,integer:true});number(t.resetDay,'刷新星期',{max:6,integer:true});
    number(t.teamSize,'自有角色席位',{min:1,integer:true});number(t.tank,'坦克要求',{integer:true});number(t.heal,'治疗要求',{integer:true});number(t.externalSeats??0,'外部占位',{integer:true});
    if(t.tank+t.heal>(t.partyRule==='raid10'?10:t.partyRule==='daily5'?5:t.teamSize))throw new Error('坦克和治疗要求不能超过队伍席位');
    if(!Array.isArray(t.days)||t.days.some(d=>!Number.isInteger(d)||d<0||d>6))throw new Error('计划星期无效');
    if(!Array.isArray(t.roleIds)||t.roleIds.some(r=>!s.roles.some(x=>x.id===r)))throw new Error('任务包含不存在的角色');
    if(new Set(t.roleIds).size!==t.roleIds.length)throw new Error('任务参与角色不能重复');
    if(t.components!==undefined){if(!Array.isArray(t.components))throw new Error('收益组成必须是数组');for(const x of t.components){number(x.quantity,'组成数量');number(x.price,'组成单价');}}
    if(t.resetDays!==undefined&&(!Array.isArray(t.resetDays)||!t.resetDays.length||new Set(t.resetDays).size!==t.resetDays.length||t.resetDays.some(d=>!Number.isInteger(d)||d<0||d>6)))throw new Error('刷新星期必须为不重复的 0–6');
    if(t.dungeonId!==undefined&&t.dungeonId!==''&&(typeof t.dungeonId!=='string'||!/^[-_a-zA-Z0-9]+$/.test(t.dungeonId)||t.partyRule!=='raid10'||t.period!=='weekly'||t.target!==1))throw new Error('副本 CD 必须绑定十人本、按周刷新且每周期目标为 1');
    if(t.partyRule&&!['none','daily5','raid10'].includes(t.partyRule))throw new Error('不支持的组队规则');
    if(t.partyRule==='raid10'&&t.raidPlayerSeats!=='auto')number(t.raidPlayerSeats??8,'10 人本玩家席位',{min:1,max:10,integer:true});
    if(t.tankMode!==undefined&&!['auto','player','companion'].includes(t.tankMode))throw new Error('坦克来源无效');
    if(t.raidTeams!==undefined){if(!Array.isArray(t.raidTeams)||t.raidTeams.length>30)throw new Error('逐队配置最多 30 队');for(const c of t.raidTeams)validateTeamConfig(c);if(t.raidTeams.length&&t.runs!==t.raidTeams.length)throw new Error('目标队数与逐队配置不一致');}
    if(t.companionLimit!==undefined)number(t.companionLimit,'每角色召请上限',{min:0,max:3,integer:true});
    return t;
  }
  function withPartyRule(t,rule=t.partyRule||'none'){
    if(rule==='daily5')return {...t,partyRule:rule,type:'role',teamSize:5,externalSeats:0,maxParallel:5,tank:1,heal:1,dps:1,allowCompanions:t.allowCompanions!==false,companionLimit:t.companionLimit??3,preferRanged:false};
    if(rule==='raid10')return {...t,partyRule:rule,type:'team',teamSize:Number.isInteger(t.raidPlayerSeats)?t.raidPlayerSeats:8,raidPlayerSeats:t.raidPlayerSeats??'auto',externalSeats:0,maxParallel:10,tank:Math.max(1,t.tank||0),heal:Math.max(1,t.heal||0),dps:1,allowCompanions:t.allowCompanions!==false,companionLimit:t.companionLimit??3,preferRanged:t.preferRanged!==false,fillCompanionSlots:t.fillCompanionSlots===true};
    return {...t,partyRule:'none'};
  }
  function validateTeamConfig(c){
    if(!c||typeof c.name!=='string'||!c.name.trim()||c.name.length>80)throw new Error('请填写团队名称（最多 80 字）');
    number(c.playerSeats,'团队玩家人数',{min:1,max:10,integer:true});
    if(!['auto','player','companion'].includes(c.tankMode))throw new Error('团队坦克来源无效');
    return c;
  }
  function partyTask(task,config){return config?withPartyRule({...task,raidPlayerSeats:config.playerSeats,tankMode:config.tankMode},task.partyRule):withPartyRule(task);}
  function upgradeState(s){
    s.config.levelCap??=130;
    if(s.dungeonRewardsVersion!==1){for(const t of s.tasks)if(['daily5','raid10'].includes(t.partyRule)&&t.dungeonRewardMode===undefined){t.dungeonRewardMode='auto';if(t.partyRule==='daily5')t.bossCount??=3;}s.dungeonRewardsVersion=1;}
    for(const p of s.plans||[])delete p.requiresReview;
    if(s.partyRulesVersion===3)return s;
    for(const t of s.tasks){let rule=t.partyRule;if(!rule){if(t.name==='大战日常')rule='daily5';else if(t.name==='10 人副本'||t.name==='10人本')rule='raid10';}
      if(rule){t.previousPartyConfig={teamSize:t.teamSize,maxParallel:t.maxParallel,tank:t.tank,heal:t.heal,externalSeats:t.externalSeats};Object.assign(t,withPartyRule(t,rule));}
    }
    s.partyRulesVersion=3;return s;
  }
  function companionAssignments(task,players,totalSlots){
    // Small daily tails join a world party; only 3–4 players use companions.
    if(task.partyRule==='daily5'&&players.length>=1&&players.length<=2)return [];
    const counts={tank:0,heal:0,dps:0};for(const r of players){const d=Catalog.profile(r).duty;if(d in counts)counts[d]++;}
    if(task.tankMode==='player'&&counts.tank<(task.tank||0))return null;
    if(task.tankMode==='companion')counts.tank=0;
    const need=task.partyRule==='raid10'&&!task.fillCompanionSlots?['tank','heal','dps'].reduce((n,d)=>n+Math.max(0,(task[d]||0)-counts[d]),0):totalSlots-players.length;if(need<0||need>players.length*(task.companionLimit??3)||need+players.length>totalSlots)return null;
    const meets=c=>c.tank>=(task.tank||0)&&c.heal>=(task.heal||0)&&c.dps>=(task.dps||0);
    if(!need)return meets(counts)?[]:null;
    if(task.allowCompanions===false)return null;
    const options=[];for(const owner of players)for(const c of Catalog.owned(owner))for(const d of c.duties)if(['tank','heal','dps'].includes(d)&&!(task.tankMode==='player'&&d==='tank'))options.push({companionId:c.id,name:c.name,ownerRoleId:owner.id,ownerName:owner.name,duty:d,range:c.range});
    const scarcity=d=>Math.max(0,(task[d]||0)-counts[d]);options.sort((a,b)=>scarcity(b.duty)-scarcity(a.duty)||Number(a.duty!=='dps')-Number(b.duty!=='dps')||a.name.localeCompare(b.name));
    let solution=null,visits=0;
    function search(index,selected,used,perOwner,c){
      if(++visits>20000||solution)return;
      if(selected.length===need){if(meets(c))solution=selected;return;}
      if(options.length-index<need-selected.length)return;
      for(let i=index;i<options.length&&!solution;i++){const a=options[i];if(used.has(a.companionId)||(perOwner[a.ownerRoleId]||0)>=(task.companionLimit??3))continue;search(i+1,[...selected,a],new Set([...used,a.companionId]),{...perOwner,[a.ownerRoleId]:(perOwner[a.ownerRoleId]||0)+1},{...c,[a.duty]:c[a.duty]+1});}
    }
    search(0,[],new Set(),{},counts);return solution;
  }
  function validateParty(task,players,companions,capacity=Infinity){
    const t=withPartyRule(task),total=t.partyRule==='daily5'?5:t.partyRule==='raid10'?10:t.teamSize;
    if(players.length>Math.min(capacity,t.maxParallel))throw new Error('玩家数量超过并行账号上限');
    if(new Set(players.map(r=>r.accountId)).size!==players.length)throw new Error('同队包含同账号角色');
    if(new Set(players.map(r=>r.id)).size!==players.length)throw new Error('同队玩家角色重复');
    if(players.some(r=>!r.server)||new Set(players.map(r=>r.server)).size!==1)throw new Error('队伍区服缺失或不兼容');
    if(players.some(r=>r.creationStatus==='planned'||t.levelCap&&r.level!==t.levelCap||r.enabled===false||(r.level??0)<t.minLevel||(r.score??0)<t.minScore))throw new Error('成员资格失效');
    if(t.partyRule==='daily5'&&players.length<=2){
      if(!players.length)throw new Error('大战批次至少需要一个角色');
      if(companions.length)throw new Error('1–2 角色大战批次须世界组队，不补充侠客');
      return true;
    }
    if(t.partyRule==='raid10'&&(t.raidPlayerSeats==='auto'?![7,8].includes(players.length):players.length!==t.raidPlayerSeats))throw new Error('10 人本玩家人数与该队配置不一致');
    if(players.length+companions.length>total||(t.partyRule==='daily5'||t.partyRule==='raid10'&&t.fillCompanionSlots)&&players.length+companions.length!==total)throw new Error('玩家与侠客数量不符合队伍总容量');
    if(companions.length&&t.allowCompanions===false)throw new Error('当前任务不允许侠客助战');
    if(new Set(companions.map(c=>c.companionId)).size!==companions.length)throw new Error('同队不能重复召请同名侠客');
    const ownerCount={};for(const c of companions){const owner=players.find(r=>r.id===c.ownerRoleId);if(!owner||!Catalog.owned(owner).some(x=>x.id===c.companionId&&x.duties.includes(c.duty)))throw new Error('侠客归属、拥有状态或职责已变化');ownerCount[owner.id]=(ownerCount[owner.id]||0)+1;if(ownerCount[owner.id]>(t.companionLimit??3))throw new Error('超过单角色召请上限');}
    const duties=[...players.map(r=>Catalog.profile(r).duty),...companions.map(c=>c.duty)];for(const d of ['tank','heal','dps'])if(duties.filter(x=>x===d).length<(t[d]||0))throw new Error('缺少必需职责 '+d);
    if(t.tankMode==='player'&&(players.filter(r=>Catalog.profile(r).duty==='tank').length<(t.tank||0)||companions.some(c=>c.duty==='tank')))throw new Error('该队要求使用玩家 T');
    if(t.tankMode==='companion'&&companions.filter(c=>c.duty==='tank').length<(t.tank||0))throw new Error('该队要求使用侠客 T');
    return true;
  }
  // Apply the new daily allocation limit when grouping or editing, without
  // invalidating the execution of historical parties.
  function validateDailyGongzhan(task,players){
    if(task.partyRule==='daily5'&&players.filter(r=>r?.gongzhanBuff===true).length>1)throw new Error('大战每队最多安排一名共战江湖角色，请分散到其他队伍');
    return true;
  }
  function batchTransition(previous,players){
    const before=new Map(previous.map(r=>[r.accountId,r])),after=new Map(players.map(r=>[r.accountId,r]));
    return {login:players.filter(r=>!before.has(r.accountId)),logout:previous.filter(r=>!after.has(r.accountId)),
      switchRole:players.filter(r=>before.has(r.accountId)&&before.get(r.accountId).id!==r.id).map(r=>({from:before.get(r.accountId),to:r})),
      stay:players.filter(r=>before.get(r.accountId)?.id===r.id)};
  }
  function batchSwitchCost(batches){
    let logins=0,switches=0;for(let i=0;i<batches.length;i++){const change=batchTransition(batches[i-1]||[],batches[i]);logins+=change.login.length;switches+=change.switchRole.length;}
    return {logins,switches};
  }
  // Improve an already feasible allocation without changing coverage, batch sizes or quotas.
  // Login changes dominate character-select switches; bounded local search keeps large pools responsive.
  function optimizeBatchSwitching(input,{rebuild=p=>p,reorder=true,locked=[]}={}){
    let parties=input.map(p=>({...p,players:[...p.players]}));if(parties.length<2)return parties;
    const weight=parties.reduce((n,p)=>n+p.players.length,0)+1;
    const score=ps=>{const c=batchSwitchCost(ps.map(p=>p.players));return c.logins*weight+c.switches;};
    let current=score(parties),attempts=0;
    const players=parties.flatMap(p=>p.players),accounts=new Set(players.map(r=>r.accountId)).size;
    const lower=accounts*weight+(new Set(players.map(r=>r.id)).size===players.length?players.length-accounts:0);
    for(let pass=0;pass<8&&attempts<6000&&current>lower;pass++){
      let best=null,bestScore=current;
      const consider=(candidate,changed)=>{
        if(++attempts>6000)return;const cost=score(candidate);if(cost>=bestScore)return;
        if(!locked.every(id=>candidate[0].players.some(r=>r.id===id)))return;
        for(const i of changed){const players=candidate[i].players;if(new Set(players.map(r=>r.accountId)).size!==players.length)return;const valid=rebuild(candidate[i]);if(!valid)return;candidate[i]=valid;}
        best=candidate;bestScore=cost;
      };
      for(let i=0;i<parties.length&&attempts<6000;i++)for(let j=i+1;j<parties.length&&attempts<6000;j++){
        // Equal-size batches retain full-party-first ordering. Named raid teams retain their positions.
        if(reorder&&parties[i].players.length===parties[j].players.length){const next=[...parties];[next[i],next[j]]=[next[j],next[i]];consider(next,[]);}
        for(let a=0;a<parties[i].players.length&&attempts<6000;a++)for(let b=0;b<parties[j].players.length&&attempts<6000;b++){
          const next=[...parties],left=[...parties[i].players],right=[...parties[j].players];[left[a],right[b]]=[right[b],left[a]];
          next[i]={...parties[i],players:left};next[j]={...parties[j],players:right};consider(next,[i,j]);
        }
      }
      if(!best)break;parties=best;current=bestScore;
    }
    // List retained accounts in the same relative order to make each transition easy to scan.
    for(let i=1;i<parties.length;i++){const order=new Map(parties[i-1].players.map((r,n)=>[r.accountId,n]));parties[i].players.sort((a,b)=>(order.get(a.accountId)??Infinity)-(order.get(b.accountId)??Infinity));}
    return parties;
  }
  function partyStats(players){
    const known=players.filter(r=>Number.isFinite(r.score)&&r.score>0),profiles=players.map(r=>Catalog.profile(r)),dps=profiles.filter(p=>p.duty==='dps');
    return {averageScore:known.length?known.reduce((n,r)=>n+r.score,0)/known.length:null,knownScores:known.length,unknownScores:players.length-known.length,melee:dps.filter(p=>p.range==='melee').length,ranged:dps.filter(p=>p.range==='ranged').length,unknownRange:dps.filter(p=>!['melee','ranged'].includes(p.range)).length};
  }
  // Balance only feasible daily allocations: retain sizes, duties, coverage and login budget.
  function balanceDailyParties(input,rebuild,locked=[]){
    if(input.length<2)return input;
    let parties=input;const budget=batchSwitchCost(input.map(p=>p.players));
    const groups=new Map();for(const r of input.flatMap(p=>p.players)){const key=r.server;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(r);}
    const targets=new Map([...groups].map(([key,players])=>[key,{...partyStats(players),size:players.length}]));
    const score=ps=>{let range=0,unknown=0,gear=0;for(const p of ps){const a=partyStats(p.players),t=targets.get(p.players[0]?.server),dps=a.melee+a.ranged,total=t.melee+t.ranged;if(total)range+=(a.melee-dps*t.melee/total)**2;unknown+=(a.unknownScores-p.players.length*t.unknownScores/t.size)**2;if(a.averageScore!==null&&t.averageScore)gear+=((a.averageScore-t.averageScore)/t.averageScore)**2;}return [range,unknown,gear];};
    const better=(a,b)=>{for(let i=0;i<a.length;i++){if(Math.abs(a[i]-b[i])>1e-10)return a[i]<b[i];}return false;};
    let current=score(parties),attempts=0;
    for(let pass=0;pass<12&&attempts<20000;pass++){
      let best=null,bestScore=current;
      for(let i=0;i<parties.length&&attempts<20000;i++)for(let j=i+1;j<parties.length&&attempts<20000;j++){
        if(parties[i].players[0]?.server!==parties[j].players[0]?.server)continue;
        for(let a=0;a<parties[i].players.length&&attempts<20000;a++)for(let b=0;b<parties[j].players.length&&attempts<20000;b++){
          const from=parties[i].players[a],to=parties[j].players[b];if(Catalog.profile(from).duty!==Catalog.profile(to).duty)continue;attempts++;
          const next=[...parties],left=[...parties[i].players],right=[...parties[j].players];[left[a],right[b]]=[right[b],left[a]];
          if(new Set(left.map(r=>r.accountId)).size!==left.length||new Set(right.map(r=>r.accountId)).size!==right.length)continue;
          next[i]={...parties[i],players:left};next[j]={...parties[j],players:right};
          if(!locked.every(id=>next[0].players.some(r=>r.id===id)))continue;
          const candidate=score(next);if(!better(candidate,bestScore))continue;const switching=batchSwitchCost(next.map(p=>p.players));if(switching.logins>budget.logins||switching.logins===budget.logins&&switching.switches>budget.switches)continue;
          const first=rebuild(next[i]),second=rebuild(next[j]);if(!first||!second)continue;next[i]=first;next[j]=second;best=next;bestScore=candidate;
        }
      }
      if(!best)break;parties=best;current=bestScore;
    }
    return parties;
  }
  const raidModes=['output','balanced','mentor'];
  function raidGongzhanStatus(players){const count=players.filter(r=>r?.gongzhanBuff===true&&r.enabled!==false&&r.creationStatus!=='planned').length;return {count,covered:count>0,extraEquipmentPerBoss:count>0?1:0};}
  function raidGongzhanWarnings(batches){return batches.flatMap((players,i)=>raidGongzhanStatus(players).covered?[]:['第 '+(i+1)+' 队缺少共战江湖：当前资格、CD、账号、职责或固定成员限制下，未能配置有效共战角色。']);}
  function raidPowerBasis(roles){
    const median=values=>{values.sort((a,b)=>a-b);const n=values.length;return n?(values[Math.floor((n-1)/2)]+values[Math.floor(n/2)])/2:1;};
    return {scoreMedian:median(roles.filter(r=>r.score>0&&Number.isFinite(r.score)).map(r=>r.score)),dpsMedian:median(roles.filter(r=>Catalog.profile(r).duty==='dps'&&r.referenceDps>0&&Number.isFinite(r.referenceDps)).map(r=>r.referenceDps))};
  }
  function roleOutputPower(role,basis){
    if(Catalog.profile(role).duty!=='dps')return 0;
    const gear=Number.isFinite(role.score)&&role.score>0?role.score/basis.scoreMedian:0;
    return Number.isFinite(role.referenceDps)&&role.referenceDps>=0?100*(.8*role.referenceDps/basis.dpsMedian+.2*gear):50*gear;
  }
  function raidPartyStats(players,basis=raidPowerBasis(players)){
    const dps=players.filter(r=>Catalog.profile(r).duty==='dps'),known=dps.filter(r=>Number.isFinite(r.referenceDps)&&r.referenceDps>=0);
    return {outputIndex:dps.reduce((n,r)=>n+roleOutputPower(r,basis),0),referenceDps:known.reduce((n,r)=>n+r.referenceDps,0),knownDps:known.length,missingDps:dps.length-known.length,unknownOutput:dps.filter(r=>!Number.isFinite(r.referenceDps)&&!(r.score>0)).length,gongzhan:raidGongzhanStatus(players).count};
  }
  function optimizeRaidMode(task,input,roles,capacity,locked=[]){
    const mode=task.raidMode;if(!['output','balanced','mentor'].includes(mode)||!input.length)return input;
    const basis=raidPowerBasis(roles),dps=roles.filter(r=>Catalog.profile(r).duty==='dps'&&roleOutputPower(r,basis)>0).sort((a,b)=>roleOutputPower(b,basis)-roleOutputPower(a,basis)),gear=roles.filter(r=>Number.isFinite(r.score)&&r.score>0).map(r=>r.score).sort((a,b)=>a-b);
    const strongThreshold=dps.length?roleOutputPower(dps[Math.max(0,Math.ceil(dps.length/3)-1)],basis):Infinity,lowThreshold=gear.length?gear[Math.max(0,Math.ceil(gear.length/3)-1)]:-Infinity;
    const anchors=p=>p.players.some(r=>Catalog.profile(r).duty==='dps'&&roleOutputPower(r,basis)>=strongThreshold),novices=p=>p.players.filter(r=>Number.isFinite(r.score)&&r.score>0&&r.score<=lowThreshold&&!(Catalog.profile(r).duty==='dps'&&roleOutputPower(r,basis)>=strongThreshold)).length;
    const covered=ps=>ps.filter(p=>raidGongzhanStatus(p.players).covered).length;
    const objective=ps=>{
      const powers=ps.map(p=>raidPartyStats(p.players,basis).outputIndex),total=powers.reduce((n,x)=>n+x,0),mean=total/ps.length,variance=powers.reduce((n,x)=>n+(x-mean)**2,0),switching=batchSwitchCost(ps.map(p=>p.players));
      if(mode==='mentor')return [-covered(ps),-ps.filter(p=>anchors(p)&&novices(p)>0).length,-ps.reduce((n,p)=>n+(anchors(p)?novices(p):0),0),-ps.filter(anchors).length,-total,switching.logins,switching.switches];
      return [-covered(ps),-total,mode==='balanced'?variance:-variance,switching.logins,switching.switches];
    };
    const better=(a,b)=>{for(let i=0;i<a.length;i++){if(Math.abs(a[i]-b[i])>1e-7)return a[i]<b[i];}return false;};
    const rebuild=p=>{try{const t=partyTask(task,p.teamConfig?.playerSeats==='auto'?undefined:p.teamConfig),companions=companionAssignments(t,p.players,10);if(!companions)return null;validateParty(t,p.players,companions,capacity);for(const other of task.routePartyTasks||[])validateParty(partyTask(other,p.teamConfig?.playerSeats==='auto'?undefined:p.teamConfig),p.players,companions,capacity);return {...p,companions,totalSlots:p.players.length+companions.length};}catch{return null;}};
    let parties=input,current=objective(input),attempts=0;
    for(let pass=0;pass<12&&attempts<16000;pass++){
      let best=null,bestScore=current;
      const consider=(next,changed)=>{if(++attempts>16000||!locked.every(id=>next[0].players.some(r=>r.id===id)))return;const value=objective(next);if(!better(value,bestScore))return;for(const i of changed){const p=rebuild(next[i]);if(!p)return;next[i]=p;}best=next;bestScore=value;};
      for(let i=0;i<parties.length&&attempts<16000;i++)for(let j=i+1;j<parties.length&&attempts<16000;j++)for(let a=0;a<parties[i].players.length&&attempts<16000;a++)for(let b=0;b<parties[j].players.length&&attempts<16000;b++){
        const crossDuty=Catalog.profile(parties[i].players[a]).duty!==Catalog.profile(parties[j].players[b]).duty;
        const next=[...parties],left=[...parties[i].players],right=[...parties[j].players];[left[a],right[b]]=[right[b],left[a]];next[i]={...parties[i],players:left};next[j]={...parties[j],players:right};if(!crossDuty||covered(next)>covered(parties))consider(next,[i,j]);
      }
      const used=new Set(parties.flatMap(p=>p.players.map(r=>r.id))),spare=roles.filter(r=>!used.has(r.id));
      for(let i=0;i<parties.length&&attempts<16000;i++)for(let a=0;a<parties[i].players.length&&attempts<16000;a++)for(const r of spare){if(attempts>=16000)break;const crossDuty=Catalog.profile(r).duty!==Catalog.profile(parties[i].players[a]).duty;const next=[...parties],players=[...parties[i].players];players[a]=r;next[i]={...parties[i],players};if(!crossDuty||covered(next)>covered(parties))consider(next,[i]);}
      if(!best)break;parties=best;current=bestScore;
    }
    if(mode==='output'){const fixed=locked.length?parties.slice(0,1):[],rest=parties.slice(fixed.length);parties=[...fixed,...rest.sort((a,b)=>raidPartyStats(b.players,basis).outputIndex-raidPartyStats(a.players,basis).outputIndex)];}
    return parties.map(p=>({...p,powerStats:raidPartyStats(p.players,basis),strongDps:p.players.filter(r=>Catalog.profile(r).duty==='dps'&&roleOutputPower(r,basis)>=strongThreshold).map(r=>r.id),noviceIds:p.players.filter(r=>Number.isFinite(r.score)&&r.score>0&&r.score<=lowThreshold&&!(Catalog.profile(r).duty==='dps'&&roleOutputPower(r,basis)>=strongThreshold)).map(r=>r.id)}));
  }
  // New candidate plans require full raids; legacy templates and saved plans keep their own rules.
  function planningTask(task){return task.partyRule==='raid10'?{...task,fillCompanionSlots:true}:task;}
  function savedPartyTask(task,plan){return task.partyRule==='raid10'&&plan.rulesSnapshot?.fillCompanionSlots===true?planningTask(task):task;}
  function optimizeTaskBatches(task,batches,capacity,parties=[],locked=[]){
    const cache=new Map(),hasParty=['daily5','raid10'].includes(task.partyRule);
    const rebuild=p=>{
      if(task.requireGongzhanPerTeam&&!raidGongzhanStatus(p.players).covered)return null;
      const key=JSON.stringify([p.teamConfig||null,p.players.map(r=>r.id).sort()]);if(cache.has(key))return cache.get(key)?{...p,...cache.get(key)}:null;
      let result=null;
      try{
        if(hasParty){const q=partyTask(task,p.teamConfig?.playerSeats==='auto'?undefined:p.teamConfig);validateDailyGongzhan(q,p.players);const companions=companionAssignments(q,p.players,q.partyRule==='daily5'?5:10);if(companions===null)throw new Error('无可用侠客');validateParty(q,p.players,companions,capacity);for(const other of task.routePartyTasks||[])validateParty(partyTask(other,p.teamConfig?.playerSeats==='auto'?undefined:p.teamConfig),p.players,companions,capacity);result={companions,totalSlots:p.players.length+companions.length};}
        else if(task.type==='team'){
          if(new Set(p.players.map(r=>r.server)).size!==1||p.players.some(r=>!r.server))throw new Error('区服不兼容');
          for(const d of ['tank','heal'])if(p.players.filter(r=>Catalog.profile(r).duty===d).length<(task[d]||0))throw new Error('职责不足');result={};
        }else result={};
      }catch{}cache.set(key,result);return result?{...p,...result}:null;
    };
    const source=batches.map((players,i)=>{const p={...parties[i],players};if(!hasParty||parties[i])return p;const valid=rebuild(p);if(!valid)throw new Error('原批次不满足队伍条件');return valid;});
    let optimized=optimizeBatchSwitching(source,{rebuild,reorder:!task.raidTeams?.length,locked});
    if(task.partyRule==='daily5')optimized=balanceDailyParties(optimized,rebuild,locked);
    return {batches:optimized.map(p=>p.players),parties:hasParty?optimized.map((p,i)=>({...p,teamIndex:task.raidTeams?.length?p.teamIndex:i})):[]};
  }
  function partyCandidates(task,roles,locked=[],capacity=Infinity,coverAll=task.partyRule==='daily5'){
    const t=withPartyRule(task),total=t.partyRule==='daily5'?5:10,cap=Math.min(capacity,t.maxParallel),reasons=[],seen=new Set();
    const available=roles.filter(r=>{const okay=!seen.has(r.id)&&r.accountId&&r.server&&r.creationStatus!=='planned'&&(!t.levelCap||r.level===t.levelCap)&&r.enabled!==false&&(r.level??0)>=(t.minLevel||0)&&(r.score??0)>=(t.minScore||0);seen.add(r.id);if(!okay)reasons.push(r.name+'：账号 / 区服 / 等级 / 装备信息不足或资格不满足');return okay;});
    if(locked.some(id=>!available.some(r=>r.id===id)))return {teams:[],parties:[],unassigned:roles,reasons:['锁定成员不在可用候选范围']};
    if(t.partyRule==='daily5'&&available.filter(r=>locked.includes(r.id)&&r.gongzhanBuff===true).length>1)return {teams:[],parties:[],unassigned:roles,reasons:['首队固定了多名共战角色：大战每队最多安排一名共战江湖角色，请调整固定成员']};
    if(t.raidMode!==undefined&&t.raidMode!=='legacy'&&!raidModes.includes(t.raidMode))throw new Error('副本组队模式无效');
    const modeBasis=raidPowerBasis(available),ranked=[...available].sort((a,b)=>roleOutputPower(b,modeBasis)-roleOutputPower(a,modeBasis)||(b.score||0)-(a.score||0)),priority=new Map(ranked.map((r,i)=>[r.id,i]));
    if(t.raidMode==='mentor'){const weak=available.filter(r=>r.score>0).sort((a,b)=>a.score-b.score),mixed=[];for(let i=0;i<Math.max(ranked.length,weak.length);i++)for(const r of [ranked[i],weak[i]])if(r&&!mixed.includes(r))mixed.push(r);mixed.forEach((r,i)=>priority.set(r.id,i));}
    const modePriority=(a,b)=>{if(coverAll||!['output','balanced','mentor'].includes(t.raidMode))return 0;const power=roleOutputPower(b,modeBasis)-roleOutputPower(a,modeBasis),gear=(b.score||0)-(a.score||0);if(!power&&!gear)return 0;return t.raidMode==='mentor'?priority.get(a.id)-priority.get(b.id):power||gear;};
    const configs=coverAll?[]:t.raidTeams?.length?t.raidTeams:Array.from({length:t.runs},(_,i)=>({name:'团队 '+(i+1),playerSeats:t.raidPlayerSeats,tankMode:t.tankMode||'auto'}));
    if(!coverAll&&!t.raidTeams?.length&&t.raidPlayerSeats==='auto'&&cap<7)return {teams:[],parties:[],unassigned:roles,reasons:['自动模式至少需要 7 个并行账号；当前上限 '+cap+'，请调整全局并行数或逐队人数。']};
    // Search the whole allocation, so a feasible first party cannot strand later parties.
    const gongzhanMode=!coverAll&&raidModes.includes(t.raidMode);let requireGongzhan=gongzhanMode&&available.filter(r=>raidGongzhanStatus([r]).covered).length>=configs.length,gongzhanSearchLimited=false;
    const profiles=new Map(available.map(r=>[r.id,Catalog.profile(r)])),owned=new Map(available.map(r=>[r.id,Catalog.owned(r)])),cache=new Map(),failed=new Set();
    let visits=0,limited=false,best=[],solution=null;
    const tick=()=>{if(++visits>300000){limited=true;return false;}return true;};
    const coverage=ps=>ps.reduce((n,p)=>n+p.players.length,0);
    function remember(path){if((coverAll?coverage(path)>coverage(best):path.length>best.length)||((coverAll?coverage(path)===coverage(best):path.length===best.length)&&coverage(path)>coverage(best)))best=[...path];}
    const sizesFor=q=>coverAll?Array.from({length:Math.min(5,cap)},(_,i)=>Math.min(5,cap)-i):q.raidPlayerSeats==='auto'?[8,7].filter(n=>n<=cap):[q.raidPlayerSeats].filter(n=>n<=cap);
    function* candidates(pool,q,required,config,index,previous=[],reserveBuffs=0){
      const poolBuffs=pool.filter(r=>raidGongzhanStatus([r]).covered).length;
      const worldTail=q.partyRule==='daily5'&&pool.length<=2;
      for(const duty of ['tank','heal','dps']){
        const potential=pool.reduce((n,r)=>n+Number(profiles.get(r.id).duty===duty)+(q.allowCompanions===false?0:Math.min(q.companionLimit??3,owned.get(r.id).filter(c=>c.duties.includes(duty)).length)),0);
        if(!worldTail&&potential<(q[duty]||0))return;
      }
      if(q.tankMode==='player'&&pool.filter(r=>profiles.get(r.id).duty==='tank').length<(q.tank||0))return;
      if(q.tankMode==='companion'&&(q.allowCompanions===false||!q.companionLimit||!pool.some(r=>owned.get(r.id).some(c=>c.duties.includes('tank')))))return;
      const frequencies={};for(const r of pool)frequencies[r.accountId]=(frequencies[r.accountId]||0)+1;
      const rank=r=>{const d=profiles.get(r.id).duty;return d==='heal'||d==='tank'&&q.tankMode!=='companion'?0:d==='dps'?1:2;};
      const previousAccounts=new Set(previous.map(r=>r.accountId));
      const ordered=[...pool].sort((a,b)=>Number(required.includes(b.id))-Number(required.includes(a.id))||(!coverAll&&t.raidMode&&t.raidMode!=='legacy'?rank(a)-rank(b):0)||modePriority(a,b)||Number(previousAccounts.has(b.accountId))-Number(previousAccounts.has(a.accountId))||rank(a)-rank(b)||
        (q.preferRanged?Number(profiles.get(b.id).range==='ranged')-Number(profiles.get(a.id).range==='ranged'):0)||
        frequencies[b.accountId]-frequencies[a.accountId]||a.id.localeCompare(b.id));
      for(const size of sizesFor(q)){
        if(size>pool.length||required.length>size)continue;
        // Do not split an infeasible larger party into many world-party batches.
        if(q.partyRule==='daily5'&&size<=2&&!worldTail)continue;
        if(q.tankMode==='companion'&&size+(q.tank||0)>total)continue;
        const preferred=Math.min(size,(q.tankMode==='companion'?0:q.tank||0)+(q.heal||0)),budgets=[preferred,...Array.from({length:preferred},(_,i)=>preferred-i-1),...Array.from({length:size-preferred},(_,i)=>preferred+i+1)];
        for(const supportBudget of budgets){
        function* build(from,players,accounts,server){
          if(!tick())return;
          if(q.partyRule==='daily5'&&players.filter(r=>r.gongzhanBuff===true).length>1)return;
          if(requireGongzhan){const count=raidGongzhanStatus(players).count;if(count>poolBuffs-reserveBuffs||!count&&!ordered.slice(from).some(r=>raidGongzhanStatus([r]).covered))return;}
          const support=players.filter(r=>['tank','heal'].includes(profiles.get(r.id).duty)).length;
          if(support>supportBudget||support+size-players.length<supportBudget)return;
          if(players.length===size){
            if(!required.every(id=>players.some(r=>r.id===id))||requireGongzhan&&!raidGongzhanStatus(players).covered)return;
            const key=[q.tankMode,q.raidPlayerSeats,q.tank,q.heal,q.allowCompanions,q.fillCompanionSlots,q.companionLimit,...players.map(r=>r.id).sort()].join('|');
            if(!cache.has(key))cache.set(key,companionAssignments(q,players,total));
            const companions=cache.get(key);if(companions&&(t.routePartyTasks||[]).every(other=>{try{validateParty(partyTask(other,config?.playerSeats==='auto'?undefined:config),players,companions,capacity);return true;}catch{return false;}}))yield {players,companions,totalSlots:players.length+companions.length,capacity:total,teamConfig:t.raidTeams?.length?config:undefined,teamName:config?.name,teamIndex:index};return;
          }
          if(ordered.length-from<size-players.length)return;
          for(let i=from;i<ordered.length&&!limited;i++){const r=ordered[i];if(accounts.has(r.accountId)||server&&r.server!==server)continue;yield* build(i+1,[...players,r],new Set([...accounts,r.accountId]),server||r.server);}
        }
        yield* build(0,[],new Set(),null);
        }
      }
    }
    function search(pool,path,left,index){
      if(!tick())return false;remember(path);
      if(coverAll?!pool.length:!left){solution=[...path];return true;}
      if(!left||!pool.length)return false;
      if(requireGongzhan&&pool.filter(r=>raidGongzhanStatus([r]).covered).length<left)return false;
      if(coverAll){
        if(pool.length>left*cap)return false;
        if(t.partyRule==='daily5'&&pool.filter(r=>r.gongzhanBuff===true).length>left)return false;
        const accounts={},servers={};for(const r of pool){accounts[r.accountId]=(accounts[r.accountId]||0)+1;servers[r.server]=(servers[r.server]||0)+1;}
        if(Math.max(...Object.values(accounts))>left||Object.values(servers).reduce((n,count)=>n+Math.ceil(count/cap),0)>left)return false;
        for(const duty of ['tank','heal','dps']){
          const potential=pool.reduce((n,r)=>n+Number(profiles.get(r.id).duty===duty)+(t.allowCompanions===false?0:Math.min(t.companionLimit??3,owned.get(r.id).filter(c=>c.duties.includes(duty)).length)),0);
          if(potential<Math.max(0,left-(t.partyRule==='daily5'?1:0))*(t[duty]||0))return false;
        }
      }else{
        const minimum=configs.slice(index).reduce((n,c)=>n+(c.playerSeats==='auto'?7:c.playerSeats),0);
        if(pool.length<minimum)return false;
        const playerT=configs.slice(index).filter(c=>c.tankMode==='player').length*(t.tank||0);
        if(pool.filter(r=>profiles.get(r.id).duty==='tank').length<playerT)return false;
        for(const duty of ['tank','heal','dps']){
          const potential=pool.reduce((n,r)=>n+Number(profiles.get(r.id).duty===duty)+(t.allowCompanions===false?0:Math.min(t.companionLimit??3,owned.get(r.id).filter(c=>c.duties.includes(duty)).length)),0);
          if(potential<left*(t[duty]||0))return false;
        }
      }
      const key=[left,index,...pool.map(r=>r.id).sort()].join('|');if(failed.has(key))return false;
      const config=coverAll?undefined:configs[index],q=partyTask(t,config?.playerSeats==='auto'?undefined:config);
      let required=!path.length?[...locked]:[];
      if(coverAll&&!required.length){const freq={};for(const r of pool)freq[r.accountId]=(freq[r.accountId]||0)+1;const anchor=[...pool].sort((a,b)=>freq[b.accountId]-freq[a.accountId]||owned.get(a.id).length-owned.get(b.id).length||a.id.localeCompare(b.id))[0];required=[anchor.id];}
      for(const p of candidates(pool,q,required,config,index,path.at(-1)?.players,requireGongzhan?left-1:0)){
        const used=new Set(p.players.map(r=>r.id));
        if(search(pool.filter(r=>!used.has(r.id)),[...path,p],left-1,index+1))return true;
        if(limited)break;
      }
      failed.add(key);return false;
    }
    if(coverAll&&cap>0){const freq={};for(const r of available)freq[r.accountId]=(freq[r.accountId]||0)+1;const lower=Math.max(Math.ceil(available.length/cap),t.partyRule==='daily5'?available.filter(r=>r.gongzhanBuff===true).length:0,0,...Object.values(freq));for(let groups=lower;groups<=available.length&&!limited;groups++){failed.clear();if(search(available,[],groups,0))break;}}
    else if(!coverAll){search(available,[],configs.length,0);if(requireGongzhan&&!solution){gongzhanSearchLimited=limited;requireGongzhan=false;visits=0;limited=false;failed.clear();best=[];search(available,[],configs.length,0);}}
    let parties=solution||best;
    // Keep useful partial output when full coverage is impossible or the search is bounded.
    const searchLimited=limited;
    if(!solution){limited=false;visits=0;let pool=[...available],partial=[];for(let i=0;i<(coverAll?available.length:configs.length)&&pool.length&&!limited;i++){
      const config=coverAll?undefined:configs[i],q=partyTask(t,config?.playerSeats==='auto'?undefined:config),p=candidates(pool,q,i===0?locked:[],config,i,partial.at(-1)?.players).next().value;
      if(!p){if(coverAll)break;continue;}partial.push(p);const used=new Set(p.players.map(r=>r.id));pool=pool.filter(r=>!used.has(r.id));
    }if((coverAll?coverage(partial)>coverage(parties):partial.length>parties.length))parties=partial;
    }
    if(coverAll&&t.partyRule==='daily5'){
      if(!locked.length)parties.sort((a,b)=>b.players.length-a.players.length);
      parties.forEach((p,i)=>p.teamIndex=i);
    }
    parties=optimizeTaskBatches({...t,requireGongzhanPerTeam:gongzhanMode&&parties.length>0&&parties.every(p=>raidGongzhanStatus(p.players).covered)},parties.map(p=>p.players),capacity,parties,locked).parties;
    if(!coverAll)parties=optimizeRaidMode(t,parties,available,capacity,locked);
    for(const p of parties)validateParty(partyTask(t,p.teamConfig?.playerSeats==='auto'?undefined:p.teamConfig),p.players,p.companions,capacity);
    if(gongzhanMode){reasons.push(...raidGongzhanWarnings(parties.map(p=>p.players)));if(gongzhanSearchLimited&&parties.some(p=>!raidGongzhanStatus(p.players).covered))reasons.push('共战分配搜索达到上限，请复核缺少共战的队伍。');}
    const used=new Set(parties.flatMap(p=>p.players.map(r=>r.id))),unassigned=roles.filter(r=>!used.has(r.id));
    if(t.partyRule==='daily5'&&unassigned.some(r=>r.gongzhanBuff===true))reasons.push('部分共战角色未安排：大战每队最多一名共战江湖角色；仍保留五人优先、3–4 人侠客补位及 1–2 人世界组队规则，请调整成员或侠客后重算。');
    if(unassigned.length)reasons.push('未安排 '+unassigned.length+' 个角色：'+unassigned.map(r=>r.name).join('、')+'。请复核账号互斥、区服、职责、侠客归属与并行上限。');
    if(!solution&&coverAll)reasons.push('未找到覆盖全部角色的方案；可调整成员职责或侠客资料后重算。');
    if(searchLimited||limited)reasons.push('搜索达到上限，当前建议未保证完整或最优；请调整逐队配置或缩小角色范围后重算。');
    if(!coverAll)for(const [i,c]of configs.entries())if(!parties.some(p=>p.teamIndex===i))reasons.push(c.name+' 未生成：需要 '+c.playerSeats+' 名玩家（'+({auto:'自动补 T',player:'玩家 T',companion:'侠客 T'}[c.tankMode]||'自动补 T')+'），请复核剩余 CD、召请者和并行上限 '+cap+'。');
    if(!solution&&!coverAll){reasons.push('目标 '+configs.length+' 队，仅生成 '+parties.length+' 队。');if(t.fillCompanionSlots)reasons.push('每队必须由玩家与已拥有侠客补满 10 席；请检查侠客数量、同名互斥、召请上限和所需职责。');}
    if(t.partyRule==='raid10'&&t.raidMode&&t.raidMode!=='legacy'){if(available.some(r=>Catalog.profile(r).duty==='dps'&&!Number.isFinite(r.referenceDps)))reasons.push('部分角色缺少参考 DPS，输出指数使用装分参考；未推算真实 DPS，也不计侠客或共战增益。');if(t.raidMode==='mentor'&&parties.some(p=>!p.strongDps?.length||!p.noviceIds?.length))reasons.push('部分队伍无法同时安排强力 DPS 与已知低装分角色，请复核成员、账号和职责限制。');if(t.raidMode==='output'&&locked.length)reasons.push('首队固定成员保持在首队，其余队伍按输出指数降序排列。');}
    return {teams:parties.map(p=>p.players),parties,unassigned,reasons,powerBasis:t.partyRule==='raid10'&&t.raidMode&&t.raidMode!=='legacy'?modeBasis:undefined};
  }
  function splitBatches(roles,capacity) {
    number(capacity,'并行容量',{min:1,integer:true});
    const groups=new Map();for(const r of roles){if(!r.accountId)throw new Error('角色 '+r.name+' 尚未分配账号');if(!groups.has(r.accountId))groups.set(r.accountId,[]);groups.get(r.accountId).push(r);}
    const batches=[];
    while([...groups.values()].some(v=>v.length)){
      const batch=[...groups.entries()].filter(([,v])=>v.length).sort((a,b)=>b[1].length-a[1].length||a[0].localeCompare(b[0])).slice(0,capacity).map(([,v])=>v.shift());batches.push(batch);
    }
    return optimizeBatchSwitching(batches.map(players=>({players}))).map(p=>p.players);
  }
  function costs(gold,minutes,onlineMinutes,config,other=0,accountMinutes={}) {
    const rate=config.cardPrice*config.discount/config.cardMinutes,entries=Object.entries(accountMinutes),allocated=entries.reduce((n,[,m])=>n+m,0);
    const card=entries.length&&config.accountBillingRates?entries.reduce((n,[id,m])=>n+m*(config.accountBillingRates[id]??rate),0)+Math.max(0,onlineMinutes-allocated)*rate:onlineMinutes*rate;
    const gross=gold*config.goldPrice/config.goldUnit*config.saleRate,fee=gross*config.fee,cost=fee+card+other,net=gross-cost;
    const netGold=config.goldPrice>0?gold*config.saleRate*(1-config.fee)-(card+other)*config.goldUnit/config.goldPrice:null;return {gold,netGold,hourlyGold:minutes>0&&netGold!==null?netGold/(minutes/60):null,minutes,onlineMinutes,gross,fee,card,other,cost,net,hourly:minutes>0?net/(minutes/60):null,roi:cost>0?net/cost*100:null,timeNet:net-minutes/60*config.hourlyValue};
  }
  function calculateRole(t,roles,c,rounds=t.target) {
    validateConfig(c);number(rounds,'覆盖轮次',{integer:true});
    if(t.partyRule==='daily5'){
      const generated=t.enabled===false||!roles.length||!rounds?{teams:[],parties:[],reasons:[],unassigned:[]}:partyCandidates(t,roles,[],c.concurrency,true),batches=generated.teams,covered=batches.flat(),duration=t.minutes/t.efficiency,accountMinutes={};
      for(const r of covered)accountMinutes[r.accountId]=(accountMinutes[r.accountId]||0)+rounds*(duration+t.onlineExtra);
      const perGold=t.components?.length?t.components.reduce((n,x)=>n+x.quantity*x.price,0):t.gold,shared=t.sharedMode==='person'?covered.length*rounds*t.shared:batches.length*rounds*t.shared;
      return {...costs((dungeonRewards(t,[],c)?dungeonGold(t,batches,c)*rounds:covered.length*rounds*perGold+shared),batches.length*rounds*duration+(batches.length?t.prepare:0),covered.length*rounds*(duration+t.onlineExtra),c,batches.length?t.otherCost:0,accountMinutes),batches,parties:generated.parties,accountMinutes,reasons:generated.reasons,unassigned:generated.unassigned,executions:covered.length*rounds};
    }
    const batches=t.enabled===false||!roles.length||!rounds?[]:splitBatches(roles,Math.min(c.concurrency,t.maxParallel));
    const duration=t.minutes/t.efficiency;
    const perGold=t.components?.length?t.components.reduce((n,x)=>n+x.quantity*x.price,0):t.gold;
    const shared=t.sharedMode==='person'?roles.length*rounds*t.shared:batches.length*rounds*t.shared;
    const gold=batches.length?roles.length*rounds*perGold+shared:0;
    const minutes=batches.length*rounds*duration+(batches.length?t.prepare:0);
    const onlineMinutes=batches.length?roles.length*rounds*(duration+t.onlineExtra):0;
    const accountMinutes={};if(batches.length)for(const r of roles)accountMinutes[r.accountId]=(accountMinutes[r.accountId]||0)+rounds*(duration+t.onlineExtra);
    return {...costs(gold,minutes,onlineMinutes,c,batches.length?t.otherCost:0,accountMinutes),batches,accountMinutes,executions:roles.length*rounds};
  }
  function teamCandidates(t,roles,locked=[],capacity=Infinity) {
    if(t.partyRule==='raid10')return partyCandidates(t,roles,locked,capacity,false);
    if(t.teamSize>Math.min(capacity,t.maxParallel))return {teams:[],reasons:['自有席位 '+t.teamSize+' 超过当前并行账号上限 '+Math.min(capacity,t.maxParallel)+'，请调整规则。']};
    const filtered=roles.filter(r=>r.creationStatus!=='planned'&&(!t.levelCap||r.level===t.levelCap)&&(r.level??0)>=t.minLevel&&(r.score??0)>=t.minScore);
    const reject=roles.filter(r=>!filtered.includes(r)).map(r=>r.name+'：等级或装备门槛未满足');
    if(locked.some(r=>!filtered.some(x=>x.id===r)))return {teams:[],reasons:['锁定成员不在可用候选范围']};
    const candidates=filtered.sort((a,b)=>Number(locked.includes(b.id))-Number(locked.includes(a.id))|| (Catalog.profile(a).duty==='dps')-(Catalog.profile(b).duty==='dps'));
    const teams=[];let available=[...candidates];
    for(let run=0;run<t.runs;run++){
      let solution=null;let visits=0;
      function search(index,team,accounts,server){
        if(++visits>100000)return;
        if(team.length===t.teamSize){if(team.filter(r=>Catalog.profile(r).duty==='tank').length>=t.tank&&team.filter(r=>Catalog.profile(r).duty==='heal').length>=t.heal&&(!teams.length?locked.every(id=>team.some(r=>r.id===id)):true))solution=team;return;}
        if(solution||available.length-index<t.teamSize-team.length)return;
        for(let i=index;i<available.length&&!solution;i++){const r=available[i];if(accounts.has(r.accountId)||!r.server||server&&r.server!==server)continue;search(i+1,[...team,r],new Set([...accounts,r.accountId]),server||r.server);}
      }
      search(0,[],new Set(),null);
      if(!solution)break;teams.push(solution);available=available.filter(r=>!solution.some(x=>x.id===r.id));
    }
    const reasons=[...reject];if(teams.length<t.runs)reasons.push('目标 '+t.runs+' 队，仅找到 '+teams.length+' 队。请检查独立账号、自有席位、区服、CD、坦克 '+t.tank+' / 治疗 '+t.heal+' 及装备门槛。');
    return {teams:optimizeTaskBatches(t,teams,capacity,[],locked).batches,reasons};
  }
  function calculateTeam(t,teams,c) {
    const active=t.enabled===false?[]:teams,k=active.length,players=active.flat(),duration=t.minutes/t.efficiency;
    const accountMinutes={};for(const r of players)accountMinutes[r.accountId]=(accountMinutes[r.accountId]||0)+duration+t.onlineExtra;
    const perGold=t.components?.length?t.components.reduce((n,x)=>n+x.quantity*x.price,0):t.gold;
    const shared=(t.sharedMode==='person'?players.length:k)*(t.shared||0);
    return {...costs(dungeonRewards(t,[],c)?dungeonGold(t,active,c):(t.rewardPerRole?players.length:k)*perGold+shared,k*duration+(k?t.prepare:0),Object.values(accountMinutes).reduce((a,b)=>a+b,0),c,k?t.otherCost:0,accountMinutes),batches:active,accountMinutes,executions:k};
  }
  function calculateBatches(t,batches,c){
    if(t.enabled===false)batches=[];
    if(t.type==='team')return calculateTeam(t,batches,c);
    const duration=t.minutes/t.efficiency,accountMinutes={},players=batches.flat(),perGold=t.components?.length?t.components.reduce((n,x)=>n+x.quantity*x.price,0):t.gold;
    for(const r of players)accountMinutes[r.accountId]=(accountMinutes[r.accountId]||0)+duration+t.onlineExtra;
    const shared=t.sharedMode==='person'?players.length*t.shared:batches.length*t.shared;
    return {...costs(dungeonRewards(t,[],c)?dungeonGold(t,batches,c):players.length*perGold+shared,batches.length*duration+(batches.length?t.prepare:0),players.length*(duration+t.onlineExtra),c,batches.length?t.otherCost:0,accountMinutes),batches,accountMinutes,executions:players.length};
  }
  function levelCap(s){return s.config.levelCap??130;}
  function isMaxLevel(s,r){return r.creationStatus!=='planned'&&r.level===levelCap(s);}
  function taskForVersion(s,t){return {...t,levelCap:levelCap(s),minLevel:Math.min(t.minLevel||0,levelCap(s))};}
  function eligible(s,t,scope={}) {t=taskForVersion(s,t);return s.roles.filter(r=>r.enabled!==false&&isMaxLevel(s,r)&&t.roleIds.includes(r.id)&&s.accounts.some(a=>a.id===r.accountId&&a.enabled!==false)&&(!t.requiresCamp||['hao','e'].includes(r.camp))&&(!scope.group||s.accounts.find(a=>a.id===r.accountId)?.group===scope.group)&&(!scope.role||r.id===scope.role)&&(!scope.account||r.accountId===scope.account)&&(r.level??0)>=(t.minLevel||0)&&(r.score??0)>=(t.minScore||0));}
  function cdKey(t){return t.dungeonId?'raid_'+t.dungeonId+'_'+(t.difficulty||'10人普通'):t.id;}
  function getProgress(s,t,r,date) {return s.progress.find(p=>p.roleId===r.id&&(p.cdKeySnapshot||cdKey(s.tasks.find(x=>x.id===p.taskId)||{}))===cdKey(t)&&p.cycle===cycle(t,date));}
  // Completion facts consume targets/CD, but never enter income or timing samples.
  function completionRecords(s){if(!s.plans.some(p=>p.completionFacts?.length))return [];const measured=new Set(),whole=new Set();for(const r of s.records)if(r.planId){const key=r.planId+'|'+r.taskId;if(!r.planBatchIndices)whole.add(key);else for(const i of r.planBatchIndices)measured.add(key+'|'+i);}return s.plans.flatMap(p=>(p.completionFacts||[]).filter(f=>!whole.has(p.id+'|'+f.taskId)&&!measured.has(p.id+'|'+f.taskId+'|'+f.planBatchIndices[0])));}
  function executionRecords(s){return [...s.records,...completionRecords(s)];}
  function cdRecord(s,t,roleId,date){return t.dungeonId?executionRecords(s).find(r=>{const source=r.dungeonId?{dungeonId:r.dungeonId,difficulty:r.difficulty}:null;return source&&cdKey(source)===cdKey(t)&&r.roleIds.includes(roleId)&&(r.cycle||cycle(t,r.date))===cycle(t,date);}):null;}
  function effectiveProgress(s,t,r,when){
    const manual=getProgress(s,t,r,when),target=manual?.target??t.target;
    const records=executionRecords(s).filter(x=>x.roleIds.includes(r.id)&&(x.dungeonId?cdKey(x)===cdKey(t):x.taskId===t.id)&&(x.cycle||cycle(t,x.startedAt||x.date))===cycle(t,when));
    const actualCompleted=records.reduce((n,x)=>n+(x.attendanceWeights?.[r.id]??(x.planBatchIndices?x.planBatchIndices.reduce((k,i)=>k+Number(s.plans.find(p=>p.id===x.planId)?.batches[i]?.includes(r.id)),0):1)),0);
    const completed=Math.max(manual?.completed||0,actualCompleted),status=completed>=target&&completed>0?'completed':completed>0?'progressing':manual?.status||'planned';
    const completionOnly=records.some(x=>x.completionOnly),measuredCompleted=records.filter(x=>!x.completionOnly).length;
    return {...manual,target,completed,status,actualCompleted,measuredCompleted,completionOnly,manualStatus:manual?.status,source:actualCompleted?(completionOnly?'完成登记'+(measuredCompleted?' / 实测':''):'实测')+(manual?' / 手工':''):manual?.source||''};
  }
  function recordedBatchIndices(s,p,taskId=p.taskId){
    const rows=executionRecords(s).filter(r=>r.planId===p.id&&r.taskId===taskId);
    if(rows.some(r=>!r.planBatchIndices)||!rows.length&&!p.closedBatches?.[taskId]?.length&&(p.executed||p.executedTaskIds?.includes(taskId)))return p.batches.map((_,i)=>i);
    return [...new Set(rows.flatMap(r=>r.planBatchIndices||[]))];
  }
  function pendingBatchIndices(s,p,taskId=p.taskId){if(p.cancelled)return [];const used=new Set([...recordedBatchIndices(s,p,taskId),...(p.closedBatches?.[taskId]||[])]);return p.batches.map((_,i)=>i).filter(i=>!used.has(i));}
  function reservedCount(s,t,roleId,when,excludePlanId=null){return s.plans.filter(p=>p.id!==excludePlanId&&!p.cancelled).reduce((n,p)=>n+(p.routeTaskIds||[p.taskId]).reduce((v,id)=>{const other=s.tasks.find(x=>x.id===id);return v+(other&&cdKey(other)===cdKey(t)&&cycle(other,planStart(s,p,id))===cycle(t,when)?pendingBatchIndices(s,p,id).filter(i=>p.batches[i].includes(roleId)).length:0);},0),0);}
  function availableCount(s,t,r,when,excludePlanId=null){const p=effectiveProgress(s,t,r,when);return p.status==='skipped'?0:Math.max(0,p.target-p.completed-reservedCount(s,t,r.id,when,excludePlanId));}
  function availableRoles(s,t,when,scope={},excludePlanId=null){return eligible(s,t,scope).filter(r=>availableCount(s,t,r,when,excludePlanId)>0);}
  function validatePlanCapacity(s,p,excludePlanId=p.id){
    const seen=new Map();for(const id of p.routeTaskIds||[p.taskId]){const t=s.tasks.find(t=>t.id===id);if(!t?.enabled)throw new Error('任务已停用');const when=planStart(s,p,id);for(const i of pendingBatchIndices(s,{...p,executed:false,executedTaskIds:[]},id))for(const roleId of p.batches[i]){const r=eligible(s,t).find(r=>r.id===roleId);if(!r)throw new Error('角色资格待确认或不满足任务要求');const key=[roleId,cdKey(t),cycle(t,when)].join('|'),count=(seen.get(key)||0)+1;seen.set(key,count);if(count>availableCount(s,t,r,when,excludePlanId))throw new Error(r.name+'：周期 '+cycle(t,when)+' 目标已完成或被其他排程占用，请查看原方案');}}
    return true;
  }
  function canRun(s,t,roleId,date){const role=s.roles.find(r=>r.id===roleId),p=role&&effectiveProgress(s,t,role,date);return !!role&&!cdRecord(s,t,roleId,date)&&p.status!=='skipped'&&p.completed<p.target;}
  function remainingRoles(s,t,date,scope={}) {return eligible(s,t,scope).filter(r=>{return canRun(s,t,r.id,date);});}
  function instant(when){return typeof when==='string'&&when.length===10?Date.parse(when+'T12:00:00+08:00'):new Date(when).getTime();}
  function pricingConfig(s,when=new Date()){const at=instant(when),rate=s.config.cardPrice*s.config.discount/s.config.cardMinutes;return {...s.config,accountBillingRates:Object.fromEntries(s.accounts.map(a=>[a.id,a.billingType==='monthly'&&a.monthlyExpiresAt&&Date.parse(a.monthlyExpiresAt)>at?0:rate]))};}
  // Price actual online intervals, including a monthly expiry within a batch.
  // Date-only plans explicitly assume noon Beijing time; precise starts override it.
  function pricePrediction(s,t,result,when,timeline=result.batches){
    const start=instant(when),duration=t.minutes/t.efficiency,billableAccountMinutes={},coveredAccountMinutes={},warnings=[];
    let cursor=start+(timeline.length?t.prepare||0:0)*60000;
    for(const batch of timeline){if(result.batches.includes(batch))for(const r of batch){const a=s.accounts.find(a=>a.id===r.accountId),minutes=duration+(t.onlineExtra||0),expiry=a?.monthlyExpiresAt?Date.parse(a.monthlyExpiresAt):null;
      const covered=a?.billingType==='monthly'&&expiry!==null?Math.min(minutes,Math.max(0,(expiry-cursor)/60000)):0;
      billableAccountMinutes[r.accountId]=(billableAccountMinutes[r.accountId]||0)+minutes-covered;
      coveredAccountMinutes[r.accountId]=(coveredAccountMinutes[r.accountId]||0)+covered;
      if(a?.billingType==='monthly'&&expiry===null)warnings.push(a.name+'：月卡到期未知，全部在线分钟暂按计时套餐估算');
    }cursor+=duration*60000;}
    const rate=s.config.cardPrice*s.config.discount/s.config.cardMinutes,config={...s.config,accountBillingRates:Object.fromEntries(Object.entries(result.accountMinutes).map(([id,m])=>[id,m?rate*(billableAccountMinutes[id]||0)/m:0]))};
    return {...result,...costs(result.gold,result.minutes,result.onlineMinutes,config,result.other,result.accountMinutes),billingConfig:config,billableAccountMinutes,coveredAccountMinutes,billingWarnings:[...new Set(warnings)]};
  }
  function executionPricing(s,record,batches=null){
    const timeline=batches||[record.roleIds],start=instant(record.startedAt||record.date),billableAccountMinutes={},coveredAccountMinutes={},warnings=[];
    const visits={};for(const batch of timeline)for(const id of batch){const r=s.roles.find(r=>r.id===id);visits[r.accountId]=(visits[r.accountId]||0)+1;}
    const fallback=pricingConfig(s,record.startedAt||record.date);
    for(const [i,batch]of timeline.entries())for(const id of batch){const r=s.roles.find(r=>r.id===id),a=s.accounts.find(a=>a.id===r.accountId),minutes=(record.accountMinutes[r.accountId]||0)/visits[r.accountId],at=start+i*record.minutes/timeline.length*60000,expiry=a.monthlyExpiresAt?Date.parse(a.monthlyExpiresAt):null;
      const covered=a.billingType==='monthly'&&expiry!==null?Math.min(minutes,Math.max(0,(expiry-at)/60000)):0;
      billableAccountMinutes[a.id]=(billableAccountMinutes[a.id]||0)+minutes-covered;coveredAccountMinutes[a.id]=(coveredAccountMinutes[a.id]||0)+covered;
      if(a.billingType==='monthly'&&expiry===null)warnings.push(a.name+'：月卡到期未知，使用计时参考单价');
    }
    const rate=s.config.cardPrice*s.config.discount/s.config.cardMinutes;
    const config={...s.config,accountBillingRates:Object.fromEntries(s.accounts.map(a=>{const minutes=record.accountMinutes[a.id]||0;return [a.id,minutes?rate*(billableAccountMinutes[a.id]||0)/minutes:fallback.accountBillingRates[a.id]];}))};
    return {config,billableAccountMinutes,coveredAccountMinutes,billingWarnings:[...new Set(warnings)]};
  }
  function plan(s,t,date,scope={},remaining=false) {t=taskForVersion(s,t);
    if(!t.enabled||!scheduled(t,date))return {...costs(0,0,0,s.config),batches:[],accountMinutes:{},executions:0,reasons:[]};
    const roles=(remaining?remainingRoles(s,t,date,scope):eligible(s,t,scope)).filter(r=>{const p=getProgress(s,t,r,date);return p?.status!=='skipped'&&(p?.target??t.target)>0;});
    if(t.type==='team') {const {teams,reasons,parties,unassigned}=teamCandidates(t,roles,[],s.config.concurrency);return pricePrediction(s,t,{...calculateTeam(t,teams,pricingConfig(s,date)),reasons,parties:parties||[],unassigned:unassigned||[]},date);}
    // Custom per-role targets may require different coverage counts; aggregate by round.
    const counts=roles.map(r=>{const p=remaining?effectiveProgress(s,t,r,date):getProgress(s,t,r,date);return {r,n:Math.max(0,(p?.target??t.target)-(remaining?p?.completed||0:0))};});
    const results=[];for(let round=0;round<Math.max(0,...counts.map(x=>x.n));round++) results.push(calculateRole({...t,prepare:round?0:t.prepare,otherCost:round?0:t.otherCost},counts.filter(x=>x.n>round).map(x=>x.r),pricingConfig(s),1));
    const total=sum(results,s.config),ordered=optimizeTaskBatches(t,results.flatMap(x=>x.batches),s.config.concurrency,results.flatMap(x=>x.parties||[]));return pricePrediction(s,t,{...total,...ordered,executions:results.reduce((n,x)=>n+x.executions,0),reasons:[...new Set(results.flatMap(x=>x.reasons||[]))],unassigned:results.flatMap(x=>x.unassigned||[])},date);
  }
  function scheduled(t,date){if(t.activeFrom&&date<t.activeFrom||t.activeUntil&&date>t.activeUntil)return false;if(!t.days.includes(weekday(date)))return false;if(t.period==='daily')return true;const start=cycle(t,date);for(let d=start;d<date;d=addDays(d,1))if(t.days.includes(weekday(d)))return false;return true;}
  function routePlan(s,taskIds,date,locks=[],scope={},excludePlanId=null,{fullRaid=false,raidMode='legacy'}={}){
    const tasks=taskIds.map(id=>{const t=s.tasks.find(t=>t.id===id);return t&&{...(fullRaid?planningTask(taskForVersion(s,t)):taskForVersion(s,t)),raidMode};});
    if(!tasks.length||tasks.some(t=>!t||!t.enabled||t.partyRule!=='raid10'))throw new Error('串本路线只能选择启用的十人本任务');
    if(new Set(tasks.map(cdKey)).size!==tasks.length)throw new Error('同一路线不能重复选择相同副本 CD');
    const available=availableRoles(s,tasks[0],date,scope,excludePlanId).filter(r=>tasks.every(t=>availableRoles(s,t,date,scope,excludePlanId).some(x=>x.id===r.id)));
    const primary={...tasks[0],runs:Math.min(...tasks.map(t=>t.runs)),...(raidMode!=='legacy'?{routePartyTasks:tasks,tank:Math.max(...tasks.map(t=>t.tank||0)),heal:Math.max(...tasks.map(t=>t.heal||0)),allowCompanions:tasks.every(t=>t.allowCompanions!==false),companionLimit:Math.min(...tasks.map(t=>t.companionLimit??3))}:{})},g=teamCandidates(primary,available,locks,s.config.concurrency),parties=[];
    for(const party of g.parties||[]){try{for(const t of tasks)validateParty(partyTask(t,party.teamConfig?.playerSeats==='auto'?undefined:party.teamConfig),party.players,party.companions,s.config.concurrency);parties.push(party);}catch{}}
    const batches=parties.map(p=>p.players);let start=instant(date);const taskResults=tasks.map(task=>{const result=pricePrediction(s,task,calculateBatches(task,batches,pricingConfig(s,date)),new Date(start));start+=result.minutes*60000;return {task,result};});
    const reasons=[...g.reasons];if(available.length<eligible(s,tasks[0],scope).length)reasons.push('已剔除任一所选副本 CD 已用、跳过或不符合参与范围的角色');if(parties.length<(g.parties||[]).length)reasons.push('部分队伍不满足其他副本的职责或侠客约束，请调整规则后重新生成');
    return {...sum(taskResults.map(x=>x.result),s.config),batches,parties,taskResults,reasons,powerBasis:g.powerBasis,unassigned:available.filter(r=>!batches.flat().some(x=>x.id===r.id))};
  }
  function sum(results,c) {
    const fields=['goldCost','gold','minutes','onlineMinutes','gross','fee','card','other','cost','net','timeNet','executions'];const out=Object.fromEntries(fields.map(k=>[k,results.reduce((n,x)=>n+(x[k]||0),0)]));for(const key of ['accountMinutes','billableAccountMinutes','coveredAccountMinutes']){out[key]={};for(const x of results)for(const [a,m]of Object.entries(x[key]||{}))out[key][a]=(out[key][a]||0)+m;}out.billingWarnings=[...new Set(results.flatMap(x=>x.billingWarnings||[]))];
    out.netGold=results.some(x=>x.netGold===null)?null:results.reduce((n,x)=>n+(x.netGold||0),0);out.hourlyGold=out.minutes>0&&out.netGold!==null?out.netGold/(out.minutes/60):null;out.hourly=out.minutes>0?out.net/(out.minutes/60):null;out.roi=out.cost>0?out.net/out.cost*100:null;return out;
  }
  function recordAccount(s,r,id){const keys=Object.keys(r.accountMinutes||{}),fullyKnown=Math.abs(Object.values(r.accountMinutes||{}).reduce((n,v)=>n+v,0)-(r.onlineMinutes||0))<1e-6;return r.roleAccounts?.[id]||(keys.length===1&&fullyKnown?keys[0]:s.roles.find(x=>x.id===id)?.accountId);}
  function freezeRecord(s,r){
    if(!r.roleAccounts){const accounts=Object.keys(r.accountMinutes||{});r.roleAccounts=Object.fromEntries(r.roleIds.map(id=>[id,recordAccount(s,r,id)]));r.ownershipSource=accounts.length===1?'执行用量':'保存时档案';}
    r.roleGroups??=Object.fromEntries(r.roleIds.map(id=>[id,s.accounts.find(a=>a.id===r.roleAccounts[id])?.group||'']));return r;
  }
  function freezeHistory(s){
    for(const r of s.records)freezeRecord(s,r);
    for(const e of [...(s.wageReceipts||[]),...(s.materialSales||[]),...s.ledger]){
      const material=(s.materials||[]).find(m=>m.id===e.materialId),r=s.records.find(r=>r.id===(e.recordId||material?.recordId)),ids=e.roleId?[e.roleId]:r?.roleIds||[];
      e.roleAccounts??=Object.fromEntries(ids.map(id=>[id,r?.roleAccounts[id]||s.roles.find(r=>r.id===id)?.accountId]));e.roleGroups??=Object.fromEntries(ids.map(id=>[id,r?.roleGroups[id]??s.accounts.find(a=>a.id===e.roleAccounts[id])?.group??'']));
      if(e.direction==='out'&&e.category==='consumption'&&e.roiCost!==false&&!e.snapshot){e.snapshot={...s.config,saleRate:1,fee:0};e.pricingSource='旧流水迁移时计价，原始币价未知';}
    }return s;
  }
  function recordResult(r){
    const goldCost=r.goldCost||0,result=costs(r.gold,r.minutes,r.onlineMinutes,r.snapshot,(r.otherCost||0)+goldCost*r.snapshot.goldPrice/r.snapshot.goldUnit,r.accountMinutes||{});
    return {...result,goldCost,accountMinutes:r.accountMinutes||{},...(r.billableAccountMinutes?{billableAccountMinutes:r.billableAccountMinutes,coveredAccountMinutes:r.coveredAccountMinutes||{}}:{}),billingWarnings:[...(r.billingWarnings||[]),...(r.pricingSource?[r.pricingSource]:[])]};
  }
  function selectedRecordRoles(s,r,scope={}){return r.roleIds.filter(id=>{const role=s.roles.find(x=>x.id===id);return role&&(!scope.role||id===scope.role)&&(!scope.account||recordAccount(s,r,id)===scope.account)&&(!scope.group||(r.roleGroups?.[id]??s.accounts.find(a=>a.id===recordAccount(s,r,id))?.group)===scope.group);});}
  function scopedRecord(s,r,scope={}){
    if(r.unallocated&&(scope.role||scope.account||scope.group))return null;const ids=selectedRecordRoles(s,r,scope);if(!ids.length&&!r.unallocated)return null;
    if(ids.length===r.roleIds.length)return r;
    if(!r.roleAllocations||ids.some(id=>!r.roleAllocations[id]))return null;
    const amounts={gold:0,minutes:0,onlineMinutes:0,otherCost:0},accountMinutes={};
    for(const id of ids){const a=r.roleAllocations[id],accountId=recordAccount(s,r,id);for(const k of Object.keys(amounts))amounts[k]+=a[k]||0;accountMinutes[accountId]=(accountMinutes[accountId]||0)+(a.onlineMinutes||0);}
    const billableAccountMinutes={},coveredAccountMinutes={};for(const [id,m]of Object.entries(accountMinutes)){const fraction=m/(r.accountMinutes?.[id]||m||1);billableAccountMinutes[id]=(r.billableAccountMinutes?.[id]||0)*fraction;coveredAccountMinutes[id]=(r.coveredAccountMinutes?.[id]||0)*fraction;}
    return {...r,...amounts,roleIds:ids,accountMinutes,...(r.billableAccountMinutes?{billableAccountMinutes,coveredAccountMinutes}:{})};
  }
  function inScope(s,r,scope={}){return !!scopedRecord(s,r,scope);}
  function planStart(s,p,taskId=p.taskId){
    let at=instant(p.startedAt||p.date);
    for(const id of p.routeTaskIds||[p.taskId]){if(id===taskId)break;const t=p.taskSnapshots?.[id]||s.tasks.find(t=>t.id===id),records=s.records.filter(r=>r.planId===p.id&&r.taskId===id),done=new Set(records.flatMap(r=>r.planBatchIndices||p.batches.map((_,i)=>i))),pending=p.batches.filter((_,i)=>!done.has(i)&&!p.closedBatches?.[id]?.includes(i));if(t){const predicted=calculateBatches({...t,prepare:done.size?0:t.prepare,otherCost:0},pending.map(b=>b.map(id=>s.roles.find(r=>r.id===id))),s.config).minutes;at=Math.max(at+records.reduce((n,r)=>n+r.minutes,0)*60000,...records.map(r=>instant(r.startedAt||new Date(at))+r.minutes*60000))+predicted*60000;}}
    return new Date(at).toISOString();
  }
  // Keep the confirmed template for historical plan/actual comparisons. Archives
  // are read only; no completion, income, pricing or recycle evidence is edited.
  function capturePlanForecasts(s,archives=[]){
    let changed=s.workflowVersion!==2;s.workflowVersion=2;
    const sources=[...archives].sort((a,b)=>(a.savedAt||'').localeCompare(b.savedAt||''));
    for(const p of s.plans){
      if(p.requiresReview!==undefined){delete p.requiresReview;changed=true;}
      for(const id of p.routeTaskIds||[p.taskId]){
        if(p.taskSnapshots?.[id])continue;
        const archive=sources.find(row=>row.data?.plans?.some(old=>old.id===p.id)&&row.data.tasks?.some(t=>t.id===id));
        const task=(archive?.data||s).tasks.find(t=>t.id===id);if(!task)continue;
        p.taskSnapshots??={};p.taskSnapshots[id]={...JSON.parse(JSON.stringify(task)),roleIds:[...new Set(p.batches?.flat()||task.roleIds)]};changed=true;
      }
    }
    return changed;
  }
  function confirmedForecast(s,start,end,scope={}){
    const usage=new Map(),warnings=[],participation=[],rows=new Map(s.tasks.map(t=>[t.id,[]]));
    for(const p of [...s.plans].filter(p=>!p.cancelled&&p.date<=end).sort((a,b)=>instant(a.startedAt||a.date)-instant(b.startedAt||b.date)||(a.createdAt||'').localeCompare(b.createdAt||''))){
      for(const taskId of p.routeTaskIds||[p.taskId]){
        const when=instant(planStart(s,p,taskId)),taskWhen=new Date(when).toISOString(),taskDate=dateKey(new Date(when)),current=s.tasks.find(t=>t.id===taskId);if(!current)continue;
        const t=taskForVersion(s,p.taskSnapshots?.[taskId]||current),validationTask=taskForVersion(s,{...current,...p.taskSnapshots?.[taskId],enabled:current.enabled}),batches=[],fullBatches=[],fullBatchIndices=[],done=new Set(recordedBatchIndices(s,p,taskId)),full=eligible(s,validationTask),selected=new Set(eligible(s,validationTask,scope).map(r=>r.id));
        for(const [i,ids]of p.batches.entries()){
          if(p.closedBatches?.[taskId]?.includes(i))continue;
          const completed=done.has(i),event=executionRecords(s).find(r=>r.planId===p.id&&r.taskId===taskId&&(!r.planBatchIndices||r.planBatchIndices.includes(i)));
          const key=id=>[id,cdKey(t),event?.cycle||cycle(t,taskWhen)].join('|');
          // Completed batches are evidence. Current membership, caps, manual
          // progress and duty edits must never erase their confirmed baseline.
          const allowed=completed?ids.map(id=>{const r=s.roles.find(r=>r.id===id);return r&&{...r,accountId:event?.roleAccounts?.[id]||r.accountId};}).filter(Boolean):ids.map(id=>full.find(r=>r.id===id)).filter(r=>{
            if(!r)return false;const progress=getProgress(s,validationTask,r,taskWhen),record=cdRecord(s,validationTask,r.id,taskWhen);
            return progress?.status!=='skipped'&&(usage.get(key(r.id))||0)<(progress?.target??validationTask.target)&&(!record||record.planId===p.id);
          });
          try{
            if(!completed){
              if(!validationTask.enabled)continue;
              if(validationTask.type==='team'||validationTask.partyRule==='daily5'){
                if(allowed.length!==ids.length)throw new Error('成员资格、跳过状态或 CD 已变化');
                if(['raid10','daily5'].includes(validationTask.partyRule))validateParty(partyTask(savedPartyTask(validationTask,p),p.teamConfigs?.[i]),allowed,p.companionAssignments?.[i]||[],s.config.concurrency);
                else if(!teamCandidates({...validationTask,runs:1},allowed,[],s.config.concurrency).teams.length)throw new Error('队伍已失效');
              }
              if(new Set(allowed.map(r=>r.accountId)).size!==allowed.length||allowed.length>Math.min(s.config.concurrency,validationTask.maxParallel))throw new Error('账号互斥或并行容量已变化');
            }
            if(!allowed.length)continue;
            for(const r of allowed)usage.set(key(r.id),(usage.get(key(r.id))||0)+1);
            fullBatches.push(allowed);fullBatchIndices.push(i);
            const scoped=completed?new Set(selectedRecordRoles(s,event||{roleIds:ids},scope)):selected;
            if(allowed.every(r=>scoped.has(r.id)))batches.push(allowed);else warnings.push(t.name+'：筛选未包含完整确认批次，未分摊共享收益');
          }catch(e){if(taskDate>=start&&taskDate<=end)warnings.push(t.name+'：'+e.message+'，该批次未计入预测');}
        }
        const scopedTask={...t,enabled:true,prepare:batches.includes(fullBatches[0])?t.prepare:0,otherCost:batches.includes(fullBatches[0])?t.otherCost:0};
        const result=pricePrediction(s,t,calculateBatches(scopedTask,batches,pricingConfig(s,new Date(when))),new Date(when),fullBatches);
        if(taskDate>=start&&taskDate<=end){rows.get(taskId).push(result);if(!scope.role&&!scope.account&&!scope.group&&fullBatches.length)participation.push({planId:p.id,taskId,date:taskDate,startedAt:new Date(when).toISOString(),prepare:t.prepare||0,batchMinutes:t.minutes/t.efficiency,batchIndices:fullBatchIndices,onlinePerVisit:t.minutes/t.efficiency+t.onlineExtra,batches:fullBatches.map(batch=>batch.map(r=>({roleId:r.id,accountId:r.accountId}))),result});}
      }
    }
    const tasks=s.tasks.filter(t=>t.enabled||rows.get(t.id)?.length).map(task=>({task,...sum(rows.get(task.id)||[],s.config),hasData:true}));
    const seen=new Set();let unassignedTargets=0;for(const d of dates(start,end))for(const t of s.tasks.filter(t=>t.enabled&&t.days.includes(weekday(d))))for(const r of eligible(s,t,scope)){const key=[r.id,cdKey(t),cycle(t,d)].join('|');if(seen.has(key))continue;seen.add(key);const p=getProgress(s,t,r,d);if(p?.status==='skipped')continue;unassignedTargets+=Math.max(0,(p?.target??t.target)-Math.max(p?.completed||0,usage.get(key)||0));}
    return {...sum(tasks,s.config),tasks,participation,hasData:true,unassignedTargets,forecastWarnings:[...new Set(warnings)],start,end};
  }
  function incomeRecords(s){
    const ownership=(e,r,ids)=>({roleAccounts:Object.fromEntries(ids.map(id=>[id,e.roleAccounts?.[id]||r?.roleAccounts?.[id]||s.roles.find(x=>x.id===id)?.accountId])),roleGroups:Object.fromEntries(ids.map(id=>[id,e.roleGroups?.[id]??r?.roleGroups?.[id]??s.accounts.find(a=>a.id===(r?.roleAccounts?.[id]||s.roles.find(x=>x.id===id)?.accountId))?.group??'']))});
    const wage=(s.wageReceipts||[]).map(e=>{const r=s.records.find(r=>r.id===e.recordId),ids=e.roleId?[e.roleId]:r.roleIds;return {...e,...ownership(e,r,ids),taskId:r.taskId,roleIds:ids,gold:e.gold,minutes:0,onlineMinutes:0,otherCost:0,accountMinutes:{},financialEvent:true};});
    const sales=(s.materialSales||[]).map(e=>{const m=s.materials.find(m=>m.id===e.materialId),r=s.records.find(r=>r.id===m.recordId),ids=e.roleId?[e.roleId]:r?.roleIds||s.roles.map(r=>r.id);return {...e,...ownership(e,r,ids),taskId:r?.taskId||'material_income',roleIds:ids,unallocated:!e.roleId&&!r,gold:e.quantity*e.unitGold-e.feeGold,minutes:0,onlineMinutes:0,otherCost:0,accountMinutes:{},financialEvent:true};});
    const expenses=s.ledger.filter(e=>e.direction==='out'&&!e.linkedEventId&&(e.roiCost===true||e.category==='consumption'&&e.roiCost!==false)&&!['transfer','adjustment'].includes(e.category)).map(e=>{const r=s.records.find(r=>r.id===e.recordId),ids=[e.roleId];return {...e,...ownership(e,r,ids),taskId:r?.taskId||'operating_cost',roleIds:ids,gold:0,goldCost:e.gold,snapshot:e.snapshot||{...s.config,saleRate:1,fee:0},minutes:0,onlineMinutes:0,otherCost:0,accountMinutes:{},financialEvent:true,expense:true};});
    return [...s.records,...wage,...sales,...expenses];
  }
  function summary(s,start,end,scope={},mode='estimated') {
    if(mode==='estimated'){dates(start,end);return confirmedForecast(s,start,end,scope);}
    const actualRows=mode==='actual'?incomeRecords(s):[],ds=dates(start,end),estimateUsage=new Set(),actualTasks=mode==='actual'?[...s.tasks,...[{id:'material_income',name:'独立材料出售'},{id:'operating_cost',name:'未关联任务的经营费用'}].filter(t=>actualRows.some(r=>r.taskId===t.id))]:s.tasks,perTask=actualTasks.filter(t=>t.enabled||mode==='actual').map(t=>{
      const list=mode==='actual'?actualRows.filter(r=>r.taskId===t.id&&r.date>=start&&r.date<=end).map(r=>scopedRecord(s,r,scope)).filter(Boolean).map(recordResult):ds.map(d=>{if(!t.dungeonId)return plan(s,t,d,scope);const key=id=>[id,cdKey(t),cycle(t,d)].join('|'),filtered={...t,roleIds:t.roleIds.filter(id=>!estimateUsage.has(key(id)))},result=plan(s,filtered,d,scope);for(const role of result.batches.flat())estimateUsage.add(key(role.id));return result;});
      return {task:t,...sum(list,s.config),hasData:mode!=='actual'||list.length>0};
    });
    const hasData=mode!=='actual'||actualRows.some(r=>r.date>=start&&r.date<=end&&inScope(s,r,scope));
    return {...sum(perTask,s.config),tasks:perTask,hasData,start,end};
  }
  function completion(s,start,end,scope={}) {let total=0,done=0;const seen=new Set();for(const d of dates(start,end))for(const t of s.tasks.filter(t=>t.enabled&&t.days.includes(weekday(d))))for(const r of eligible(s,t,scope)){const key=[r.id,cdKey(t),cycle(t,d)].join('|');if(seen.has(key))continue;seen.add(key);const p=effectiveProgress(s,t,r,d),target=p.target;if(p?.status==='skipped')continue;total+=target;done+=Math.min(target,p?.completed||(cdRecord(s,t,r.id,d)?1:0));}return {total,done,rate:total?done/total*100:null};}
  function cashSummary(s,start,end) {const list=s.cash.filter(c=>c.date>=start&&c.date<=end),income=list.filter(c=>c.type==='income').reduce((n,c)=>n+c.amount,0),expense=list.filter(c=>c.type==='expense').reduce((n,c)=>n+c.amount,0);return {income,expense,net:income-expense,roi:expense?((income-expense)/expense*100):null,hasData:list.length>0};}
  function budget(s,summary) {return s.accounts.filter(a=>a.enabled!==false).map(a=>{
    const minutes=summary.accountMinutes[a.id]||0,monthly=a.billingType==='monthly',known=Object.prototype.hasOwnProperty.call(summary.billableAccountMinutes||{},a.id),expiry=a.monthlyExpiresAt?Date.parse(a.monthlyExpiresAt):null;
    const covered=known?summary.coveredAccountMinutes?.[a.id]||0:monthly&&expiry>instant(summary.start||dateKey())&&(!summary.end||expiry>=instant(summary.end)+12*3600000)?minutes:0;
    const billable=known?summary.billableAccountMinutes[a.id]:minutes-covered,balanceExpired=!!a.balanceExpiry&&a.balanceExpiry<(summary.start||dateKey()),balance=balanceExpired?0:a.balance||0,gap=Math.max(0,billable-balance),packs=Math.ceil(gap/s.config.cardMinutes);
    const unknown=monthly?expiry===null||!known&&billable>0||billable>0&&(a.balanceExpiry===undefined||a.balance===undefined):a.balanceExpiry===undefined||a.balance===undefined;
    return {account:a,minutes,coveredMinutes:covered,billableMinutes:billable,balance,gap,packs,cash:packs*s.config.cardPrice*s.config.discount,left:balance+packs*s.config.cardMinutes-billable,unknown,expired:monthly?expiry!==null&&expiry<=instant(summary.start||dateKey()):balanceExpired,monthly};
  });}
  function balance(s,r) {const events=s.ledger.filter(e=>e.roleId===r.id&&(!r.openingGoldDate||e.date>=r.openingGoldDate)),delta=events.reduce((n,e)=>n+(e.direction==='in'?e.gold:-e.gold),0),expected=r.openingGold==null?null:r.openingGold+delta;return {expected,observed:r.observedGold,unexplained:expected===null||r.observedGold==null?null:r.observedGold-expected};}
  function ledgerIncome(s) {return s.ledger.filter(e=>e.category!=='transfer'&&e.category!=='adjustment').reduce((n,e)=>n+(e.direction==='in'?e.gold:-e.gold),0);}
  function validateState(s) {
    if(s.version!==VERSION)throw new Error('不支持的数据版本 '+s.version+'；当前支持 version: 1');
    validateConfig(s.config);if(s.recordingPreferences&&(!['none','attendance'].includes(s.recordingPreferences.financialAllocation)||!['none','attendance'].includes(s.recordingPreferences.timeAllocation)))throw new Error('执行分摊偏好无效');
    for(const key of ['accounts','roles','tasks','progress','records','ledger','cash','equipment','plans','imports','scenarios','notes']){if(!Array.isArray(s[key]))throw new Error('缺少数组字段 '+key);const ids=s[key].map(x=>x.id);if(ids.some(x=>typeof x!=='string'||!x||!/^[-_a-zA-Z0-9]+$/.test(x))||new Set(ids).size!==ids.length)throw new Error(key+' 包含缺失、非法或重复 ID（仅字母、数字、下划线与连字符）');}
    for(const r of s.roles){if(r.referenceDps!=null){if(typeof r.referenceDps!=='number')throw new Error('参考 DPS 必须为数字');number(r.referenceDps,'参考 DPS');}if(r.gongzhanBuff!=null&&typeof r.gongzhanBuff!=='boolean')throw new Error('共战江湖状态必须为有、无或待确认');if(r.creationStatus!==undefined&&!['planned','created'].includes(r.creationStatus))throw new Error('角色创建状态无效');for(const k of ['energy','energyCap','weeklyEnergy','contribution','chivalry','prestige','achievement','equipmentScore','stage','huashang','homeSeason'])if(r[k]!=null)number(r[k],k);if(r.energy!=null&&r.energyCap!=null&&r.energy>r.energyCap)throw new Error('角色精力不能超过上限');if(r.resourceUpdatedAt&&!Number.isFinite(new Date(r.resourceUpdatedAt).getTime()))throw new Error('资源采集时间无效');if(!s.accounts.some(a=>a.id===r.accountId))throw new Error('角色 '+r.name+' 的账号不存在');if(!r.name?.trim())throw new Error('角色名不能为空');for(const k of ['level','score','openingGold','observedGold'])if(r[k]!=null)number(r[k],k);if(r.companionIds!==undefined&&(!Array.isArray(r.companionIds)||r.companionIds.some(id=>!Catalog.companions.some(c=>c.id===id))||new Set(r.companionIds).size!==r.companionIds.length))throw new Error('角色侠客 ID 无效或重复');if(r.companionDutyOverrides)for(const [id,duties]of Object.entries(r.companionDutyOverrides))if(!Catalog.companions.some(c=>c.id===id)||!Array.isArray(duties)||duties.some(d=>!['tank','heal','dps'].includes(d)))throw new Error('侠客职责覆盖无效');}
    for(const a of s.accounts){if(!a.name?.trim())throw new Error('账号别名不能为空');number(a.balance??0,'点卡余额');if(a.region&&!['电信区','双线区','无界区'].includes(a.region))throw new Error('账号大区无效');if(a.billingType&&!['point','monthly'].includes(a.billingType))throw new Error('计费类型无效');if(a.monthlyExpiresAt&&!Number.isFinite(new Date(a.monthlyExpiresAt).getTime()))throw new Error('月卡到期时间无效');for(const k of ['tongbao','points','activityScore','sharedEnergy','sharedEnergyCap'])if(a[k]!=null)number(a[k],k);}
    for(const t of s.tasks)validateTask(t,s);
    for(const p of s.progress){if(!s.roles.some(r=>r.id===p.roleId)||!s.tasks.some(t=>t.id===p.taskId))throw new Error('进度引用不存在的角色或任务');number(p.completed,'完成次数',{integer:true});number(p.target??0,'任务目标',{integer:true});}
    const progressKeys=s.progress.map(p=>[p.roleId,p.cdKeySnapshot||cdKey(s.tasks.find(t=>t.id===p.taskId)),p.cycle].join('|'));if(new Set(progressKeys).size!==progressKeys.length)throw new Error('同一角色、任务、周期存在重复进度，请先解决冲突');
    const validDate=d=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&Number.isFinite(new Date(d+'T12:00:00+08:00').getTime())&&dateKey(new Date(d+'T12:00:00+08:00'))===d;
    for(const r of s.roles)if(r.openingGoldDate!=null&&!validDate(r.openingGoldDate))throw new Error('期初金币日期无效');
    for(const r of s.records){if(!s.tasks.some(t=>t.id===r.taskId))throw new Error('实测任务不存在');for(const k of ['gold','minutes','onlineMinutes','batches'])number(r[k],k);number(r.batches,'实测批次',{min:1,integer:true});validateConfig(r.snapshot);if(!validDate(r.date))throw new Error('实测日期无效');if(!Array.isArray(r.roleIds)||r.roleIds.some(id=>!s.roles.some(x=>x.id===id)))throw new Error('实测成员引用不存在的角色');for(const [account,minutes] of Object.entries(r.accountMinutes||{})){if(!s.accounts.some(a=>a.id===account))throw new Error('实测用量引用不存在账号');number(minutes,'账号在线分钟');}if(Object.values(r.accountMinutes||{}).reduce((n,m)=>n+m,0)>r.onlineMinutes+1e-6)throw new Error('逐账号用量超过实测总在线分钟');}
    for(const r of s.records){
      if(r.billableAccountMinutes){for(const [id,m]of Object.entries(r.billableAccountMinutes)){if(!s.accounts.some(a=>a.id===id))throw new Error('计费分钟账号不存在');number(m,'计费分钟');number(r.coveredAccountMinutes?.[id]??0,'月卡覆盖分钟');if(Math.abs(m+(r.coveredAccountMinutes?.[id]||0)-(r.accountMinutes?.[id]||0))>1e-6)throw new Error('计费分钟与账号出勤不一致');}}
      if(new Set(r.roleIds).size!==r.roleIds.length)throw new Error('实测成员重复');
      if(r.startedAt!==undefined&&r.startedAt!==null&&(!Number.isFinite(new Date(r.startedAt).getTime())||dateKey(new Date(r.startedAt))!==r.date))throw new Error('实测开始时刻与日期不一致');
      if(r.endedAt!=null&&(!r.startedAt||!Number.isFinite(Date.parse(r.endedAt))||Date.parse(r.endedAt)<Date.parse(r.startedAt)))throw new Error('实测结束时间无效或早于开始时间');
      if(r.dungeonId&&(typeof r.dungeonId!=='string'||!/^[-_a-zA-Z0-9]+$/.test(r.dungeonId)||!validDate(r.cycle)))throw new Error('实测副本 CD 标识无效');
      if(r.cdSnapshot){if(r.cdSnapshot.period!=='weekly'||!Array.isArray(r.cdSnapshot.resetDays)||!r.cdSnapshot.resetDays.length||r.cdSnapshot.resetDays.some(d=>!Number.isInteger(d)||d<0||d>6))throw new Error('历史 CD 刷新规则无效');number(r.cdSnapshot.resetHour,'历史刷新小时',{min:0,max:23,integer:true});if(r.cycle!==cycle(r.cdSnapshot,r.startedAt||r.date))throw new Error('实测 CD 与开始时刻或历史刷新规则不一致');}
      if(r.roleAccounts){if(Object.keys(r.roleAccounts).length!==r.roleIds.length||r.roleIds.some(id=>!s.accounts.some(a=>a.id===r.roleAccounts[id])))throw new Error('历史角色账号快照无效');}if(r.roleGroups&&r.roleIds.some(id=>typeof r.roleGroups[id]!=='string'))throw new Error('历史分组快照无效');
      for(const [id,value]of Object.entries(r.roleOnlineMinutes||{})){if(!r.roleIds.includes(id))throw new Error('参与耗时引用不存在成员');number(value,'角色在线分钟');}
      if(r.roleOnlineMinutes&&Math.abs(Object.values(r.roleOnlineMinutes).reduce((a,b)=>a+b,0)-r.onlineMinutes)>1e-6)throw new Error('角色在线分钟合计不等于实测总量');
      if(r.roleAllocations){
        if(Object.keys(r.roleAllocations).length!==r.roleIds.length||r.roleIds.some(id=>!r.roleAllocations[id]))throw new Error('实测分摊必须覆盖全部出勤成员');
        for(const key of ['gold','minutes','onlineMinutes','otherCost']){let total=0;for(const [id,a]of Object.entries(r.roleAllocations)){if(!r.roleIds.includes(id))throw new Error('分摊成员不在实测范围');total+=number(a[key]??0,'分摊 '+key);}if(Math.abs(total-(r[key]||0))>1e-6)throw new Error('分摊 '+key+' 与整条记录不一致');}
      }
    }
    for(const p of s.plans){
      if(p.taskSnapshots!=null){if(typeof p.taskSnapshots!=='object'||Array.isArray(p.taskSnapshots))throw new Error('排程模板快照格式无效');for(const [id,t]of Object.entries(p.taskSnapshots)){if(!t||t.id!==id||!s.tasks.some(x=>x.id===id))throw new Error('排程模板快照引用无效');validateTask(t,s);}}
      for(const f of p.completionFacts||[])if(f.endedAt!=null&&(!f.startedAt||!Number.isFinite(Date.parse(f.endedAt))||Date.parse(f.endedAt)<Date.parse(f.startedAt)))throw new Error('完成登记结束时间无效');
      if(p.executionDrafts!==undefined){
        if(!Array.isArray(p.executionDrafts))throw new Error('执行草稿必须为数组');
        const keys=new Set();for(const d of p.executionDrafts){const key=d.taskId+'|'+d.index;if(!(p.routeTaskIds||[p.taskId]).includes(d.taskId)||!Number.isInteger(d.index)||!p.batches[d.index]||keys.has(key)||!d.values||typeof d.values!=='object'||Array.isArray(d.values)||!Array.isArray(d.roleIds))throw new Error('执行草稿引用无效');keys.add(key);for(const k of ['gold','minutes','onlineMinutes','otherCost'])if(d.values[k]!==''&&d.values[k]!=null)number(d.values[k],k);}
      }
    }
    const factIds=new Set();for(const p of s.plans){if(p.completionFacts!==undefined&&!Array.isArray(p.completionFacts))throw new Error('完成登记必须为数组');const keys=new Set();for(const f of p.completionFacts||[]){const i=f.planBatchIndices?.[0],t=s.tasks.find(t=>t.id===f.taskId),key=f.taskId+'|'+i;if(!f.id||!/^[-_a-zA-Z0-9]+$/.test(f.id)||factIds.has(f.id)||keys.has(key)||f.planId!==p.id||!f.completionOnly||!t||!(p.routeTaskIds||[p.taskId]).includes(t.id)||!Array.isArray(f.planBatchIndices)||f.planBatchIndices.length!==1||!Number.isInteger(i)||!p.batches?.[i]||f.batches!==1)throw new Error('完成登记引用无效或重复');factIds.add(f.id);keys.add(key);if(!validDate(f.date)||f.date!==p.date||f.startedAt&&(!Number.isFinite(Date.parse(f.startedAt))||dateKey(new Date(f.startedAt))!==f.date)||f.cycle!==cycle(f.cycleSnapshot||f.cdSnapshot||t,f.startedAt||f.date))throw new Error('完成登记日期或周期无效');if(!Array.isArray(f.roleIds)||new Set(f.roleIds).size!==f.roleIds.length||f.roleIds.length!==p.batches[i].length||f.roleIds.some(id=>!p.batches[i].includes(id)||!s.accounts.some(a=>a.id===f.roleAccounts?.[id])||typeof f.roleGroups?.[id]!=='string'))throw new Error('完成登记成员或账号快照无效');validateConfig(f.snapshot);if(!Array.isArray(f.billingAccounts)||new Set(f.billingAccounts.map(a=>a.id)).size!==f.billingAccounts.length||f.roleIds.some(id=>!f.billingAccounts.some(a=>a.id===f.roleAccounts[id]))||f.billingAccounts.some(a=>!s.accounts.some(x=>x.id===a.id)||a.monthlyExpiresAt&&!Number.isFinite(Date.parse(a.monthlyExpiresAt))||a.billingType&&!['point','monthly'].includes(a.billingType)))throw new Error('完成登记计费账号快照无效');if(f.cycleSnapshot){if(!['daily','weekly'].includes(f.cycleSnapshot.period)||!Array.isArray(f.cycleSnapshot.resetDays)||!f.cycleSnapshot.resetDays.length||f.cycleSnapshot.resetDays.some(d=>!Number.isInteger(d)||d<0||d>6))throw new Error('完成登记刷新规则无效');number(f.cycleSnapshot.resetHour,'完成刷新小时',{min:0,max:23,integer:true});}}}
    const batchEvents=new Set();for(const r of executionRecords(s))if(r.planBatchIndices){const p=s.plans.find(p=>p.id===r.planId);if(!p||!(p.routeTaskIds||[p.taskId]).includes(r.taskId)||!Array.isArray(r.planBatchIndices)||r.planBatchIndices.length!==r.batches||new Set(r.planBatchIndices).size!==r.planBatchIndices.length||r.planBatchIndices.some(i=>!Number.isInteger(i)||i<0||i>=p.batches.length))throw new Error('部分执行批次引用无效');const ids=[...new Set(r.planBatchIndices.flatMap(i=>p.batches[i]))];if(ids.length!==r.roleIds.length||ids.some(id=>!r.roleIds.includes(id)))throw new Error('部分执行成员与批次不一致');for(const i of r.planBatchIndices){const k=[p.id,r.taskId,i].join('|');if(batchEvents.has(k))throw new Error('同一排程批次不能重复执行');batchEvents.add(k);}}
    for(const key of ['wageClaims','wageReceipts','materials','materialSales','sourceArchives','priceQuotes','energyRecipes','roiComparisons'])if(s[key]!==undefined){if(!Array.isArray(s[key])||s[key].some(x=>!x.id||!/^[-_a-zA-Z0-9]+$/.test(x.id))||new Set(s[key].map(x=>x.id)).size!==s[key].length)throw new Error(key+' 数组或 ID 无效');}
    const receipts=s.wageReceipts||[],sales=s.materialSales||[],events=new Set();
    for(const e of [...receipts,...sales]){if(!e.eventKey?.trim()||events.has(e.eventKey.trim())||s.ledger.some(x=>x.eventKey?.trim()===e.eventKey.trim()&&x.linkedEventId!==e.id))throw new Error('分账凭据缺失或重复');events.add(e.eventKey.trim());if(!validDate(e.date))throw new Error('分账日期无效');validateConfig(e.snapshot);if(e.roleId&&!s.roles.some(r=>r.id===e.roleId))throw new Error('分账归属角色不存在');}
    for(const e of receipts){const r=s.records.find(r=>r.id===e.recordId);if(!r||e.roleId&&!r.roleIds.includes(e.roleId))throw new Error('工资执行或成员引用无效');number(e.gold,'到账工资',{min:0.000001});}
    const claims=new Set();for(const c of s.wageClaims||[]){const r=s.records.find(r=>r.id===c.recordId);if(!r||claims.has(c.recordId))throw new Error('工资应收执行缺失或重复');claims.add(c.recordId);number(c.expectedGold,'应收工资');if(c.expectedGold+1e-6<r.gold+receipts.filter(e=>e.recordId===r.id).reduce((n,e)=>n+e.gold,0))throw new Error('应收工资不能低于累计到账');}
    for(const m of s.materials||[]){if(!m.name?.trim())throw new Error('材料名称不能为空');number(m.quantity,'材料数量',{min:0.000001});if(m.unitPrice!=null)number(m.unitPrice,'材料估值');if(!validDate(m.date)||m.priceDate&&!validDate(m.priceDate))throw new Error('材料日期无效');if(m.unitPrice!=null&&!m.priceDate)throw new Error('材料估值必须保留报价日期');if(m.roleId&&!s.roles.some(r=>r.id===m.roleId)||m.recordId&&!s.records.some(r=>r.id===m.recordId&&(!m.roleId||r.roleIds.includes(m.roleId))))throw new Error('材料归属引用无效');if(sales.filter(e=>e.materialId===m.id).reduce((n,e)=>n+e.quantity,0)>m.quantity+1e-6)throw new Error('材料出售超出库存');}
    for(const e of sales){const m=(s.materials||[]).find(m=>m.id===e.materialId);if(!m||m.tradable===false||m.roleId&&e.roleId!==m.roleId)throw new Error('材料出售引用或归属无效');number(e.quantity,'出售数量',{min:0.000001});number(e.unitGold,'出售单价');number(e.feeGold,'交易费用');if(e.feeGold>e.quantity*e.unitGold)throw new Error('交易费用超过出售收入');}
    for(const e of s.ledger.filter(x=>x.linkedEventId)){const event=[...receipts,...sales].find(x=>x.id===e.linkedEventId),gold=event?.gold??(event?.quantity*event?.unitGold-event?.feeGold);if(!event||e.roleId!==event.roleId||e.date!==event.date||e.direction!=='in'||Math.abs(e.gold-gold)>1e-6||s.ledger.filter(x=>x.linkedEventId===e.linkedEventId).length!==1)throw new Error('分账关联流水与原事件不一致');}
    const validInstant=v=>typeof v==='string'&&/T/.test(v)&&Number.isFinite(Date.parse(v));
    const sourceURL=url=>{if(url&&!(typeof url==='string'&&/^https?:\/\//i.test(url)&&!/[\s<>"']/.test(url)))throw new Error('价格 / 配方来源链接须为 HTTP(S)');};
    for(const q of s.priceQuotes||[]){if(!['gold','material'].includes(q.kind)||typeof q.server!=='string'||!q.name?.trim()||!q.sourceName?.trim()||!['manual','listing','trade','import'].includes(q.sourceType)||!validInstant(q.observedAt))throw new Error('报价名称、区服、来源或采集时点无效');number(q.price,'报价金额');number(q.unit,'报价单位',{min:q.kind==='gold'?1:.000001});number(q.validForHours,'报价有效小时',{min:.000001,max:8760});if(q.sampleCount!=null)number(q.sampleCount,'报价样本数',{min:1,integer:true});if(q.itemId!=null&&typeof q.itemId!=='string')throw new Error('报价物品 ID 无效');sourceURL(q.sourceUrl);}
    for(const m of s.materials||[]){if(m.server!==undefined&&typeof m.server!=='string'||m.itemId!==undefined&&typeof m.itemId!=='string')throw new Error('库存区服或物品 ID 无效');if(m.pricingMode!==undefined&&!['manual','latest','locked'].includes(m.pricingMode))throw new Error('库存计价方式无效');if(m.priceValidForHours!=null)number(m.priceValidForHours,'手工报价有效小时',{min:.000001,max:8760});if(m.pricingMode==='locked'){const q=(s.priceQuotes||[]).find(q=>q.id===m.priceQuoteId),server=m.server??s.roles.find(r=>r.id===m.roleId)?.server??'';if(!q||q.kind!=='material'||q.server!==server||(m.itemId||q.itemId?!m.itemId||m.itemId!==q.itemId:m.name!==q.name))throw new Error('锁定报价与库存物品 / 区服不匹配');}}
    for(const r of s.energyRecipes||[]){if(!r.name?.trim()||typeof r.server!=='string'||!r.source?.trim()||!Array.isArray(r.roleIds)||new Set(r.roleIds).size!==r.roleIds.length||r.roleIds.some(id=>!s.roles.some(x=>x.id===id)))throw new Error('精力配方名称、来源或角色资格无效');number(r.energy,'单次消耗精力',{min:1,integer:true});number(r.minutes,'单次操作分钟',{min:.000001});number(r.maxRuns,'配方最多执行次数',{min:1,max:10000,integer:true});for(const k of ['fixedGoldCost','otherYuanCost'])number(r[k]??0,k);for(const k of ['saleRate','tradeFeeRate'])number(r[k],k,{max:1});if(typeof r.allowPurchase!=='boolean'||typeof r.enabled!=='boolean')throw new Error('配方采购 / 启用开关无效');for(const key of ['inputs','outputs']){if(!Array.isArray(r[key])||key==='outputs'&&!r[key].length||r[key].length>20)throw new Error('配方投入 / 产出须为明细数组');const items=new Set();for(const x of r[key]){if(!x.name?.trim()||x.itemId!==undefined&&typeof x.itemId!=='string')throw new Error('配方材料名称 / ID 无效');number(x.quantity,'配方材料数量',{min:.000001});const id=x.itemId?'id:'+x.itemId:'name:'+x.name;if(items.has(id))throw new Error('同一配方明细的材料重复，请合并数量');items.add(id);if(x.tradable!==undefined&&typeof x.tradable!=='boolean')throw new Error('产物交易属性无效');}}sourceURL(r.sourceUrl);}
    for(const t of s.tasks)if(t.energyCost!=null)number(t.energyCost,'任务单角色精力消耗',{integer:true});
    for(const sc of s.roiComparisons||[]){if(!sc.name?.trim()||!validInstant(sc.generatedAt)||!sc.options||!validInstant(sc.startedAt)||!Array.isArray(sc.results)||!Array.isArray(sc.groups)||!Array.isArray(sc.warnings)||!sc.baseline||typeof sc.truncated!=='boolean')throw new Error('时间组合快照格式无效');validateConfig(sc.config);number(sc.options.minutes,'组合时间预算',{max:1440});if(!['net','timeNet','completion'].includes(sc.options.objective)||!['template','confirmed'].includes(sc.options.source))throw new Error('组合快照目标 / 来源无效');for(const r of [...sc.results,sc.baseline]){number(r.purchaseGold,'采购需求');number(r.remainingMinutes,'剩余分钟');if(!Number.isFinite(r.gold)||!r.energyUsed||typeof r.energyUsed!=='object')throw new Error('组合金币或精力字段无效');for(const v of Object.values(r.energyUsed))number(v,'组合精力');number(r.minutes,'组合操作分钟');if(r.minutes>sc.options.minutes+1e-6||!Number.isFinite(r.net)||!Number.isFinite(r.timeNet)||!Array.isArray(r.items))throw new Error('组合结果时间 / 收益无效');for(const item of r.items){if(typeof item.name!=='string'||!validInstant(item.startedAt)||!Array.isArray(item.roleNames)||item.roleNames.some(x=>typeof x!=='string')||!Array.isArray(item.roleIds)||!item.result||!Number.isFinite(item.result.minutes)||item.result.minutes<0)throw new Error('组合快照批次字段无效');}}}
    for(const e of s.ledger.filter(e=>e.eventKey&&!e.linkedEventId&&e.category!=='transfer')){const key=e.eventKey.trim();if(events.has(key))throw new Error('流水凭据重复');events.add(key);}
    const cdEvents=new Set();for(const r of executionRecords(s).filter(r=>r.dungeonId)){for(const roleId of r.roleIds){const key=[roleId,cdKey(r),r.cycle].join('|');if(cdEvents.has(key))throw new Error('同一角色、副本与刷新周期包含重复 CD 实测');cdEvents.add(key);}}
    for(const p of s.plans){if(p.rulesSnapshot?.raidMode!==undefined&&p.rulesSnapshot.raidMode!=='legacy'&&!raidModes.includes(p.rulesSnapshot.raidMode))throw new Error('排程组队模式无效');if(p.rulesSnapshot?.powerBasis){for(const key of ['scoreMedian','dpsMedian'])if(!Number.isFinite(p.rulesSnapshot.powerBasis[key])||p.rulesSnapshot.powerBasis[key]<=0)throw new Error('排程输出参考基准无效');}if(p.lockedBatches!==undefined&&(!Array.isArray(p.lockedBatches)||new Set(p.lockedBatches).size!==p.lockedBatches.length||p.lockedBatches.some(i=>!Number.isInteger(i)||i<0||i>=p.batches.length)))throw new Error('锁定队伍批次引用无效');if(p.closedBatches){for(const [id,indices]of Object.entries(p.closedBatches)){if(!(p.routeTaskIds||[p.taskId]).includes(id)||!Array.isArray(indices)||new Set(indices).size!==indices.length||indices.some(i=>!Number.isInteger(i)||i<0||i>=p.batches.length||recordedBatchIndices(s,{...p,executed:false,executedTaskIds:[]},id).includes(i)))throw new Error('终止或移出批次引用无效');}}if(p.startedAt&&(!Number.isFinite(instant(p.startedAt))||dateKey(new Date(p.startedAt))!==p.date))throw new Error('排程开始时刻与日期不一致');if(p.routeTaskIds!==undefined&&(!Array.isArray(p.routeTaskIds)||!p.routeTaskIds.length||new Set(p.routeTaskIds).size!==p.routeTaskIds.length||!p.routeTaskIds.includes(p.taskId)||p.routeTaskIds.some(id=>!s.tasks.some(t=>t.id===id&&t.partyRule==='raid10'))))throw new Error('串本排程的任务引用无效');if(p.executedTaskIds!==undefined&&(!Array.isArray(p.executedTaskIds)||p.executedTaskIds.some(id=>!(p.routeTaskIds||[p.taskId]).includes(id))))throw new Error('串本执行状态引用无效');}
    for(const e of s.ledger){if(!s.roles.some(r=>r.id===e.roleId))throw new Error('流水角色不存在');number(e.gold,'流水金额');if(e.recordId&&!s.records.some(r=>r.id===e.recordId&&r.roleIds.includes(e.roleId)))throw new Error('费用关联执行或成员无效');if(e.snapshot)validateConfig(e.snapshot);if(e.roiCost!==undefined&&typeof e.roiCost!=='boolean')throw new Error('费用开关无效');if(!['in','out'].includes(e.direction))throw new Error('流水方向无效');}
    for(const c of s.cash){number(c.amount,'现金金额');if(!['income','expense'].includes(c.type))throw new Error('现金方向无效');}
    for(const key of ['cash','ledger','equipment','progress','plans'])for(const e of s[key])if(e.date&&!validDate(e.date))throw new Error(key+' 存在非法日期');
    for(const e of s.equipment){if(!s.roles.some(r=>r.id===e.roleId))throw new Error('装备角色不存在');number(e.score,'装备评分');}
    for(const p of s.plans){if(!s.tasks.some(t=>t.id===p.taskId)||!Array.isArray(p.batches)||p.batches.some(b=>!Array.isArray(b)||b.some(id=>!s.roles.some(r=>r.id===id))))throw new Error('排程任务或成员引用无效');if(p.companionAssignments!==undefined){if(!Array.isArray(p.companionAssignments)||p.companionAssignments.some((a,i)=>!Array.isArray(a)||a.some(c=>!p.batches[i]?.includes(c.ownerRoleId)||!Catalog.companions.some(x=>x.id===c.companionId)||!['tank','heal','dps'].includes(c.duty))))throw new Error('排程侠客引用、归属或职责无效');}if(p.teamConfigs!==undefined){if(!Array.isArray(p.teamConfigs)||p.teamConfigs.length!==p.batches.length)throw new Error('排程逐队配置与成员批次不一致');for(const c of p.teamConfigs)if(c)validateTeamConfig(c);}}
    for(const sc of s.scenarios)validateConfig({...s.config,...sc.config});
    for(const entry of s.notes.filter(n=>n.kind==='task-recycle'))validateRecycleEntry(entry);
    return s;
  }
  function validateRecycleEntry(entry){
    if(!Array.isArray(entry.changes))throw new Error('任务回收记录缺少变更明细');
    const seen=new Set();
    for(const c of entry.changes){
      if(!c||!['plans','records','progress','wageClaims','wageReceipts','materials','materialSales','ledger'].includes(c.key)||typeof c.id!=='string'||!/^[-_a-zA-Z0-9]+$/.test(c.id)||[c.before,c.after].some(row=>row!==null&&(!row||typeof row!=='object'||Array.isArray(row)||row.id!==c.id))||seen.has(c.key+'|'+c.id))throw new Error('任务回收记录引用无效');
      seen.add(c.key+'|'+c.id);
    }
  }
  function sameHistoryRow(context,key,a,b){
    const canonical=value=>JSON.stringify(value,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);
    const snapshot=(key,row)=>{
      if(!row)return null;
      const copy=JSON.parse(JSON.stringify(row));
      if(key==='plans'){delete copy.taskSnapshots;delete copy.requiresReview;}
      if(['records','ledger','wageReceipts','materialSales'].includes(key))freezeHistory({...context,records:key==='records'?[copy]:context.records,ledger:key==='ledger'?[copy]:[],wageReceipts:key==='wageReceipts'?[copy]:[],materialSales:key==='materialSales'?[copy]:[]});
      return copy;
    };
    return canonical(snapshot(key,a))===canonical(snapshot(key,b));
  }
  function merge(current,incoming) {
    validateState(incoming);incoming=freezeHistory(JSON.parse(JSON.stringify(incoming)));const next=freezeHistory(JSON.parse(JSON.stringify(current))),stats={added:0,updated:0,skipped:0,old:0};
    // Backups contain the final workspace plus an audit journal, not a sequence
    // to replay against an arbitrary (possibly empty) installation.
    const same=(key,a,b)=>sameHistoryRow(incoming,key,a,b);
    const recycle=new Map((current.notes||[]).filter(n=>n.kind==='task-recycle').map(n=>[n.id,n]));
    const histories=new Map(),changed=new Set(),handled=new Set();
    for(const entry of incoming.notes.filter(n=>n.kind==='task-recycle')){
      const old=recycle.get(entry.id),fresh=!old||!!entry.updatedAt&&(!old.updatedAt||entry.updatedAt>old.updatedAt);
      for(const c of entry.changes){
        const key=c.key+'|'+c.id;if(!histories.has(key))histories.set(key,[]);histories.get(key).push({entry,...c});if(fresh)changed.add(key);
      }
      if(fresh)recycle.set(entry.id,entry);
    }
    for(const key of changed){
      const history=histories.get(key),{key:collection,id}=history[0],row=(next[collection]||[]).find(x=>x.id===id)||null,target=(incoming[collection]||[]).find(x=>x.id===id)||null;
      const time=n=>n.updatedAt||n.createdAt||'',latest=history.reduce((at,c)=>time(c.entry)>at?time(c.entry):at,'');
      const newerLocal=(current.notes||[]).some(n=>n.kind==='task-recycle'&&time(n)>latest&&n.changes?.some(c=>c.key===collection&&c.id===id));
      handled.add(key);
      if(newerLocal){stats.old++;continue;}
      if(same(collection,row,target)){stats.skipped++;continue;}
      if(row&&!history.some(c=>same(collection,row,c.before)||same(collection,row,c.after)))throw new Error('任务删除 / 恢复与当前数据冲突（'+collection+' / '+id+'），可选择完整备份替换；合并不会覆盖后续修改');
      next[collection]=(next[collection]||[]).filter(x=>x.id!==id);if(target)next[collection].push(target);
      if(row)stats.updated++;else if(target)stats.added++;
    }
    const deleted=new Set([...recycle.values()].filter(n=>!n.restoredAt).flatMap(n=>(n.changes||[]).filter(c=>c.after===null).map(c=>c.key+'|'+c.id)));
    for(const key of ['accounts','roles','tasks','progress','records','ledger','cash','equipment','plans','scenarios','notes','wageClaims','wageReceipts','materials','materialSales','sourceArchives','priceQuotes','energyRecipes','roiComparisons'])for(const item of incoming[key]||[]){
      if(handled.has(key+'|'+item.id))continue;
      if(deleted.has(key+'|'+item.id)&&!next[key]?.some(x=>x.id===item.id)){stats.old++;continue;}
      next[key]??=[];const existing=next[key].find(x=>x.id===item.id);
      if(!existing){next[key].push(item);stats.added++;continue;}
      if(JSON.stringify(existing)===JSON.stringify(item)){stats.skipped++;continue;}
      if(key==='materials'&&item.updatedAt&&(!existing.updatedAt||item.updatedAt>existing.updatedAt)){const fields=['itemId','server','pricingMode','priceQuoteId','unitPrice','priceDate','priceSource','priceValidForHours','updatedAt'];for(const name of fields)if(name in item)existing[name]=item[name];stats.updated++;continue;}
      // Explicitly revised measurements can round-trip through a newer backup.
      // Ordinary imported measurements and financial events remain immutable.
      if(key==='records'&&item.correctionRevision>(existing.correctionRevision||0)&&item.updatedAt&&(!existing.updatedAt||item.updatedAt>=existing.updatedAt)&&Array.isArray(item.corrections)&&item.corrections.length===item.correctionRevision){Object.assign(existing,item);stats.updated++;continue;}
      if(['records','ledger','cash','wageReceipts','materialSales','materials','sourceArchives','priceQuotes','roiComparisons'].includes(key)||!item.updatedAt||existing.updatedAt&&item.updatedAt<=existing.updatedAt){stats.old++;continue;}
      Object.assign(existing,item);stats.updated++;
    }
    // Preserve unknown top-level extension fields and explicitly keep active local configuration.
    for(const [key,value] of Object.entries(incoming))if(!(key in next))next[key]=value;
    for(const key of ['balanceSnapshots'])if(Array.isArray(incoming[key])){next[key]??=[];for(const x of incoming[key])if(!next[key].some(y=>y.id===x.id)){next[key].push(x);stats.added++;}}
    validateState(next);return {next,stats};
  }
  return {dungeonRewardDefaults,dungeonRewards,capturePlanForecasts,sameHistoryRow,validateDailyGongzhan,raidModes,raidGongzhanStatus,raidGongzhanWarnings,raidPowerBasis,roleOutputPower,raidPartyStats,partyStats,planningTask,savedPartyTask,completionRecords,executionRecords,effectiveProgress,recordedBatchIndices,pendingBatchIndices,reservedCount,availableCount,availableRoles,validatePlanCapacity,recordAccount,freezeRecord,freezeHistory,VERSION,id,dateKey,addDays,weekday,weekStart,dates,cycle,cdKey,cdRecord,canRun,selectedRecordRoles,scopedRecord,blank,demo,number,validateConfig,validateTask,withPartyRule,partyTask,validateTeamConfig,upgradeState,companionAssignments,validateParty,partyCandidates,batchTransition,batchSwitchCost,optimizeTaskBatches,splitBatches,costs,calculateRole,teamCandidates,calculateTeam,calculateBatches,pricingConfig,pricePrediction,executionPricing,planStart,confirmedForecast,levelCap,isMaxLevel,taskForVersion,eligible,getProgress,remainingRoles,plan,scheduled,routePlan,sum,recordResult,incomeRecords,summary,completion,cashSummary,budget,balance,ledgerIncome,validateState,merge,inScope};
});
