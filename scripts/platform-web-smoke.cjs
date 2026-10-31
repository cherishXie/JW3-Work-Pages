'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {chromium}=require(process.env.JX3_PLAYWRIGHT_PATH||'playwright'),M=require('../model.js');
const root=path.resolve(__dirname,'..'),out=path.join(root,'output/playwright/desktop');
const base=process.argv[2]||'http://127.0.0.1:4173/',online=base.startsWith('https:'),fixture=M.demo();
(async()=>{
  const browser=await chromium.launch({...(process.env.JX3_BROWSER_PATH?{executablePath:process.env.JX3_BROWSER_PATH}:{channel:'chrome'}),headless:true});
  try{
    const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce',timezoneId:'Asia/Shanghai'}),page=await context.newPage(),errors=[],metrics=[];
    page.setDefaultTimeout(60000);page.on('pageerror',e=>{errors.push(e.message);console.error('Page error:',e.message);});
    await context.addInitScript(s=>{if(!localStorage.getItem('jx3-workbench-data-v2'))localStorage.setItem('jx3-workbench-data-v2',JSON.stringify({storeVersion:1,active:s,snapshots:[]}));},fixture);
    await page.goto(base);await page.locator('#workbench-boot').waitFor({state:'detached'});
    assert.equal(await page.evaluate(()=>WorkbenchPlatform.kind),'web');
    assert.equal(await page.locator('footer [data-storage-label]').textContent(),'数据保存在此浏览器');
    for(const theme of ['deep-ocean','cloud-blue','jade-green','warm-sand','amethyst-night']){
      await page.locator('#theme-select').selectOption(theme,{force:true});
      for(const width of [1440,1024,390]){
        await page.setViewportSize({width,height:900});
        assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
        metrics.push({theme,width,height:await page.evaluate(()=>document.documentElement.scrollHeight)});
      }
    }
    await page.setViewportSize({width:1440,height:1000});
    await page.locator('nav [data-page="roles"]').click();
    assert(await page.locator('.directory-account-list button').count()<=6);
    const selectedId=await page.locator('.directory-account-list button').first().getAttribute('data-id');
    await page.locator('.directory-account-list button').first().click();
    if(await page.locator('[aria-label="下一页账号"]').isEnabled()){
      await page.locator('[aria-label="下一页账号"]').press('Enter');
      assert.equal(await page.locator('.account-archive').getAttribute('data-account-id'),selectedId);
      await page.locator('[data-action="directory-account-current"]').click();
      assert.equal(await page.locator('.directory-account-list button.active').getAttribute('data-id'),selectedId);
    }
    const last=fixture.accounts.at(-1);await page.locator('#directory-account-search').fill(last.name);
    await page.locator('.directory-account-list [data-id="'+last.id+'"]').press('Enter');
    assert.equal(await page.locator('.account-archive').getAttribute('data-account-id'),last.id);
    await page.locator('#directory-account-search').fill('');await page.locator('.account-tree>[data-action="account-filter"]').click();
    await page.locator('nav [data-page="task"]').click();
    const storedBeforeHover=await page.evaluate(()=>WorkbenchPlatform.storage.getItem('jx3-workbench-data-v2'));
    const day=page.locator('.tc-cal-day[aria-haspopup="dialog"]').first();await day.hover();
    await page.locator('#calendar-day-preview').waitFor();
    assert.equal(await page.locator('.calendar-preview-list li').count(),Number((await day.getAttribute('aria-label')).match(/，(\d+) 项任务/)[1]));
    assert.equal(await page.locator('#calendar-task-panel').count(),0);
    await day.focus();await page.keyboard.press('ArrowDown');assert(await page.locator('.calendar-preview-list').evaluate(el=>el===document.activeElement));
    await page.keyboard.press('Escape');assert.equal(await page.locator('#calendar-day-preview').count(),0);
    const emptyDay=page.locator('.tc-cal-day:not([aria-haspopup])').first();if(await emptyDay.count()){await emptyDay.hover();assert.equal(await page.locator('#calendar-day-preview').count(),0);}
    assert.equal(await page.evaluate(()=>WorkbenchPlatform.storage.getItem('jx3-workbench-data-v2')),storedBeforeHover);
    await page.locator('nav [data-page="settings"]').click();await page.locator('[data-action="settings-tab"][data-value="data"]').click();
    const imported=structuredClone(fixture);imported.roles[0].name+='网页验证';
    await page.locator('#import-file').setInputFiles({name:'platform-test-copy.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(imported))});
    await page.locator('#f-importMode').selectOption('replace',{force:true});await page.locator('#modal-form button[type="submit"]').click();
    await page.locator('#dialog').waitFor({state:'hidden'});
    const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#app [data-action="export"]').click()]);
    const exported=JSON.parse(fs.readFileSync(await download.path(),'utf8'));assert.equal(exported.roles[0].name,imported.roles[0].name);
    await page.reload();await page.locator('#workbench-boot').waitFor({state:'detached'});
    assert.equal(await page.locator('html').getAttribute('data-theme'),'amethyst-night');
    assert.equal(await page.evaluate(()=>WorkbenchStorage.read(WorkbenchPlatform.storage).store.active.roles[0].name),imported.roles[0].name);
    assert.deepEqual(errors,[]);
    fs.mkdirSync(out,{recursive:true});await page.screenshot({path:path.join(out,online?'pages-online.png':'web-local.png')});
    fs.writeFileSync(path.join(out,online?'web-online-report.json':'web-local-report.json'),JSON.stringify({base,platform:'web',roles:fixture.roles.length,metrics,errors,importExport:true,reload:true,fixtureUnchanged:true},null,2));
    console.log('PASS '+base+' browser port, five themes/three widths, JSON import/export, theme/data persistence after reload; independent '+(online?'synthetic':'layout copy')+' data.');
    await context.close();
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
