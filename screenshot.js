/* Local-only OCR for the Mingyi character statistics table. No screenshot leaves the browser. */
(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.WorkbenchScreenshot=api;})(typeof globalThis==='object'?globalThis:this,()=>{
  'use strict';
  const fields=['name','school','gold','tongbao','level','achievement','petCount','xiaxing','weeklyXiaxing'];
  const labels=['截图角色名','门派','金币（G）','通宝','等级','资历','宠物','侠行','侠行周'];
  const numeric=fields.slice(2),clean=s=>String(s||'').normalize('NFKC').replace(/\s/g,''),base=s=>clean(s).split('@')[0];
  function editDistance(a,b){
    if(a===b)return 0;
    if(Math.abs(a.length-b.length)>2)return 99;
    const prev=Array.from({length:b.length+1},(_,i)=>i);
    for(let i=1;i<=a.length;i++){
      const row=[i];
      for(let j=1;j<=b.length;j++)row[j]=Math.min(row[j-1]+1,prev[j]+1,prev[j-1]+(a[i-1]===b[j-1]?0:1));
      for(let j=0;j<row.length;j++)prev[j]=row[j];
    }
    return prev[b.length];
  }
  function suggestRoles(roles,name,school=''){
    const key=base(name),full=clean(name),schoolKey=clean(school),all=roles||[];
    if(!key)return {roleId:'',exact:false,auto:false,suggestions:[]};
    const ocrServer=full.includes('@')?full.split('@').slice(1).join('@'):'';
    const knownServers=new Set(all.map(r=>clean(r.name).split('@').slice(1).join('@')).filter(Boolean));
    const suggestions=all.map(role=>{
      const target=base(role.name),roleFull=clean(role.name),server=roleFull.includes('@')?roleFull.split('@').slice(1).join('@'):'';
      const distance=editDistance(key,target),exact=distance===0,fullExact=roleFull===full;
      const schoolKnown=!!schoolKey&&!!clean(role.school);
      const compatibleSchool=!schoolKnown||clean(role.school)===schoolKey;
      const suffixStatus=!ocrServer||!server||ocrServer===server?'exact':
        knownServers.has(ocrServer)||editDistance(ocrServer,server)>1?'conflict':'ocr-typo';
      const threshold=key.length>=6?2:key.length>=3?1:0;
      const score=distance+(suffixStatus==='conflict'?2:suffixStatus==='ocr-typo'?.2:0)
        +(schoolKnown&&!compatibleSchool?2:0)-(fullExact?.5:0);
      return {roleId:role.id,name:role.name,school:role.school,distance,exact,fullExact,
        compatibleSchool,schoolKnown,suffixStatus,suffixConflict:suffixStatus==='conflict',
        score,eligible:distance<=threshold};
    }).filter(x=>x.eligible).sort((a,b)=>a.score-b.score||a.name.localeCompare(b.name,'zh-CN'));
    const exactMatches=suggestions.filter(x=>x.exact&&x.compatibleSchool&&!x.suffixConflict);
    const validExact=exactMatches.length===1?exactMatches[0]:null;
    const exactAuto=!!validExact&&(validExact.suffixStatus==='exact'||validExact.schoolKnown);
    if(exactAuto)return {roleId:validExact.roleId,exact:true,auto:true,suggestions};
    // A one-character OCR error needs corroborating school AND one unique safe candidate.
    const supported=suggestions.filter(x=>x.distance<=1&&x.schoolKnown&&x.compatibleSchool&&!x.suffixConflict);
    const best=supported[0],second=supported[1];
    const auto=!!best&&best.distance===1&&key.length>=3&&
      (second===undefined||second.score-best.score>=1)&&!suggestions.some(x=>x.exact&&!x.suffixConflict);
    return {roleId:auto?best.roleId:'',exact:false,auto,suggestions};
  }
  function match(roles,name){const k=base(name);if(!k)return '';const matches=(roles||[]).filter(r=>base(r.name)===k);return matches.length===1?matches[0].id:'';}

  function chooseRecognizedName(roles,variants,school=''){
    const unique=[...new Set(variants.map(x=>clean(x).replace(/[|]/g,'').replace(/@{2,}/g,'@')).filter(Boolean))];
    if(!unique.length)return {name:'',matched:false};
    const scored=unique.map((name,index)=>{
      const matchInfo=suggestRoles(roles,name,school);
      const candidate=matchInfo.suggestions.find(x=>x.roleId===matchInfo.roleId);
      const strength=matchInfo.roleId?(candidate?.fullExact?4:matchInfo.exact?3:matchInfo.auto?2:0):0;
      return {name,matchInfo,strength,index};
    }).sort((a,b)=>b.strength-a.strength||a.index-b.index);
    return {name:scored[0].name,matched:scored[0].strength>0};
  }
  function value(v,key){if(v===''||v==null)return null;const s=String(v).trim();if(!/^\d+(?:\.\d{1,4})?$/.test(s))throw new Error('数值格式不正确：'+key);const n=Number(s);if(!Number.isSafeInteger(Math.round(n*10000))||n<0||key!=='gold'&&!Number.isInteger(n)||key==='level'&&(n<1||n>200))throw new Error('数值超出范围：'+key);return n;}
  // Merge identical names (including any @server suffix) across screenshots.
  // Do not merge unnamed rows or different server suffixes: they may be different roles.
  // Fields are filled from the first nonblank candidate; discrepancies need explicit review.
  function mergeScreenshots(images,{roles=[]}={}){
    const groups=new Map();let rawRows=0;
    for(const [imageIndex,image] of images.entries()){
      for(const [rowIndex,row] of (image.rows||[]).entries()){
        rawRows++;
        const name=clean(row.name),matchInfo=suggestRoles(roles,name,row.school);
        const canonical=clean(roles.find(r=>r.id===matchInfo.roleId)?.name);
        const sameSuffix=!name.includes('@')||!canonical.includes('@')||name.split('@')[1]===canonical.split('@')[1];
        const matched=matchInfo.auto&&matchInfo.roleId&&sameSuffix;
        const key=matched?'matched:'+matchInfo.roleId:name?'role:'+name:'unknown:'+imageIndex+':'+rowIndex;
        let group=groups.get(key);
        if(!group){
          group={name,roleId:matched?matchInfo.roleId:'',sourceNames:[],candidates:{},sources:[]};
          for(const field of fields.slice(1))group.candidates[field]=new Map();
          groups.set(key,group);
        }
        const label=String(image.name||'截图 '+(imageIndex+1));
        if(!group.sourceNames.includes(label))group.sourceNames.push(label);
        group.sources.push({name:label,row:rowIndex+1});
        if(name!==group.name){(group.nameCandidates??=[]).push({name,source:label});}
        for(const field of fields.slice(1)){
          const candidate=String(row[field]??'').trim();
          if(!candidate)continue;
          const options=group.candidates[field],normalized=field==='school'?clean(candidate):candidate;
          if(!options.has(normalized))options.set(normalized,{value:candidate,files:[]});
          const item=options.get(normalized);
          if(!item.files.includes(label))item.files.push(label);
        }
      }
    }
    const rows=[...groups.values()].map(group=>{
      const canonical=roles.find(r=>r.id===group.roleId);
      const row={name:canonical?clean(canonical.name):group.name,roleId:group.roleId,sourceNames:group.sourceNames,sources:group.sources,occurrences:group.sources.length,conflicts:{},nameCandidates:group.nameCandidates||[]};
      for(const field of fields.slice(1)){
        const choices=[...group.candidates[field].values()];
        row[field]=choices[0]?.value||'';
        if(choices.length>1)row.conflicts[field]=choices;
      }
      return row;
    });
    return {rows,rawRows,duplicates:rawRows-rows.length,conflicts:rows.filter(r=>Object.keys(r.conflicts).length).length};
  }
  function importedDigests(state){
    return new Set((state.sourceArchives||[]).flatMap(a=>(a.files||[]).map(f=>f.sha256).filter(Boolean)));
  }
  function apply(state,rows,{digest,name,files,capturedAt,now=new Date().toISOString(),rawRows,duplicates,allowReimport=false}){
    if(!/^[a-f0-9]{64}$/.test(digest)||!Number.isFinite(Date.parse(capturedAt))||Date.parse(capturedAt)>Date.parse(now)+60000)throw new Error('截图标识或采集时间无效（不能在未来）');
    const incoming=files||[{name,sha256:digest}];
    if(!Array.isArray(incoming)||!incoming.length||incoming.some(f=>!f.name||!/^[a-f0-9]{64}$/.test(f.sha256))||new Set(incoming.map(f=>f.sha256)).size!==incoming.length)throw new Error('截图文件清单无效或存在重复文件');
    const existing=importedDigests(state);
    const repeated=incoming.filter(f=>existing.has(f.sha256));
    if(repeated.length&&!allowReimport)throw new Error('包含已导入截图，请勾选“确认复核已导入截图”后再提交');
    if(allowReimport&&!repeated.length)throw new Error('本批没有已导入截图，无需开启复核模式');
    let id='screenshot_'+digest;
    if(allowReimport){id='screenshot_review_'+digest.slice(0,20)+'_'+Date.parse(now).toString(36);}
    if((state.sourceArchives||[]).some(x=>x.id===id))throw new Error('本次截图记录已存在，请稍后重试');
    const next=structuredClone(state),seen=new Set(),changes=[],date=new Date(Date.parse(capturedAt)+8*3600000).toISOString().slice(0,10);
    for(const row of rows.filter(x=>x.selected)){
      if(Object.keys(row.conflicts||{}).length&&!row.conflictsConfirmed)throw new Error(row.name+' 存在截图数据冲突，请逐项核对并勾选冲突确认');
      const role=next.roles.find(r=>r.id===row.roleId);if(!role)throw new Error('请为选中行选择已有角色');if(seen.has(role.id))throw new Error('同一角色出现多次，请只保留一行');seen.add(role.id);
      if(role.resourceUpdatedAt&&Date.parse(role.resourceUpdatedAt)>Date.parse(capturedAt)||role.observedDate&&role.observedDate>date||role.screenshotCapturedAt&&Date.parse(role.screenshotCapturedAt)>Date.parse(capturedAt))throw new Error(role.name+' 已有更新的快照，请取消选择旧数据');
      const changed={};for(const key of numeric){const n=value(row[key],key);if(n==null)continue;const target=key==='gold'?'observedGold':key;changed[target]={before:role[target]??null,after:n};role[target]=n;}
      if(!Object.keys(changed).length)throw new Error(role.name+' 没有可更新的数值');
      if(row.school?.trim()){changed.school={before:role.school??'',after:row.school.trim()};role.school=row.school.trim();}
      if(changed.observedGold){role.observedDate=date;role.observedGoldSource='茗伊角色统计截图';next.balanceSnapshots??=[];next.balanceSnapshots.push({id:id+'_'+role.id,roleId:role.id,gold:role.observedGold,date,source:'茗伊角色统计截图',importedAt:now,capturedAt});}
      role.screenshotCapturedAt=capturedAt;role.updatedAt=now;changes.push({roleId:role.id,sourceName:row.name,sources:row.sourceNames||[],changes:changed});
    }
    if(!changes.length)throw new Error('请至少选择一行有效角色');
    next.sourceArchives??=[];next.sourceArchives.push({id,name,date,format:allowReimport?'mingyi-role-screenshot-review-v1':incoming.length>1?'mingyi-role-screenshot-batch-v1':'mingyi-role-screenshot-v1',counts:{roles:changes.length,files:incoming.length,rawRows:rawRows??rows.length,duplicates:duplicates??0},files:incoming.map(f=>({name:f.name,sha256:f.sha256})),rows:changes,reviewedDigests:repeated.map(f=>f.sha256),issues:['采集时间由用户确认，截图相对快照计时不作为绝对时间。','图标金币单位需人工核对；仅更新观测余额，不计收入。',...(repeated.length?['复核已导入截图：保留原导入档案，新建更正记录；观测余额不计收入。']:[])],updatedAt:now,capturedAt});
    next.imports.push({id,name:'角色截图 · '+name,date,stats:{added:0,updated:changes.length,skipped:rows.length-changes.length,old:0}});return next;
  }
  function lines(tsv){return tsv.split('\n').slice(1).map(l=>l.split('\t')).filter(a=>a[0]==='5'&&a[11]?.trim()).map(a=>({text:a.slice(11).join('\t').trim(),x:Number(a[6]),y:Number(a[7])+Number(a[9])/2,confidence:Number(a[10])}));}
  // Resolve from the script's own URL, not the page route (Pages lives under /JW3-Work-Pages/).
  const scriptBase=typeof document!=='undefined'&&document.currentScript?.src||'';
  const readableError=e=>e instanceof Error&&e.message?e.message:typeof e==='string'&&e.trim()?e.trim():e&&typeof e.message==='string'&&e.message.trim()?e.message:'浏览器未提供详细错误';
  async function createOcrWorker(progress){
    if(!globalThis.Tesseract?.createWorker)throw new Error('本地 OCR 脚本未加载，请刷新工作台后重试');
    const base=new URL('vendor/ocr/',scriptBase||document.baseURI).href;
    const asset=name=>new URL(name,base).href;
    const options={
      workerPath:asset('worker.min.js'),langPath:base.replace(/\/$/,''),
      workerBlobURL:false,cacheMethod:'none',
      logger:m=>progress(m.status==='recognizing text'?'正在识别表格…':'正在加载本地识别引擎…'),
      // Tesseract.js 6 can also throw a second uncaught error when a worker job rejects.
      errorHandler:()=>{}
    };
    let simdError;
    try{
      return await globalThis.Tesseract.createWorker('chi_sim',1,{...options,corePath:base});
    }catch(e){simdError=readableError(e);}
    // On devices where the SIMD build fails, use the verified non-SIMD LSTM build.
    // A full-file corePath is supported by Tesseract.js and prevents auto SIMD selection.
    progress('SIMD 识别引擎加载失败，正在尝试兼容模式…');
    try{
      return await globalThis.Tesseract.createWorker('chi_sim',1,{...options,corePath:asset('tesseract-core-lstm.wasm.js')});
    }catch(e){
      throw new Error('OCR 引擎无法启动；SIMD：'+simdError+'；兼容模式：'+readableError(e)+'。请检查 '+asset('tesseract-core-simd-lstm.wasm.js')+' 和 '+asset('tesseract-core-lstm.wasm.js')+' 是否可访问（HTTP 200），刷新后重试');
    }
  }
  async function recognize(file,{top=23,bottom=92,progress=()=>{},worker:sharedWorker,roles=[]}={}){
    if(!/^image\/(png|jpeg|webp)$/.test(file.type)||file.size>12*1024*1024)throw new Error('请选择不超过 12 MB 的 PNG / JPG / WebP 图片');
    if(!(top>=0&&bottom<=100&&bottom-top>=10))throw new Error('表格上下边界必须在 0–100%，且间距至少 10%');
    if(location.protocol==='file:')throw new Error('截图识别请使用 Pages 站点或本地 HTTP 服务；单文件模式可继续使用 JSON / CSV 导入');
    const bitmap=await createImageBitmap(file);if(bitmap.width*bitmap.height>20000000){bitmap.close();throw new Error('图片分辨率过大，请裁剪后上传');}
    let worker=sharedWorker;
    try{
      if(!worker)worker=await createOcrWorker(progress);
      const scale=3,h=Math.round(bitmap.height*(bottom-top)/100)*scale,w=bitmap.width*scale;
      const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(bitmap,0,bitmap.height*top/100,bitmap.width,h/scale,0,0,w,h);
      // Dark game UI: turn light glyphs into dark glyphs for OCR, retaining geometry.
      const cuts=[.014,.128,.178,.398,.491,.561,.628,.708,.792,.875],columns=[];
      // Color-aware name image: all colored glyphs on this UI become black text,
      // while the low-intensity blue/gray table background remains white.
      const nameLeft=Math.round(cuts[0]*w),nameWidth=Math.round((cuts[1]-cuts[0])*w);
      const bin=document.createElement('canvas');bin.width=nameWidth;bin.height=h;
      const binCtx=bin.getContext('2d',{willReadFrequently:true});
      const binData=ctx.getImageData(nameLeft,0,nameWidth,h);
      const pixels=ctx.getImageData(0,0,w,h);
      for(let y=0;y<h;y++)for(let x=0;x<nameWidth;x++){
        const src=(y*w+nameLeft+x)*4,dst=(y*nameWidth+x)*4;
        const r=pixels.data[src],g=pixels.data[src+1],b=pixels.data[src+2];
        const light=Math.max(r,g,b),colorDiff=light-Math.min(r,g,b);
        const v=light>=103||colorDiff>=55?0:255;
        binData.data[dst]=binData.data[dst+1]=binData.data[dst+2]=v;
        binData.data[dst+3]=255;
      }
      binCtx.putImageData(binData,0,0);
      // The regular grayscale path is preserved for numeric OCR.
      for(let i=0;i<pixels.data.length;i+=4){const light=Math.max(pixels.data[i],pixels.data[i+1],pixels.data[i+2]);const c=255-light;pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=c;}
      ctx.putImageData(pixels,0,0);
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
      const parsed=anchors.map(a=>{const row={};for(let i=0;i<9;i++){const words=columns[i].filter(x=>Math.abs(x.y-a.y)<spacing*.42).sort((a,b)=>a.x-b.x);if(i<2)row[fields[i]]=words.map(x=>x.text).join('').replace(/\s/g,'');else if(i===2){const nums=coins.map(col=>col.filter(x=>Math.abs(x.y-a.y)<spacing*.42).map(x=>x.text).join(''));row.gold=nums.every(x=>/^\d+$/.test(x))&&Number(nums[1])<10000&&Number(nums[2])<100&&Number(nums[3])<100?String((Number(nums[0])*100000000+Number(nums[1])*10000+Number(nums[2])*100+Number(nums[3]))/10000):'';}else row[fields[i]]=words.length===1&&/^\d+$/.test(words[0].text)?words[0].text:'';}row.name=clean(row.name);return row;});
      // A second whole-column OCR pass uses the color-aware binary image.
      // Compare both passes with the WORKBENCH character names (never use a
      // raw OCR guess to rename a stored role).
      if(roles.length){
        progress('正在用角色档案校对彩色角色名…');
        await worker.setParameters({tessedit_pageseg_mode:'6',tessedit_char_whitelist:'',preserve_interword_spaces:'1'});
        try{
          const nameResult=await worker.recognize(bin,{}, {tsv:true});
          const alternatives=lines(nameResult.data.tsv||'');
          for(let i=0;i<parsed.length;i++){
            const a=anchors[i],text=alternatives.filter(x=>Math.abs(x.y-a.y)<spacing*.42)
              .sort((l,r)=>l.x-r.x).map(x=>x.text).join('');
            const best=chooseRecognizedName(roles,[parsed[i].name,text],parsed[i].school);
            if(best.matched&&best.name!==parsed[i].name){
              parsed[i].name=best.name;parsed[i].nameCorrected=true;
            }
          }
        }catch{ /* The original column OCR remains available. */ }
        // Only difficult lines need the slower isolated-line scans.
        await worker.setParameters({tessedit_pageseg_mode:'7',tessedit_char_whitelist:'',preserve_interword_spaces:'0'});
        for(let i=0;i<parsed.length;i++){
          const original=parsed[i].name;
          if(suggestRoles(roles,original,parsed[i].school).exact)continue;
          progress('正在复核角色名称（'+(i+1)+'/'+parsed.length+'）…');
          const a=anchors[i],cropHeight=Math.max(20,Math.round(Math.min(spacing*.86,h*.13)));
          const cropY=Math.max(0,Math.min(h-cropHeight,Math.round(a.y-cropHeight/2)));
          const results=[original];
          // Use both the old inverted gray image and the color-aware glyph mask.
          for(const source of [canvas,bin]){
            const c=document.createElement('canvas');c.width=nameWidth;c.height=cropHeight;
            c.getContext('2d').drawImage(source,source===canvas?nameLeft:0,cropY,nameWidth,cropHeight,0,0,nameWidth,cropHeight);
            try{
              const response=await worker.recognize(c,{}, {text:true});
              results.push(response.data.text);
              if(chooseRecognizedName(roles,results,parsed[i].school).matched)break;
            }catch{ /* Preserve earlier OCR on a failed isolated-line pass. */ }
          }
          const best=chooseRecognizedName(roles,results,parsed[i].school);
          if(best.matched&&best.name!==original){
            parsed[i].name=best.name;parsed[i].nameCorrected=true;
          }
        }
      }
      return parsed;
    }finally{bitmap.close();if(!sharedWorker&&worker)await worker.terminate();}
  }
  return {fields,labels,base,match,suggestRoles,chooseRecognizedName,editDistance,value,mergeScreenshots,importedDigests,apply,recognize,createWorker:createOcrWorker};
});
