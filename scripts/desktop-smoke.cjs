/* Run the actual desktop host in an isolated user profile. No fixture is packaged. */
'use strict';
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {_electron:electron}=require(process.env.JX3_PLAYWRIGHT_PATH||'playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'output/playwright/desktop');
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'jw3-desktop-smoke-'));
const {createStore}=require('../desktop/store.cjs'),Store=require('../storage.js'),M=require('../model.js');
const state=M.demo();
fs.mkdirSync(out,{recursive:true});Store.write(createStore(profile),Store.withState(Store.empty(),state));
const metrics=[],errors=[];let app;
async function launch(){
  app=await electron.launch({...(process.env.JX3_ELECTRON_PATH?{executablePath:path.resolve(process.env.JX3_ELECTRON_PATH),args:[]}: {args:[path.join(root,'.desktop-stage')]}),
    env:{...process.env,JX3_DESKTOP_USER_DATA:profile},timeout:60000});
  const page=await app.firstWindow();page.setDefaultTimeout(20000);page.on('pageerror',e=>errors.push(e.message));
  await page.locator('#workbench-boot').waitFor({state:'detached'});
  assert.equal(await page.evaluate(()=>WorkbenchPlatform.kind),'electron');
  assert.equal(await page.evaluate(()=>typeof require),'undefined');
  return page;
}
(async()=>{
  try{
    let page=await launch();
    assert.equal(await page.locator('footer [data-storage-label]').textContent(),'数据保存在此电脑');
    const security=await app.evaluate(({BrowserWindow})=>{const p=BrowserWindow.getAllWindows()[0].webContents.getLastWebPreferences();return {sandbox:p.sandbox,contextIsolation:p.contextIsolation,nodeIntegration:p.nodeIntegration};});
    assert.deepEqual(security,{sandbox:true,contextIsolation:true,nodeIntegration:false});
    for(const theme of ['deep-ocean','cloud-blue','jade-green','warm-sand','amethyst-night']){
      await page.locator('#theme-select').selectOption(theme,{force:true});
      for(const width of [1440,1024,390]){
        await app.evaluate(({BrowserWindow},width)=>BrowserWindow.getAllWindows()[0].setContentSize(width,900),width);
        await page.waitForTimeout(100);
        metrics.push({theme,width,height:await page.evaluate(()=>document.documentElement.scrollHeight)});
        assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
      }
    }
    await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].setContentSize(1440,1000));
    // Hash navigation must not revoke the main-frame storage capability.
    await page.locator('nav [data-page="task"]').click();
    const loaded=await page.evaluate(()=>WorkbenchStorage.read(WorkbenchPlatform.storage).store.active);
    assert.equal(loaded.roles.length,state.roles.length);
    await page.screenshot({path:path.join(out,'tasks.png')});
    const checks=await page.evaluate(async()=>{
      let rejected=false;try{workbenchDesktop.storage.getItem('arbitrary-file');}catch{rejected=true;}
      const privateStatus=(await fetch('workbench://app/data/JX3_Workbench_2026-10-30.json')).status;
      let networkBlocked=false;try{await fetch('https://example.com');}catch{networkBlocked=true;}
      return {rejected,privateStatus,networkBlocked};
    });
    assert.deepEqual(checks,{rejected:true,privateStatus:404,networkBlocked:true});
    const ocr=await page.evaluate(async()=>{
      const worker=await WorkbenchScreenshot.createWorker(()=>{});
      try{const canvas=document.createElement('canvas');canvas.width=320;canvas.height=100;const c=canvas.getContext('2d');c.fillStyle='white';c.fillRect(0,0,320,100);c.fillStyle='black';c.font='42px sans-serif';c.fillText('123456',12,64);return (await worker.recognize(canvas)).data.text;}finally{await worker.terminate();}
    });assert.match(ocr,/123456/);
    const screenshots=[];
    const imported=structuredClone(state);imported.roles[0].name+='桌面验证';
    const importCopy=path.join(profile,'import-copy.json');fs.writeFileSync(importCopy,JSON.stringify(imported));
    await page.locator('nav [data-page="settings"]').click();
    await page.locator('[data-action="settings-tab"][data-value="data"]').click();
    await page.locator('#import-file').setInputFiles(importCopy);
    await page.locator('#f-importMode').selectOption('replace',{force:true});
    await page.locator('#modal-form button[type="submit"]').click();
    await page.locator('#dialog').waitFor({state:'hidden'});
    assert.equal(await page.evaluate(()=>WorkbenchStorage.read(WorkbenchPlatform.storage).store.active.roles[0].name),imported.roles[0].name);
    await app.close();app=null;
    assert.equal(createStore(profile).getItem('jx3-workbench-theme-v1'),'amethyst-night');
    page=await launch();assert.equal(await page.locator('html').getAttribute('data-theme'),'amethyst-night');
    assert.equal(await page.evaluate(()=>WorkbenchStorage.read(WorkbenchPlatform.storage).store.active.roles.length),state.roles.length);
    assert.equal(await page.evaluate(()=>WorkbenchStorage.read(WorkbenchPlatform.storage).store.active.roles[0].name),imported.roles[0].name);
    await page.reload();await page.locator('#workbench-boot').waitFor({state:'detached'});
    assert.equal(await page.evaluate(()=>WorkbenchStorage.read(WorkbenchPlatform.storage).store.active.roles.length),state.roles.length);
    assert.deepEqual(errors,[]);
    fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({security,checks,metrics,ocr,screenshots,errors,restart:true,reload:true,syntheticFixture:true},null,2));
    console.log('PASS Electron packaged host: five themes/three widths, hash navigation, restart/reload persistence, isolated bridge, denied network/private files, offline OCR with synthetic fixtures.');
  }finally{if(app)await app.close();fs.rmSync(profile,{recursive:true,force:true});}
})().catch(error=>{console.error(error);process.exitCode=1;});
