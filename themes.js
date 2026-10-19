/* Theme preferences are independent of business data and its JSON backup. */
(function(root,factory){const api=factory();if(typeof module!=='undefined'&&module.exports)module.exports=api;else{root.WorkbenchThemes=api;api.apply(api.preference(),false);}})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const KEY='jx3-workbench-theme-v1';
  const names=['bg','sidebar','surface','surface-2','hover','border','text','text-secondary','text-muted','primary','cyan','purple','success','warning','danger','primary-text'];
  const themes=[
    {id:'deep-ocean',name:'深海蓝',mode:'dark',description:'深色 · 原始战术控制台',colors:['#080F1F','#0C1425','#111C30','#16243A','#1B2E46','#2A3A51','#F1F5FC','#B0BED2','#899BB3','#4A91FF','#37D8E8','#A78BFA','#34D399','#FBBF24','#FB7185','#071326']},
    {id:'cloud-blue',name:'云白蓝',mode:'light',description:'浅色 · 清晰明快',colors:['#F3F6FC','#FFFFFF','#FFFFFF','#EDF2FA','#E3EBF7','#D4DEEB','#14213B','#45556F','#586984','#2563EB','#087C8C','#7040B5','#087C58','#986313','#C33850','#FFFFFF']},
    {id:'jade-green',name:'竹青绿',mode:'light',description:'浅色 · 柔和青绿',colors:['#F1F7F4','#FAFDFC','#FFFFFF','#EAF3EF','#DFEEE7','#CBDDD3','#17382C','#435F52','#587365','#087F68','#087F68','#735096','#137648','#886318','#BF3C50','#FFFFFF']},
    {id:'warm-sand',name:'暖砂金',mode:'light',description:'浅色 · 暖白纸感',colors:['#F8F5EE','#FFFCF7','#FFFEFB','#F1EBDF','#EAE1D0','#DED2BE','#3B3023','#665846','#79684F','#A15C16','#87600F','#7951A2','#34703C','#95600C','#BB3746','#FFFFFF']},
    {id:'amethyst-night',name:'暮紫夜',mode:'dark',description:'深色 · 紫蓝夜色',colors:['#110F1C','#181423','#201B30','#29233B','#342D49','#453954','#F6F0FF','#C9BED8','#A99ABF','#B7A0FF','#7DDFD1','#CDA4FB','#70D9AB','#F4CC7A','#FF92AE','#21152F']}
  ];
  const rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
  function mix(a,b,weight){const x=rgb(a),y=rgb(b);return '#'+x.map((v,i)=>Math.round(v*(1-weight)+y[i]*weight).toString(16).padStart(2,'0')).join('');}
  function palette(id){const theme=themes.find(t=>t.id===id)||themes[0],p=Object.fromEntries(names.map((n,i)=>[n,theme.colors[i]]));
    Object.assign(p,{'input-bg':mix(p.surface,p['surface-2'],.45),'control-border':mix(p.surface,p['text-muted'],.8),'primary-soft':mix(p.surface,p.primary,theme.mode==='light'?.09:.17),'primary-hover':mix(p.primary,theme.mode==='light'?'#000000':'#FFFFFF',.14),'notice-bg':mix(p.surface,p.primary,.055),'notice-border':mix(p.border,p.primary,.35),'success-bg':mix(p.surface,p.success,.1),'success-border':mix(p.border,p.success,.4),'forecast-bg':mix(p.surface,p.purple,.1),'forecast-border':mix(p.border,p.purple,.4),'warning-bg':mix(p.surface,p.warning,.09),'warning-border':mix(p.border,p.warning,.45),'track':mix(p.surface,p.border,.75),'grid':mix(p.surface,p.border,.7),'avatar-bg':mix(p.surface,p.primary,.15),'backdrop':theme.mode==='light'?'#14213B66':'#030915C9','shadow':theme.mode==='light'?'#20304A26':'#00000080','button-muted':mix(p.surface,p['surface-2'],.6)});
    p['primary-label']=mix(p.primary,theme.mode==='light'?'#000000':'#FFFFFF',theme.mode==='light'?.12:.22);
    return {theme,tokens:p,chartColors:[p.primary,p.cyan,p.purple,p.warning,p.success,p.danger]};
  }
  function preference(){try{const id=localStorage.getItem(KEY);return themes.some(t=>t.id===id)?id:'deep-ocean';}catch{return 'deep-ocean';}}
  function apply(id,persist=true){const p=palette(id),root=document.documentElement;root.dataset.theme=p.theme.id;root.dataset.colorMode=p.theme.mode;root.style.colorScheme=p.theme.mode;for(const [n,v]of Object.entries(p.tokens))root.style.setProperty('--wb-'+n,v);const meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.content=p.tokens.bg;let saved=true;if(persist)try{localStorage.setItem(KEY,p.theme.id);}catch{saved=false;}return {...p,saved};}
  return {themes,palette,preference,apply};
});
