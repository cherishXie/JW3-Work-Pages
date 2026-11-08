/* One explicit asset boundary shared by web, standalone and desktop packaging. */
'use strict';
const ocrAssets=require('./ocr-assets.cjs');
const sqliteAssets={
  'vendor/sql-wasm.js':'694ca5b36aa3e6e71f417819d7df390b65343665fcfa5c69015ca33d93d291b3',
  'vendor/sql-wasm.wasm':'0734155c83e493983d1f2ff5b09a4fab6e35a32e9449c7e4e545756439f62d73',
  'vendor/sql-js-LICENSE.txt':'60a3f6e4d7b29b4321359e683b36cf198d24f58e24582070f56e6fa89d5ee2be'
};
const pinnedAssets={...ocrAssets,...sqliteAssets};
const sourceFiles=[
  'recover.html','recovery.js','update.js','manifest.webmanifest','app-icon.png','app-icon-192.png','app-icon-512.png','screenshot.js',...Object.keys(pinnedAssets),'index.html','boot.js','platform.js','styles.css',
  'themes.js','catalog.js','raid-catalog.js','model.js','operations.js','activity.js',
  'storage.js','storage-worker.js','verification.js','vendor/jszip.min.js','daily.js','execution.js','importer.js','roi.js','jx3box.js','app.js'
];
const generatedFiles=['version.js','update-manifest.json','sw.js'];
const publicFiles=[...sourceFiles,...generatedFiles];
const runtimeFiles=['storage-worker.js','recover.html','recovery.js','app-icon-192.png','app-icon-512.png','sw.js','update-manifest.json'];
module.exports={ocrAssets,pinnedAssets,sourceFiles,generatedFiles,runtimeFiles,publicFiles,publicDocuments:['README.md','CHANGELOG.md','CONTRIBUTING.md']};
