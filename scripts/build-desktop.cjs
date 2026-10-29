/* Package only assets that passed the public artifact checks; no private inputs. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..'),out=path.join(root,'.desktop-stage');
cp.execFileSync(process.execPath,[path.join(__dirname,'prepare-ocr.cjs')],{stdio:'inherit'});
cp.execFileSync(process.execPath,[path.join(__dirname,'build-pages.cjs')],{stdio:'inherit'});
const {publicFiles}=require('./public-assets.cjs');
fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(path.join(out,'web'),{recursive:true});
for(const file of publicFiles){const target=path.join(out,'web',file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(root,'.pages-dist',file),target);}
for(const file of ['main.cjs','preload.cjs','store.cjs','security.cjs'])fs.copyFileSync(path.join(root,'desktop',file),path.join(out,file));
fs.writeFileSync(path.join(out,'assets.json'),JSON.stringify(publicFiles));
const pkg=require('../package.json');
fs.writeFileSync(path.join(out,'package.json'),JSON.stringify({name:'jx3-workbench-desktop',version:pkg.version,description:'剑网三工作台',author:'JW3 Workbench',main:'main.cjs',private:true},null,2));
console.log('Desktop stage ready: shared business rules + platform port + isolated Electron host. No user data included.');
