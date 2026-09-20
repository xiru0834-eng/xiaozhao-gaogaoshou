# 执行清单：本地 AI 岗位更新

## 当前阶段 1 执行切片

- [ ] S1：资料路径、稳定身份、运行锁及崩溃恢复。
- [ ] S2：进度库版本、显式无损导入与失败回滚。
- [ ] S3：公司目录数据库、别名精确去重、只追加初始化。
- [ ] S4：同资料身份 HTTP 契约、分页与追加接口。
- [ ] S5：工作台统一读取动态目录及实际浏览器验收。

范围、各项门槛与证据约定：[阶段 1 规格](../docs/阶段1-数据基础.md)。

状态：AI 更新任务均未完整实现；前置 TS 工作台/状态服务迁移已完成，详见 [迁移记录](../docs/TypeScript迁移.md)。先审阅 [计划](plan.md) 和 [规格](../docs/本地AI更新功能规格.md)。每个任务先补失败测试/固定输入，再实现；任务结束记录实际证据，不凭描述勾选。

文件列表为预期主要文件，不表示已经存在；单个任务超过 5 个文件时先拆分。新增业务与测试均用 TS；新测试由 `npm test` 发现，Python 回归独立保留。所有阶段文档同步写入本文件结果记录。

## A · 第一批：保护原数据与独立运行

### T01 · 固定回归与数据安全基线

- [ ] 依赖：无。范围 S：`tests/types.test.ts`、`tests/legacy-contract.test.ts`、`tasks/todo.md`。
- [ ] 验收：原状态枚举、接口响应与错误拒绝有契约测试；临时旧库含每种状态、中文名称/特殊字符；根目录测试可发现新测试。
- [ ] 验证：`npm test`、`npm run build`、`python -X utf8 -m unittest -q`；用已知错误响应证明契约测试能失败；不读取或写入真实个人库。

### T02 · 统一运行配置与实例隔离

- [ ] 依赖：T01。范围 M：`src/server/runtime-config.ts`、`src/server/main.ts`、`src/server/http.ts`、`tests/runtime-config.test.ts`、`tasks/todo.md`。
- [ ] 验收：源码与数据路径分开；测试可指定目录/端口；错误配置身份不复用服务、不强杀进程。
- [ ] 验证：两个临时配置分别启动/写入/重开互不影响；旧状态接口契约通过；原后端摘要测试按计划 A 的顺序替换，不直接删保护。

### T03 · 显式导入旧进度与恢复

- [ ] 依赖：T02。范围 M：`src/server/profile-migration.ts`、`src/server/runtime-config.ts`、`tests/profile-migration.test.ts`、`tasks/todo.md`。
- [ ] 验收：一致性备份；空目标导入；非空目标拒绝覆盖；导入失败原库和原入口仍可用。
- [ ] 验证：临时旧库全量 `(name,status,updated_at)` 比对、`integrity_check=ok`；模拟中断/权限失败/重复导入均不丢记录。

**检查点 A0：T01–T03 是下一次首先实施的范围。通过后展示证据，再进入后续；本阶段不接模型、不迁移真实台账。**

## A · 第二批：统一目录

### T04 · 只读种子与目录存储

- [ ] 依赖：T03。范围 M：`src/server/catalog-store.ts`、`seed/catalog.json`、`tests/catalog-store.test.ts`、`tasks/todo.md`。
- [ ] 验收：当前目录一次性去敏导出为可信种子；315 家名称/顺序/已有日期不变；稳定 ID、别名、追加序号与幂等初始化。
- [ ] 验证：全部种子字段比对、双次初始化不重复、未知值不猜测；个人库未被打开写入。

### T05 · 完整版读取目录服务

- [ ] 依赖：T04。范围 M：`src/server/catalog-api.ts`、`src/server/http.ts`、`src/client/main.ts`、`tests/catalog-api.test.ts`、`tasks/todo.md`。
- [ ] 验收：先定义请求/响应；页面保留视觉和筛选，统一从服务读目录；获取失败明确提示，不覆盖本地状态。
- [ ] 验证：真实浏览器看旧目录、临时新增、筛选与导出；本机请求校验、分页和错误路径测试。

### T06 · 悬浮助手读取同一目录

- [ ] 依赖：T05。范围 M：`src/desktop/catalog-bridge.ts`、`src/desktop/window.ts`、`tests/desktop-window.test.ts`、`tests/catalog-sync.test.ts`、`tasks/todo.md`。
- [ ] 验收：动态新增在两端一致；选择与保存仍正确；不能把另一配置的活动计数混入。
- [ ] 验证：隔离环境中两端互相看见新增/状态变更；贴边/固定/今日计数回归；修改中的 UI 不被后台刷新覆盖。

**检查点 A：原应用功能无回归、目录来源唯一。**

## B · 设置与模型连接

### T07 · 求职设置与密钥存储

- [ ] 依赖：T06。范围 M：`src/server/settings.ts`、`src/server/secrets.ts`、`src/server/settings-api.ts`、`tests/local-settings.test.ts`、`tasks/todo.md`。
- [ ] 验收：默认关闭自动任务；仅必要求职条件；密钥独立保护、不回显、可清除；所有配置调用有本机会话校验。
- [ ] 验证：临时配置重开、非法字段、第三方 Origin/无 token 请求被拒绝；日志/JSON 不含测试密钥；真实密钥不进入测试用例。

### T08 · 设置页面与模型连接测试

- [ ] 依赖：T07。范围 M：`src/server/model-client.ts`、`src/server/http.ts`、`src/client/main.ts`、`tests/model-client.test.ts`、`tasks/todo.md`。
- [ ] 验收：可配置一种明确支持协议的模型并测试；连接错误分类；无模型时旧台账继续可用；请求限时/限输出并脱敏。
- [ ] 验证：mock 的正确/错误密钥、429、超时、非法结构/不兼容模型；用户选择提供者和额度后只做最小真实调用。Ollama 可拆为后续独立任务。

**检查点 B：连接路径可用，不把“连通”当作提取质量达标。**

## C · 手动采集完整流程

### T09 · 官方来源安全读取

- [ ] 依赖：T08。范围 M：`src/server/source-fetch.ts`、`src/server/source-registry.ts`、`tests/source-fetch.test.ts`、`tests/fixtures/fetch_cases.json`、`tasks/todo.md`。
- [ ] 验收：先支持一个无需登录公开来源；超时/体积/重定向有限；禁止内网、凭据 URL、非 HTTP(S) 和网页提示词控制。
- [ ] 验证：200/404/429/登录/超时/重定向到内网等固定样本；实际官方页只读请求，记录访问证据。

### T10 · 结构化提取与确定性核验

- [ ] 依赖：T09。范围 M：`src/server/job-extract.ts`、`src/server/job-rules.ts`、`tests/job-extract.test.ts`、`tests/fixtures/jobs_gold.json`、`tasks/todo.md`。
- [ ] 验收：建立版本化、分层的 60 例评测集；字段绑定证据、未知不补猜；硬性不符不得被模型分数覆盖。
- [ ] 验证：40 开发/20 冻结样本分别出报告；模型返回截断/非法 JSON/诱导文本等拒绝测试；报告精确率与不确定率。

### T11 · 运行、差异预览与幂等入库

- [ ] 依赖：T10。范围 M：`src/server/update-store.ts`、`src/server/collector.ts`、`src/server/updates-api.ts`、`tests/update-batches.test.ts`、`tasks/todo.md`。
- [ ] 验收：runId 可追踪；候选与已接纳分离；批次原子接纳/版本冲突显式报错；采集器没有个人状态写入路径。
- [ ] 验证：重复接纳零重复、中途失败不半写、取消不误报完成、回滚不影响个人库；异步调用不阻塞台账保存。

### T12 · 更新中心与真实手动试点

- [ ] 依赖：T11。范围 M：`src/server/http.ts`、`src/client/main.ts`、`tests/update-flow.test.ts`、`docs/更新流程验收.md`、`tasks/todo.md`。
- [ ] 验收：设置→立即检查→进度→证据/差异→入库→重开全过程可见；至少 3 家真实官方来源跑通，两端看见新增。
- [ ] 验证：浏览器和悬浮窗证据；断网、无额度、全失败与零新增明确区分；若 API Key 不可用，仅标模拟通过，真实门槛不勾选。

**检查点 C：用户可手动完成一次真实更新。通过前不注册每日任务。**

## D · 搜索新公司与内推

### T13 · 搜索提供者与发现队列

- [ ] 依赖：T12。范围 M：`src/server/search-client.ts`、`src/server/discovery.ts`、`src/server/settings.ts`、`tests/discovery.test.ts`、`tasks/todo.md`。
- [ ] 验收：一个搜索适配器；真实预算/凭据先确认；24h/7d/30d 搜索与官方回溯；清单外公司可进入待核验区。
- [ ] 验证：缓存、分页/限额、摘要非官方、搜索失败、别名和重复链接；真实中文岗位小批试验报告，不自动扩大付费调用。

### T14 · 内推绑定与来源试点扩充

- [ ] 依赖：T13。范围 M：`src/server/referral-rules.ts`、`src/server/source-registry.ts`、`tests/referrals.test.ts`、`docs/来源覆盖报告.md`、`tasks/todo.md`。
- [ ] 验收：公司/批次绑定、原来源、有效性等级；约 20 家/至少 3 类来源；没有可靠码即显示未找到。
- [ ] 验证：跨公司/过期/推广线索不能自动提升为已验证；多城市同 ID/不同 ID、来源不通、重复公司测试；报告实测覆盖与限制。

**检查点 D：来源与模型质量有证据，不能只看新增条数。**

## E · 每日自动运行

### T15 · 可重入的单次 worker 与预算

- [ ] 依赖：T14。范围 M：`src/server/worker.ts`、`src/server/run-policy.ts`、`src/server/collector.ts`、`tests/worker.test.ts`、`tasks/todo.md`。
- [ ] 验收：界面与后台调用相同流程；按配置加锁；可取消、持久化记录、异常退出恢复；每次重试纳入预算。
- [ ] 验证：双触发、进程中断、租约过期、余额/限额耗尽、幂等重试，不重复入库、不无限重试。

### T16 · Windows 定时与补跑

- [ ] 依赖：T15。范围 M：`src/server/scheduler.ts`、`src/server/worker.ts`、`src/server/settings.ts`、`tests/scheduler.test.ts`、`tasks/todo.md`。
- [ ] 验收：显式启用/禁用/卸载；IANA 时区；关机后只补跑一次；当前用户运行，不保存 Windows 密码。
- [ ] 验证：冻结时钟覆盖悉尼夏令时、跨日和时区变更；先审批临时计划任务并真实触发，再验证禁用后不运行。

### T17 · 自动接纳策略与每日结果

- [ ] 依赖：T16。范围 M：`src/server/run-policy.ts`、`src/server/updates-api.ts`、`src/client/main.ts`、`tests/daily-summary.test.ts`、`tasks/todo.md`。
- [ ] 验收：采集与自动入库开关分开；只有通过验收来源的证据完整新增可自动入库；展示最近成功、待核验、失败与下次运行。
- [ ] 验证：真实观察至少两次计划触发；并发手动运行不双写；失败不能报零新增成功；旧状态在更新前后逐条不变。

**检查点 E：后台运行的效果有证据，而不只是注册成功。**

## F · 分享与正式切换

### T18 · 干净用户、程序升级与退出后台

- [ ] 依赖：T17。范围 M：`README.md`、`docs/安装与升级验收.md`、`tests/upgrade.test.ts`、`package.json`、`tasks/todo.md`。
- [ ] 验收：新用户不依赖维护者环境；升级后自己的数据完整；未授权不切换真实日常台账/旧自动化、不推送远端。
- [ ] 验证：干净 Windows 用户或另一台电脑实测克隆→配置→采集→重开→更新；Git 秘密扫描；卸载定时任务后不再后台调用。

## 结果记录

- 2026-09-20：完成规划和代码事实检查；原 70 项测试通过。上述 T01–T18 全部仍为待实现，未产生新功能通过证据。
- 2026-09-20，技术路线调整：工作台与后端基础已迁 TS，新版 12 项测试及严格构建通过，保留旧版 70 项回归；T01–T18 的动态目录、导入、桌面同步及 AI 流程还未完成，不因此勾选。后续模块路径已改为 TS 规划路径。
