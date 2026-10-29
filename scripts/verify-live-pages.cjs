'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {walk}=require('./pages-channels.cjs');
const base='https://cherishxie.github.io/JW3-Work-Pages/',root=path.resolve(__dirname,'../.pages-site');
(async()=>{for(const file of walk(root).filter(f=>!f.endsWith('.nojekyll'))){
 const response=await fetch(base+file+'?verify='+process.env.GITHUB_SHA);assert(response.ok(),file+' HTTP '+response.status);
 assert(Buffer.from(await response.arrayBuffer()).equals(fs.readFileSync(path.join(root,file))),file+' differs from deployment snapshot');
 }console.log('PASS live Pages: both channel snapshots match every published byte.');})().catch(e=>{console.error(e);process.exitCode=1;});
