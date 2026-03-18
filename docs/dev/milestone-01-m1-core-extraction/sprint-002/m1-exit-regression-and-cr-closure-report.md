# M1 退出回归与 CR 收口报告（TK-116）

- Status: active
- Date: 2026-03-19
- Milestone: `M1`
- Sprint: `sprint-002`
- Task: `TK-116`

## 1. 结论摘要

1. `TK-111`~`TK-116` 均已完成并在 checklist/tasks.csv 同步登记。
2. 规范命令集与核心命令可达性回归通过，未发现阻断问题。
3. CR 产物均已流转到 `verified_review_*`，无待处理阻断项。
4. 验收结论：`conditional-go`（允许进入下一里程碑，保留已登记中风险跟踪项）。

## 2. 任务收口矩阵（M1/sprint-002）

| task_id | status | primary_artifact | cr_status |
|---|---|---|---|
| TK-111 | done | `core-memory-extraction-baseline.md` | verified |
| TK-112 | done | `core-session-extraction-baseline.md` | verified |
| TK-113 | done | `memory-store-adapter-extraction-baseline.md` | verified |
| TK-114 | done | `notification-dispatcher-extraction-baseline.md` | verified |
| TK-115 | done | `dependency-direction-warning-gate-baseline.md` | verified |
| TK-116 | done | `m1-exit-regression-and-cr-closure-report.md` | verified |

## 3. Checkpoint Commands 结果（按 `code_standards.md`）

| command | started_at | result |
|---|---|---|
| `node ./scripts/governance/check-esm-import-specifiers.js` | 2026-03-19 06:33:21 +0800 | pass |
| `node ./scripts/governance/check-dynamic-import-usage.js` | 2026-03-19 06:33:21 +0800 | pass |
| `node ./scripts/governance/check-finite-literal-sets.js` | 2026-03-19 06:33:21 +0800 | pass |
| `node ./scripts/governance/check-utils-reuse-governance.js` | 2026-03-19 06:33:21 +0800 | pass |
| `node ./scripts/governance/check-type-governance.js` | 2026-03-19 06:33:22 +0800 | pass |
| `node ./scripts/governance/check-ts-only-residue.js` | 2026-03-19 06:33:22 +0800 | pass |
| `node ./scripts/governance/check-docs-triad-sync.js` | 2026-03-19 06:33:22 +0800 | pass |
| `npm run test -- --maxWorkers=1 --maxConcurrency=1` | 2026-03-19 06:33:22 +0800 | pass |
| `node ./dist/bin/repo-ai-governor.js --help >/dev/null` | 2026-03-19 06:33:56 +0800 | pass |

执行日志缓存：`/tmp/repo-ai-governor-tk116/cmd-*.log`。

## 4. Golden Command 可达性回归（TK-003 对齐）

| command | checked_at | result |
|---|---|---|
| `init --help` | 2026-03-19 06:34:11 +0800 | pass |
| `doctor --help` | 2026-03-19 06:34:11 +0800 | pass |
| `plan --help` | 2026-03-19 06:34:12 +0800 | pass |
| `check --help` | 2026-03-19 06:34:12 +0800 | pass |
| `run --help` | 2026-03-19 06:34:12 +0800 | pass |
| `review --help` | 2026-03-19 06:34:12 +0800 | pass |
| `review-verify --help` | 2026-03-19 06:34:12 +0800 | pass |
| `report --help` | 2026-03-19 06:34:12 +0800 | pass |

## 5. CR 生命周期收口

1. `verified_review_tk-111-core-memory-extraction-baseline.md`
2. `verified_review_tk-112-core-session-extraction-baseline.md`
3. `verified_review_tk-113-memory-store-adapter-extraction-baseline.md`
4. `verified_review_tk-114-notification-dispatcher-extraction-baseline.md`
5. `verified_review_tk-115-dependency-direction-warning-gate-baseline.md`
6. `verified_review_tk-116-m1-exit-regression-and-cr-closure.md`

结论：本 sprint 已无 `review_*` 待复核文件，无 `resolved_*` 待补丁链路。

## 6. 风险台账快照（M1 Exit）

| risk_id | title | likelihood | impact | risk_score | status | mitigation_plan | followup_task |
|---|---|---:|---:|---:|---|---|---|
| RSK-M1-001 | 依赖边界检查仍处 warning 模式 | 3 | 3 | 9 | watching | 维持 warning 输出并持续清理违规，M5 切 blocking | TK-503 |
| RSK-M1-002 | provider 契约自动化覆盖尚未全量 | 2 | 3 | 6 | watching | 在 M5 契约测试阶段补齐关键路径覆盖 | TK-501, TK-502 |
| RSK-M1-003 | shared execution session 运行时能力尚待落地 | 2 | 3 | 6 | mitigating | 在 M2 完成 session 总线与快照回放实现 | TK-213, TK-214 |

## 7. 里程碑验收决策

| field | value |
|---|---|
| milestone_id | `M1` |
| sprint | `sprint-002` |
| reviewer_group | Architecture / QA / PM |
| execution_session_id | `N/A（session runtime 将在 M2 接入）` |
| acceptance_time | `2026-03-19 06:34:18 +0800` |
| decision | `conditional-go` |
| rationale | 核心抽离与门禁回归通过；中风险项已登记且有明确后续任务闭环 |
| required_followups | `TK-503`, `TK-501`, `TK-502`, `TK-213`, `TK-214` |

## 8. 后续动作

1. 切换到 M2，推进 workspace/memory/session 稳定化任务。
2. 跟踪 `RSK-M1-001`，在 M5 完成 warning -> blocking gate 切换。
3. 在 M3/M5 补齐通知 provider 与契约测试闭环。
