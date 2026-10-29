/* Reproducible local OCR dependencies. Download only pinned public runtime assets. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),https=require('node:https'),crypto=require('node:crypto');
const assets=require('./ocr-assets.cjs'),root=path.resolve(__dirname,'..');
const urls={
 'tesseract.min.js':'https://cdn.jsdelivr.net/npm/tesseract.js@6.0.1/dist/tesseract.min.js',
 'worker.min.js':'https://cdn.jsdelivr.net/npm/tesseract.js@6.0.1/dist/worker.min.js',
 'LICENSE.txt':'https://cdn.jsdelivr.net/npm/tesseract.js@6.0.1/LICENSE.md',
 'CORE-LICENSE.txt':'https://cdn.jsdelivr.net/npm/tesseract.js-core@6.0.0/LICENSE',
 'DATA-LICENSE.txt':'https://raw.githubusercontent.com/tesseract-ocr/tessdata_fast/main/LICENSE',
 'chi_sim.traineddata.gz':'https://tessdata.projectnaptha.com/4.0.0_fast/chi_sim.traineddata.gz'
};
for(const name of ['tesseract-core-lstm','tesseract-core-simd-lstm'])for(const ext of ['.wasm.js','.wasm'])urls[name+ext]='https://cdn.jsdelivr.net/npm/tesseract.js-core@6.0.0/'+name+ext;
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function get(url,redirects=0){return new Promise((resolve,reject)=>{if(redirects>4)return reject(new Error('Too many OCR asset redirects'));const req=https.get(url,res=>{if(res.statusCode>=300&&res.statusCode<400&&res.headers.location){res.resume();get(new URL(res.headers.location,url).href,redirects+1).then(resolve,reject);return;}if(res.statusCode!==200){res.resume();reject(new Error('OCR dependency HTTP '+res.statusCode));return;}const chunks=[];let size=0;res.on('data',b=>{size+=b.length;if(size>10*1024*1024){req.destroy(new Error('OCR dependency too large'));return;}chunks.push(b);});res.on('end',()=>resolve(Buffer.concat(chunks)));res.on('error',reject);});req.setTimeout(45000,()=>req.destroy(new Error('OCR dependency timeout')));req.on('error',reject);});}
(async()=>{for(const directory of ['vendor','vendor/ocr']){const target=path.join(root,directory);if(fs.existsSync(target)&&fs.lstatSync(target).isSymbolicLink())throw new Error('OCR dependency directory is a symlink');fs.mkdirSync(target,{recursive:true});}
for(const [relative,digest]of Object.entries(assets)){const file=path.join(root,relative),name=path.basename(relative);if(!urls[name])throw new Error('Unreviewed OCR asset '+relative);if(fs.existsSync(file)){if(fs.lstatSync(file).isSymbolicLink())throw new Error('OCR dependency is a symlink');if(hash(fs.readFileSync(file))===digest)continue;}
let last;for(let attempt=0;attempt<3;attempt++){try{const bytes=await get(urls[name]);if(hash(bytes)!==digest)throw new Error('OCR dependency checksum mismatch: '+name);fs.writeFileSync(file,bytes);last=null;break;}catch(e){last=e;}}if(last)throw last;console.log('Prepared pinned OCR asset: '+name);}
console.log('All OCR assets verified against SHA-256 allowlist.');})().catch(e=>{console.error(e.message);process.exitCode=1;});
