'use strict';
// Deterministic, synthetic images only. Private references use the separate private QA.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const out=path.resolve(process.env.JX3_OCR_OUTPUT||'output/ocr-matrix');
const specs=[
 {id:'standard'}, {id:'resources',resources:true}, {id:'reordered',resources:true,reordered:true},
 {id:'wide-columns',resources:true,wide:true}, {id:'large',resources:true,scale:1.8},
 {id:'small',resources:true,scale:.85}, {id:'jpeg',resources:true,jpeg:true},
 {id:'dim',resources:true,dim:true}, {id:'colored-names',resources:true,colored:true}, {id:'colored-unregistered',resources:true,colored:true,unregistered:true},
 {id:'colored-small',resources:true,colored:true,scale:.85}, {id:'colored-jpeg',resources:true,colored:true,jpeg:true},
 {id:'colored-dim',resources:true,colored:true,dim:true}, {id:'contribution',resources:true,contribution:true}
];
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,executablePath:process.env.JX3_BROWSER_PATH});
 try{
 const context=await browser.newContext(),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.JX3_OCR_URL||'http://127.0.0.1:4173/');
 await page.evaluate(()=>{const i=document.createElement('input');i.type='file';i.id='matrix-file';document.body.append(i);});
 const report={synthetic:true,cases:[],errors};
 if(process.env.JX3_OCR_BASELINE_SOURCE)await page.addScriptTag({content:fs.readFileSync(process.env.JX3_OCR_BASELINE_SOURCE,'utf8')});
 for(const spec of specs.filter(s=>!process.env.JX3_OCR_CASES||process.env.JX3_OCR_CASES.split(',').includes(s.id))){
   const fixture=await page.evaluate(async spec=>{
     const c=document.createElement('canvas');c.width=978;c.height=600;
     const x=c.getContext('2d');x.fillStyle='#303b42';x.fillRect(0,0,c.width,c.height);
     const columns=spec.resources?(spec.reordered?
       [['name',100],['school',70],['gold',220],['prestige',90],['chivalry',90],['achievement',80],['level',60],['xiaxing',80],['weeklyXiaxing',80]]:
       [['name',100],['school',70],['gold',220],['level',60],['achievement',80],['prestige',90],['chivalry',90],['xiaxing',80],['weeklyXiaxing',80]]):
       [['name',100],['school',70],['gold',220],['tongbao',90],['level',60],['achievement',80],['petCount',80],['xiaxing',80],['weeklyXiaxing',80]];
     if(spec.contribution)columns[columns.length-1][0]='contribution';
     if(spec.wide){columns[0][1]+=35;columns[2][1]-=35;}
     const titles={name:'名字',school:'门派',gold:'金钱',tongbao:'通宝',level:'等级',achievement:'资历',petCount:'宠物',prestige:'威名点',chivalry:'侠义值',xiaxing:'侠行',weeklyXiaxing:'侠行周',contribution:'江湖贡献'};
     const rows=Array.from({length:8},(_,i)=>({name:['测试星河','测试明月','测试青山','测试长风','测试流云','测试秋水','测试晴川','测试飞雪'][i],school:'天策',gold:i===0?'6036.9101':((3+i)*10000+1234+(56+i)/100+(78+i)/10000).toFixed(4),tongbao:String(i*960),level:i%2?'50':'130',achievement:String(51665-i*3101),petCount:String(1081-i*101),prestige:String(98765-i*4321),chivalry:String(8765-i*431),xiaxing:String(70000-i*3001),weeklyXiaxing:String(i*154),contribution:String(87500-i*1921)}));
     const ingot=(left,y,color)=>{x.fillStyle=color;x.beginPath();x.moveTo(left,y-4);x.quadraticCurveTo(left+6,y,left+12,y-4);x.quadraticCurveTo(left+11,y+6,left+6,y+5);x.quadraticCurveTo(left+1,y+6,left,y-4);x.fill();};
     let left=12;
     x.font='14px sans-serif';x.textBaseline='middle';
     for(const [key,width]of columns){
       x.fillStyle=spec.dim?'#a1a7ac':'#dddddd';x.textAlign='center';x.fillText(titles[key],left+width/2,124);
       for(let i=0;i<rows.length;i++){
         const y=151+i*42,row=rows[i];x.fillStyle=spec.colored&&key==='name'?['#9c7cdb','#e978a8','#cfde47','#34c7d3','#528fe1','#8caf3a','#dc6f38','#d54963'][i%8]:spec.dim?'#a1a7ac':'#dddddd';
         if(key==='gold'){
           x.textAlign='left';let at=left+8;const n=Math.round(Number(row.gold)*10000),wan=Math.floor(n/100000000),gold=Math.floor(n/10000)%10000,silver=Math.floor(n/100)%100,copper=n%100;
           for(const [v,type]of [[wan,'wan'],[gold,'gold'],[silver,'silver'],[copper,'copper']]){
             if(type==='wan'&&!wan)continue;
             x.fillStyle=spec.dim?'#a1a7ac':'#ddd';const text=String(v);x.fillText(text,at,y);at+=x.measureText(text).width+3;
             if(type==='copper'){x.fillStyle='#b39b20';x.beginPath();x.arc(at+5,y,5,0,2*Math.PI);x.fill();at+=15;}else {ingot(at,y,type==='silver'?'#c4c7bd':'#e1b320');at+=17;}
           }
         }else{x.textAlign='center';x.fillText(row[key],left+width/2,y);}
       }
       x.strokeStyle='#506569';x.lineWidth=1;x.beginPath();x.moveTo(left+.5,112);x.lineTo(left+.5,540);x.stroke();left+=width;
     }
     x.strokeStyle='#506569';x.beginPath();x.moveTo(left+.5,112);x.lineTo(left+.5,540);x.stroke();
     let result=c;
     if(spec.scale){result=document.createElement('canvas');result.width=Math.round(c.width*spec.scale);result.height=Math.round(c.height*spec.scale);result.getContext('2d').drawImage(c,0,0,result.width,result.height);}
     const url=result.toDataURL(spec.jpeg?'image/jpeg':'image/png',spec.jpeg?.65:undefined);
     return {base64:url.split(',')[1],rows:rows.map(r=>Object.fromEntries(columns.map(([k])=>[k,r[k]])))};
   },spec);
   const name=spec.id+(spec.jpeg?'.jpg':'.png'),file=path.join(out,name);
   fs.writeFileSync(file,Buffer.from(fixture.base64,'base64'));
   await page.locator('#matrix-file').setInputFiles(file);
   const result=await page.evaluate(async ({reference,unregistered})=>{
     const roles=unregistered?[]:reference.map((r,i)=>({id:'test-'+i,name:r.name,school:r.school}));
     let worker;const headers=[];try{worker=await WorkbenchScreenshot.createWorker(()=>{});const set=worker.setParameters.bind(worker),rec=worker.recognize.bind(worker);let params;worker.setParameters=async p=>{params=p;return set(p)};worker.recognize=async(...args)=>{const r=await rec(...args);if(params?.tessedit_pageseg_mode==='7'&&params.tessedit_char_whitelist?.includes('名字'))headers.push(r.data.text.trim());return r};const rows=await WorkbenchScreenshot.recognize(document.querySelector('#matrix-file').files[0],{roles,worker});return {rows,headers,namesMatched:rows.filter((r,i)=>WorkbenchScreenshot.suggestRoles(roles,r.name,r.school).roleId==='test-'+i).length,namesExact:rows.filter((r,i)=>r.name===reference[i]?.name).length};}
     catch(e){return {rows:[],headers,error:e.message};}finally{if(worker)await worker.terminate();}
   },{reference:fixture.rows,unregistered:spec.unregistered});
   const mismatches=[];let total=0,correct=0,blank=0;
   for(let i=0;i<fixture.rows.length;i++)for(const [key,expected]of Object.entries(fixture.rows[i])){
     if(['name','school'].includes(key))continue;total++;
     const actual=result.rows[i]?.[key];
     if(actual!==''&&actual!=null&&Number(actual)===Number(expected))correct++;
     else {if(actual===''||actual==null)blank++;mismatches.push({row:i+1,field:key,expected,actual:actual??null});}
   }
   const item={id:spec.id,image:name,rowCount:result.rows.length,namesMatched:result.namesMatched||0,namesExact:result.namesExact||0,unregistered:!!spec.unregistered,total,correct,blank,wrong:total-correct-blank,mismatches,error:result.error||null,headers:result.headers,expectedRows:fixture.rows,recognizedRows:result.rows};
   report.cases.push(item);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
   console.log(JSON.stringify({case:spec.id,rows:result.rows.length,namesMatched:item.namesMatched,total,correct,blank,wrong:item.wrong,error:item.error}));
 }
 assert.deepEqual(errors,[]);
 const failures=report.cases.filter(c=>c.correct!==c.total||c.rowCount!==8||(c.unregistered?c.namesExact:c.namesMatched)!==8);
 if(failures.length&&!process.env.JX3_OCR_ALLOW_FAILURES)throw Error('OCR matrix failed: '+failures.map(x=>x.id).join(', '));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
