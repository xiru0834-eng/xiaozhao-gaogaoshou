# 校招高高手

把公司、公开内推线索和投递进度放在一个本地工作台里。支持完整网页和贴边悬浮助手，沿用「薄荷石墨 · 轻量工作台」的视觉风格。

这是邀请制的 Windows 源码分享版，不是在线多人系统，也不是免安装 EXE。仓库提供程序和公共公司清单；每个人的投递记录保存在自己的电脑上。

## 已有功能

- 公司搜索，性质、行业、投递状态等组合筛选；最近新增、截止日期分组与排序。
- 推荐码复制、招聘入口、详情、明暗主题和紧凑视图。
- SQLite 保存进度，支持「无合适岗位」；提供导出和备份入口。
- 可选桌面悬浮助手：贴边收起、固定、切换下一家、与完整版共享本机进度。
- 悬浮助手的今日计数记录状态变更，不代表已在招聘官网完成真实投递。

初始目录包含 315 家公司，是 2026-09-20 的分享快照，不是 315 个已核实仍开放的岗位。内推码为历史公开线索，未在本次分享时逐条实测，须核对公司、批次、届别和有效期。本应用不会自动投递、读取短信或联系招聘人员。笔试/面试日程备忘录尚未实现。

## 首次使用

1. 请维护者邀请你的 GitHub 账号，接受邀请后才能访问私有仓库。不要把登录令牌写进命令或发给他人。
2. 准备 Windows、Git 和 Python。当前代码在 Windows + Python 3.13.15 验证；没有验证 macOS/Linux。建议使用独立、可写的本地目录。
3. 在 PowerShell 执行：

```powershell
git clone https://github.com/xiru0834-eng/xiaozhao-gaogaoshou.git
cd xiaozhao-gaogaoshou
python -m venv .venv
.\.venv\Scripts\python.exe launcher.py
```

完整版仅使用 Python 标准库，会打开浏览器访问 `http://127.0.0.1:18763/`。不要直接双击 `index.html`，文件模式不能正常连接数据库。

可选：使用悬浮助手。

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe launcher.py --companion
```

悬浮助手依赖 pywebview、Windows .NET 环境与 WebView2 Runtime。缺少环境时按 [pywebview 官方安装说明](https://pywebview.flowrl.com/guide/installation.html)安装；悬浮窗口启动失败时程序会尝试打开完整版，并记录原因。请勿从不明网站下载 DLL。

## 获取后续更新

维护者把新版本提交并推送后，在这个仓库目录中执行：

```powershell
git status --short
git pull --ff-only
```

若有本地代码改动或提示冲突，请停止并联系维护者，不要使用强制覆盖命令。`--ff-only` 在历史发生分叉时拒绝合并，见 [Git 官方说明](https://git-scm.com/docs/git-pull)。

更新前先通过应用导出一份数据库备份到仓库之外，并确认页面显示保存完成。关闭页面不等于后台服务退出；更新 Python 文件后需要重启服务。不会识别对应进程时，可保存其他工作、正常重启 Windows，再从同一个目录启动本应用。不要删除数据库来解决启动问题。

这不是实时推送：目前需要维护者主动发布、朋友主动拉取。维护者个人台账的每日自动更新尚未接入这个分享仓库。

## 个人数据与使用边界

- 第一次使用会在本机创建空白 `qiuzhao.db`；不会获得维护者的投递记录。
- `qiuzhao.db`、备份、日志、浏览器缓存、窗口设置和今日计数均不进入 Git。普通拉取更新不替换这些文件；`.gitignore` 不是数据备份，也不能阻止人为强制添加文件。
- 不要把整个已使用的应用目录打包发给别人；分享仓库链接即可。不要在 Issues、截图或日志中泄露简历、电话、身份证、验证码和个人申请链接。
- 同一台电脑只运行一个安装目录。本版固定使用端口 18763；启动另一份副本可能复用旧服务，而不是自动切换到新目录。
- 不要把本地端口暴露到公网或做端口转发；这不是具备多用户认证的服务器产品。
- 岗位和内推信息仅供查找线索，填表须使用自己的真实资料；最终结果以招聘官网为准。

## 开发与验证

测试需要 Git，以及 PATH 中的 Node.js（用于运行页面实际 JavaScript；应用运行本身不需要 Node）。

```powershell
.\.venv\Scripts\python.exe -X utf8 -m unittest -v
```

测试使用临时数据库和隔离端口，不应启动或改写日常台账。开发预览可运行 `python preview_isolated.py --port 18764 --seconds 600`，然后访问 `http://127.0.0.1:18764/`；预览数据退出后丢弃。

主要文件：`index.html` 完整工作台与公共清单；`companion.html` 悬浮助手；`launcher.py` 启动；`app.py` 本地存储服务；`test_*.py` 回归测试。

发布范围与验证记录见 [共享与更新说明](docs/共享与更新说明.md)。本仓库暂未选择公开开源许可证；第三方依赖仍遵守各自许可证。
