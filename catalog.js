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
    // 剑网3官方微博 2026-10-20：https://www.sina.cn/news/detail/5356042898639894.html
    {...companion('he-qixian','何其鲜',['dps'],'melee','常驻共鸣','2026-10-29 苍生铸世上线；外功近战输出；红尘侠影使用上品茶饼或上品茶饼·兑结识'),season:'苍生铸世',source:'https://www.sina.cn/news/detail/5356042898639894.html'},
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
  // Cangsheng, verified against official 2026-10-29 changes and current-season
  // author-maintained client-data calculator. Weights are ordering points, NOT DPS %.
  const teamBuffSeason='cangsheng-2026',teamBuffCheckedAt='2026-11-14';
  const teamBuffSources={
    qixiu:'https://jx3.xoyo.com/show-2466-7559-1.html',
    tiance:'https://jx3.xoyo.com/show-2466-7574-1.html',
    shaolin:'https://jx3.xoyo.com/show-2466-7560-1.html',
    wanhua:'https://jx3.xoyo.com/show-2466-7558-1.html',
    wudu:'https://jx3.xoyo.com/show-2466-7563-1.html',
    cangyun:'https://jx3.xoyo.com/show-2466-7566-1.html',
    changge:'https://jx3.xoyo.com/show-2466-7567-1.html',
    chunyang:'https://jx3.xoyo.com/show-2466-7561-1.html',
    formation:'https://www.cjdps.com/gear.html',
    formationIndex:'https://jx3.unua.top/schools/',
    latest:'https://jx3.xoyo.com/index/#/article-details?kid=1335924'
  };
  const teamBuffCatalog=[
    {id:'xiuqi',name:'袖气',stances:['冰心诀','云裳心经'],damage:'all',family:'xiuqi',effect:'全属性提升，适配各类输出',source:'qixiu'},
    {id:'pofeng',name:'破风',stances:['傲血战意','铁牢律'],damage:'external',family:'external-defense',effect:'降低目标外功防御，适配外功输出',source:'tiance'},
    {id:'jilei',name:'激雷',stances:['傲血战意'],damage:'external',family:'jilei',effect:'小队外功攻击与破防提升',condition:'需选择激雷奇穴并施展撼如雷',source:'tiance'},
    {id:'lidi',name:'立地成佛',stances:['洗髓经'],damage:'internal',family:'internal-defense',effect:'降低目标内功防御，适配内功输出',condition:'需选择立地成佛奇穴并触发',source:'shaolin'},
    {id:'chanyu',name:'禅语',stances:['洗髓经'],damage:'all',family:'tank-insight',effect:'提升团队无双',condition:'需选择禅语奇穴并施展大狮子吼',source:'shaolin'},
    {id:'zhenfen',name:'振奋',stances:['铁骨衣'],damage:'all',family:'tank-insight',effect:'提升团队无双',condition:'需选择振奋奇穴并施展盾挡',source:'cangyun'},
    {id:'qiusu',name:'秋肃',stances:['离经易道'],damage:'all',family:'healer-insight',effect:'治疗目标获得无双提升',condition:'需选择秋肃奇穴并治疗',source:'wanhua'},
    {id:'zhuangzhou',name:'庄周梦',stances:['相知'],damage:'all',family:'healer-insight',effect:'持续治疗目标获得无双提升',condition:'需选择庄周梦奇穴并添加持续治疗',source:'changge'},
    {id:'zuoxuan',name:'左旋右转',stances:['云裳心经'],damage:'all',family:'healer-insight',effect:'运功为团队提供无双提升',condition:'需选择左旋右转并完成对应运功',source:'qixiu'},
    {id:'xianding',name:'仙王蛊鼎',stances:['补天诀'],damage:'all',family:'healer-insight',effect:'蛊鼎范围内团队获得无双提升',condition:'需选择仙王蛊鼎，战斗中在范围内生效',source:'wudu'}
  ];
  // Formation affinity only: no old rating values or fifth/sixth-layer self buffs.
  // Official skill-index baseline is cross-checked against current-season changes;
  // the current author calculator independently confirms the external applications.
  const dailyFormations=[
    ['问水诀','依山观澜阵','external'],['山居剑意','依山观澜阵','external'],['傲血战意','卫公折冲阵','external'],
    ['太虚剑意','北斗七星阵','external'],['惊羽诀','流星赶月阵','external'],['笑尘诀','降龙伏虎阵','external'],
    ['北傲诀','霜岚洗锋阵','external'],['天罗诡道','千机百变阵','all'],['隐龙诀','龙皇雪风阵','external'],
    ['凌海诀','墟海引归阵','external'],['分山劲','锋凌横绝阵','external'],['孤锋诀','横云破锋阵','external'],['山海心诀','苍梧引灵阵','all'],
    ['易筋经','天鼓雷音阵','internal'],['花间游','七绝逍遥阵','internal'],['紫霞功','九宫八卦阵','internal'],
    ['冰心诀','九音惊弦阵','internal'],['毒经','万蛊噬心阵','internal'],['焚影圣诀','炎威破魔阵','internal'],
    ['莫问','万籁金弦阵','internal'],['太玄经','九星游年阵','internal'],['无方','乱暮浊茵阵','internal'],['周天功','含章挺秀阵','internal'],['幽罗引','连丝织意阵','internal']
  ].map(([stance,name,damage])=>({stance,name,damage,source:'formationIndex'}));
  const externalDamageStances=['傲血战意','太虚剑意','问水诀','山居剑意','惊羽诀','笑尘诀','分山劲','北傲诀','凌海诀','隐龙诀','孤锋诀','山海心诀'];
  const internalDamageStances=['易筋经','花间游','紫霞功','冰心诀','毒经','天罗诡道','焚影圣诀','莫问','太玄经','无方','周天功','幽罗引'];
  function damageType(role){const p=profile(role);return !p.verified||p.duty!=='dps'?'unknown':externalDamageStances.includes(p.name)?'external':internalDamageStances.includes(p.name)?'internal':'unknown';}
  function school(name){return schools.find(x=>x.name===name||x.aliases?.includes(name));}
  function stances(name){return [...(school(name)?.stances||[]),...extraStances];}
  function profile(role){const known=stances(role.school).find(x=>x.name===role.stance);return known?{...known,verified:true}:{duty:role.duty||'unknown',range:role.range||'unknown',verified:false};}
  function owned(role){const ids=Array.isArray(role.companionIds)?role.companionIds:String(role.companion||'').split(/[,，、;；\s]+/).map(name=>companions.find(c=>c.name===name)?.id).filter(Boolean);return [...new Set(ids)].map(id=>companions.find(c=>c.id===id)).filter(Boolean).map(c=>({...c,duties:role.companionDutyOverrides?.[c.id]||c.duties}));}
  return {teamBuffSeason,teamBuffCheckedAt,teamBuffSources,teamBuffCatalog,dailyFormations,damageType,checkedAt:'2026-10-14',companionsCheckedAt:'2026-11-13',companionsSeason:'苍生铸世',schools,extraStances,companions,school,stances,profile,owned};
});
