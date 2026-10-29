'use strict';
module.exports={
  appId:'io.github.cherishxie.jx3workbench',productName:'剑网三工作台',
  directories:{app:'.desktop-stage',output:'release'},
  files:['package.json','*.cjs','assets.json','web/**/*'],asar:true,npmRebuild:false,
  electronDownload:{checksums:require('electron/checksums.json')},
  mac:{artifactName:'JW3-Workbench-macOS-${arch}-v${version}.${ext}',icon:'desktop/icons/icon.icns',target:[{target:'dmg',arch:['arm64','x64']}],category:'public.app-category.productivity',identity:null},
  win:{artifactName:'JW3-Workbench-Windows-${arch}-v${version}.${ext}',icon:'desktop/icons/icon.ico',target:[{target:'nsis',arch:['x64']}],signExecutable:false},
  nsis:{oneClick:false,allowToChangeInstallationDirectory:true,deleteAppDataOnUninstall:false,createDesktopShortcut:true},
  publish:null
};
