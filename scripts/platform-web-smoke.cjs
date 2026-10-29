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
