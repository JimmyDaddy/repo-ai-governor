# project-036-runtime-durable-storage-and-registry-cutover 计划

- Status: completed
- Date: 2026-04-02
- Stage Mapping: Runtime durable storage implementation
- Phase Mapping: Session durable truth cutover / artifact registry sqlite truth / tasks ledger sqlite projection / migration and governance hardening
- Upstream:
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-durable-storage/module-overview.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-durable-storage/contracts/session-durable-storage-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-durable-storage/contracts/registry-and-ledger-projection-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-durable-storage/adrs/sqlite-fs-default-runtime-truth-and-rendered-csv-views.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/module-overview.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/adapter-health-and-route-probe-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/layered-adapter-health-check-and-route-capability-probe.md`
  - `.repo-ai-governor/draft/runtime-session-durable-memory-and-sqlite-fs-cutover-technical-solution.md`
  - `.repo-ai-governor/draft/layered-adapter-health-check-and-route-probe-technical-solution.md`
  - `.repo-ai-governor/context/dev/project-035-session-main-supervisor-and-role-subagent-productization/sprint-004-streaming-and-host-parity/tasks/TK-474-promote-runtime-durable-storage-and-sqlite-fs-cutover-solution-into-formal-module-docs.md`

## 1. 目标

1. 将 runtime session durable truth 从 `fs-csv + whole-payload rewrite` 迁移到 `sqlite-fs + session summary + append-only event log`。
2. 将 Artifact Registry / Archive Registry 切为 sqlite-backed canonical truth，并把 CSV 收敛为 rendered compatibility/export view。
3. 为 `tasks.csv` 补齐 sqlite projection/read-model，使查询、统计、审计读取与 UI 检索不再直接依赖 CSV 解析。
4. 为以上 cutover 补齐 migration、doctor/verify、render/rebuild 与 rollout governance，形成可验证的长期实现基线。

## 2. Sprint 细化

## 2.1 sprint-001-session-durable-storage-foundation

- Status: completed
- Sprint Goal: 建立 sqlite-fs 默认 session durable truth、schema baseline 与 append-only session event log 消费迁移面。
- Task Package: `TK-475`、`TK-476`。

## 2.2 sprint-002-artifact-registry-sqlite-truth-and-rendered-views

- Status: completed
- Sprint Goal: 将 Artifact Registry / Archive Registry 切为 sqlite canonical truth，并保留 rendered CSV 兼容视图。
- Task Package: `TK-477`。

## 2.3 sprint-003-task-ledger-sqlite-projection-and-audit-read-model

- Status: completed
- Sprint Goal: 为 `tasks.csv` 建立 sqlite projection/read-model，并让 audit/query/UI consumer 优先读取该 read-model。
- Task Package: `TK-478`。

## 2.4 sprint-004-migration-verification-and-cutover-governance

- Status: completed
- Sprint Goal: 收口 migration、doctor/verify、rebuild/render、artifact lifecycle automation 与 cutover governance，确保新旧工作区都有明确升级路径。
- Task Package: `TK-479`、`TK-480`、`TK-481`、`TK-482`、`TK-483`、`TK-484`。

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
|---|---|---|---|---|---|
| TK-475 | sprint-001 | cut over runtime session durable truth to sqlite-fs default and durable schema baseline | runtime/session-storage | `runtime.durable-storage` formal module docs | completed |
| TK-476 | sprint-001 | migrate shared session manager and runtime consumers to append-only session event log semantics | runtime/session-runtime | TK-475 | completed |
| TK-477 | sprint-002 | implement sqlite-backed artifact registry canonical truth and rendered CSV compatibility views | runtime/artifact-registry | TK-475 | completed |
| TK-478 | sprint-003 | build tasks.csv sqlite projection and route audit/query consumers through it | runtime/ledger-read-model | TK-477 | completed |
| TK-479 | sprint-004 | deliver migration, verification, rebuild and cutover governance for durable storage surfaces | governance/cutover | TK-476、TK-477、TK-478、TK-480 | completed |
| TK-480 | sprint-004 | automate artifact lifecycle maintenance and auto-archive from sqlite canonical truth | governance/artifact-lifecycle-automation | TK-477 | completed |
| TK-481 | sprint-004 | promote layered adapter health check and route probe solution into runtime-agent-projection formal docs | docs/promotion | TK-479 | completed |
| TK-482 | sprint-004 | implement layered adapter health check contract and shared probe runtime baseline | runtime/adapter-health-check | TK-479、TK-481 | completed |
| TK-483 | sprint-004 | align codex copilot claude and ollama probes with layered auth protocol route semantics | runtime/adapter-probes | TK-482 | completed |
| TK-484 | sprint-004 | route doctor verify and role fallback through layered health check diagnostics | cli/routing-diagnostics | TK-482、TK-483 | completed |

## 4. 依赖产物策略

1. `runtime.durable-storage` formal docs 已经定义终局架构；本项目承接的是实现落地，而不是再次修改目标方向。
2. session durable truth、artifact registry truth 与 `tasks.csv` read-model 虽属同一技术方案，但交付节奏允许有限分阶段，只要目标架构保持一致。
3. `tasks.csv` 在本项目内继续保持 human-readable canonical source 身份；sqlite 仅作为 projection/read-model，不新增手工 truth 入口。
4. Artifact Registry / Archive Registry 切到 sqlite canonical truth 后，现有 CSV surface 必须继续可 render、可校验、可导出，直到所有 machine-consumer 完成切换。
5. `fs-csv` 在 runtime session 面上的长期定位是 export/debug/fallback，不再继续强化为默认 durable truth。

## 5. DoD（project-036）

1. runtime session durable truth 默认已切到 `sqlite-fs`，并具备 `sessions + session_events + session_diagnostics` 或等价 schema/transaction semantics。
2. `turn_count` 与 canonical `turn_index` 已以 `TURN_SUBMITTED` 为单调推进锚点，不再仅依赖 `TURN_COMPLETED` 计数。
3. Artifact Registry / Archive Registry 已以 sqlite-backed registry 作为 canonical truth；`artifacts.csv` 仅保留 rendered/export 角色。
4. `tasks.csv` 已具备 sqlite projection/read-model，且 audit/query/UI consumer 可优先读该 read-model。
5. doctor/verify/migration/rebuild/render/cutover governance 已为上述 durable surfaces 提供可执行验证路径。
6. artifact registry lifecycle 已具备基于 sqlite canonical truth 的自动维护与 auto-archive 路径。

## 6. 里程碑记录

1. 2026-04-02：`runtime.durable-storage` 技术方案已正式提升完成，形成 `project-036` 的实施输入。
2. 2026-04-02：创建 `project-036-runtime-durable-storage-and-registry-cutover`，将 approved solution 拆为 session truth、artifact registry truth、ledger projection 与 cutover governance 四个实施阶段。
3. 2026-04-02：将 `sprint-001-session-durable-storage-foundation` 设为当前 primary planning surface，开始承接 sqlite-fs default cutover 与 append-only session event log 的任务拆解与后续实现基线。
4. 2026-04-02：正式激活 `sprint-001`，`TK-475` 已切换为 `active`，开始收敛 memory provider 默认值、distribution truth 与 session durable schema baseline 的第一阶段实现。
5. 2026-04-02：`sprint-001-session-durable-storage-foundation` 已完成，`TK-475/TK-476` 全部收口；当前 primary planning surface 前移至 `sprint-002-artifact-registry-sqlite-truth-and-rendered-views`。
6. 2026-04-02：`sprint-002-artifact-registry-sqlite-truth-and-rendered-views` 已完成，`TK-477` 收口；当前 primary planning surface 前移至 `sprint-003-task-ledger-sqlite-projection-and-audit-read-model`。
7. 2026-04-02：新增 `TK-480`，将 artifact lifecycle automation / auto-archive 纳入 `sprint-004` 的正式实施范围，作为 sqlite canonical truth 后续治理增强项。
8. 2026-04-02：`sprint-003-task-ledger-sqlite-projection-and-audit-read-model` 已完成，`TK-478` 收口；当前 primary planning surface 前移至 `sprint-004-migration-verification-and-cutover-governance`，并激活 `TK-479`。
9. 2026-04-02：将 layered adapter health check / route probe 技术方案正式并入 `runtime.agent-projection`，并在 `sprint-004` 中新增 `TK-481` promotion 与 `TK-482~TK-484` 的实现拆分，作为 durable storage governance 窗口下的 probe hardening follow-up。
10. 2026-04-02：`sprint-004-migration-verification-and-cutover-governance` 已完成，`TK-479/TK-480/TK-481/TK-482/TK-483/TK-484` 全部收口；doctor/verify、artifact lifecycle automation、layered adapter health-check 与 route diagnostics 已形成 durable baseline。
11. 2026-04-02：`project-036-runtime-durable-storage-and-registry-cutover` 收口为 `completed`，项目级审计摘要见 [project-036-completion-audit-summary.md](/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-036-runtime-durable-storage-and-registry-cutover/project-036-completion-audit-summary.md)。
12. 2026-04-02：完成 post-closeout reviewer preflight UX 修补；`session.main` 现在会在 `reviewer` 角色真正 dispatch 前先展示 role preflight / surface probe 进度，并将 reviewer candidate surface probe 改为并发收集，避免前台出现长时间无声等待。
13. 2026-04-02：完成 post-closeout direct-answer probe hardening；`CliAdapterRoutingRuntime` 开始跨 turn 复用 surface protocol 实例，从而保留 adapter 级 probe cache，同时 `session.main` 已能把“目标工具是否可用”短路到本地 availability probe，不再为这类问题额外探测全部 direct-answer surface 并调起外部 answer-stage。
14. 2026-04-02：完成 post-closeout shared probe-cache hardening；`CliAdapterRoutingRuntime` 现在支持 workspace-scoped shared protocol cache namespace，同一 workspace 中即便 runtime 被重新构造，也能尽量复用已有 surface protocol 与 probe cache，减少重复 30s 探测。
15. 2026-04-02：完成 post-closeout live activity 标签收口；session shell 的普通实时活动与 execution details 已移除 `Current/当前` 前缀，改为直接展示中性进度消息内容，避免 transcript 中继续出现已失去意义的过时标签。
16. 2026-04-02：完成 post-closeout live activity viewport hardening；运行中的 `live_activity` 现在只渲染可滚动窗口而非无限增高的整段日志，完整历史仍保留，且用户可在任务进行中用 `PgUp/PgDn/Home/End` 浏览旧日志，不必再等到输出结束后才能恢复正常阅读。
17. 2026-04-02：完成 post-closeout agent reply history fix；session shell 现在会把 `agent_message/token` 草稿同步成可更新的 role reply 活动条目，并在 completed/failed turn execution details 中保留最新快照，确保 reviewer 等角色的非命令文本输出也能稳定进入执行过程历史。
18. 2026-04-02：完成 post-closeout timeout/liveness 技术方案 draft；在 `.repo-ai-governor/draft/agent-invoke-liveness-and-timeout-governance-technical-solution.md` 中正式提出“hard timeout 只做最后保险丝，多信号 liveness 判定作为主判断”的长期路线，供后续任务拆分与 formal promotion 使用。
