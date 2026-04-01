# Runtime Session Durable Memory And Sqlite-Fs Cutover Technical Solution (Draft)

- Status: draft
- Date: 2026-04-02
- Owner: AI-Agent
- Scope: `runtime session durability / local memory storage / interactive shell + sidecar / provider default cutover`
- Related Inputs:
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-memory-semantics/module-overview.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-memory-provider-loading/module-overview.md`
  - `.repo-ai-governor/draft/memory-module-technical-solution.md`
  - `.repo-ai-governor/draft/memory-provider-pluginization-technical-solution.md`
  - `packages/core-session/src/shared-session-manager.ts`
  - `packages/core-orchestration-service/src/local-orchestration-service-session-runtime.ts`
  - `packages/memory-providers/fs-csv/src/fs-csv-memory-store-provider.ts`
  - `packages/memory-providers/sqlite-fs/src/sqlite-fs-memory-store-provider.ts`

## 1. 目的

本方案解决一个已经在真实交互场景中暴露出来的运行时稳定性问题：

1. 长时间运行的 `review/run` 任务会持续向 session 写入事件。
2. 当前 session 主存储默认仍是 `fs-csv`。
3. `fs-csv` 即使加入锁与原子替换，也仍然属于“整表读写 + 整体重写”模型。
4. 一旦 session 记录在长任务中途暂时不可读、被旧快照覆盖或被异常写入链打断，运行中的 turn 就会在收尾阶段报：
   - `Session "<id>" was not found in memory store.`

本方案的目标不是再做一轮局部补丁，而是直接给出长期终局：

1. 运行时 session truth 不再建立在 `CSV` 整体重写之上。
2. 本地运行时默认切到 `sqlite-fs`。
3. session 数据模型从“整份 session blob 重写”演进到“append-only event log + summary/projection”。
4. `fs-csv` 退出运行时真值角色，只保留为兼容/导出/低频诊断能力。

## 2. 问题定义

### 2.1 真实故障表现

在交互 shell 中，用户发起长时间运行的 `CR` 后，可能出现以下序列：

1. 长任务已经真实执行了较长时间。
2. 前台 shell 为了继续附着，自动创建了一个新 session。
3. 原始 turn 最终在收尾阶段失败：
   - `Session "<id>" was not found in memory store.`

这说明问题不只是前台 UI 恢复不够好，而是后端 session canonical source 在运行中失去了连续性。

### 2.2 当前根因链

当前实现中同时存在 3 个会放大该问题的因素：

1. `SharedSessionManager` 当前仍按“读整份 session -> 改整份 payload -> 回写整份 session”工作。
2. `fs-csv` provider 的底层持久化单位是整张 CSV 文件，而不是单条事件。
3. session 生命周期中的事件写入非常频繁：
   - `TURN_SUBMITTED`
   - `TURN_STREAM_DELTA`
   - `TURN_COMPLETED / TURN_FAILED`
   - `updateContext`

也就是说，当前运行时把“高频、长生命周期、多进程可见”的 session 事实，压在了一个本质上更适合低频配置/导出用途的存储模型上。

## 3. 目标

### 3.1 必须达成

1. 活跃 session 一旦创建，不应因为并发写入、长任务收尾或 sidecar/shell 共存而“从主存储消失”。
2. 长时间运行的 `review/run` 必须能稳定持续写入事件，并在结束后可靠读回。
3. 本地运行模式保持 `local-first`，不引入额外 server 依赖。
4. CLI、desktop host、local orchestration service 继续通过统一 memory provider loading seam 使用同一套能力。
5. 新旧工作区要有可控迁移路径，不能要求用户手工搬运状态。

### 3.2 明确非目标

1. 不把本地内存层升级为组织级云端数据库。
2. 不在本方案中引入向量数据库或重型检索引擎。
3. 不要求一次性淘汰所有文件系统落盘能力；快照和导出仍可保留 `fs`。
4. 不把 canonical source 从 `current-context/tasks/review/artifacts` 转移到 memory。

### 3.2.1 未上线阶段的方案策略

由于本项目当前尚未正式上线，本方案采用比“存量产品渐进兼容”更激进的决策原则：

1. 目标架构可以直接定到终局，不需要为了历史包袱长期维持 `fs-csv` 继续担任 session 主真值。
2. 兼容策略只需要覆盖当前仓库内已有 workspace、已有 host surface 与已有调试链路，不需要做面向外部 adopter 的长期双轨承诺。
3. 可以接受在一个较短的版本窗口内完成默认 provider 切换与 session durable truth 重构。

但这不等于必须做成一次性“大爆炸”改造。

本方案仍把实施拆成有限阶段，原因是工程回归面不同，而不是产品上要长期保留旧路径：

1. `memory provider default cutover`
2. `session storage model cutover`
3. `shell / resume / recovery / diagnostics read model cutover`

因此本方案的原则是：

`终局架构一步到位，工程交付有限分阶段；不做长期双轨产品承诺。`

### 3.3 与 `tasks.csv` 的边界

`tasks.csv` 不在本方案的主变更面内。

原因是：

1. `tasks.csv` 当前属于仓库级执行台账与审计产物的一部分。
2. 它与 `plan.md / checklist.md / TK-xxx.md / review lifecycle` 一起构成当前工作流的人类可读 canonical source。
3. 本方案解决的是运行时 session durability，不是任务台账产品形态重构。

因此本方案的建议是：

1. `tasks.csv` 现阶段不切换为 sqlite 主真值。
2. 但应在当前长期方案下优先补齐 `tasks.csv -> sqlite` 的 projection/read-model。
3. 该 projection/read-model 可直接服务查询性能、统计、审计读取与 UI 检索。
4. 在单独的产品决策完成之前，`tasks.csv` 仍保持 canonical source 身份，不与本次 session durable storage cutover 绑定为真值迁移。

### 3.4 执行台账与审计是否可以切到 sqlite

可以，但不建议与本次 session durable storage cutover 同步落地为“主真值切换”。

需要分成两类看：

1. `runtime session audit`
   - 可以，也推荐逐步改为从 sqlite 读取。
   - 因为它与本方案的 session/event/diagnostics durable truth 是同一问题域。
2. `project execution ledger`
   - 包括 `plan.md / checklist.md / tasks.csv / review lifecycle`
   - 现阶段不建议直接改为“只写 sqlite、只从 sqlite 读”。

原因是：

1. runtime session audit 属于运行时事实链路，天然适合结构化事件存储。
2. execution ledger 目前不仅是机器数据源，还是团队协作中的 human-readable canonical source。
3. 如果本次同时把 session truth、任务台账 truth、审计读取链路一起切换，范围会从“运行时 durability 修复”膨胀成“整套治理台账产品形态重构”，风险会明显上升。

因此推荐的演进顺序是：

1. 第一阶段
   - session/event/diagnostics 先切到 sqlite durable truth。
   - runtime audit/diagnostics 改为优先从 sqlite 读取。
2. 第二阶段
   - 为 `tasks.csv / checklist / review lifecycle` 建立 sqlite projection/index。
   - 其中 `tasks.csv` 的 sqlite projection/read-model 作为优先实施项。
   - 审计与统计 UI 可以优先读 sqlite projection。
3. 第三阶段
   - 若产品层明确接受“人类文件不再是唯一 canonical source”，再讨论 execution ledger 主真值是否从文件切到 sqlite。

本方案当前推荐的是：

1. `runtime audit`：可以跟随本方案切到 sqlite 读模型。
2. `execution ledger audit`：优先做 sqlite projection/read-model。
3. `tasks.csv`：当前就应纳入 sqlite projection/read-model 实施范围，但不在本次方案中直接替换其 canonical source。

### 3.4.1 对 artifact registry 的进一步结论

基于本轮评审补充，`artifact registry / archive registry` 的结论比 `tasks.csv` 更积极：

1. 它们当前虽然仍以 CSV 形式存在，但本质上更接近“结构化索引/注册表”，而不是长文本协作台账。
2. 它们的消费面以机器读取、生命周期校验、依赖解析和渲染视图为主。
3. 因为本项目尚未上线，不需要为了外部 adopter 长期维持 `CSV canonical truth` 包袱。

因此本方案更新后的建议是：

1. `artifact registry / archive registry` 可以在当前阶段直接切到 sqlite 真值。
2. 现有两份 CSV 保留为从 sqlite 渲染出的兼容/导出视图。
3. 这件事可以作为本方案的直接 follow-up 落地，不必等到更远的产品阶段。

需要保留的边界仍然是：

1. `artifact registry`：适合现在就切 sqlite 真值。
2. `tasks.csv / checklist / review lifecycle`：现阶段仍不建议直接切 sqlite 真值。

### 3.5 当前仓库 CSV 面的推荐去向矩阵

为避免把“session durable truth cutover”误解成“所有 CSV 一次性下线”，当前仓库的 CSV 面建议按下表处理：

| CSV 类型 | 当前典型路径 | 当前角色 | 推荐去向 | 是否切为 sqlite 真值 | 是否保留 CSV |
| --- | --- | --- | --- | --- | --- |
| runtime memory records | `context/memory/memory-records.csv` | 运行时 memory 主存储 | 切到 `sqlite-fs` | 是，优先 | 是，保留为导出/兼容/fallback |
| runtime memory snapshots | `context/memory/snapshots.csv` | 运行时快照索引 | 跟随 `sqlite-fs` 接管索引 | 是，优先 | 是，快照 payload 仍可保留文件 |
| runtime memory archive | `context/memory/archive.csv` | 运行时 archive 索引 | 跟随 `sqlite-fs` 接管索引 | 是，优先 | 是，保留为导出/兼容 |
| session / diagnostics 相关 CSV | 若存在 future csv view | 运行时 session / 审计视图 | 改成 sqlite read model | 是，优先 | 可选保留导出视图 |
| sprint `tasks.csv` | `context/dev/**/tasks/tasks.csv` | 执行台账 canonical source 之一 | 当前阶段优先做 sqlite projection/read-model | 否，现阶段不建议 | 是，继续保留 canonical source |
| artifact registry main | `context/artifact-registry/artifacts.csv` | 产物注册表主索引 | 直接切 sqlite 真值，CSV 退化为渲染视图 | 是，建议当前阶段实施 | 是，建议保留渲染/导出视图 |
| artifact registry archive | `context/artifact-registry/archive/artifacts.archive.csv` | 归档产物注册表索引 | 直接切 sqlite 真值，CSV 退化为渲染视图 | 是，建议当前阶段实施 | 是，建议保留渲染/导出视图 |

矩阵背后的原则是：

1. 高频运行时结构化数据，优先离开 CSV。
2. 仍承担 human-readable canonical source 责任的 CSV，不与本次方案绑定主真值切换；但可优先补齐 sqlite projection/read-model，其中 `tasks.csv` 为当前优先项。
3. 已经具备明显“索引/注册表”性质的 CSV，应优先评估切到 sqlite 真值；其中 `artifact registry` 已经具备当前阶段直接实施条件。

## 4. 为什么继续把 CSV 当主存储不合适

### 4.1 CSV 的优势

`fs-csv` 仍有明确价值：

1. 可读性强，便于人工检查。
2. 无额外依赖，适合作为最低基线。
3. 适合低频写入、简单查询、导出视图。

### 4.2 CSV 的根本限制

即使当前 `fs-csv` 已补齐：

1. 互斥锁
2. 原子 rename
3. 竞争创建保护

它仍然无法改变两个根本事实：

1. 持久化单位是整文件，而不是单事件。
2. session truth 仍然被建模为一个会不断变大的整体 blob。

对于“长任务 + 高频 event append + shell/sidecar 共存”场景，CSV 的天然问题是：

1. 写放大高
2. 读取成本随会话膨胀
3. 恢复语义差
4. 很难提供真正可靠的事件级原子性

所以本方案的结论不是“CSV 有 bug 要修”，而是：

`CSV 这种持久化形态不再适合承担运行时 session 的 canonical truth。`

## 5. 外部方案比较

## 5.1 备选方案一：继续使用 fs-csv

### 结论

不推荐作为长期主线。

### 原因

1. 已经不止一次暴露出与长任务/并发写有关的稳定性问题。
2. 再继续加锁、加缓存、加回放，最终会演变成“在 CSV 上手写数据库语义”。
3. 这条路的长期复杂度高于直接切到更合适的嵌入式存储。

## 5.2 备选方案二：append-only file log + snapshot（纯文件系统）

### 结论

技术上可行，但不作为首选。

### 优点

1. 仍保持纯 `fs`、无数据库依赖。
2. 比整表 CSV 重写更适合事件流。
3. append-only 语义天然更贴近 session event。

### 问题

1. 需要自己实现：
   - replay
   - compaction
   - schema migration
   - 索引
   - 多进程并发一致性
2. 实际上是在手工重建一层轻量数据库内核。

### 结论解释

如果仓库里没有现成的 `sqlite-fs`，这会是很值得考虑的方案。  
但当前仓库已经有可用的 sqlite 基线，因此没有必要优先自造一套事件存储引擎。

## 5.3 备选方案三：sqlite-fs

### 结论

推荐作为长期主线。

### 原因

1. 嵌入式、无独立服务、符合 `local-first`。
2. 事务和锁语义成熟。
3. 适合“多读、单写、频繁小事务”的本地运行时。
4. 当前仓库已经有 `sqlite-fs` provider，不需要从零引入。
5. 当前实现已启用 `WAL`，有利于本地读写并发。

### 外部参考

1. SQLite 官方 WAL 文档：
   - [https://www.sqlite.org/wal.html](https://www.sqlite.org/wal.html)
2. SQLite 官方 locking 文档：
   - [https://www.sqlite.org/lockingv3.html](https://www.sqlite.org/lockingv3.html)
3. SQLite 官方特性说明：
   - [https://www.sqlite.org/different.html](https://www.sqlite.org/different.html)

## 5.4 备选方案四：LMDB

### 结论

强备选，但不作为本仓库首选。

### 优点

1. 本地嵌入式、高性能、适合多进程。
2. 读写并发语义优秀。
3. 很适合作为高性能 KV 主存储。

### 不选原因

1. Node 分发和跨平台接入成本高于 sqlite。
2. 我们当前不仅需要 KV，还需要更自然的查询、索引和迁移语义。
3. 相比 sqlite，团队维护心智负担更高。

## 5.5 备选方案五：RocksDB / LevelDB

### 结论

不推荐。

### 原因

1. 偏重型。
2. 更适合高吞吐 KV，而不是本地治理工具的 session truth。
3. 发布和本地依赖复杂度明显更高。
4. `LevelDB` 的维护状态也不如 sqlite 稳妥。

## 5.6 备选方案六：DuckDB

### 结论

不推荐。

### 原因

1. DuckDB 更适合分析型负载。
2. 不适合我们这种大量小事务、长时间交互式状态写入。
3. 多进程写同一个本地数据库文件不是它的核心设计目标。

## 6. 最终推荐

本方案推荐的长期终局是：

1. 运行时 memory 主存储默认切换为 `sqlite-fs`
2. session truth 改为：
   - `session metadata / summary`
   - `append-only session event log`
   - `必要 projection`
3. `fs-csv` 降级为：
   - 导出视图
   - 调试/诊断视图
   - 极简 fallback

简化表达：

`放弃 CSV 作为 session 主存储；不放弃 fs；默认采用 sqlite-fs 承担 durable runtime truth。`

### 6.1 本轮评审后的范围落点

基于本轮评审结论，本方案当前确认的落地范围是：

1. `runtime memory / session / diagnostics`：
   - 按本方案切到 `sqlite-fs + append-only session event log`。
2. `artifact registry / archive registry`：
   - 作为同一轮长期方向下的直接后续范围，切到 sqlite 真值。
   - 现有 CSV 保留为从 sqlite 渲染出的兼容/导出视图。
3. `tasks.csv / checklist / review lifecycle`：
   - 当前仍保持文件 canonical source，不在这轮直接切 sqlite 真值。
   - 其中 `tasks.csv` 先实施 sqlite projection/read-model。

也就是说，本轮不是“只谈 session，不落 artifact registry”，而是：

`session durable truth 与 artifact registry sqlite truth 进入同一份长期技术方案；但具体实现可按相邻阶段推进。`

## 7. 目标架构

## 7.1 分层定位

### A. Canonical Source Layer

保持不变：

1. `current-context`
2. `tasks/checklist`
3. `tasks.csv`
4. review lifecycle
5. normative docs
6. artifact registry

### B. Runtime Session Store Layer

新增明确职责：

1. durable session metadata
2. append-only session event log
3. terminal turn diagnostics
4. incremental stream/progress details

### C. Runtime Memory Provider Layer

由 `runtime.memory-provider-loading` 统一装配：

1. default provider：`sqlite-fs`
2. legacy / export provider：`fs-csv`

### D. Shell / Sidecar Consumption Layer

由 shell 与 service 共同消费：

1. live activity
2. transcript replay
3. session resume
4. turn recovery

## 7.2 Session 数据模型

### 7.2.1 sessions 表

每条 session 一行，保存摘要而不是完整事件数组。

这里不建议额外引入独立整数 `id` 作为主键，原因是：

1. `session_id` 本身已经是稳定、全局唯一、跨 shell/sidecar/diagnostics 可直接引用的业务主键。
2. 运行时、日志、恢复链路、错误提示和用户可见文案都已经围绕 `session_id` 组织。
3. 再加一个内部自增 `id` 会引入“双主键心智”，但当前阶段没有足够收益。

### 7.2.2 session_events 表

`session_events` 与 `session_stream_fragments` 这类高频追加表则建议引入独立整数 `id`，原因是：

1. 便于内部存储局部性和按时间/写入顺序分页。
2. 便于后续 archive/compaction 时做批量范围操作。
3. 不替代业务唯一键；仍应保留 `(session_id, event_id)` 或 `(session_id, event_index)` 唯一约束。

### 7.2.3 建议 SQL（Draft v1）

以下 SQL 只定义 session durable truth 的核心表，不覆盖所有可选 projection。

#### A. sessions

```sql
CREATE TABLE IF NOT EXISTS sessions (
  session_id TEXT PRIMARY KEY,
  status TEXT NOT NULL,
  execution_id TEXT,
  process_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  closed_at TEXT,
  context_json TEXT NOT NULL,
  turn_count INTEGER NOT NULL DEFAULT 0,
  last_event_id TEXT
);

CREATE INDEX IF NOT EXISTS idx_sessions_status_updated_at
ON sessions(status, updated_at);
```

字段说明：

| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| `session_id` | `TEXT` | session 的稳定业务主键，直接面向 shell、resume、diagnostics 与错误回报。 |
| `status` | `TEXT` | session 生命周期状态，如 `active/completed/cancelled/failed`。 |
| `execution_id` | `TEXT` | 当前 session 关联的执行链路 ID，便于回放与审计聚合。 |
| `process_id` | `TEXT` | 当前 process/runtime 图的逻辑 ID。 |
| `created_at` | `TEXT` | session 创建时间，使用 RFC3339。 |
| `updated_at` | `TEXT` | 最近一次 session 摘要更新时间。 |
| `closed_at` | `TEXT` | session 进入终态的时间；未关闭则为空。 |
| `context_json` | `TEXT` | session 级上下文摘要，不保存完整事件流。 |
| `turn_count` | `INTEGER` | 已占用的 canonical turn 数，按 `TURN_SUBMITTED` 单调递增。 |
| `last_event_id` | `TEXT` | 最近一次追加成功的事件 ID，用于恢复和一致性检查。 |

#### B. session_events

```sql
CREATE TABLE IF NOT EXISTS session_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  event_id TEXT NOT NULL,
  event_index INTEGER NOT NULL,
  event_type TEXT NOT NULL,
  created_at TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  turn_index INTEGER,
  stream_sequence INTEGER,
  FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_session_events_session_event_id
ON session_events(session_id, event_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_session_events_session_event_index
ON session_events(session_id, event_index);

CREATE INDEX IF NOT EXISTS idx_session_events_session_turn_index
ON session_events(session_id, turn_index, event_index);
```

字段说明：

| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `INTEGER` | 内部自增主键，仅用于局部性、分页和批量维护，不作为业务标识。 |
| `session_id` | `TEXT` | 所属 session。 |
| `event_id` | `TEXT` | 事件稳定 ID，用于幂等与去重。 |
| `event_index` | `INTEGER` | session 内单调递增事件序号，作为 replay 主顺序。 |
| `event_type` | `TEXT` | 事件类型，如 `TURN_SUBMITTED/TURN_STREAM_DELTA/TURN_COMPLETED/TURN_FAILED`。 |
| `created_at` | `TEXT` | 事件创建时间，使用 RFC3339。 |
| `payload_json` | `TEXT` | 事件完整 payload。 |
| `turn_index` | `INTEGER` | 该事件归属的 canonical turn index。 |
| `stream_sequence` | `INTEGER` | 用于同一 turn 内流式增量排序；非流式事件可为空。 |

#### C. session_diagnostics

```sql
CREATE TABLE IF NOT EXISTS session_diagnostics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  turn_index INTEGER,
  category TEXT NOT NULL,
  detail_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_session_diagnostics_session_turn
ON session_diagnostics(session_id, turn_index, created_at);
```

字段说明：

| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `INTEGER` | 内部自增主键，用于排序与批量维护。 |
| `session_id` | `TEXT` | 所属 session。 |
| `turn_index` | `INTEGER` | 关联 turn；session 级诊断可为空。 |
| `category` | `TEXT` | 诊断类别，如 `probe/error/progress/recovery`。 |
| `detail_json` | `TEXT` | 结构化诊断详情。 |
| `created_at` | `TEXT` | 诊断写入时间。 |

### 7.2.4 可选 projection 表

用于加速查询和恢复，而不是替代 event log。

建议：

1. `session_turns`
2. `session_stream_fragments`
3. `session_diagnostics`

这些 projection 可以重建，所以不是 canonical truth。

## 7.3 写入模型

每次 session 变更都应满足：

1. `append event`
2. `update session summary`
3. `必要 projection 更新`

以上在同一个 sqlite transaction 内完成。

这样可以避免以下旧问题：

1. 读出旧 session blob
2. 修改内存对象
3. 整份 payload 回写
4. 中途失败后 session 整体丢失或回退

## 7.4 读取模型

### 7.4.1 正常读取

读取顺序应变为：

1. 读 `sessions`
2. 按需分页读 `session_events`
3. 读需要的 projection

### 7.4.2 shell 实时消费

交互 shell 不应每次都把整份 session 全量读回，而应支持：

1. 按 `event_index` 增量拉取
2. 按 `stream_sequence` 追加实时内容
3. terminal 后一次性读取收尾 diagnostics

### 7.4.3 resume 恢复

`/resume` 的事实源应是：

1. session metadata
2. event log
3. latest projection

而不是依赖单个大 blob 反序列化成功。

## 8. 为什么这能避免“内存会话丢了”

这个问题的核心不是“进程内缓存丢了”，而是“持久化 truth 在长任务中途读不到了”。

换成 `sqlite-fs + append-only event log` 后，风险会显著下降，原因是：

1. session 元信息不再和完整事件数组绑死在一个大 payload 上。
2. 事件写入单位从“整份 session”变成“单条 event append”。
3. 收尾阶段追加 `TURN_FAILED/TURN_COMPLETED` 时，不需要再先读整份历史才能写回。
4. shell/sidecar 即使同时观察同一个 session，也更容易通过 transaction 和 stable row 维持一致性。

换句话说，目标不是“绝对不会失败”，而是：

`session 不再因为一次中途回写失败而整体消失。`

## 9. Provider 默认策略调整

## 9.1 默认策略

建议把默认 runtime memory store engine 从：

1. `fs_csv`

切换为：

1. `sqlite_fs`

## 9.2 责任边界

建议把 built-in provider 责任重新定义为：

1. `sqlite-fs`
   - 运行时 durable truth 的默认 built-in provider
2. `fs-csv`
   - 导出/兼容/fallback built-in provider

## 9.3 分发语义

当前 `sqlite-fs` 仍是 optional built-in。长期方案要求同步调整：

1. default distribution 应包含 `sqlite-fs` runtime payload
2. clean-room / verify / doctor 要把 `sqlite-fs` 视为默认预期，而不是可选增强
3. `fs-csv` 仍保留，但不再被宣称为交互 runtime 的首选 durable provider

## 10. 迁移方案

需要特别说明：

本节的“迁移”主要是工程内迁移，而不是面向外部用户的长期兼容承诺。

这意味着：

1. 可以直接把终局目标定为 `sqlite-fs + append-only session event log`。
2. 不需要设计长期维持 `fs-csv` 作为 session 主真值的双写模式。
3. 但仍建议把交付拆成有限阶段，确保每一步都能验证、回滚和收敛。

## 10.1 新工作区

新建 workspace 直接默认使用 `sqlite-fs`。

## 10.2 旧工作区

对已有 `fs-csv` workspace 提供一次性迁移：

1. 读取 `fs-csv` records/snapshots/archive
2. 转换写入 `sqlite-fs`
3. 做 `copy -> verify -> switch`
4. 保留旧 `fs-csv` 只读备份

## 10.3 Session 结构迁移

建议分两阶段：

1. Phase A
   - provider 切到 `sqlite-fs`
   - session payload 仍保持兼容
2. Phase B
   - 引入 `sessions + session_events + projections`
   - `SharedSessionManager` 改为事件追加模型

这样能把“存储后端切换”和“session 语义模型重构”拆开，降低一次性风险。

## 10.4 对“是否一步到位”的正式结论

本方案的正式结论是：

1. 架构目标：一步到位。
   - 直接以 `sqlite-fs + append-only session event log` 作为终局。
2. 产品兼容：不长期保留旧主路径。
   - 不再把 `fs-csv` 继续维持为 session durable truth。
3. 工程交付：有限分阶段。
   - 分阶段只是为了降低实现和验证风险，不代表长期双轨。

如果后续实现评审认为当前测试与迁移验证已经足够充分，本方案允许把 `Phase A + Phase B` 合并为一次性 cutover。前提是：

1. shell / sidecar / resume 的核心回归覆盖完整。
2. 当前仓库已有 workspace 的迁移验证可通过。
3. `doctor / verify / clean-room / build` 能一次性对齐默认语义。

## 11. 风险与约束

## 11.1 node:sqlite 约束

当前 `sqlite-fs` 基于 Node.js `node:sqlite`。需要明确：

1. 运行环境至少满足现有 Node 版本基线
2. 打包/分发必须把该能力纳入默认支持矩阵

## 11.2 数据库 schema 迁移

从 CSV 切到 sqlite 后，schema versioning 要正式化，至少包括：

1. schema version table
2. forward migration
3. incompatible version fail-closed

## 11.3 WAL 文件与清理

启用 WAL 后需要明确：

1. 哪些文件算 runtime durable state
2. 清理、备份、workspace copy 的行为

## 11.4 事件日志增长

append-only event log 需要搭配：

1. compaction
2. archive
3. projection rebuild

否则长期仍会膨胀。

## 12. 实施建议

## 12.1 第一阶段：默认 provider 切换

1. default memory engine 切到 `sqlite_fs`
2. default distribution 正式携带 `sqlite-fs`
3. clean-room / doctor / verify 对齐默认语义

## 12.2 第二阶段：session event log 正式化

1. 新增 session/sqlite schema
2. `SharedSessionManager` 切换到 append-only
3. shell/resume 按 event cursor 增量读取

## 12.3 第三阶段：artifact registry / archive registry 切到 sqlite 真值

1. 为 `artifact registry main + archive registry` 定义 sqlite schema 与 migration。
2. 现有治理脚本改为以 sqlite 为 canonical truth。
3. `artifacts.csv / artifacts.archive.csv` 改为从 sqlite 渲染出的兼容/导出视图。
4. lifecycle / dependency / compact / reconcile / render 等链路统一以 sqlite 为事实源。

## 12.4 第四阶段：tasks.csv projection/read-model 落地

1. 为 `tasks.csv` 定义 sqlite projection schema 与 rebuild 规则。
2. 从 `tasks.csv` 增量同步或全量重建 sqlite read-model。
3. 查询、统计、审计 UI 与检索链路优先读 sqlite projection。
4. `tasks.csv` 继续保留为 human-readable canonical source，不引入主真值切换。

## 12.5 第五阶段：fs-csv 与 CSV 视图角色收缩

1. 退出 runtime durable truth
2. 保留 export/debug/fallback
3. 文档与 diagnostics 明确降级定位

## 13. 验收标准

长期方案落地后，至少要满足：

1. 长时间运行的 `review/run` 不再因为主存储丢 session 而在收尾阶段报 `MEMORY_SESSION_NOT_FOUND`。
2. shell/sidecar 并行存在时，session 事件仍保持可持续追加和读取。
3. `resume` 以 event log 为基础恢复，不依赖整份 session blob 成功反序列化。
4. 新工作区默认使用 `sqlite-fs`，并在 `doctor/verify` 中可见。
5. 旧 `fs-csv` 工作区具备可验证迁移路径。
6. `fs-csv` 即使继续存在，也不再被视为 session durable truth 的默认实现。
7. `artifact registry / archive registry` 的 canonical truth 已迁移到 sqlite，CSV 仅作为渲染/导出视图存在。
8. `tasks.csv` 已具备可重建、可校验的 sqlite projection/read-model，且不改变其文件 canonical source 身份。

## 14. 最终结论

本项目尚未上线，因此没有必要继续把长期方案压缩成“在 CSV 上持续打补丁”。

推荐直接采用以下终局：

1. 默认运行时 memory provider 切到 `sqlite-fs`
2. session truth 切到 `append-only event log + summary/projection`
3. `artifact registry / archive registry` 切到 sqlite 真值，CSV 改为渲染视图
4. `fs-csv` 降级为兼容/导出/fallback

一句话总结：

`我们不再把 CSV 当作运行时 session 与 artifact registry 的真值存储；长期主线改为 sqlite-fs 承接 durable local truth，并用 append-only session event log 保障长任务与恢复链路稳定性。`
