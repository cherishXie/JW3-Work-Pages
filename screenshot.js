/* Local-only OCR for the Mingyi character statistics table. No screenshot leaves the browser. */
(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.WorkbenchScreenshot=api;})(typeof globalThis==='object'?globalThis:this,()=>{
  'use strict';
  const fields=['name','school','gold','tongbao','level','achievement','petCount','xiaxing','weeklyXiaxing'];
  const labels=['截图角色名','门派','金币（G）','通宝','等级','资历','宠物','侠行','侠行周'];
  const numeric=fields.slice(2),clean=s=>String(s||'').normalize('NFKC').replace(/\s/g,''),base=s=>clean(s).split('@')[0];
  function match(roles,name){const nameOnly=base(name);if(!nameOnly)return '';const matches=roles.filter(r=>base(r.name)===nameOnly);return matches.length===1?matches[0].id:'';}
  function value(v,key){if(v===''||v==null)return null;const s=String(v).trim();if(!/^\d+(?:\.\d{1,4})?$/.test(s))throw new Error('数值格式不正确：'+key);const n=Number(s);if(!Number.isSafeInteger(Math.round(n*10000))||n<0||key!=='gold'&&!Number.isInteger(n)||key==='level'&&(n<1||n>200))throw new Error('数值超出范围：'+key);return n;}
  function apply(state,rows,{digest,name,capturedAt,now=new Date().toISOString()}){
    if(!/^[a-f0-9]{64}$/.test(digest)||!Number.isFinite(Date.parse(capturedAt))||Date.parse(capturedAt)>Date.parse(now)+60000)throw new Error('截图标识或采集时间无效（不能在未来）');
    const id='screenshot_'+digest;if((state.sourceArchives||[]).some(x=>x.id===id))throw new Error('该截图已导入；如需重做，请先撤销上次导入');
    const next=structuredClone(state),seen=new Set(),changes=[],date=new Date(Date.parse(capturedAt)+8*3600000).toISOString().slice(0,10);
    for(const row of rows.filter(x=>x.selected)){
      const role=next.roles.find(r=>r.id===row.roleId);if(!role)throw new Error('请为选中行选择已有角色');if(seen.has(role.id))throw new Error('同一角色出现多次，请只保留一行');seen.add(role.id);
      if(role.resourceUpdatedAt&&Date.parse(role.resourceUpdatedAt)>Date.parse(capturedAt)||role.observedDate&&role.observedDate>date||role.screenshotCapturedAt&&Date.parse(role.screenshotCapturedAt)>Date.parse(capturedAt))throw new Error(role.name+' 已有更新的快照，请取消选择旧数据');
      const changed={};for(const key of numeric){const n=value(row[key],key);if(n==null)continue;const target=key==='gold'?'observedGold':key;changed[target]={before:role[target]??null,after:n};role[target]=n;}
      if(!Object.keys(changed).length)throw new Error(role.name+' 没有可更新的数值');
      if(row.school?.trim()){changed.school={before:role.school??'',after:row.school.trim()};role.school=row.school.trim();}
      if(changed.observedGold){role.observedDate=date;role.observedGoldSource='茗伊角色统计截图';next.balanceSnapshots??=[];next.balanceSnapshots.push({id:id+'_'+role.id,roleId:role.id,gold:role.observedGold,date,source:'茗伊角色统计截图',importedAt:now,capturedAt});}
      role.screenshotCapturedAt=capturedAt;role.updatedAt=now;changes.push({roleId:role.id,sourceName:row.name,changes:changed});
    }
    if(!changes.length)throw new Error('请至少选择一行有效角色');
    next.sourceArchives??=[];next.sourceArchives.push({id,name,date,format:'mingyi-role-screenshot-v1',counts:{roles:changes.length},files:[{name,sha256:digest}],rows:changes,issues:['采集时间由用户确认，截图相对快照计时不作为绝对时间。','图标金币单位需人工核对；仅更新观测余额，不计收入。'],updatedAt:now,capturedAt});
    next.imports.push({id,name:'角色截图 · '+name,date,stats:{added:0,updated:changes.length,skipped:rows.length-changes.length,old:0}});return next;
  }
  function lines(tsv){return tsv.split('\n').slice(1).map(l=>l.split('\t')).filter(a=>a[0]==='5'&&a[11]?.trim()).map(a=>({text:a.slice(11).join('\t').trim(),x:Number(a[6]),y:Number(a[7])+Number(a[9])/2,confidence:Number(a[10])}));}
  async function recognize(file,{top=23,bottom=92,progress=()=>{}}={}){
    if(!/^image\/(png|jpeg|webp)$/.test(file.type)||file.size>12*1024*1024)throw new Error('请选择不超过 12 MB 的 PNG / JPG / WebP 图片');
    if(!(top>=0&&bottom<=100&&bottom-top>=10))throw new Error('表格上下边界必须在 0–100%，且间距至少 10%');
    if(location.protocol==='file:')throw new Error('截图识别请使用 Pages 站点或本地 HTTP 服务；单文件模式可继续使用 JSON / CSV 导入');
    const bitmap=await createImageBitmap(file);if(bitmap.width*bitmap.height>20000000){bitmap.close();throw new Error('图片分辨率过大，请裁剪后上传');}
    let worker;
    try{
      const url=p=>new URL('vendor/ocr/'+p,document.baseURI).href;
      worker=await Tesseract.createWorker('chi_sim',1,{workerPath:url('worker.min.js'),corePath:url(''),langPath:url('').replace(/\/$/,''),workerBlobURL:false,cacheMethod:'none',logger:m=>progress(m.status==='recognizing text'?'正在识别表格…':'正在加载本地识别引擎…')});
      const scale=3,h=Math.round(bitmap.height*(bottom-top)/100)*scale,w=bitmap.width*scale;
      const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(bitmap,0,bitmap.height*top/100,bitmap.width,h/scale,0,0,w,h);
      // Dark game UI: turn light glyphs into dark glyphs for OCR, retaining geometry.
      const pixels=ctx.getImageData(0,0,w,h);for(let i=0;i<pixels.data.length;i+=4){const light=Math.max(pixels.data[i],pixels.data[i+1],pixels.data[i+2]);const c=255-light;pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=c;}ctx.putImageData(pixels,0,0);
      const cuts=[.014,.128,.178,.398,.491,.561,.628,.708,.792,.875],columns=[];
      for(let i=0;i<9;i++){
        progress('正在识别 '+labels[i]+'（'+(i+1)+'/9）…');
        await worker.setParameters({tessedit_pageseg_mode:'6',tessedit_char_whitelist:i===0?'':i===1?'霸刀七秀藏剑纯阳五毒长歌药宗衍天唐门蓬莱苍云明教天策万花少林丐帮凌雪刀宗万灵段氏无方相知北傲太玄':'0123456789',preserve_interword_spaces:'1'});
        const c=document.createElement('canvas');c.width=Math.round((cuts[i+1]-cuts[i])*w);c.height=h;c.getContext('2d').drawImage(canvas,Math.round(cuts[i]*w),0,c.width,h,0,0,c.width,h);
        const result=await worker.recognize(c,{}, {tsv:true});columns.push(lines(result.data.tsv||''));
      }
      // Currency icons are not text. Recognize each right-aligned digit group separately.
      const coinCuts=[[.196,.220],[.236,.276],[.2915,.316],[.330,.352]],coins=[];
      await worker.setParameters({tessedit_char_whitelist:'0123456789'});
      for(const [left,right] of coinCuts){
        progress('正在核对万金 / 金 / 银 / 铜数字…');const c=document.createElement('canvas');c.width=Math.round((right-left)*w);c.height=h;c.getContext('2d').drawImage(canvas,Math.round(left*w),0,c.width,h,0,0,c.width,h);const result=await worker.recognize(c,{}, {tsv:true});coins.push(lines(result.data.tsv||''));
      }
      const anchors=columns[4].filter(x=>/^\d{2,3}$/.test(x.text)&&Number(x.text)<=200);if(!anchors.length)throw new Error('未识别到等级列，请调整表格上下边界，保持完整表格列');
      const spacing=anchors.length>1?Math.min(...anchors.slice(1).map((a,i)=>a.y-anchors[i].y)):h;
      return anchors.map(a=>{const row={};for(let i=0;i<9;i++){const words=columns[i].filter(x=>Math.abs(x.y-a.y)<spacing*.42).sort((a,b)=>a.x-b.x);if(i<2)row[fields[i]]=words.map(x=>x.text).join('').replace(/\s/g,'');else if(i===2){const nums=coins.map(col=>col.filter(x=>Math.abs(x.y-a.y)<spacing*.42).map(x=>x.text).join(''));row.gold=nums.every(x=>/^\d+$/.test(x))&&Number(nums[1])<10000&&Number(nums[2])<100&&Number(nums[3])<100?String((Number(nums[0])*100000000+Number(nums[1])*10000+Number(nums[2])*100+Number(nums[3]))/10000):'';}else row[fields[i]]=words.length===1&&/^\d+$/.test(words[0].text)?words[0].text:'';}row.name=base(row.name);return row;});
    }finally{bitmap.close();if(worker)await worker.terminate();}
  }
  return {fields,labels,base,match,value,apply,recognize};
});
