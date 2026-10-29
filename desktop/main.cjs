'use strict';
const {app,BrowserWindow,protocol,ipcMain,session,Menu,dialog,shell}=require('electron');
const fs=require('node:fs'),path=require('node:path');
const {createUpdater}=require('./updater.cjs');
const {createStore}=require('./store.cjs'),{ORIGIN,assetPath,trustedSender}=require('./security.cjs');
protocol.registerSchemesAsPrivileged([{scheme:'workbench',privileges:{standard:true,secure:true,supportFetchAPI:true,corsEnabled:true}}]);
if(process.env.JX3_DESKTOP_USER_DATA)app.setPath('userData',path.resolve(process.env.JX3_DESKTOP_USER_DATA));
let window;
if(!app.requestSingleInstanceLock())app.quit();
else{
  app.on('second-instance',()=>{if(window){if(window.isMinimized())window.restore();window.show();window.focus();}});
  app.whenReady().then(()=>{
    let store;
    try{store=createStore(app.getPath('userData'));}catch(error){
      dialog.showErrorBox('工作台数据未能读取',error.message+'\n原文件未覆盖。请先备份数据目录，并检查 workbench-storage.json 与 .bak 文件。\n'+app.getPath('userData'));app.quit();return;
    }
    const updater=createUpdater({directory:path.join(app.getPath('userData'),'updates'),bundledRoot:path.join(__dirname,'web')});
    let updateTimeout;
    ipcMain.handle('workbench:updates',async(event,action,id)=>{
      if(!trustedSender(event))throw Error('不受信任的更新请求');
      if(action==='check')return updater.check();
      if(action==='prepare')return updater.prepare();
      if(action==='ready'){if(id!==updater.current().manifest.id)return false;clearTimeout(updateTimeout);updater.ready();return true;}
      if(action==='installer'){await shell.openExternal('https://github.com/cherishXie/JW3-Work-Pages/releases');return true;}
      if(action==='activate'){const result=updater.activate();setTimeout(()=>{window?.webContents.reloadIgnoringCache();updateTimeout=setTimeout(()=>{updater.rollback();window?.webContents.reloadIgnoringCache();},30000);},100);return result;}
      throw Error('未知更新操作');
    });
    protocol.handle('workbench',async request=>{
      const snapshot=updater.current(),allowed=new Set([...snapshot.manifest.files.map(f=>f.name),'update-manifest.json']);
      const file=assetPath(request.url,snapshot.root,allowed);
      if(!file||!['GET','HEAD'].includes(request.method))return new Response('Not found',{status:404});
      const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.wasm':'application/wasm','.gz':'application/gzip','.txt':'text/plain; charset=utf-8','.json':'application/json','.webmanifest':'application/manifest+json','.png':'image/png'};
      const headers=new Headers({'Content-Type':types[path.extname(file)]||'application/octet-stream'});
      headers.set('Content-Security-Policy',"default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; worker-src 'self' blob:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-src 'none'; form-action 'none'");
      headers.set('X-Content-Type-Options','nosniff');
      headers.set('Cache-Control','no-store');
      try{return new Response(request.method==='HEAD'?null:await fs.promises.readFile(file),{headers});}
      catch{return new Response('Not found',{status:404});}
    });
    session.defaultSession.setPermissionRequestHandler((_contents,_permission,callback)=>callback(false));
    session.defaultSession.setPermissionCheckHandler(()=>false);
    // Renderer stays offline-only; the host updater performs fixed-channel GET requests.
    session.defaultSession.webRequest.onBeforeRequest({urls:['<all_urls>']},(details,callback)=>{
      callback({cancel:!details.url.startsWith(ORIGIN+'/')&&!/^(blob:|data:|devtools:)/.test(details.url)});
    });
    session.defaultSession.on('will-download',(_event,item)=>item.setSaveDialogOptions({title:'导出工作台文件',defaultPath:path.join(app.getPath('downloads'),path.basename(item.getFilename()))}));
    ipcMain.on('workbench:storage',(event,request)=>{
      try{
        if(!trustedSender(event))throw new Error('不受信任的存储请求');
        if(!request||!['get','set','remove'].includes(request.action))throw new Error('未知存储操作');
        const value=request.action==='get'?store.getItem(request.key):request.action==='set'?store.setItem(request.key,request.value):store.removeItem(request.key);
        event.returnValue={ok:true,value};
      }catch(error){event.returnValue={ok:false,error:error.message};}
    });
    function createWindow(){
      window=new BrowserWindow({width:1440,height:1000,minWidth:390,minHeight:600,title:'剑网三工作台',backgroundColor:'#111111',show:false,
        webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,sandbox:true,nodeIntegration:false,webSecurity:true,webviewTag:false}});
      window.webContents.setWindowOpenHandler(()=>({action:'deny'}));
      window.webContents.on('will-navigate',event=>event.preventDefault());
      window.webContents.on('will-attach-webview',event=>event.preventDefault());
      window.once('ready-to-show',()=>window.show());
      window.on('closed',()=>{window=null;});
      window.loadURL(ORIGIN+'/');
    }
    Menu.setApplicationMenu(Menu.buildFromTemplate([
      ...(process.platform==='darwin'?[{role:'appMenu'}]:[]),
      {label:'文件',submenu:[{label:'打开本机数据目录',click:()=>shell.openPath(app.getPath('userData'))},{type:'separator'},{role:process.platform==='darwin'?'close':'quit'}]},
      {label:'编辑',submenu:[{role:'undo'},{role:'redo'},{type:'separator'},{role:'cut'},{role:'copy'},{role:'paste'},{role:'selectAll'}]},
      {label:'视图',submenu:[{role:'reload'},{role:'togglefullscreen'},{role:'resetZoom'},{role:'zoomIn'},{role:'zoomOut'}]},
      {role:'windowMenu'}
    ]));
    createWindow();app.on('activate',()=>{if(BrowserWindow.getAllWindows().length===0)createWindow();});
  }).catch(error=>{dialog.showErrorBox('工作台启动失败',error.message);app.quit();});
  app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit();});
}
