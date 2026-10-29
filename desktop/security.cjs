'use strict';
const path=require('node:path');
const ORIGIN='workbench://app';
function assetPath(raw,root,allowed){
  try{
    const url=new URL(raw);
    if(url.protocol!=='workbench:'||url.hostname!=='app'||url.port||url.username||url.password)return null;
    const name=decodeURIComponent(url.pathname)==='/'?'index.html':decodeURIComponent(url.pathname).slice(1);
    if(!allowed.has(name)||name.split('/').some(x=>x==='..'||x==='.')||name.includes('\\'))return null;
    const resolved=path.resolve(root,name);return resolved.startsWith(path.resolve(root)+path.sep)?resolved:null;
  }catch{return null;}
}
function trustedSender(event){
  const frame=event.senderFrame;
  return !!frame&&frame===event.sender.mainFrame&&frame.url.split('#')[0]===ORIGIN+'/';
}
module.exports={ORIGIN,assetPath,trustedSender};
