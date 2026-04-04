# project-040-task-ledger-sqlite-canonical-truth-cutover 计划

- Status: completed
- Date: 2026-04-04
- Stage Mapping: Task ledger durable truth cutover
- Phase Mapping: sqlite canonical ledger / rendered CSV view cutover / governance contract alignment / canonical naming cleanup
- Upstream:
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-durable-storage/module-overview.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-durable-storage/contracts/registry-and-ledger-projection-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-durable-storage/adrs/sqlite-fs-default-runtime-truth-and-rendered-csv-views.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/decomposition-protocol-template.md`
  - `.repo-ai-governor/draft/session-main-plan-generation-and-ledger-commit-contract.md`
  - `.repo-ai-governor/context/dev/project-036-runtime-durable-storage-and-registry-cutover/sprint-003-task-ledger-sqlite-projection-and-audit-read-model/plan.md`

## 1. 目标

1. 将 task ledger 从“`tasks.csv` canonical + sqlite projection/read-model”切换为“sqlite canonical truth + rendered `tasks.csv` compatibility view”。
2. 保持 `TK` 仍然作为任务语义主源，同时让 `sync-task-ledger` 把 sqlite canonical ledger 与 `tasks.csv` 视图统一收口。
3. 让现有 governance/read-model consumer 优先读取 sqlite canonical rows，而不是继续把 CSV 当主真值。
4. 同步 formal docs、planning seam 与 regression coverage，避免新旧口径长期并存。
5. 将 canonical sqlite 文件名、表名与 CLI durable-storage diagnostics 对外命名统一收口到 canonical truth 语义。

## 2. Sprint 细化

## 2.1 sprint-001-task-ledger-canonical-truth-and-rendered-csv-views

- Status: completed
- Sprint Goal: 完成 task ledger sqlite canonical truth cutover，并让 `tasks.csv` 退化为 rendered compatibility view。
- Task Package: `TK-514`、`TK-515`、`TK-516`

## 2.2 sprint-002-canonical-naming-cleanup-and-diagnostics-alignment

- Status: completed
- Sprint Goal: 完成 task ledger canonical sqlite 文件名/表名/CLI 诊断命名收口，并保留 legacy naming 兼容迁移。
- Task Package: `TK-517`、`TK-518`

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
|---|---|---|---|---|---|
| TK-514 | sprint-001 | activate project-040 and switch task-ledger execution surface | governance/activation | `project-039` closeout surface | completed |
| TK-515 | sprint-001 | cut over task ledger to sqlite canonical truth and rendered csv views | runtime/ledger-canonical | `project-036 sprint-003` baseline | completed |
| TK-516 | sprint-001 | align governance contracts plan-ledger seams and regression coverage with sqlite canonical task ledger | governance/docs-and-verification | TK-515 | completed |
| TK-517 | sprint-002 | rename task-ledger sqlite canonical storage naming and migrate legacy naming | runtime/canonical-naming | TK-515 | completed |
| TK-518 | sprint-002 | align cli durable-storage diagnostics docs and regression coverage with canonical task-ledger naming | cli/docs-and-verification | TK-517 | completed |

## 4. 依赖产物策略

1. `TK` 继续承担任务语义主源责任；sqlite canonical ledger 记录的是派生执行台账真值，而不是替代 task card 的语义边界。
2. `scripts/governance/task-ledger-projection.js` 在本轮中承担 migration/bootstrap、canonical read path 与 rendered `tasks.csv` view 的统一收口。
3. `scripts/governance/sync-task-ledger.js` 必须先更新 sqlite canonical ledger，再回写 `tasks.csv`，避免 CSV 被继续当作主真值。
4. `check-task-ledger-sync`、`check-sprint-plan-status-sync`、artifact lifecycle 与 delivery registry consumer 必须继续通过，不允许因真值切换破坏既有治理链。
5. canonical naming clean-up 只允许改变默认 sqlite 文件名、表名与 outward diagnostics naming；既有 legacy naming 需保留自动迁移或只读兼容能力。

## 5. DoD（project-040）

1. task ledger sqlite canonical truth 已在 governance/runtime 读写链路中生效。
2. `tasks.csv` 已明确降级为 rendered compatibility/export view。
3. `sync-task-ledger`、task-ledger read-model consumer 与关键 governance gate 已通过定向验证。
4. formal docs 与 planning/ledger seam draft 已同步更新，不再继续宣称 `tasks.csv` 是 canonical truth。
5. task ledger sqlite 默认路径、表名与 CLI durable-storage diagnostics 已切到 canonical naming，legacy naming 仅承担兼容迁移职责。

## 6. 里程碑记录

1. 2026-04-04：用户明确要求将 task ledger 的真值从 `tasks.csv` 切换为 sqlite，并优先开始实现而不是停留在讨论层。
2. 2026-04-04：创建 `project-040-task-ledger-sqlite-canonical-truth-cutover`，并将本轮切换收敛为 activation、canonical cutover、docs+verification 三个任务。
3. 2026-04-04：完成 `TK-514` ~ `TK-516`，task ledger 已切换为 sqlite canonical truth，`tasks.csv` 退化为 rendered view，且关键治理脚本与定向测试通过。
4. 2026-04-04：项目级完成态审计摘要见 [project-040-completion-audit-summary.md](/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-040-task-ledger-sqlite-canonical-truth-cutover/project-040-completion-audit-summary.md)。
5. 2026-04-04：follow-up `sprint-002-canonical-naming-cleanup-and-diagnostics-alignment` 完成 `TK-517` ~ `TK-518`，将 task ledger sqlite 文件名、表名与 CLI durable-storage diagnostics 收口为 canonical naming，同时补齐 legacy naming 自动迁移与 review-chain regression fix。
6. 2026-04-04：follow-up 项目级完成态审计摘要见 [project-040-sprint-002-canonical-naming-cleanup-completion-audit-summary.md](/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-040-task-ledger-sqlite-canonical-truth-cutover/project-040-sprint-002-canonical-naming-cleanup-completion-audit-summary.md)。
