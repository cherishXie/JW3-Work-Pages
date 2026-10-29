const fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
let html=fs.readFileSync(path.join(root,'index.html'),'utf8');
html=html.replace(/<link rel="stylesheet" href="styles\.css(?:\?[^\"]*)?">/,()=>'<style>\n'+fs.readFileSync(path.join(root,'styles.css'),'utf8')+'\n</style>');
for(const name of ['boot.js','platform.js','themes.js','catalog.js','raid-catalog.js','model.js','operations.js','activity.js','storage.js','verification.js','vendor/jszip.min.js','daily.js','execution.js','importer.js','roi.js','vendor/ocr/tesseract.min.js','screenshot.js','app.js'])html=html.replace(new RegExp(`<script[^>]* src="${name.replaceAll(".", "\\.").replaceAll("/", "\/")}(?:\\?[^"]*)?"><\\/script>`),()=>'<script>\n'+fs.readFileSync(path.join(root,name),'utf8').replace(/<\/script/gi,'<\\/script')+'\n</script>');
const ocrAssets=require('./ocr-assets.cjs'),crypto=require('node:crypto');
const bundle={};for(const [file,digest]of Object.entries(ocrAssets)){const bytes=fs.readFileSync(path.join(root,file));if(crypto.createHash('sha256').update(bytes).digest('hex')!==digest)throw new Error('OCR checksum mismatch: '+file);if(!file.endsWith('.txt'))bundle[path.basename(file)]=bytes.toString('base64');}
const licenses=Object.fromEntries(Object.keys(ocrAssets).filter(file=>file.endsWith('.txt')).map(file=>[path.basename(file),fs.readFileSync(path.join(root,file),'utf8')]));
html=html.replace('</body>',()=>'<script type="application/json" id="offline-ocr-licenses">'+JSON.stringify(licenses).replace(/<\/script/gi,'<\\/script')+'</script>\n</body>');
html=html.replace('<script>\n/* Local-only OCR',()=>'<script>globalThis.WorkbenchOcrBundle='+JSON.stringify(bundle)+';<\/script>\n<script>\n/* Local-only OCR');
fs.writeFileSync(path.join(root,'JX3_Workbench.html'),html);
console.log('Built JX3_Workbench.html · self-contained, no external assets');
