/* One explicit asset boundary shared by web, standalone and desktop packaging. */
'use strict';
const ocrAssets=require('./ocr-assets.cjs');
const sourceFiles=[
  'update.js','manifest.webmanifest','app-icon.png','app-icon-192.png','app-icon-512.png','screenshot.js',...Object.keys(ocrAssets),'index.html','boot.js','platform.js','styles.css',
  'themes.js','catalog.js','raid-catalog.js','model.js','operations.js','activity.js',
  'storage.js','verification.js','vendor/jszip.min.js','daily.js','execution.js','importer.js','roi.js','app.js'
];
const generatedFiles=['version.js','update-manifest.json','sw.js'];
const publicFiles=[...sourceFiles,...generatedFiles];
const runtimeFiles=['app-icon-192.png','app-icon-512.png','sw.js','update-manifest.json'];
module.exports={ocrAssets,sourceFiles,generatedFiles,runtimeFiles,publicFiles,publicDocuments:['README.md','CHANGELOG.md','CONTRIBUTING.md']};
