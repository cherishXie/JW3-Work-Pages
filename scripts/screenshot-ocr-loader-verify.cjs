'use strict';
// Browser-independent regression for GitHub Pages subpath + Tesseract worker loading failures.
const assert=require('node:assert/strict');
const S=require('../screenshot');
const old={document:global.document,location:global.location,createImageBitmap:global.createImageBitmap,Tesseract:global.Tesseract};
let closed=0,terminated=0;
global.location={protocol:'https:'};
global.document={
  baseURI:'https://example.test/JW3-Work-Pages/',
  createElement:()=>({width:0,height:0,getContext:()=>({
    drawImage(){},fillRect(){},getImageData:()=>({data:new Uint8ClampedArray(4)}),putImageData(){}
  })})
};
global.createImageBitmap=async()=>({width:80,height:80,close(){closed++;}});
const tsv='level\tpage_num\tblock_num\tpar_num\tline_num\tword_num\tleft\ttop\twidth\theight\tconf\ttext\n5\t0\t0\t0\t0\t0\t10\t10\t10\t10\t98\t130';
const worker={setParameters:async()=>{},recognize:async()=>({data:{tsv}}),terminate:async()=>{terminated++;}};
const file={type:'image/png',size:512};
(async()=>{
  const attempts=[],progress=[],details=[];
  global.Tesseract={createWorker:async(lang,oem,opts)=>{
    assert.equal(lang,'chi_sim');assert.equal(oem,1);
    assert.equal(opts.workerBlobURL,false);
    assert.equal(opts.workerPath,'https://example.test/JW3-Work-Pages/vendor/ocr/worker.min.js');
    assert.equal(opts.langPath,'https://example.test/JW3-Work-Pages/vendor/ocr');
    opts.logger({status:'loading language traineddata',progress:.42});
    attempts.push(opts.corePath);
    if(attempts.length===1)throw undefined; // Tesseract.js 6 rejects with no message on Worker errors
    return worker;
  }};
  const rows=await S.recognize(file,{progress:(p,detail)=>{progress.push(p);if(detail)details.push(detail);}});
  assert.equal(rows.length,1);
  assert.equal(attempts[0],'https://example.test/JW3-Work-Pages/vendor/ocr/');
  assert.equal(attempts[1],'https://example.test/JW3-Work-Pages/vendor/ocr/tesseract-core-lstm.wasm.js');
  assert.ok(progress.some(p=>p.includes('兼容模式')));
  assert.ok(progress.some(p=>p.includes('准备中文识别模型')));
  assert.equal(details[0].progress,.42);assert.equal(details[0].stage,'loading language traineddata');
  assert.equal(terminated,1);assert.equal(closed,1);
  global.Tesseract={createWorker:async()=>{throw undefined;}};
  await assert.rejects(S.recognize(file),e=>e instanceof Error&&e.message.includes('浏览器未提供详细错误')&&e.message.includes('tesseract-core-simd-lstm.wasm.js')&&e.message.includes('/JW3-Work-Pages/'));
  assert.equal(closed,2);
  console.log('PASS screenshot OCR loader: Pages path, SIMD fallback, meaningful missing worker errors, clean termination');
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>{
  for(const [key,value] of Object.entries(old))if(value===undefined)delete global[key];else global[key]=value;
});
