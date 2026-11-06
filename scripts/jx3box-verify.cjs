'use strict';
const assert=require('node:assert/strict'),Box=require('../jx3box.js'),M=require('../model.js'),ROI=require('../roi.js');
const now=Date.now(),stamp=Math.floor(now/1000),rows=[{item_id:'5_24430',server:'梦江南',price:279900000,sample:81,timestamp:stamp}];
const [q]=Box.prices(rows,'梦江南',['5_24430'],now);assert.equal(q.price,27990);assert.equal(q.sampleCount,81);
for(const patch of [{server:'长安城'},{item_id:'5_1'},{price:null},{price:0},{price:-1},{price:'10000'},{timestamp:null},{timestamp:stamp+1000}])assert.equal(Box.prices([{...rows[0],...patch}],'梦江南',['5_24430'],now).length,0);
assert.throws(()=>Box.items({data:[]}));const items=Box.items({pages:1,total:2,list:[{id:'5_1',Name:'测试',CanTrade:true},{id:'bad',Name:'伪资料'}]});assert.equal(items.rows.length,1);assert.equal(items.rows[0].tradable,true);
const s=M.demo(),m={id:'box_test',name:'测试',itemId:'5_24430',roleId:s.roles[0].id,catalogSource:'jx3box',server:'梦江南',pricingMode:'latest',quantity:3,date:M.dateKey(),tradable:true};s.materials.push(m);s.priceQuotes.push({...q,id:'box_quote',name:m.name,kind:'material',sourceName:'JX3BOX 小时行情',sourceType:'listing',validForHours:24});M.validateState(s);
assert.equal(ROI.stock(s,m,new Date(now)).reference,83970);assert.equal(ROI.stock(s,m,new Date(now+25*3600000)).estimate,null);m.tradable=false;assert.equal(ROI.stock(s,m,new Date(now)).reference,null);m.tradable=true;s.roles[0].server='长安城';assert.equal(ROI.materialQuote(s,m,new Date(now)),null);m.pricingMode='manual';m.unitPrice=100;m.priceDate=M.dateKey();assert.equal(ROI.materialQuote(s,m,new Date(now)),null);assert.equal(s.records.some(r=>r.id==='box_test'),false);
console.log('PASS JX3BOX currency, exact item/server, stale, bound, role transfer and validation');
