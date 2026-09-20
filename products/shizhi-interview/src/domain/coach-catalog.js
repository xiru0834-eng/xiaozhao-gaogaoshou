/** Original oral-practice prompts and reference cues, grouped by learning topic. */
export const COACH_TRACKS = Object.freeze([
  { id: 'network', title: '计算机网络', subtitle: 'HTTP · TCP · HTTPS', icon: '↗', source: 'https://developer.mozilla.org/en-US/docs/Web/HTTP', questions: [
    ['HTTP 的 GET 和 POST 有哪些语义区别？', '安全性与幂等性是方法语义；GET 用于读取，POST 提交处理；不能仅凭方法声称数据加密或安全。'],
    ['TCP 为什么需要三次握手？', '同步双方初始序列号；确认双方收发能力；讨论历史重复连接请求，而非仅背次数。', 'https://www.rfc-editor.org/rfc/rfc9293.html#section-3.5'],
    ['HTTP 缓存中的强缓存与条件请求有什么区别？', 'Cache-Control 与新鲜度；ETag/If-None-Match；Last-Modified；304 复用已缓存的表示。'],
    ['HTTPS 如何保护 HTTP 通信？', 'TLS 提供传输机密性和完整性；证书验证服务器身份；区分非对称认证和会话对称加密。'],
    ['TCP 是字节流，这会给应用层协议带来什么问题？', '没有应用消息边界；读取不等于一条消息；使用定长、分隔符或长度前缀处理拆包与合包。', 'https://www.rfc-editor.org/rfc/rfc9293.html#section-3.7'],
    ['HTTP/2 多路复用解决了什么问题，还存在哪些限制？', '同一连接多条流；帧交错；仍依赖 TCP，丢包可能阻塞共享连接中的流。'],
    ['Cookie、Session 和 JWT 分别解决什么问题？', 'Cookie 是浏览器存储与发送机制；Session 保存服务端状态；JWT 是令牌格式；讨论失效和撤销。'],
    ['接口重试时，如何避免同一笔业务被重复执行？', '幂等键和唯一约束；原子地检查与保存业务结果；重试返回已保存结果；考虑超时和并发。'],
  ] },
  { id: 'database', title: '数据库', subtitle: '索引 · 事务 · SQL', icon: '▤', source: 'https://www.postgresql.org/docs/current/mvcc.html', questions: [
    ['数据库索引为什么能加速查询，它的代价是什么？', '减少扫描范围；有序结构支持查找；占用存储且增加写入维护成本；取决于选择性和查询计划。'],
    ['事务的 ACID 分别是什么意思？', '原子性、一致性、隔离性、持久性；一致性依赖约束与正确业务逻辑；用转账说明失败行为。'],
    ['脏读、不可重复读和幻读分别是什么？', '读取未提交值、同一行前后值不同、同一条件结果集变化；结合事务隔离级别讨论。'],
    ['MVCC 如何改善数据库读写并发？', '多版本与快照可见性；减少读写互斥；旧版本清理成本；不等于所有写入无需锁。'],
    ['如何排查一条 SQL 为什么变慢？', '执行计划与真实耗时；扫描行数、索引选择、排序和连接；锁等待、数据规模和统计信息。'],
    ['联合 B-tree 索引的列顺序为什么会影响查询？', '按多列顺序排列；领先列过滤和范围约束影响扫描范围；用具体查询与执行计划验证。', 'https://www.postgresql.org/docs/current/indexes-multicolumn.html'],
    ['乐观锁和悲观锁适合哪些场景？', '版本号或条件更新检测冲突；悲观锁先占用资源；冲突率、事务长度与重试代价。'],
    ['分页数据量很大时，OFFSET 可能有什么问题？', '跳过大量行仍有工作量；游标或键集分页；稳定排序和唯一决胜列；不能直接跳任意页。'],
  ] },
  { id: 'java', title: 'Java 基础', subtitle: '集合 · JVM · 并发', icon: '{ }', source: 'https://docs.oracle.com/javase/tutorial/essential/concurrency/', questions: [
    ['HashMap 如何定位一个键，哈希冲突如何处理？', '哈希与桶索引；equals 判断相同键；冲突容器与扩容；实现细节应注明 Java 版本。', 'https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/HashMap.html'],
    ['为什么重写 equals 时通常也必须重写 hashCode？', '相等对象须返回相同哈希值；相同哈希值不保证相等；影响哈希集合查找与去重。'],
    ['volatile 能解决哪些并发问题，不能解决哪些？', '可见性与特定的排序保证；不保证复合操作原子性；i++ 仍需同步或原子变量。'],
    ['synchronized 和 ReentrantLock 有什么区别？', '互斥与可见性；自动释放与 finally 解锁；可中断、超时、条件变量等能力差异。'],
    ['线程池为什么要设置队列容量与拒绝策略？', '限制资源和排队时延；阻止无限堆积；根据负载选择拒绝或背压；监控活跃数和队列。'],
    ['内存泄漏和内存溢出有什么区别？', '不再需要的对象仍被引用；溢出是分配失败现象；结合堆转储、引用链和内存增长排查。'],
    ['垃圾回收中，如何判断一个对象是否可回收？', '从 GC Roots 做可达性分析；强弱引用区别；循环引用本身不一定泄漏；避免把引用计数当作 JVM 通用机制。'],
    ['ConcurrentHashMap 为什么适合并发访问？', '并发访问的可见性与原子操作；实现随版本变化；组合 get/put 不自动原子，使用 compute 或 putIfAbsent。'],
  ] },
  { id: 'redis', title: 'Redis 与缓存', subtitle: '过期 · 一致性 · 高并发', icon: 'ϟ', source: 'https://redis.io/docs/latest/develop/', questions: [
    ['Redis 常见的数据类型分别适合什么场景？', 'String、Hash、List、Set、Sorted Set；匹配计数、对象字段、队列、去重和排行榜；说明复杂度。'],
    ['缓存穿透、击穿和雪崩分别是什么？', '不存在数据反复查询；热点键失效；大量缓存同时失效或服务不可用；对应空值或布隆、互斥与过期打散等方案。'],
    ['缓存与数据库双写时，为什么容易出现不一致？', '并发与故障导致操作交错；cache-aside 先更新库再失效缓存仍有窗口；结合重试、版本与业务容忍度。'],
    ['Redis 的过期时间和内存淘汰策略有什么区别？', '到期失效与达到内存上限时的处理；淘汰策略作用范围；不能把所有缓存丢失都归因于过期。'],
    ['使用 Redis 做分布式锁，需要注意哪些问题？', '原子加锁与租约；唯一持有者标识；原子校验后释放；租约过期与暂停，可考虑 fencing token。'],
    ['RDB 和 AOF 的持久化有什么取舍？', '快照与写命令记录；恢复时间、磁盘开销和数据丢失窗口；取决于配置和故障类型。'],
    ['Redis 主从复制是否能保证所有写入都不丢失？', '异步复制与故障切换窗口；确认语义与持久化不同；根据一致性需求设计业务。'],
    ['热点 Key 和大 Key 会造成哪些问题？', '负载倾斜、网络与内存开销、慢操作；监控定位；拆分、局部缓存或数据结构调整须评估一致性。'],
  ] },
])

/** Resolves a configured topic to the built-in track, or null for a custom topic.
 * @param {string} topic Persisted practice topic.
 * @returns {object|null} Matching track.
 */
export function coachTrack(topic) {
  return COACH_TRACKS.find((track) => topic === `拾知 · ${track.title}`) || null
}

/** Supplies source-linked cues for an exact original prompt.
 * @param {string} prompt Saved question text.
 * @returns {object|null} Reference cues, without an inferred model score.
 */
export function coachReference(prompt) {
  for (const track of COACH_TRACKS) {
    const question = track.questions.find(([text]) => text === prompt)
    if (question) return { cues: question[1], source: question[2] || track.source }
  }
  return null
}
