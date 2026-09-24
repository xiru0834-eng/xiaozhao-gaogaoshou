# 校招高手桌面版（Windows x64）

[English](README.md) | 中文

## 安装与使用

运行 `Xiaozhao-Setup-0.1.2-x64.exe`，选择安装位置，然后双击「校招高手」快捷方式。安装包包含 Electron、Node 24.21.0、校招工作台、面试陪练和运行依赖，使用者不需要 Git、Node、npm 或 pnpm。安装目录内的整个 `win-unpacked` 文件夹也能直接运行；不能只复制其中的 EXE。

首次打开可填写 DeepSeek 密钥和阿里云百炼北京地域密钥，也可以先体验公司台账与题库。千问使用 `qwen3-asr-flash` 转写录音，需要联网，免费额度和计费取决于用户账号。AI 点评和模拟面试同样需要用户自己的有效模型配置。点击窗口菜单 **校招高手 → 模型与语音配置** 可以修改密钥；留空保留，勾选清除才删除。保存配置会重启工作台，请先保存正在编辑的内容。其他模型继续通过应用内 **设置 → 模型** 管理；桌面保存的 DeepSeek 密钥优先于 Harness 中同名密钥。

关闭最后一个窗口会停止后台，再次打开会恢复本机记录。重复打开快捷方式会聚焦已有窗口。程序只监听 `127.0.0.1`，首次自动分配端口，重启时优先复用；端口冲突会自动换用空闲端口。外部招聘网站在默认浏览器打开，文件导出使用系统保存对话框。桌面版语音使用千问，不依赖浏览器厂商的语音识别服务。

这是未签名的测试安装包，Windows 可能显示未知发布者提示。当前没有自动更新；更新时退出程序，再安装新版。当前版本只构建 Windows x64，桌宠仍是独立入口。安装、升级和卸载默认保留用户数据。

## 数据与配置

正式版的数据根目录为 `%APPDATA%\XiaozhaoShizhi`，开发启动使用独立的 `XiaozhaoShizhi-Dev`。菜单 **打开数据文件夹** 可直接进入。桌面版不会读取源码目录里的 `.env`，不会自动复制旧网页版的个人记录或 API Key。

- `data/profiles/web/data/shizhi-interview/`：面试数据库、校招数据库与备份。
- `data/`：Harness 会话、模型配置及工作区信息。
- `desktop-credentials.json`：首次配置页的密钥，经 Electron `safeStorage` 使用 Windows 用户凭据加密；不能直接复制到另一台电脑解密。

备份前关闭桌面程序，复制整个数据根目录。迁移旧版练习时先备份两边，人工迁移数据文件，保留桌面版自己的 profile 配置和插件链接；不要把源码版的整个运行目录覆盖进来。安装包通过文件白名单生成，不打包 `.env`、个人数据库、缓存、录音或开发数据。运行依赖和许可证清单随包保留在 `resources/backend/runtime-inventory.json` 及各依赖目录；Electron 和 Node 许可证也包含在发行文件中。

## 从源码构建

开发者需要 Windows x64、Node 24.14 或更新的 24.x、npm，并在完整仓库根目录执行：

```powershell
npm ci
npm run coach:install
npm run desktop:install
npm run desktop:prepare
npm run desktop
```

完成验证后运行 `npm run desktop:dist`。安装包输出到 `products/shizhi-desktop/release/`。修改界面、后端或桥接插件后，需要先重新运行 `desktop:prepare`。Electron Shell 的 `src/` 修改可直接重新打包。Node 下载校验固定 SHA256，Electron 下载校验其 npm 包中的官方校验值。

GitHub 二进制下载不可用时，可设置带版本目录的 HTTPS 镜像再运行 Electron 准备脚本；文件仍须通过同一官方校验：

```powershell
$env:ELECTRON_MIRROR = 'https://npmmirror.com/mirrors/electron/44.4.5/'
npm --prefix products/shizhi-desktop run prepare:electron
```

## 验证与实现

在本目录运行 `npm test`、`npm run test:runtime`、`npm run test:lifecycle` 和 `npm run test:desktop`。运行时测试从开发工具被移出 PATH 的环境启动真实 `dsh web`，验证鉴权、题库、校招页面、数据重开、端口冲突和正常退出。生命周期测试验证父进程丢失。Electron 测试使用临时数据和软件渲染，覆盖首次配置、全宽顶部布局、历史会话弹窗及焦点恢复、模型设置、插件页返回、陪练切换、全局浅色/深色/跟随系统、工作台明暗控件、刷新后偏好恢复、导出菜单点击区域、窄窗口及渲染隔离，并输出验收截图；它不测量实际麦克风或模型点评质量。

[后台启动器](src/backend.mjs)调用发行包里的正式 `dsh web` CLI；[桥接插件](bridge/index.mjs)通过父子 IPC 通知就绪和退出。首次运行只创建本机 profile 和两个插件 junction，不运行包管理器。主窗口不启用 Node 集成，启用沙箱和上下文隔离；只有本地配置页拥有受限 preload。麦克风权限仅开放给本机工作台的音频请求。原有网页版和它的数据目录不受桌面启动影响。

更多练习和岗位功能见[面试陪练说明](../shizhi-interview/README.zh.md)。打包工具参考 [Electron 安全指南](https://www.electronjs.org/docs/latest/tutorial/security)与 [NSIS 配置](https://www.electron.build/nsis/)。
