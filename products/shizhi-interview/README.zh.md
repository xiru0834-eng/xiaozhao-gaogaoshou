---
description: "本地校招工作台，支持公司关联面试练习、语音作答和 Harness 模型点评。"
kind: "package-bundle"
---

# 校招高高手 × 拾知面试陪练

[English](README.md) | 中文

## 概述

首页整合校招高高手的公司清单、投递记录和拾知面试陪练。筛选公司、记录投递进度，再点 **准备面试**，为你确认的目标岗位练习。内置计算机网络、数据库、Java、Redis 四个方向的 32 道原创问题，支持口述或文字作答、查看反馈和重新回答。数据保存在本机 SQLite，AI 点评使用 Harness 中配置的模型。

## 目录

- [使用本产品](#use-this-package)
- [实现方式](#understand-the-implementation)
- [模型体验](#model-experience)
- [已知限制与后续工作](#known-limitations-and-deferred-work)
- [进一步了解](#further-exploration)
- [开发说明](#dev-note)

<a id="use-this-package"></a>

## 使用本产品

### 启动本地产品

使用 Node 22.19 或更新版本，并确保 Git、npm、pnpm 可用。本产品在校招高高手仓库内运行，直接使用根目录的 `src/` 和 `web/`。需要完整 Git 克隆，构建会对照 [career-upstream.json](scripts/career-upstream.json) 中的已验证版本校验这些源码。

```powershell
git clone --branch feat/shizhi-interview-integration https://github.com/xiru0834-eng/xiaozhao-gaogaoshou.git
cd xiaozhao-gaogaoshou
npm run coach:install
npm run coach
```

已有源码目录时切换到本分支，跳过克隆。打开 Harness 输出的本地私有链接。**新建会话**返回 **校招工作台**，顶部还可切换 **面试陪练** 和 **直接聊聊**，无需选择工作区。每次开始练习会创建独立会话；已有记录仍可从侧栏的 **拾知 · 面试陪练**查看。浏览公司、记录投递与保存回答无需模型密钥；聊天与 AI 点评需要在 **设置 → 模型** 中配置密钥。按 Ctrl+C 停止服务。

启动脚本构建前端，首次运行时将此目录作为链接 bundle 安装进隔离的 `web` profile，再通过正式的 `dsh web` 入口启动，默认地址为 `127.0.0.1:4317`。`SHIZHI_PORT` 可修改端口，`DSH_HOME` 可覆盖默认的产品内 `.dsh-home` 目录。请勿公开包含令牌的启动链接。

### 练习与复盘

在公司卡片点 **准备面试**，填写目标岗位，再选择练习方向。点评使用已确认的岗位背景；回到这家公司可以查看关联练习和已保存的分数。题目是通用知识练习，不是经核实的公司真题。练习不会改变投递状态。315 家公司来自上游历史快照，截止时间、岗位和推荐码请在招聘官网核实。整合版使用独立的投递数据库，不自动导入朋友已有的个人记录。

提交时先保存回答，再请求模型点评。请求进入队列不代表点评已完成：Harness 对话区会显示失败，点击 **重新请求点评** 可继续评价已保存的回答。**重新回答** 会新增作答记录，不覆盖旧回答。**针对回答追问一题** 会让模型基于已有回答出一道追问。**结束并保存** 即使未配置模型也能归档，练习档案支持导出含公司与岗位信息的 Markdown。修改知识练习主题时保留公司关联。

### 语音输入

浏览器支持时可直接使用语音识别。它可能将音频发送给浏览器厂商，依赖浏览器支持、麦克风权限与网络连接。提交前请检查可编辑的转写文本。题目朗读使用浏览器语音合成与可用的系统音色。

如需独立服务，将 `.env.example` 复制为 `.env` 并同时填写下面两个变量。接口参考 [Speaches 转写](https://github.com/speaches-ai/speaches/blob/master/docs/usage/speech-to-text.md)，需要先在该服务中安装模型。

```dotenv
SHIZHI_ASR_URL=http://127.0.0.1:8000/v1/audio/transcriptions
SHIZHI_ASR_MODEL=your-installed-model-id
SHIZHI_ASR_API_KEY=
```

修改 `.env` 后重启产品。转写密钥只留在服务端。录音在内存中暂存并发送到配置的服务，本产品不保存音频文件。默认限制为 180 秒、8 MiB，转写请求超时为 60 秒。插件的 `speech` 配置可覆盖 `url`、`model`、`apiKeyEnv`、`maxSeconds`、`maxBytes`、`timeoutMs`。录音界面会在使用前显示服务地址。

### 数据与检查

本节路径相对于 `products/shizhi-interview`。练习数据默认位于 `.dsh-home/profiles/web/data/shizhi-interview/interview.sqlite`，旁边的 `career/` 目录保存 `catalog.db`、`qiuzhao.db` 和 `profile-id`。工作台导出菜单可分别下载公司目录和投递进度备份；完整保留产品数据目录才能保留公司关联练习。Harness 对话数据在同一个隔离 home 内。Git 忽略密钥、构建产物、依赖和本地数据。已有拾知用户可先停止旧服务，再将 `DSH_HOME` 指向原来的数据目录后启动本分支；不要同时让两个服务使用同一个数据目录。

```powershell
cd products/shizhi-interview
npm run verify
```

该命令构建两套前端和复用的上游存储模块，运行领域、存储、陪练及语音回归测试，并检查 JavaScript 语法。整合测试覆盖稳定公司标识、SQLite 重开后进度、可用备份、公司关联点评上下文、路由鉴权和进行中请求的清理。自动测试不衡量模型点评质量或实体麦克风识别效果。

<a id="understand-the-implementation"></a>

## 实现方式

<details>
<summary>展开实现细节</summary>

bundle 通过 [cordis.patch.yml](cordis.patch.yml) 插入一个插件。[陪练命令](src/application/coach-commands.js) 管理内置练习流程，[题库](src/domain/coach-catalog.js) 管理题目与带来源的参考要点。[智能体桥接](src/adapters/dsh/agent-event-bridge.js) 投递会记录到 Harness 日志的消息，既有原子工具保存模型反馈。内置陪练会话仅允许使用面试工具。[语音输入](src/client/features/voice-answer.js) 管理可编辑草稿，[服务适配器](src/infrastructure/speech-provider.js) 负责服务端转写，无需修改 Harness 的智能体循环。

[校招构建脚本](scripts/build-career.mjs) 打包上游 TypeScript 界面、CatalogStore 和 Store，不修改原仓库；同源 iframe 隔离样式。两个前端适配器将请求转给已鉴权的 Harness 路由，并将选中的公司交给拾知。[校招路由](src/adapters/http/career-routes.js) 校验写入并提供关联历史，[存储适配器](src/infrastructure/career-repository.js) 从目录解析公司的稳定标识。可选的 `config.target` 将公司与岗位保存在现有练习 JSON 内，旧练习无需迁移。更新上游版本时，需要检查适配器并更新固定版本后再构建。

</details>

<a id="model-experience"></a>

## 模型体验

点评请求明确指定已有题目和作答，要求模型读取存档并避免重复创建回答。每次新请求附带已记录的范围提示：普通问候和知识问答不恢复历史点评，只有明确的练习请求进入练习流程。模型按当前请求回答，不向普通用户列出内部工具与记录编号。内置题目附带参考要点。分数是模型给出的练习反馈，不代表录用概率。固定题目的选择与归档无需推理；追问、讲解和个性化评价需要可用的模型。

<a id="known-limitations-and-deferred-work"></a>

## 已知限制与后续工作

这是中文桌面浏览器首版，尚无订阅、支付、账号或生产托管。没有接入上游 Python 伴随服务、岗位爬虫、自动排序和独立模型设置服务。浏览器识别不保证离线；本地转写服务需要单独安装。点评可靠性仍需真实用户评估。参考讲解按题目存储，评价按每次回答存储。本 bundle 与原版 `dsh-interview` 共享工具和路由名，不能同时启用。

<a id="further-exploration"></a>

## 进一步了解

[第三方说明](NOTICE.md) 记录 MIT 面试代码基础、工作台来源和接口参考。固定版本的工作台未提供公开再分发许可证，本包设置 `private: true` 以阻止 npm 发布。[DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 提供运行时、模型配置、会话日志与插件生命周期。

<a id="dev-note"></a>

## 开发说明

<details>
<summary>维护者信息</summary>

包处于 private 状态，作为 `products/` 下的独立目录维护，运行时版本由锁文件固定。包名必须与构建脚本中的浏览器模块名一致。浏览器验证使用启动 overlay 提供的页面内目录选择器。

</details>
