/* Browser regression; private fixture is opt-in and never copied into public assets. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {chromium}=require('playwright'),M=require('../model');
const base=process.argv[2]||'http://127.0.0.1:4173/',privateQA=process.env.JX3_PRIVATE_QA==='1';
const fixture=privateQA?path.resolve(__dirname,'../data/JX3_Workbench_2026-10-30.json'):null;
const bytes=fixture?fs.readFileSync(fixture):null,raw=bytes?JSON.parse(bytes):null,seed=raw?(raw.active||raw):M.demo();
const out=path.resolve(__dirname,'../output/playwright/roster-combat');fs.mkdirSync(out,{recursive:true});
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
async function navigate(page,id){const menu=page.locator('#topbar [data-action="menu"]');if(await menu.isVisible())await menu.click();await page.locator('nav [data-page="'+id+'"]').click();}
(async()=>{const browser=await chromium.launch({headless:true,...(process.env.JX3_CHROMIUM_PATH?{executablePath:process.env.JX3_CHROMIUM_PATH}:{})});try{
  const errors=[],context=await browser.newContext({viewport:{width:1440,height:1000},timezoneId:'Asia/Shanghai',reducedMotion:'reduce'});
  await context.addInitScript(s=>{if(!localStorage.getItem('jx3-workbench-data-v2'))localStorage.setItem('jx3-workbench-data-v2',JSON.stringify({storeVersion:1,active:s,snapshots:[]}));},seed);
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(base);await page.locator('#workbench-boot').waitFor({state:'detached'});await navigate(page,'roles');assert.equal(await page.locator('.roster-analysis').count(),0);await navigate(page,'roster');await page.locator('.combat-grid').waitFor();assert.equal(await page.locator('.account-archive').count(),0);
  const metrics=[];
  for(const theme of ['deep-ocean','cloud-blue','jade-green','warm-sand','amethyst-night']){await page.evaluate(theme=>WorkbenchThemes.apply(theme),theme);for(const width of [1440,1024,390]){
    await page.setViewportSize({width,height:1000});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),theme+' '+width);
    const analysisHeight=await page.evaluate(()=>document.documentElement.scrollHeight);await navigate(page,'roles');assert.equal(await page.locator('.roster-analysis').count(),0);const listHeight=await page.evaluate(()=>document.documentElement.scrollHeight);await navigate(page,'roster');metrics.push({theme,width,analysisHeight,listHeight});
    await page.screenshot({path:path.join(out,`${privateQA?'private':'synthetic'}-${theme}-${width}.png`),fullPage:true});
  }}
  await page.setViewportSize({width:1440,height:1000});await page.locator('.combat-rank-row').first().click();
  const selected=await page.locator('.combat-rank-row.active').getAttribute('data-id');
  await page.locator('.combat-panel-heading [data-action="edit-role"]').click();await page.locator('[name="referenceDps"]').fill('200000');await page.locator('[name="referenceDpsContext"]').fill('测试木桩 / 180 秒 / 无增益');
  const details=page.locator('details').filter({has:page.locator('[name="combat_attack"]')});await details.locator('summary').click();await page.locator('[name="combat_attack"]').fill('100000');await page.locator('[name="combat_critical"]').fill('32.5');await page.locator('#dialog button[type="submit"]').click();await page.locator('#dialog').waitFor({state:'hidden'});
  assert.match(await page.locator('.combat-attributes').innerText(),/32.50%/);
  const read=()=>page.evaluate(()=>WorkbenchStorage.read(WorkbenchPlatform.storage).store.active);
  assert.equal((await read()).roles.find(r=>r.id===selected).combatStats.attack,100000);
  const scenario=page.locator('[data-action="combat-context"]').filter({hasText:'测试木桩'});await scenario.click();
  const previous=await page.locator('.combat-simulations').innerText(),target=Number(await page.locator('#combat-target-score').inputValue());
  await page.locator('#combat-target-score').fill(String(target*2));const next=await page.locator('.combat-simulations').innerText();assert.notEqual(next,previous);
  const rankQuery=page.locator('#combat-rank-query');await rankQuery.fill('没有匹配的角色');assert.equal(await page.locator('.combat-rank-row').count(),0);await rankQuery.fill('');
  await page.reload();await page.locator('.combat-grid').waitFor();assert.match(await page.locator('.combat-attributes').innerText(),/32.50%/);
  await context.close();
  // A large roster exercises bounded lists, search, pagination, focus and local scope.
  const stress=M.demo();stress.accounts=Array.from({length:90},(_,i)=>({...stress.accounts[0],id:'stress-a'+i,name:'测试账号 '+i}));
  const template={...stress.roles[0]};stress.roles=Array.from({length:270},(_,i)=>({...template,id:'stress-r'+i,accountId:stress.accounts[i%90].id,name:'测试角色 '+String(i).padStart(3,'0'),score:100000+i*100,enabled:i%3!==0,referenceDpsContext:'场景 '+(i%12)}));stress.tasks=[];stress.records=[];stress.progress=[];stress.plans=[];
  const c=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});await c.addInitScript(s=>localStorage.setItem('jx3-workbench-data-v2',JSON.stringify({storeVersion:1,active:s,snapshots:[]})),stress);
  const p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));await p.goto(base);await p.locator('#workbench-boot').waitFor({state:'detached'});await navigate(p,'roster');
  assert.equal(await p.locator('.combat-rank-row').count(),6);await p.locator('[data-action="combat-rank-page"]').last().click();assert.equal(await p.locator('.combat-rank-row').count(),6);
  await p.locator('.combat-rank-row').first().focus();await p.keyboard.press('Enter');const chosen=await p.locator('.combat-rank-row.active').getAttribute('data-id');assert(chosen);assert.equal(await p.locator('.combat-rank-row.active').evaluate(el=>el===document.activeElement),true);
  await p.locator('[data-action="combat-rank-page"]').first().click();await p.locator('[data-action="combat-rank-page"]').last().click();assert.equal(await p.locator('.combat-rank-row.active').getAttribute('data-id'),chosen);
  await p.locator('#combat-rank-query').fill('测试角色 000');assert.equal(await p.locator('.combat-rank-row').count(),1);assert.match(await p.locator('.combat-rank-row').innerText(),/已停用/);
  await p.locator('#directory-search').fill('测试角色 000');assert.match(await p.locator('.combat-summary').innerText(),/1 \/ 1/);
  await p.screenshot({path:path.join(out,'large-roster-filter.png'),fullPage:true});await c.close();
  if(fixture)assert.equal(hash(fs.readFileSync(fixture)),hash(bytes));assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'metrics.json'),JSON.stringify(metrics,null,2));
  console.log('PASS roster combat: separate overview/list routes, 5 themes x 3 widths, attributes save/reload, scenario simulation, 270-role search/paging/selection/focus/disabled archive; original fixture unchanged');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
