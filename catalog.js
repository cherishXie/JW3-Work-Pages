/* Offline snapshot, checked 2026-10-14. Base sects and learnable schools are distinct. */
(function(root,factory){const api=factory();if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.JX3Catalog=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const xf=(name,duty='dps',range='ranged')=>({name,duty,range});
  const schools=[
    {name:'少林',stances:[xf('易筋经','dps','melee'),xf('洗髓经','tank','melee')]},
    {name:'万花',stances:[xf('花间游'),xf('离经易道','heal')]},
    {name:'天策',stances:[xf('傲血战意','dps','melee'),xf('铁牢律','tank','melee')]},
    {name:'纯阳',stances:[xf('紫霞功'),xf('太虚剑意','dps','melee')]},
    {name:'七秀',stances:[xf('冰心诀'),xf('云裳心经','heal')]},
    {name:'藏剑',stances:[xf('问水诀','dps','melee'),xf('山居剑意','dps','melee')]},
    {name:'五毒',stances:[xf('毒经'),xf('补天诀','heal')]},
    {name:'唐门',stances:[xf('惊羽诀'),xf('天罗诡道')]},
    {name:'明教',stances:[xf('焚影圣诀','dps','melee'),xf('明尊琉璃体','tank','melee')]},
    {name:'丐帮',stances:[xf('笑尘诀','dps','melee')]},
    {name:'苍云',stances:[xf('分山劲','dps','melee'),xf('铁骨衣','tank','melee')]},
    {name:'长歌',stances:[xf('莫问'),xf('相知','heal')]},
    {name:'霸刀',stances:[xf('北傲诀','dps','melee')]},
    {name:'蓬莱',stances:[xf('凌海诀','dps','melee')]},
    {name:'凌雪阁',aliases:['凌雪'],stances:[xf('隐龙诀','dps','melee')]},
    {name:'衍天宗',aliases:['衍天'],stances:[xf('太玄经')]},
    {name:'北天药宗',aliases:['药宗'],stances:[xf('无方'),xf('灵素','heal')]},
    {name:'刀宗',stances:[xf('孤锋诀','dps','melee')]},
    {name:'万灵山庄',aliases:['万灵'],stances:[xf('山海心诀')]},
    {name:'段氏',aliases:['大理段氏','南诏段氏'],stances:[xf('周天功')]}
  ];
  const extraStances=[xf('幽罗引')];
  const companion=(id,name,duties,range,group,notes='')=>({id,name,duties,range,group,notes});
  const companions=[
    companion('shen-jianxin','沈剑心',['dps'],'melee','任务 / 家园'),
    companion('kang-yanbie','康宴别',['tank'],'melee','常驻共鸣'),
    companion('yue-zhongshan','岳仲山',['tank'],'melee','常驻共鸣','2026-06 上线；防御 / 强制仇恨'),
    companion('mu-qingrou','沐晴柔',['heal'],'ranged','常驻共鸣'),
    companion('tang-xiaoke','唐小珂',['dps'],'ranged','常驻共鸣'),
    companion('yue-jiahe','月嘉禾',['dps'],'ranged','常驻共鸣'),
    companion('he-xian','贺闲',['dps'],'melee','常驻共鸣'),
    companion('li-xingyun','李星云',['dps'],'melee','常驻共鸣'),
    companion('bai-que','白鹊',['dps'],'melee','常驻共鸣'),
    companion('wen-zhezhi','温折枝',['dps'],'melee','任务 / 家园'),
    companion('wen-ciqiu','温辞秋',['heal'],'ranged','任务 / 家园'),
    companion('nian-xiaoxiong','年小熊',['heal'],'ranged','任务 / 家园'),
    companion('nian-xiaolu','年小鹿',['dps'],'ranged','任务 / 家园'),
    companion('ruan-guiyun','阮归云',['dps'],'ranged','任务 / 家园'),
    companion('ruan-xianzhou','阮闲舟',['heal'],'ranged','任务 / 家园'),
    companion('rong-rong','茸茸',['tank'],'melee','任务 / 家园'),
    companion('fei-dajin','费大劲',['tank'],'melee','任务 / 家园'),
    companion('yan-ziniang','燕子娘',['heal'],'ranged','历次联动','历史活动；只有实际拥有时勾选'),
    companion('dao-ma','刀马',['tank'],'melee','历次联动','历史活动；只有实际拥有时勾选'),
    companion('gai-nie','盖聂',['dps'],'melee','历次联动'),
    companion('wei-zhuang','卫庄',['dps'],'melee','历次联动'),
    companion('li-xiaoyao','李逍遥',['dps'],'melee','历次联动'),
    companion('zhao-linger','赵灵儿',['dps','heal'],'ranged','历次联动','一场只承担一种排程职责；实际治疗能力需复核'),
    companion('jiang-tang','姜棠',['dps'],'ranged','常驻共鸣','2025-10 上线'),
    companion('li-e','李萼',['dps'],'melee','历次联动','2025-12 联动'),
    companion('jing-tian','景天',['dps','heal'],'melee','历次联动','2026-04 助战；一场只承担一种排程职责')
  ];
  function school(name){return schools.find(x=>x.name===name||x.aliases?.includes(name));}
  function stances(name){return [...(school(name)?.stances||[]),...extraStances];}
  function profile(role){const known=stances(role.school).find(x=>x.name===role.stance);return known?{...known,verified:true}:{duty:role.duty||'unknown',range:role.range||'unknown',verified:false};}
  function owned(role){const ids=Array.isArray(role.companionIds)?role.companionIds:String(role.companion||'').split(/[,，、;；\s]+/).map(name=>companions.find(c=>c.name===name)?.id).filter(Boolean);return [...new Set(ids)].map(id=>companions.find(c=>c.id===id)).filter(Boolean).map(c=>({...c,duties:role.companionDutyOverrides?.[c.id]||c.duties}));}
  return {checkedAt:'2026-10-14',schools,extraStances,companions,school,stances,profile,owned};
});
