# 开发与分支发布

本仓库是应用公开开发仓库，默认分支为 dev。本地工作目录的 origin 应为 cherishXie/JW3-Work-Pages，日常开发、提交、推送都使用 dev。

## 日常修改

```sh
git switch dev
npm ci
npm run setup
npm test
npm run build:pages
git add <本次修改的文件>
git commit -m "说明本次修改"
git push
```

也可使用 `npm run publish:pages:public` 校验后推送 dev。仅在本地 commit 不会触发 GitHub Actions。

每次推送 dev 自动更新开发页面及开发客户端 Release。稳定页面和 main 保持原样。

- 稳定页面：https://cherishxie.github.io/JW3-Work-Pages/
- 开发页面：https://cherishxie.github.io/JW3-Work-Pages/dev/
- 两个地址同源，浏览器本地存储由它们共用。验证须使用独立浏览器上下文；如需在主浏览器尝试开发版，请先导出备份。

## 大版本发布到 main

1. 在 dev 完成并验证本次版本，更新 package.json 和 package-lock.json 的版本号。main 只接收 major 或 minor 升级，例如 0.2.0 → 0.3.0 或 1.0.0。
2. 在 CHANGELOG.md 增加 `## [新版本号]`，记录新增、改进、修复及需要用户注意的迁移事项，至少有一条具体更新。
3. 提交并推送 dev，等待该提交的 Actions 全部通过。
4. 执行 `npm run release:main`。它检查工作区干净、已同步 dev、main 是当前提交祖先、版本升级及更新记录，通过测试后才将当前 dev 提交快进至 main。本地仍留在 dev。不要默认执行此命令或自动合入 main。
5. main 的 Actions 更新稳定页面，保留开发页面；生成正式客户端 Release，并附上此次 CHANGELOG。验证失败的构建不会公开客户端 Release。

本地 pre-push hook 阻止普通 main 推送；只有显式发布命令才放行。GitHub main 工作流也独立检查版本及更新记录。历史正式版本不覆盖，后续日常改动仍进入 dev。

## 部署结构

公共仓库 main/dev 保存可开发源码。gh-pages 仅保存白名单静态产物，根目录是稳定快照，dev/ 是开发快照。Pages 使用 GitHub Actions 部署组合快照。部署任务串行执行，逐字节核对两个线上快照。

所有客户端按平台独立提供 EXE 或 DMG，文件名包含平台、架构和版本。dev 产生带 `-dev.<构建号>` 后缀的预发布构建；main 产生无此后缀的正式版。客户端内部版本、文件名和网页更新清单均按频道区分，package.json 保留下一次正式发布的基础版本。0.2.1 起支持界面与业务资源的应用内更新；原生壳升级仍需新安装包，现阶段没有签名或 Apple 公证。

## 私人文件与迁移边界

data/、output/、docs/、本机截图和备份、.private-source.git/、.public-migration/ 全部忽略。不要公开私人文件。公开源文件采用 scripts/public-source.cjs 白名单；新开发文件须主动扩充清单及对应 .gitignore 条目。

本机 Git 元数据备份目录 .private-source.git/ 不得添加、推送或删除。

## 更新资源与兼容性

build:pages 为完整公共资源生成 update-manifest.json（文件大小与 SHA-256）、version.js 与版本化 sw.js，部署保持 main/dev 独立。只允许 GET 检查更新，不上传业务数据。更改原生桥能力且旧壳无法兼容时，必须同步提升 scripts/update-build.cjs 的 protocol，不能通过普通资源更新调用旧壳没有的能力。

Electron 的 desktop/updater.cjs 只从固定公共 Pages 频道下载允许类型的资源，禁止原生代码、目录穿越、跨频道和摘要不匹配。更新不增加安装包压缩合集，Release 继续按平台独立提供 EXE / DMG。

验证：npm run test:updates；npm run build:desktop 后可运行 npm run test:updates:browser。在本机设置 JX3_PRIVATE_QA=1 使用指定布局数据的只读副本，JX3_TEST_DESKTOP=1 同时验证实际 Electron 更新与重启；公共 CI 仅使用生成的示例数据。
