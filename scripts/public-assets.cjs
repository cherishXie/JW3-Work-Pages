/* One explicit asset boundary shared by web, standalone and desktop packaging. */
'use strict';
const ocrAssets=require('./ocr-assets.cjs');
const publicFiles=[
  'screenshot.js',...Object.keys(ocrAssets),'index.html','boot.js','platform.js','styles.css',
  'themes.js','catalog.js','raid-catalog.js','model.js','operations.js','activity.js',
  'storage.js','verification.js','vendor/jszip.min.js','daily.js','execution.js','importer.js','roi.js','app.js'
];
module.exports={ocrAssets,publicFiles,publicDocuments:['README.md','CHANGELOG.md','CONTRIBUTING.md']};
