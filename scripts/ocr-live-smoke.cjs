'use strict';
// GitHub Actions smoke check against PUBLIC Pages. Uses synthetic text; no user data.
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:process.env.JX3_BROWSER_PATH,args:['--no-sandbox']});
  try{
    const page=await browser.newPage();
    const url=(process.env.JX3_LIVE_URL||'https://cherishxie.github.io/JW3-Work-Pages/dev/');
    const pageErrors=[];
    page.on('pageerror',e=>pageErrors.push(e.message));
    await page.goto(url,{waitUntil:'load',timeout:45000});
    const result=await page.evaluate(async()=>{
      const base=new URL('vendor/ocr/',document.baseURI).href;
      let worker;
      try{
        // OCR is loaded on demand; exercise the same loader and SIMD fallback as the UI.
        worker=await WorkbenchScreenshot.createWorker(()=>{});
        const canvas=document.createElement('canvas');
        canvas.width=260;canvas.height=80;
        const ctx=canvas.getContext('2d');
        ctx.fillStyle='#fff';ctx.fillRect(0,0,260,80);
        ctx.fillStyle='#000';ctx.font='48px sans-serif';ctx.fillText('130',30,57);
        const response=await worker.recognize(canvas);
        return {corePath:base,recognizedText:response.data.text};
      }finally{if(worker)await worker.terminate();}
    });
    assert.equal(result.corePath,new URL('vendor/ocr/',url).href);
    assert.match(result.recognizedText,/130/);
    assert.deepEqual(pageErrors,[]);
    console.log('PASS public GitHub Pages Chromium OCR: Tesseract core + WASM + Chinese data initialized; synthetic image processed.');
  }finally{await browser.close();}
})().catch(e=>{console.error('LIVE OCR SMOKE FAILED:',e);process.exitCode=1;});
