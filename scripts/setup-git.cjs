'use strict';
if(!process.env.CI){const cp=require('node:child_process');cp.execFileSync('git',['config','core.hooksPath','.githooks']);cp.execFileSync('git',['config','push.default','simple']);console.log('Installed dev/main push guard.');}
