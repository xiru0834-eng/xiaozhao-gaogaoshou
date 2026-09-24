# Python 兼容工具与桌宠

这里保留旧版 Python 台账、悬浮助手，以及连接 TypeScript 工作台的可选 Windows 桌宠。完整的校招与面试桌面产品使用 [Electron 版](../shizhi-desktop/README.zh.md)；日常新功能在 TypeScript 工作台和面试陪练中开发。

## 目录

- 当前目录：Python 模块、旧版 `index.html` / `companion.html`、可选依赖 `requirements.txt`。
- `tests/`：兼容台账、窗口、资料迁移与 TypeScript 连接的 Python 测试。
- `scripts/`：隔离预览、显式资料迁移及原生窗口验证。
- 共享图片与桌宠帧保留在仓库根目录 `assets/`，TypeScript 编译产物在根目录 `dist/`。

## 旧版台账与悬浮助手

以下命令均在仓库根目录执行，需要 Windows 和 Python。完整网页只使用 Python 标准库，打开固定端口 `18763`。

```powershell
python products/legacy-desktop/launcher.py
```

可选悬浮助手还需要 pywebview、Windows .NET 与 WebView2 Runtime：

```powershell
python -m pip install -r products/legacy-desktop/requirements.txt
python products/legacy-desktop/launcher.py --companion
```

**目录整理不迁移数据。** 兼容台账继续使用仓库根目录原有的 `qiuzhao.db`、`backups/`、日志和窗口偏好；页面从本目录读取，素材从根目录 `assets/` 读取。不要删除数据库或复制一份空库覆盖原记录。此前指向根目录 Python 脚本的快捷方式需要改为这里的新路径；Electron 桌面快捷方式不受影响。

## 连接 TypeScript 的可选桌宠

先构建工作台并显式配置已迁移的外部资料，再运行：

```powershell
python products/legacy-desktop/desktop_runtime.py --config "配置文件绝对路径"
```

`--companion` 打开悬浮助手，`--full` 打开对应完整工作台。配置默认位于 `%LOCALAPPDATA%\XiaozhaoGaogaoshou\desktop-settings.json`；缺少有效配置时拒绝启动，不创建空白资料。数据仍由配置中的 `dataDir` 指定。准备条件与历史验收范围见 [桌面接入记录](../../docs/桌面统一升级与桌宠接入-20260921.md)。

迁移工具位于 `scripts/migrate-desktop-profile.py`，要求明确的源库和新资料目录；使用前先备份。它与 Electron 数据导入是不同流程，不会自动把旧记录导入 Electron。

## 验证与预览

需要 Git、Python、Node 24.x 以及已安装的根目录 npm 依赖。先在根目录构建 TypeScript 后端，再运行测试：

```powershell
npm run build
npm run test:legacy
```

等价的测试发现命令是 `python -X utf8 -m unittest discover -s products/legacy-desktop -q`。测试使用临时数据库；旧页面的部分 JavaScript 检查也需要 Node。

有限时长的独立预览使用临时资料，退出后丢弃：

```powershell
python products/legacy-desktop/scripts/preview_isolated.py --port 18764 --seconds 600
```

打开 `http://127.0.0.1:18764/`。请勿直接双击旧 HTML 页面，文件模式无法访问本地数据库。原生窗口验证工具为 `scripts/verify-desktop-native.py`，需要可选窗口依赖。
