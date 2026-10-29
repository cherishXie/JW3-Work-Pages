'use strict';
/* Synthetic-only browser test for the publicly deployed multi-image import UI. */
const assert=require('node:assert/strict');
const {chromium}=require('playwright'),M=require('../model');
(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:process.env.JX3_BROWSER_PATH,args:['--no-sandbox']});
  let page;
  try{
    const context=await browser.newContext({viewport:{width:1440,height:1000},timezoneId:'Asia/Shanghai'});
    const fixture=M.demo();fixture.roles[0].name='测试甲@档案';fixture.roles[1].name='测试乙';
    await context.addInitScript(f=>{
      if(!localStorage.getItem('jx3-workbench-data-v2'))localStorage.setItem('jx3-workbench-v1',JSON.stringify(f));
    },fixture);
    page=await context.newPage();const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(process.env.JX3_QA_URL||(process.env.JX3_LIVE_URL||'https://cherishxie.github.io/JW3-Work-Pages/dev/'),{waitUntil:'load',timeout:45000});
    const identityChecks=await page.evaluate(()=>{
      const S=WorkbenchScreenshot,roles=[{id:'live',name:'测试霄',school:'纯阳'},{id:'plan',name:'测试阳',school:'纯阳',creationStatus:'planned'}],short=[{id:'short',name:'测试',school:'藏剑',observedGold:12345.6789}];
      return [S.suggestRoles(roles,'测试填','纯阳').roleId,S.suggestRoles(short,'测式','藏剑').roleId,S.suggestRoles(short,'测式','藏剑',{gold:'12345.6789'}).roleId,S.suggestRoles(short,'测式','藏剑',{gold:'999.1234'}).roleId];
    });
    assert.deepEqual(identityChecks,['live','','short','']);
    await page.locator('nav').getByRole('button',{name:'账号与角色',exact:true}).click();
    await page.getByRole('button',{name:'上传角色截图',exact:true}).click();
    const fileInput=page.locator('#screenshot-file');
    assert.ok(await fileInput.evaluate(el=>el.multiple));
    await page.evaluate(()=>{
      WorkbenchScreenshot.createWorker=async()=>({terminate:async()=>{}});
      WorkbenchScreenshot.recognize=async file=>file.name==='one.png'?[
        {name:'测试甲@档案',school:'霸刀',gold:'100.0000',level:'130',achievement:''}
      ]:[
        {name:'测试甲@档案',school:'霸刀',gold:'200.0000',level:'130',achievement:'54321'}
      ];
    });
    const one={name:'one.png',mimeType:'image/png',buffer:Buffer.from('image-1-test-fixture')};
    const two={name:'two.png',mimeType:'image/png',buffer:Buffer.from('image-2-test-fixture')};
    await fileInput.setInputFiles(one);
    assert.equal(await page.locator('.screenshot-file-item').count(),1);
    await fileInput.setInputFiles(two);
    assert.equal(await page.locator('.screenshot-file-item').count(),2);
    await fileInput.setInputFiles({name:'remove.png',mimeType:'image/png',buffer:Buffer.from('to-be-removed')});
    assert.equal(await page.locator('.screenshot-file-item').count(),3);
    await page.locator('.screenshot-file-item').last().getByRole('button',{name:'删除'}).click();
    assert.equal(await page.locator('.screenshot-file-item').count(),2);
    assert.match(await page.locator('#screenshot-queue').textContent(),/one.png/);
    assert.match(await page.locator('#screenshot-queue').textContent(),/two.png/);
    await page.getByRole('button',{name:'开始本地识别',exact:true}).click();
    await page.getByRole('heading',{name:'核对截图识别结果',exact:true}).waitFor({timeout:30000}).catch(async e=>{console.error('OCR dialog state:',await page.locator('#dialog').textContent().then(v=>v.slice(0,2000)).catch(()=>''));console.error('Queue:',await page.locator('#screenshot-queue').textContent().catch(()=>''));console.error('Current status:',await page.locator('#screenshot-status').textContent().catch(()=>''));console.error('Page errors:',errors);throw e;});
    assert.equal(await page.locator('[name^="shot-pick-"]').count(),1);
    assert.equal(await page.locator('[name="shot-0-achievement"]').inputValue(),'54321');
    assert.equal(await page.locator('[name="shot-0-gold"]').inputValue(),'100.0000');
    assert.equal(await page.locator('[name="shot-role-0"]').inputValue(),fixture.roles[0].id);
    assert.match(await page.locator('#dialog').textContent(),/合并重复/);
    assert.match(await page.locator('#dialog').textContent(),/one\.png/);
    assert.match(await page.locator('#dialog').textContent(),/two\.png/);
    const initial=await page.evaluate(()=>JSON.parse(localStorage.getItem('jx3-workbench-data-v2')).active.roles[0].achievement);
    await page.locator('[name="shot-pick-0"]').check();
    await page.getByRole('button',{name:'确认更新勾选角色',exact:true}).click();
    await page.getByText('存在截图数据冲突',{exact:false}).waitFor();
    const beforeReview=await page.evaluate(()=>JSON.parse(localStorage.getItem('jx3-workbench-data-v2')).active.roles[0].achievement);
    assert.equal(beforeReview,initial); // no mutation before review
    await page.locator('[name="shot-0-gold"]').fill('200.0000');
    await page.locator('[name="shot-confirm-0"]').check();
    await page.getByRole('button',{name:'确认更新勾选角色',exact:true}).click();
    await page.locator('#dialog').waitFor({state:'hidden'});
    const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('jx3-workbench-data-v2')).active);
    assert.equal(saved.roles[0].achievement,54321);
    assert.equal(saved.roles[0].observedGold,200);
    assert.equal(saved.roles[1].achievement,fixture.roles[1].achievement);
    assert.equal(saved.sourceArchives.at(-1).files.length,2);
    assert.equal(saved.sourceArchives.at(-1).counts.duplicates,1);
    assert.equal(saved.sourceArchives.at(-1).format,'mingyi-role-screenshot-batch-v1');
    await page.getByRole('button',{name:'撤销',exact:true}).click();
    const undone=await page.evaluate(()=>JSON.parse(localStorage.getItem('jx3-workbench-data-v2')).active);
    assert.equal(undone.roles[0].achievement,fixture.roles[0].achievement);
    // Previously imported image must still reach OCR preview and require explicit review.
    const correctionContext=await browser.newContext({viewport:{width:1440,height:1000},timezoneId:'Asia/Shanghai'});
    await correctionContext.addInitScript(f=>{
      if(!localStorage.getItem('jx3-workbench-data-v2'))localStorage.setItem('jx3-workbench-v1',JSON.stringify(f));
    },saved);
    const correction=await correctionContext.newPage();
    await correction.goto(process.env.JX3_QA_URL||(process.env.JX3_LIVE_URL||'https://cherishxie.github.io/JW3-Work-Pages/dev/'),{waitUntil:'load'});
    await correction.locator('nav').getByRole('button',{name:'账号与角色',exact:true}).click();
    await correction.getByRole('button',{name:'上传角色截图',exact:true}).click();
    await correction.evaluate(()=>{
      WorkbenchScreenshot.createWorker=async()=>({terminate:async()=>{}});
      WorkbenchScreenshot.recognize=async()=>[{name:'测试甲@档案',school:'霸刀',gold:'555.0000',level:'130',achievement:'54321'}];
    });
    await correction.locator('#screenshot-file').setInputFiles(one);
    await correction.getByRole('button',{name:'开始本地识别',exact:true}).click();
    await correction.getByRole('heading',{name:'核对截图识别结果',exact:true}).waitFor({timeout:30000});
    assert.match(await correction.locator('#dialog').textContent(),/历史导入过的截图/);
    await correction.locator('[name="shot-pick-0"]').check();
    await correction.getByRole('button',{name:'确认更新勾选角色',exact:true}).click();
    await correction.getByText('包含已导入截图',{exact:false}).waitFor();
    const unchanged=await correction.evaluate(()=>JSON.parse(localStorage.getItem('jx3-workbench-data-v2')).active);
    assert.equal(unchanged.roles[0].observedGold,200);
    await correction.locator('[name="shot-allow-reimport"]').check();
    await correction.getByRole('button',{name:'确认更新勾选角色',exact:true}).click();
    await correction.locator('#dialog').waitFor({state:'hidden'});
    const reviewed=await correction.evaluate(()=>JSON.parse(localStorage.getItem('jx3-workbench-data-v2')).active);
    assert.equal(reviewed.roles[0].observedGold,555);
    assert.equal(reviewed.sourceArchives.at(-1).format,'mingyi-role-screenshot-review-v1');
    assert.equal(reviewed.sourceArchives.length,saved.sourceArchives.length+1);
    await correction.getByRole('button',{name:'撤销',exact:true}).click();
    const restored=await correction.evaluate(()=>JSON.parse(localStorage.getItem('jx3-workbench-data-v2')).active);
    assert.equal(restored.roles[0].observedGold,200);
    assert.equal(restored.sourceArchives.length,saved.sourceArchives.length);
    await correctionContext.close();
    // Loading remains visible between worker events; percentages refer to the current real stage.
    await page.getByRole('button',{name:'上传角色截图',exact:true}).click();
    await page.evaluate(()=>{
      WorkbenchScreenshot.createWorker=async progress=>{
        window.feedbackProgress=progress;
        progress('下载中文识别模型',{stage:'loading language traineddata',progress:.36});
        await new Promise(resolve=>{window.finishFeedbackLoad=resolve;});
        return {terminate:async()=>{}};
      };
      WorkbenchScreenshot.recognize=async(file,{progress})=>{
        progress('正在识别角色名称…');
        await new Promise(resolve=>{window.finishFeedbackRecognition=resolve;});
        return [{name:'测试甲@档案',school:'霸刀',gold:'100',level:'130'},
          {name:'完全未知角色',school:'七秀',gold:'200',level:'130'}];
      };
    });
    await page.locator('#screenshot-file').setInputFiles(one);
    await page.getByRole('button',{name:'开始本地识别',exact:true}).click();
    await page.locator('#screenshot-progress-label').filter({hasText:'下载中文识别模型'}).waitFor();
    assert.match(await page.locator('#screenshot-progress-label').textContent(),/加载识别引擎.*当前阶段 36%/);
    assert.equal(await page.locator('#screenshot-progress-bar').getAttribute('value'),'36');
    assert.ok(await page.locator('#screenshot-file').isDisabled());
    await page.waitForFunction(()=>Number(document.querySelector('#screenshot-elapsed').textContent.match(/\d+/)[0])>=1);
    await page.evaluate(()=>window.feedbackProgress('初始化中文识别引擎',{progress:0}));
    assert.equal(await page.locator('#screenshot-progress-bar').getAttribute('value'),'0');
    await page.evaluate(()=>window.finishFeedbackLoad());
    await page.getByText('第 1 / 1 张：正在识别角色名称…',{exact:true}).waitFor();
    assert.equal(await page.locator('#screenshot-progress-bar').getAttribute('value'),null);
    await page.evaluate(()=>window.finishFeedbackRecognition());
    await page.getByRole('heading',{name:'核对截图识别结果',exact:true}).waitFor();
    const unresolved=page.locator('[data-shot-row="1"]');
    assert.ok(await unresolved.evaluate(el=>el.classList.contains('screenshot-unmatched')));
    assert.ok(await unresolved.getByText('待匹配角色',{exact:true}).isVisible());
    assert.match(await page.locator('#screenshot-match-summary').textContent(),/有 1 行待匹配/);
    if(process.env.JX3_FEEDBACK_SCREENSHOT){await page.screenshot({path:process.env.JX3_FEEDBACK_SCREENSHOT,fullPage:true});}
    await page.locator('[name="shot-1-name"]').fill('测试乙');
    assert.equal(await page.locator('[name="shot-role-1"]').inputValue(),fixture.roles[1].id);
    assert.ok(!await unresolved.evaluate(el=>el.classList.contains('screenshot-unmatched')));
    await page.locator('[name="shot-1-name"]').fill('完全未知角色');
    assert.ok(await unresolved.evaluate(el=>el.classList.contains('screenshot-unmatched')));
    await page.locator('[name="shot-role-1"]').selectOption(fixture.roles[1].id);
    assert.ok(!await unresolved.evaluate(el=>el.classList.contains('screenshot-unmatched')));
    assert.match(await page.locator('#screenshot-match-summary').textContent(),/所有角色均已匹配/);
    await page.locator('[name="shot-1-name"]').fill('手工选择保留');
    assert.equal(await page.locator('[name="shot-role-1"]').inputValue(),fixture.roles[1].id);
    assert.match(await page.locator('#shot-match-hint-1').textContent(),/已手动匹配/);
    await page.locator('[name="shot-role-1"]').selectOption('');
    assert.ok(await unresolved.evaluate(el=>el.classList.contains('screenshot-unmatched')));
    // Failed initialization clears the busy state and allows retry.
    await page.evaluate(()=>document.querySelector('#dialog').close());
    await page.getByRole('button',{name:'上传角色截图',exact:true}).click();
    await page.evaluate(()=>{WorkbenchScreenshot.createWorker=async()=>{throw new Error('模拟加载失败');};});
    await page.locator('#screenshot-file').setInputFiles(one);
    await page.getByRole('button',{name:'开始本地识别',exact:true}).click();
    await page.locator('#screenshot-status').filter({hasText:'模拟加载失败'}).waitFor();
    assert.ok(await page.locator('#screenshot-progress').isHidden());
    assert.ok(await page.getByRole('button',{name:'开始本地识别',exact:true}).isEnabled());
    assert.ok(await page.locator('#screenshot-file').isEnabled());
    console.log('PASS OCR feedback: actual stage progress, elapsed time, indeterminate recognition, unmatched highlight, manual/automatic updates and failure recovery');
    assert.deepEqual(errors,[]);
    console.log('PASS live multi-image OCR UI: multi-select, merge, conflicts, isolated commit, provenance and undo');
  }catch(error){
    if(page){console.error('Final OCR dialog:',await page.locator('#dialog').textContent().catch(()=>''));console.error('Final status:',await page.locator('#toast').textContent().catch(()=>''));}
    throw error;
  }finally{await browser.close();}
})().catch(e=>{console.error('LIVE BATCH SCREENSHOT FAILED:',e);process.exitCode=1;});
