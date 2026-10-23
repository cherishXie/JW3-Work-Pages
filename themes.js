/*
MIT License

Copyright (c) 2021-2022 Modulz
Copyright (c) 2022-Present WorkOS

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
/* Theme preferences are independent of business data and its JSON backup. */
(function(root,factory){const api=factory();if(typeof module!=='undefined'&&module.exports)module.exports=api;else{root.WorkbenchThemes=api;api.apply(api.preference(),false);}})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const KEY='jx3-workbench-theme-v1';
  // Radix Colors (MIT), official 12-step scales. See docs/RADIX_COLORS_LICENSE.txt.
  const scales={"light":{"gray":["#fcfcfc","#f9f9f9","#f0f0f0","#e8e8e8","#e0e0e0","#d9d9d9","#cecece","#bbbbbb","#8d8d8d","#838383","#646464","#202020"],"slate":["#fcfcfd","#f9f9fb","#f0f0f3","#e8e8ec","#e0e1e6","#d9d9e0","#cdced6","#b9bbc6","#8b8d98","#80838d","#60646c","#1c2024"],"sage":["#fbfdfc","#f7f9f8","#eef1f0","#e6e9e8","#dfe2e0","#d7dad9","#cbcfcd","#b8bcba","#868e8b","#7c8481","#5f6563","#1a211e"],"sand":["#fdfdfc","#f9f9f8","#f1f0ef","#e9e8e6","#e2e1de","#dad9d6","#cfceca","#bcbbb5","#8d8d86","#82827c","#63635e","#21201c"],"mauve":["#fdfcfd","#faf9fb","#f2eff3","#eae7ec","#e3dfe6","#dbd8e0","#d0cdd7","#bcbac7","#8e8c99","#84828e","#65636d","#211f26"],"blue":["#fbfdff","#f4faff","#e6f4fe","#d5efff","#c2e5ff","#acd8fc","#8ec8f6","#5eb1ef","#0090ff","#0588f0","#0d74ce","#113264"],"jade":["#fbfefd","#f4fbf7","#e6f7ed","#d6f1e3","#c3e9d7","#acdec8","#8bceb6","#56ba9f","#29a383","#26997b","#208368","#1d3b31"],"amber":["#fefdfb","#fefbe9","#fff7c2","#ffee9c","#fbe577","#f3d673","#e9c162","#e2a336","#ffc53d","#ffba18","#ab6400","#4f3422"],"violet":["#fdfcfe","#faf8ff","#f4f0fe","#ebe4ff","#e1d9ff","#d4cafe","#c2b5f5","#aa99ec","#6e56cf","#654dc4","#6550b9","#2f265f"],"teal":["#fafefd","#f3fbf9","#e0f8f3","#ccf3ea","#b8eae0","#a1ded2","#83cdc1","#53b9ab","#12a594","#0d9b8a","#008573","#0d3d38"],"green":["#fbfefc","#f4fbf6","#e6f6eb","#d6f1df","#c4e8d1","#adddc0","#8eceaa","#5bb98b","#30a46c","#2b9a66","#218358","#193b2d"],"red":["#fffcfc","#fff7f7","#feebec","#ffdbdc","#ffcdce","#fdbdbe","#f4a9aa","#eb8e90","#e5484d","#dc3e42","#ce2c31","#641723"],"orange":["#fefcfb","#fff7ed","#ffefd6","#ffdfb5","#ffd19a","#ffc182","#f5ae73","#ec9455","#f76b15","#ef5f00","#cc4e00","#582d1d"]},"dark":{"gray":["#111111","#191919","#222222","#2a2a2a","#313131","#3a3a3a","#484848","#606060","#6e6e6e","#7b7b7b","#b4b4b4","#eeeeee"],"slate":["#111113","#18191b","#212225","#272a2d","#2e3135","#363a3f","#43484e","#5a6169","#696e77","#777b84","#b0b4ba","#edeef0"],"sage":["#101211","#171918","#202221","#272a29","#2e3130","#373b39","#444947","#5b625f","#63706b","#717d79","#adb5b2","#eceeed"],"sand":["#111110","#191918","#222221","#2a2a28","#31312e","#3b3a37","#494844","#62605b","#6f6d66","#7c7b74","#b5b3ad","#eeeeec"],"mauve":["#121113","#1a191b","#232225","#2b292d","#323035","#3c393f","#49474e","#625f69","#6f6d78","#7c7a85","#b5b2bc","#eeeef0"],"blue":["#0d1520","#111927","#0d2847","#003362","#004074","#104d87","#205d9e","#2870bd","#0090ff","#3b9eff","#70b8ff","#c2e6ff"],"jade":["#0d1512","#121c18","#0f2e22","#0b3b2c","#114837","#1b5745","#246854","#2a7e68","#29a383","#27b08b","#1fd8a4","#adf0d4"],"amber":["#16120c","#1d180f","#302008","#3f2700","#4d3000","#5c3d05","#714f19","#8f6424","#ffc53d","#ffd60a","#ffca16","#ffe7b3"],"violet":["#14121f","#1b1525","#291f43","#33255b","#3c2e69","#473876","#56468b","#6958ad","#6e56cf","#7d66d9","#baa7ff","#e2ddfe"],"teal":["#0d1514","#111c1b","#0d2d2a","#023b37","#084843","#145750","#1c6961","#207e73","#12a594","#0eb39e","#0bd8b6","#adf0dd"],"green":["#0e1512","#121b17","#132d21","#113b29","#174933","#20573e","#28684a","#2f7c57","#30a46c","#33b074","#3dd68c","#b1f1cb"],"red":["#191111","#201314","#3b1219","#500f1c","#611623","#72232d","#8c333a","#b54548","#e5484d","#ec5d5e","#ff9592","#ffd1d9"],"orange":["#17120e","#1e160f","#331e0b","#462100","#562800","#66350c","#7e451d","#a35829","#f76b15","#ff801f","#ffa057","#ffe0c2"]}};
  const themes=[
    {id:'deep-ocean',name:'石墨深色',mode:'dark',neutral:'gray',accent:'blue',description:'深色'},
    {id:'cloud-blue',name:'云白蓝',mode:'light',neutral:'slate',accent:'blue',description:'浅色'},
    {id:'jade-green',name:'竹青绿',mode:'light',neutral:'sage',accent:'jade',description:'浅色'},
    {id:'warm-sand',name:'暖砂金',mode:'light',neutral:'sand',accent:'amber',description:'浅色'},
    {id:'amethyst-night',name:'暮紫夜',mode:'dark',neutral:'mauve',accent:'violet',description:'深色'}
  ];
  function palette(id){
    const theme=themes.find(t=>t.id===id)||themes[0],s=scales[theme.mode],n=s[theme.neutral],a=s[theme.accent],at=(name,step)=>s[name][step-1];
    const p={bg:n[0],sidebar:n[1],surface:n[1],'surface-2':n[2],hover:n[3],border:n[5],text:n[11],'text-secondary':n[10],'text-muted':n[10],primary:a[8],cyan:at('teal',11),purple:at('violet',11),success:at('green',11),warning:at('amber',11),danger:at('red',11),'primary-text':theme.accent==='violet'?'#ffffff':'#111111',
      'input-bg':n[2],'control-border':n[6],'primary-soft':a[4],'primary-hover':a[9],'primary-label':a[10],
      'notice-bg':a[2],'notice-border':a[5],'success-bg':at('green',3),'success-border':at('green',6),'forecast-bg':at('violet',3),'forecast-border':at('violet',6),'warning-bg':at('amber',3),'warning-border':at('amber',6),
      'chart-bg-0':a[3],'chart-bg-1':at('teal',4),'chart-bg-2':at('violet',4),'chart-bg-3':at('amber',4),'chart-bg-4':at('green',4),'chart-bg-5':at('red',4),track:n[3],grid:n[5],'avatar-bg':a[3],backdrop:'#000000b3',shadow:'#00000026','button-muted':n[2],
      'login':at('orange',11),'login-bg':at('orange',3),'switch':at('blue',11),'switch-bg':at('blue',3),
      'chart-primary':a[8],'chart-cyan':at('teal',8),'chart-purple':at('violet',8),'chart-warning':at('amber',8),'chart-success':at('green',8),'chart-danger':at('red',8)};
    return {theme,tokens:p,chartColors:[p['chart-primary'],p['chart-cyan'],p['chart-purple'],p['chart-warning'],p['chart-success'],p['chart-danger']]};
  }
  function preference(){try{const id=localStorage.getItem(KEY);return themes.some(t=>t.id===id)?id:'deep-ocean';}catch{return 'deep-ocean';}}
  function apply(id,persist=true){const p=palette(id),root=document.documentElement;root.dataset.theme=p.theme.id;root.dataset.colorMode=p.theme.mode;root.style.colorScheme=p.theme.mode;for(const [n,v]of Object.entries(p.tokens))root.style.setProperty('--wb-'+n,v);const meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.content=p.tokens.bg;let saved=true;if(persist)try{localStorage.setItem(KEY,p.theme.id);}catch{saved=false;}return {...p,saved};}
  return {themes,palette,preference,apply};
});
