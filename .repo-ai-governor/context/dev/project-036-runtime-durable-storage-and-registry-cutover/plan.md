# project-036-runtime-durable-storage-and-registry-cutover 计划

- Status: active
- Date: 2026-04-02
- Stage Mapping: Runtime durable storage implementation
- Phase Mapping: Session durable truth cutover / artifact registry sqlite truth / tasks ledger sqlite projection / migration and governance hardening
- Upstream:
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-durable-storage/module-overview.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-durable-storage/contracts/session-durable-storage-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-durable-storage/contracts/registry-and-ledger-projection-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-durable-storage/adrs/sqlite-fs-default-runtime-truth-and-rendered-csv-views.md`
  - `.repo-ai-governor/draft/runtime-session-durable-memory-and-sqlite-fs-cutover-technical-solution.md`
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

- Status: active
- Sprint Goal: 收口 migration、doctor/verify、rebuild/render、artifact lifecycle automation 与 cutover governance，确保新旧工作区都有明确升级路径。
- Task Package: `TK-479`、`TK-480`。

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
|---|---|---|---|---|---|
| TK-475 | sprint-001 | cut over runtime session durable truth to sqlite-fs default and durable schema baseline | runtime/session-storage | `runtime.durable-storage` formal module docs | completed |
| TK-476 | sprint-001 | migrate shared session manager and runtime consumers to append-only session event log semantics | runtime/session-runtime | TK-475 | completed |
| TK-477 | sprint-002 | implement sqlite-backed artifact registry canonical truth and rendered CSV compatibility views | runtime/artifact-registry | TK-475 | completed |
| TK-478 | sprint-003 | build tasks.csv sqlite projection and route audit/query consumers through it | runtime/ledger-read-model | TK-477 | completed |
| TK-479 | sprint-004 | deliver migration, verification, rebuild and cutover governance for durable storage surfaces | governance/cutover | TK-476、TK-477、TK-478、TK-480 | active |
| TK-480 | sprint-004 | automate artifact lifecycle maintenance and auto-archive from sqlite canonical truth | governance/artifact-lifecycle-automation | TK-477 | planned |

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
