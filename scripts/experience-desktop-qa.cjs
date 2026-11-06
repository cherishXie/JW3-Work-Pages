/* Explicit desktop regression: ephemeral profile, no personal data. */
'use strict';
const {_electron}=require('playwright'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),profile=fs.mkdtempSync(path.join(os.tmpdir(),'jw3-experience-qa-'));
(async()=>{let app;try{
  app=await _electron.launch({args:[path.join(root,'.desktop-stage')],env:{...process.env,JX3_DESKTOP_USER_DATA:profile}});
  const page=await app.firstWindow(),errors=[];page.setDefaultTimeout(60000);page.on('pageerror',e=>errors.push(e.message));
  const key='jx3-workbench-experience-v1',personal='jx3-workbench-data-v2';
  await page.locator('[data-action="experience-start"]').waitFor();
  const original=await page.evaluate(key=>WorkbenchPlatform.storage.getItem(key),personal);
  const enter=async()=>{await page.locator('[data-action="experience-start"]').click({noWaitAfter:true});await page.locator('.experience-banner').waitFor();assert.equal(await page.evaluate(()=>WorkbenchPlatform.kind),'electron');};
  const exited=async()=>{await page.locator('[data-action="experience-start"]').waitFor();assert.equal(await page.evaluate(key=>WorkbenchPlatform.storage.getItem(key),key),null);assert.equal(await page.evaluate(key=>WorkbenchPlatform.storage.getItem(key),personal),original);assert.equal(await page.locator('[data-action="undo"]').count(),0);};
  await enter();await page.locator('#sidebar [data-action="setup"]').click();
  await page.getByRole('button',{name:'退出体验模式',exact:true}).click({noWaitAfter:true});await exited();
  await enter();if(await page.locator('#update-dismiss').isVisible())await page.locator('#update-dismiss').click();await page.locator('.experience-banner').click({noWaitAfter:true});await exited();
  const blocked=await app.evaluate(async({BrowserWindow})=>{const w=BrowserWindow.getAllWindows()[0];let prevented=false;const event={preventDefault(){prevented=true;}};w.webContents.emit('will-navigate',event,'https://example.invalid/');return prevented;});assert(blocked);assert.deepEqual(errors,[]);
  console.log('PASS Electron experience: enter, guidance exit, reentry, banner exit, personal storage unchanged, undo cleared, external navigation blocked');
}finally{if(app)await app.close();fs.rmSync(profile,{recursive:true,force:true});}})().catch(e=>{console.error(e);process.exitCode=1;});
