# 自动岗位与内推更新：本地框架与 API 方案

日期：2026-09-20。状态：**设计提案，尚未实现或启用**。基线 `2219e8c`，承接阶段 3 工程版及 T13–T18，不把设计接口标成可用接口。

## 1. 目标与边界

用户在自己的电脑配置模型服务、搜索服务、求职条件、时区和限额后，应用定期发现岗位与公开内推信息，核验来源、保存增量并展示报告。Git 分发代码和公开来源配置；个人 Key、投递记录及运行数据库不通过 Git 同步。

设计假设：Windows 单用户、本地优先；默认悉尼时间 07:00；用户可以修改时间和时区；自动采集默认关闭；首次启用确认外部服务、发送内容及额度。自动收集不等于自动接纳，更不等于自动投递。

- 做：定向官网复查、搜索发现新线索、公开原文读取、岗位/内推提取、确定性核验、待核验队列、追加更新、预算和运行报告。
- 不做：填写申请、试投验证推荐码、读取短信、登录绕过、私人联系信息搜集、远端同步个人资料、自动 git pull 并执行代码。
- 本地关机时不能执行；恢复可运行环境后按规则补一次。若必须关机也准时运行，需要另立云端方案，不在本轮托管用户密钥。

## 2. 为什么不能只接一个普通模型 API

现有 ModelService 是 OpenAI 兼容 Chat Completions 文本通道。它没有搜索工具或原生联网适配器。传入“帮我找今天的岗位”不能替代有来源的真实搜索。

| 能力 | 职责 | 第一版选择 |
|---|---|---|
| SearchProvider | 找 URL、摘要、候选日期，返回线索 | 独立搜索 API；先试 Tavily，Brave 为替换候选，不预设中文招聘召回优劣 |
| SourceAdapter / SourceReader | 核验公司归属并读取允许访问的原文 | 官方详情/公开列表优先；沿用网络边界，逐站适配 |
| ModelService | 将公开正文转为带原文证据的字段 | 复用用户自选兼容接口；不让模型决定 URL 安全、预算或直接写库 |
| DiscoveryRunner | 安排步骤、去重、预算、检查点、失败处理 | 确定性 TypeScript 流程，不先引入多 Agent 框架 |
| Scheduler / Dispatcher | 判断到期并唤起运行 | 应用计算 IANA 时间；Windows 任务只唤起本地执行器 |

如果用户只配置模型 Key，没有搜索服务：仅能定向检查已登记来源，界面必须写“未启用搜索发现”。如果某个模型服务提供原生联网能力，可以以后实现 SearchProvider 适配器，经过真实引用/费用/取消验收后再复用同一 Key；普通兼容协议不自动获得这一能力。

本应用不能借用当前 Codex 会话里的搜索工具给所有下载者免费联网。搜索服务与模型服务的费用分别由用户账号承担，具体价格和国内网络可达性在接入前确认。

## 3. 一条统一流水线

```text
手动检查 / 定时到期
        ↓
读取已确认配置 → 领取日任务 → 预留预算
        ↓
搜索新线索 + 复查存量岗位（两个独立队列）
        ↓
URL 与公司/租户核验 → 安全读取原文 → 快照与内容哈希
        ↓
结构化解析优先 → 必要时调用模型提取字段
        ↓
岗位硬条件 / 内推适用范围 / 时效 / 证据检查
        ↓
差异候选：新增 / 更新 / 重复 / 待核验 / 明确关闭
        ↓
人工接纳 或 用户已启用的受限自动接纳
        ↓
同库事务提交 → 本机增量报告 → 页面刷新
```

现有 `CollectionService`、`SourceReader`、`ModelService`、`CollectionStore` 可复用，但不能直接外面套一个 cron：当前只接受最多 3 个已登记来源、20 次 HTTP 请求、3 次模型尝试，预算仅单轮内存计数，且同一资料有独占锁。

新增 `DiscoveryRunner` 作为父运行协调器，调用重构后的同一来源处理函数；原手动接口继续维持现有限额和响应。父运行的全局预算必须覆盖所有子批次，不得通过每批 3 来源绕过总限额。旧运行不自动升级成每日任务。

## 4. 搜索与覆盖策略

### 4.1 两条队列分别工作

1. **发现队列**：公司/岗位族/招聘批次的固定模板查询，以及公司+批次+内推关键词。先 24 小时，不足且尚有预算时扩 7 天、30 天。每次扩窗记录理由；不会为凑数量无限搜索。
2. **复核队列**：已保存的官方职位、公开内推来源，按距上次检查时长、截止紧迫性和用户关注排序，不加“最近发布”限制。防止只搜新帖而漏掉仍开放的旧岗位。

模板例子：`公司名 2027 校招 Agent 大模型 RAG`、`公司名 2027 校招 内推码 推荐码`。查询只含公开公司名、方向、届别，不含姓名、手机、邮箱或简历。

对 315 家公司不能在小预算下承诺每天逐家穷尽。按互联网/模型公司、游戏、硬件汽车、其他行业 AI 团队轮转；用户关注与临近截止优先。界面记录每家公司 lastCheckedAt、nextCheckDueAt，显示覆盖、未覆盖及积压数量；配置过小导致轮转周期无法达标时明确警告。

### 4.2 搜索结果不是事实

- 日期过滤是搜索端线索，不等于核实发帖日期。保存原页 publishedAt、firstDiscoveredAt、lastCheckedAt；缺发布日期就是 null。
- 24h/7d 搜索仍可能漏掉无日期页面，故保留周期性不带日期的官方入口复查。Brave 的 `pm` 是 31 天，若产品口径是 30 天应映射显式日期范围，不能偷换。
- 只见摘要的线索可进入“待核验”，不直接成为可投岗位或有效推荐码；聚合页尽量回溯原始来源。
- 相同 query+provider+筛选配置缓存建议 6 小时；页面 ETag/Last-Modified 可用时条件读取。正文/适配器/提取 schema/模型版本未变可复用提取；求职条件变化只重新跑本地匹配规则。
- 条件请求和缓存不能使过期原文自动满足 24 小时接纳门槛；必须记录这次确实成功的服务器核验及其对应正文。

### 4.3 登记来源不是任意 URL 代理

新 URL 先存发现队列，不自动放宽现有白名单。已审阅公司官方域名和 ATS 租户，可以由适配器验证列表到详情的关系后登记精确 URL；新域名/租户/公司关系进入人工待核验。

飞书/Moka/北森等共享域名不能只按整个主域信任：绑定公司、租户路径或子域、官方跳转证据、允许的详情路由和内容类型。详情 ID 来自已核验页面，不由模型编造。新适配器走源码审阅，不从网页下载执行脚本。

继续 HTTPS、DNS 全地址检查并固定已核验 IP、重定向逐跳复核、robots/访问限制、体积与超时约束。登录/验证码/动态空壳显示受限；第一版不增加无人监督浏览器抓取。不把 robots 允许当成所有再分发用途的授权。

## 5. 岗位与内推分开建模

### 岗位身份与更新

- 主键优先 `(ATS provider, tenantId, officialJobId)`；无可靠 ID 才用适配器核验的规范 URL。
- 不能通用删除 URL 的 query/hash；其中可能是岗位 ID。城市作为岗位地点集合；相同 ID 多城市不凭城市重复建岗，不同 ID 同标题不能直接合并。
- 当前 `sourceId|URL` 记录通过 identity_aliases 迁移映射保留历史；存在歧义只生成合并建议，不批量删除旧岗。
- 新公司只追加，原公司排序/首次日期不重写；已有岗位写 observation 和前后差异，不更改个人已投事实。公司级“已投”不能推定该公司所有新岗位均已投。
- 超时、403、404、搜索不到只说明本次核验失败，不自动标关闭；明确官方停止申请/截止证据才产生关闭候选。过期信息保留历史，不删除。

### 内推记录

```typescript
// 设计草案；实现前需要补运行时 schema。
interface ReferralRecord {
  id: string;
  companyId: string;
  kind: "code" | "link";
  value: string; // 原样保留大小写和安全的公开推荐参数
  campaign: "campus" | "social" | "internship" | "unknown";
  cohort: string | null; // 例如 2027；不能按当前年份猜
  scope: { jobIds: string[]; allCompanyJobs: boolean | null };
  publishedAt: string | null;
  expiresAt: string | null;
  firstDiscoveredAt: string;
  lastCheckedAt: string;
  provenance: "official" | "traceable_author" | "aggregator" | "unknown";
  validity: "officially_stated" | "claimed_unverified" | "unknown" | "expired" | "suspected_expired";
  evidenceIds: string[];
  applicationTested: false; // 本功能不做试投
}
```

`provenance` 与 `validity` 分离：可追溯到作者不证明其员工身份；官方链接存在也不证明某个码有效。官方明确公布且适用范围/期限有证据时标“官方声明有效，未试投”；员工或其他作者公开声称有效时标“来源称有效，未实测”；不明就待核验。

唯一性采用公司+招聘批次/届别+码/公开链接的适配后指纹，多个出处合并成多条证据。批次未知不能跨批次合并。不得跨公司通用复用，不把校招码套给社招；仅“可内推，私信我”记录“需联系”，不虚构码或采集私人电话号码。

公开 referral token 只允许通过特定 ATS 适配器识别并保存为公开推荐链接；不能为了它全局允许 token 参数。resumeId/userId/session/登录凭证一类私人申请链接不采集。内推来源变了保留原证据并重新定级，不悄悄覆盖历史有效性。

## 6. 自动接纳政策

提供两个独立设置：`collectionEnabled` 与 `acceptancePolicy`。第一版默认“自动收集、人工确认”；后续经真实样本达标后可选择 `trusted_new_only`。

受限自动接纳只处理：已审阅官方详情、确定公司/岗位身份、证据完整、开放状态明确、应届毕业窗口/学历/经验等适用性无硬缺口的新增岗位。薪资或发布日期未披露可以是 null，不为补全制造字段。

- 新公司性质不明、歧义身份、岗位关闭/关键资格变化均待审，不自动改变原公司元信息。
- 公开推荐码可以自动进入带等级的“内推线索”区域，但未知/声称有效不能自动变成默认推荐码；第一版不自动替换台账旧码。
- 所有接纳记录 actor=manual/policy、policyVersion、runId、evidenceIds、变更与回执；同一事务完成，崩溃不半写。
- 采集器没有个人进度存储的写入接口。改设置/停任务不会删已有结果。

## 7. 费用与失败控制

不是无限自我循环 Agent。先使用固定查询模板和有上限的阶段流水线；模型不能增加预算、切换服务商或扩展权限。

建议试点的单日初始上限（**待用户确认，不是已经授权的额度**）：20 次搜索请求、60 次网页 HTTP 请求、10 次提取尝试、运行 15 分钟；总模型 token 另设上限并受每次 maxTokens 限制。规模扩大必须看覆盖/成本数据后调整。搜索、重定向、robots、重试都计数；所有手动采集与定时采集共享每日账本，不能多点击绕过。

预算持久化：请求前事务预留 → 保存 attemptId → 发起调用 → 按使用量结算。服务端若不报告 usage，保留保守预留并显示“消耗未知”；取消、超时不承诺免计费。先实现可靠的请求数硬上限；准确的 token 预留需要已验证的模型 tokenizer/计费口径，不支持时不能把字符数估算冒充硬 token 封顶。人民币金额只是按已确认价格表估算，未知单价不显示 0 元、不承诺硬金额封顶，用户还应设置服务商侧额度。

- 模型调用发送后结果不确定：不盲目重试、不释放可能已消费的预留，标 ambiguous；用户决定是否重跑。
- 公共 GET 的短暂失败可在预算内最多重试 1 次，指数退避/尊重 Retry-After；401/403、验证码、付费余额不足、非法提取不自动重试。第一版搜索付费调用也不自动重发。
- 同主机建议至少 1 秒间隔，若 robots 要求更慢按更慢；读取并发最多 2，模型最多 1，兼容当前模型服务每分钟限制。积压可留到下次，不追求当天扫完所有公司。
- Key 或 endpoint/model/search provider 改变使原定时授权失效，暂停并重新确认；减少限额可立即收紧，增加限额需重新确认。运行固定配置/来源/规则版本，停用时取消并禁止后续新请求。
- 日志记录阶段、错误码、来源 ID、耗时和用量，不记录 Key、完整个人资料、认证链接或完整模型请求。公开正文按必要范围留存，受来源用途约束；磁盘达到配额停止而非静默删除证据。

## 8. 定时：关闭页面后也能工作，不能双进程争用数据库

### 单一拥有者

现有 runtime-config 会对一份资料持有数据库独占锁，不能让“网页服务”和“定时 worker”分别打开并写同一资料。

目标是一个 `LocalEngine` 同时承载 HTTP、采集队列和调度判断。Windows 的小型 `Dispatcher` 只负责：找到本用户、本资料的 engine → 通过受当前用户权限保护的本机 IPC 请求 `checkDue` → 若无 engine，隐藏启动一个。启动竞态继续由原资料锁挡住，失败方不杀进程、不尝试别的资料。

IPC 第一候选是有用户 ACL 的 Windows 命名管道，只允许 ping/checkDue；不开放任意文件路径、外部 URL 或运行命令。必须验收其他用户拒绝、profileId/instanceId 校验及假实例拒绝；若不能实现安全通道，不以开放无鉴权 loopback 端点替代。CLI/任务 XML 不携带 API Key。

### 到期算法

- 存 `timeZone="Australia/Sydney"`、`localTime="07:00"`、启用时间、nextDueAt UTC、scheduleId；不能固定写死 UTC+10。
- 在机器在线且用户会话可用时，任务计划程序每 5 分钟唤起 dispatcher；engine 内可用定时唤醒提高精度。唤起只检查本地时间，未到期不调用搜索或模型。
- 去重键 `(profileId, scheduleId, scheduledLocalDate)`；配置版本不放入日键以免同日改配置重复消费。手动运行有独立 requestId，但与定时共用并发锁和日预算。
- 事务领取任务后写租约、owner 和 fencing token。恢复过期租约前确认旧实例不能继续提交；每个写入/外部调用前检查租约，旧 owner 不能靠迟到响应入库。
- 夏令时重复时刻只取第一次，跳过的时刻取当天第一个有效时刻；用 IANA 日历运算并冻结时钟测试。07:00通常不落在跳变段，但配置支持其他时刻也须覆盖。
- 错过执行：仅补最新一个到期时段，最多回看 24 小时；更早的写 missed，不连续补几十次。首次启用不追补启用前任务；当天已领取/完成不因重启再开新任务。失败不无限自动重跑；用户重跑复用日预算并保留原失败记录。

### 系统状态与产品说明

第一版使用当前用户登录会话，不保存 Windows 密码，不使用 SYSTEM。关闭浏览器不影响 engine；锁屏是否持续执行需真机验收；注销、DPAPI 不可用或关机时不承诺执行。睡眠唤醒是独立可选项，默认关闭，硬件和电源策略可能限制它。

Windows 的 StartWhenAvailable 可帮助补错过的时间任务，但有系统延迟，不能作为产品的日键去重逻辑。用户应看到“预计下次检查”与“实际开始”，而非保证 07:00:00 精确完成。无需电脑在线的方案要用云端，另行评估成本和密钥托管。

## 9. 内部契约与本机 API（提案）

既有 `/api/collection-runs`、`/api/update-batches/*`、`/api/model-settings`、`/api/status` 保持兼容；不增加未验证的任意 URL 参数。

```typescript
interface SearchInput {
  query: string;
  window: "24h" | "7d" | "30d" | "any";
  maxResults: number;
}
interface SearchHit {
  url: string; title: string; snippet: string;
  providerDate: string | null; discoveredAt: string;
}
interface SearchOutput {
  hits: SearchHit[];
  requestId: string | null;
  usage: { units: number | null; unit: "credits" | "requests" };
}
interface SearchProvider {
  // 凭据由后端注入，不放在 input 或前端响应。
  search(input: SearchInput, signal: AbortSignal): Promise<SearchOutput>;
}
type AcceptancePolicy = "review" | "trusted_new_only";
interface DiscoveryInput {
  requestId: string;
  expectedSettingsRevision: number;
  intent: "discover" | "recheck" | "both";
}
// 后端从已确认配置加载来源范围、所有预算和能力；客户端不能自报无限预算。
interface RunAccepted { runId: string; state: "queued"; reused: boolean }
```

统一响应 `{profileId, ...result}`；失败 `{profileId,error:{code,message}}`，不回传堆栈/凭据。400结构错误、403会话/资料拒绝、409版本/并发/重复冲突、422未配置或未授权、429本地预算、503本地存储不可用。付费 POST 不在客户端自动重发。

| 本机接口 | 输入/输出要点 | 行为 |
|---|---|---|
| GET/POST `/api/search-settings` | 读取脱敏配置；保存需 expectedRevision、provider、keyAction | 只保存，不发起搜索；换 provider 须重新绑定 Key |
| POST `/api/search-tests` | expectedRevision、requestId；后端固定公开查询 | 用户显式点击才消费一次，返回结果数/可达性，不宣称召回达标 |
| GET/POST `/api/discovery-settings` | companyIds、角色/行业范围、时间窗、预算、acceptancePolicy、expectedRevision | 原子保存，未知字段拒绝；保存不等于开启任务 |
| POST `/api/discovery-runs` | DiscoveryInput → 202 RunAccepted | 持久化父任务，手动/定时走同一 service |
| GET `/api/discovery-runs[/:id]` | 分页或单条，stage、覆盖、计数、用量、错误、版本 | 记录计划与实际执行，不把部分失败隐藏成成功 |
| POST `/api/discovery-runs/:id/cancel` | 空对象 → 当前状态 | 中止后续工作，费用未必为零 |
| GET `/api/discoveries` | 游标、状态过滤 → 待核验 URL/公司归属/摘要 | 搜索候选不直接当 job |
| POST `/api/source-approvals` | discoveryId、预期版本、经过支持适配器校验的归属 | 本地用户确认，不能注册任意可执行适配器 |
| GET `/api/referrals` | 公司/批次/有效性筛选及游标 | 返回码/公开推荐链接、适用范围、等级及来源 |
| GET/POST `/api/schedule-settings` | enabled、IANA zone、HH:mm、missedPolicy、wakeFromSleep、revision/授权版本 | 启用须确认当前外部服务和限额；停用撤销本应用任务并取消采集 |
| GET `/api/update-reports` | 日期/运行 ID/游标 | 查看本机每日结果、未覆盖原因和下次时间 |

全部 HTTP 读取/修改仍使用现有 Host/Origin、会话 token 和 profileId 边界。所有列表 limit≤100，游标绑定筛选和稳定排序；所有写请求有 revision 或幂等 ID。任务触发专用 IPC 不复用浏览器会话令牌。

上表是范围契约，不是已发布 OpenAPI。每个切片实现前补齐该接口的严格 TypeScript 输入/输出、运行时校验、错误码和契约测试；未补齐的接口不提前接入生产页面。

## 10. 存储演进

继续 SQLite，不为单机引入 Redis、消息队列、微服务。拟新增数据实体，实际 schema 在对应切片中先写迁移测试：

- `discovery_runs / work_items`：父任务、阶段、检查点、租约与幂等键。
- `search_hits / fetch_observations`：搜索发现与真实读取分开，含时间来源和访问结果。
- `referrals / referral_evidence / job_referrals`：原码、多个来源及明确范围关系。
- `identity_aliases / source_approvals`：新旧岗位身份映射、已审阅归属与适配器版本。
- `usage_reservations / usage_events / schedule_occurrences`：持久化预算、请求尝试、日键与处理结果。

它们由唯一 engine 写 `catalog.db`，迁移先做一致性备份、版本检查、事务执行和完整性验证；个人 `qiuzhao.db` 不增加采集写权限。密钥分别以当前用户 DPAPI 加密，非密设置带修订号，DB 运行保存其版本快照。Git 忽略所有运行时资料。

第一版不静默清理证据或突破当前 1000 次运行保护；后续定量归档需验证引用完整和恢复步骤。用户可导出脱敏诊断，不默认导出原始公开推荐 token 到共享日志。

## 11. 用户能看见的结果

设置页需要分开呈现：模型已连接、搜索已连接、定时开关、下次执行、每日额度、自动接纳政策；不能只给一个“AI 已启用”。

每日摘要展示：计划/实际检查公司数、发现/核验岗位数、新增/变更/重复/待核验、内推来源及可信度、失败来源、近截止提醒、搜索次数/模型 tokens/未知用量。示例数字只能用测试数据，正式页面来自持久化统计。

全部来源失败显示“本次检查失败”；部分受限显示“部分完成”；只有完成目标检查且没有可靠增量才显示“无可靠新增”。关闭通知不关闭采集，关闭采集不删除结果；设置变更不修改个人投递状态。

## 12. 先实现哪里与验收

先补当前 C9 真实模型/岗位门槛，搜索接口的离线开发可先准备，但自动采集不能因离线测试通过就开启。

| 切片 | 最小可见交付 | 主要文件范围（含测试，≤5） | 验收 |
|---|---|---|---|
| D1 | 搜索配置保存、脱敏、清除 | shared/search-contract、server/search-settings、search-api、http、search-settings.test | 错资料拒绝；Key不回显；保存零请求；并发/写失败保留 |
| D2 | 用户点击测试搜索，显示真实链接 | search-client、search-api、client/search-settings、main、search-client.test | 模拟错误/429/超时和真实小额中文试点分开；不自动重发 |
| D3 | 搜索发现列表，尚不入库 | discovery-store、discovery-service、discovery-api、http、discovery.test | 日期分开、URL去重、分页、归属待审；无证据不推荐 |
| D4 | 一个已审阅列表→详情适配 | source-adapters、source-registry、source-document、discovery-service、adapter.test | 同公司/租户绑定；跨租户/私有/会话链接拒绝；真实详情可读 |
| D5 | 内推线索及适用范围可追溯 | shared/referral-contract、referral-rules、referral-store、discovery-service、referral.test | 跨公司/批次不混用；码原样；出处失效/未知不升格 |
| D6 | 界面核对岗位与内推差异 | updates、updates-render、updates-view、updates.css、updates-flow.test | 可看原始证据，人工接纳，不覆盖旧码/已投状态 |
| D7 | 跨手动/定时的持久化预算 | budget-store、model-service、search-client、collection-service、budget.test | 重启不重置；发送后超时不退未知费用；耗尽停止 |
| D8 | 独立 engine 与安全触发 | engine、main、dispatcher、runtime-config、engine.test | 网页与后台同一拥有者；假实例/其他用户拒绝；竞态不双写 |
| D9 | 时区日键、断点和补跑 | schedule-policy、schedule-store、discovery-service、dispatcher、schedule.test | 夏令时/跨日/改时区/重复触发/宕机均有固定时钟测试 |
| D10 | UI 开关与 Windows 注册/卸载 | windows-scheduler、schedule-api、http、client/schedule-settings、scheduler.test | 无管理员/明文Key；显式确认；停用不留本应用触发器；不改旧任务 |
| D11 | 受限自动接纳与日报 | acceptance-policy、collection-store、discovery-service、client/update-report、daily-report.test | 只接纳符合策略新增；旧公司顺序与进度逐条不变；日报不误报 |
| D12 | 真实连续运行验收 | eval脚本、真实去敏fixture、集成测试、验收报告、tasks/todo | 至少20家公司/3类公开来源试点；两次真实定时执行；另一台电脑验证另列 |

每片先失败测试再实现，运行已有 `npm test`、`npm run build`，存储/桌面相关改动另跑 `npm run test:legacy`。命令保持现有可执行脚本，不在此声称已运行未创建的测试。新增大模块超过 5 文件必须再次拆分。

独立评测目标：至少 120 条人工复核记录，60 开发/60冻结，按公司/文档分组防泄漏，覆盖真实岗位、内推、未知、过期、跨批次、重复和攻击样本；报告真实/合成比例，不复用现有 synthetic reserve 冒充盲测。

硬门槛：个人记录零误改、公司历史顺序不变、重复接纳零新增、跨公司推荐码零误绑定、非法 URL 零访问、日志零 Key、网络错误零误下架、所有自动接纳有可回溯原文、预留预算不被重启绕过。

质量门槛提案：真实推荐 precision≥95%，同时报告召回率、unknown率、字段精度、内推绑定精度、覆盖率和样本分母；不允许只靠“全都未知”过关。试点中人工可见目标岗位召回率目标≥80%，不把它叫全网召回率。阈值未达先缩小可信来源，不开自动接纳。

功能目标：本机任务创建不等待外网，暖启动合成负载下 p95≤500ms；正常取消后不再派发新请求；20公司试点在配置上限内结束，超限标 partial；至少两次真实触发无重复执行。上述均为验收目标，不是目前的实测成绩。

## 13. 实施前需要用户确定的事项

1. 搜索服务及 Key：先试 Tavily 还是已有服务；两者官方文档不能替代中国招聘覆盖实测。
2. 单日调用次数/模型 token/服务商侧金额上限。
3. 定时是否启用、是否允许唤醒；默认07:00悉尼、最新时段补一次。
4. 自动收录先保持人工审核，还是在质量门槛通过后允许可信新增自动接纳。

本轮仅形成方案，不读取用户 Key、不安装依赖、不修改数据库、不注册任务、不改旧 Codex 自动化或桌面入口。

## 14. 查证依据（2026-09-20）

- [Tavily Search 官方文档](https://docs.tavily.com/documentation/api-reference/endpoint/search)：提供查询、日期窗、返回 URL/摘要及 usage。拟固定搜索深度，关闭自动参数和生成答案，以控制范围；功能存在不证明国内招聘覆盖足够。
- [Brave Web Search 官方文档](https://api-dashboard.search.brave.com/app/documentation/web-search)：支持日/周/月和自定义日期范围；作为可替换接口候选，未实测本项目效果。
- [Microsoft StartWhenAvailable](https://learn.microsoft.com/en-us/windows/win32/taskschd/tasksettings-startwhenavailable)：错过时间后的任务可以延迟执行，因此补跑需应用自行去重，不能保证准点。
- [Microsoft MultipleInstances](https://learn.microsoft.com/en-us/windows/win32/taskschd/tasksettings-multipleinstances)：系统支持任务实例策略，但它不能替代跨手动与定时入口的数据库领取与幂等。
- [Microsoft WakeToRun](https://learn.microsoft.com/en-us/windows/win32/taskschd/tasksettings-waketorun)：可请求从睡眠/休眠唤醒；本设计默认关闭，不承诺关机执行。

技能所指附带 definition-of-done/security-checklist 文件在本机未提供；以本文明确列出的边界、硬门槛和逐片验收作为实施约束。
