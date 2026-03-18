# Dependency Artifact Registry

- Status: active
- Date: 2026-03-19
- Scope: `docs/dev/**`

## Purpose

统一登记“会被后续任务依赖的产物”，确保产物创建后可被后续任务立即检索、回链与消费。

## Registration Rules

1. 任何被 2 个及以上后续任务依赖的产物，必须在本表登记。
2. 产物登记后，必须同步：
   - `docs/dev/index.md` 的可检索入口；
   - 相关任务卡的 `Depends On` 与 `Input References`；
   - 触发任务的 `tasks/checklist.md` 与 `tasks/tasks.csv` 执行记录。
3. 若依赖任务新增或变更，需在同一变更窗口更新本表。

## Registry Table

| artifact_id | artifact_path | producer_task | dependent_tasks | first_registered_at | last_updated_at | status |
|---|---|---|---|---|---|---|
| DA-001 | `docs/dev/milestone-00-m0-baseline-governance/sprint-001/boundary-and-dependency-check-strategy.md` | `TK-002` | `TK-115`, `TK-503` | 2026-03-18 | 2026-03-18 | active |
| DA-002 | `docs/dev/milestone-00-m0-baseline-governance/sprint-001/golden-command-regression-checklist.md` | `TK-003` | `TK-006`, `TK-116` | 2026-03-18 | 2026-03-18 | active |
| DA-003 | `docs/dev/milestone-00-m0-baseline-governance/sprint-001/contract-test-directory-and-naming-baseline.md` | `TK-004` | `TK-006`, `TK-501`, `TK-502` | 2026-03-18 | 2026-03-18 | active |
| DA-004 | `docs/dev/milestone-00-m0-baseline-governance/sprint-001/risk-register-and-milestone-acceptance-template.md` | `TK-005` | `TK-006`, `TK-116`, `TK-216`, `TK-316`, `TK-416`, `TK-516` | 2026-03-18 | 2026-03-18 | active |
| DA-005 | `docs/dev/milestone-01-m1-core-extraction/sprint-001/monorepo-workspace-skeleton-and-build-entry-baseline.md` | `TK-101` | `TK-102`, `TK-103`, `TK-104`, `TK-105`, `TK-106` | 2026-03-19 | 2026-03-19 | active |
| DA-006 | `docs/dev/milestone-01-m1-core-extraction/sprint-001/core-process-extraction-baseline.md` | `TK-102` | `TK-106`, `TK-116` | 2026-03-19 | 2026-03-19 | active |
| DA-007 | `docs/dev/milestone-01-m1-core-extraction/sprint-001/core-policy-extraction-baseline.md` | `TK-103` | `TK-106`, `TK-116` | 2026-03-19 | 2026-03-19 | active |
| DA-008 | `docs/dev/milestone-01-m1-core-extraction/sprint-001/core-role-registry-extraction-baseline.md` | `TK-104` | `TK-106`, `TK-116` | 2026-03-19 | 2026-03-19 | active |
| DA-009 | `docs/dev/milestone-01-m1-core-extraction/sprint-001/adapter-sdk-initial-contract-baseline.md` | `TK-105` | `TK-106`, `TK-116`, `TK-405` | 2026-03-19 | 2026-03-19 | active |
| DA-010 | `docs/dev/milestone-01-m1-core-extraction/sprint-001/cli-bridge-regression-baseline.md` | `TK-106` | `TK-116`, `TK-416` | 2026-03-19 | 2026-03-19 | active |
| DA-011 | `docs/dev/milestone-01-m1-core-extraction/sprint-002/core-memory-extraction-baseline.md` | `TK-111` | `TK-112`, `TK-113`, `TK-116`, `TK-211` | 2026-03-19 | 2026-03-19 | active |
| DA-012 | `docs/dev/milestone-01-m1-core-extraction/sprint-002/core-session-extraction-baseline.md` | `TK-112` | `TK-113`, `TK-116`, `TK-213`, `TK-214` | 2026-03-19 | 2026-03-19 | active |
| DA-013 | `docs/dev/milestone-01-m1-core-extraction/sprint-002/memory-store-adapter-extraction-baseline.md` | `TK-113` | `TK-116`, `TK-211`, `TK-212` | 2026-03-19 | 2026-03-19 | active |

## Notes

1. `dependent_tasks` 字段使用任务 ID 列表，按时间先后排序。
2. 如产物废弃或被替代，新增记录并将旧记录标记为 `deprecated`，避免静默删除造成链路中断。
