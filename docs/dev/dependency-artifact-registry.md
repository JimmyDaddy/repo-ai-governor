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
| DA-014 | `docs/dev/milestone-01-m1-core-extraction/sprint-002/notification-dispatcher-extraction-baseline.md` | `TK-114` | `TK-116`, `TK-311`, `TK-312` | 2026-03-19 | 2026-03-19 | active |
| DA-015 | `docs/dev/milestone-01-m1-core-extraction/sprint-002/dependency-direction-warning-gate-baseline.md` | `TK-115` | `TK-116`, `TK-503` | 2026-03-19 | 2026-03-19 | active |
| DA-016 | `docs/dev/milestone-01-m1-core-extraction/sprint-002/m1-exit-regression-and-cr-closure-report.md` | `TK-116` | `TK-216`, `TK-416`, `TK-516` | 2026-03-19 | 2026-03-19 | active |
| DA-017 | `docs/dev/milestone-02-m2-workspace-memory-session/sprint-001/workspace-schema-tool-managed-repo-local-baseline.md` | `TK-201` | `TK-202`, `TK-203`, `TK-204`, `TK-205`, `TK-206`, `TK-216` | 2026-03-19 | 2026-03-19 | active |
| DA-018 | `docs/dev/milestone-02-m2-workspace-memory-session/sprint-001/workspace-resolver-and-repo-fingerprint-baseline.md` | `TK-202` | `TK-203`, `TK-204`, `TK-205`, `TK-216` | 2026-03-19 | 2026-03-19 | active |
| DA-019 | `docs/dev/milestone-02-m2-workspace-memory-session/sprint-001/tool-managed-default-path-and-initialization-baseline.md` | `TK-203` | `TK-204`, `TK-205`, `TK-206`, `TK-216` | 2026-03-19 | 2026-03-19 | active |
| DA-020 | `docs/dev/milestone-02-m2-workspace-memory-session/sprint-001/repo-local-mode-integration-and-compatibility-baseline.md` | `TK-204` | `TK-205`, `TK-206`, `TK-216` | 2026-03-19 | 2026-03-19 | active |
| DA-021 | `docs/dev/milestone-02-m2-workspace-memory-session/sprint-001/workspace-migration-copy-verify-switch-baseline.md` | `TK-205` | `TK-206`, `TK-216` | 2026-03-19 | 2026-03-19 | active |
| DA-022 | `docs/dev/milestone-02-m2-workspace-memory-session/sprint-001/workspace-rollback-and-failure-error-model-baseline.md` | `TK-206` | `TK-216`, `TK-306` | 2026-03-19 | 2026-03-19 | active |
| DA-023 | `docs/dev/milestone-02-m2-workspace-memory-session/sprint-002/normative-knowledge-sources-integration-baseline.md` | `TK-211` | `TK-212`, `TK-215`, `TK-216`, `TK-217` | 2026-03-19 | 2026-03-19 | active |
| DA-024 | `docs/dev/milestone-02-m2-workspace-memory-session/sprint-002/operational-state-source-integration-baseline.md` | `TK-212` | `TK-213`, `TK-215`, `TK-216`, `TK-217` | 2026-03-19 | 2026-03-19 | active |
| DA-025 | `docs/dev/milestone-02-m2-workspace-memory-session/sprint-002/shared-execution-session-id-event-bus-baseline.md` | `TK-213` | `TK-214`, `TK-215`, `TK-315`, `TK-316` | 2026-03-19 | 2026-03-19 | active |
| DA-026 | `docs/dev/milestone-02-m2-workspace-memory-session/sprint-002/session-snapshot-and-replay-baseline.md` | `TK-214` | `TK-215`, `TK-216`, `TK-315`, `TK-316` | 2026-03-19 | 2026-03-19 | active |
| DA-027 | `docs/dev/milestone-02-m2-workspace-memory-session/sprint-002/audit-field-completion-workspace-session-memory-baseline.md` | `TK-215` | `TK-216`, `TK-506`, `TK-516` | 2026-03-19 | 2026-03-19 | active |
| DA-028 | `docs/dev/milestone-02-m2-workspace-memory-session/sprint-002/m2-exit-test-and-documentation-closure-report.md` | `TK-216` | `TK-316`, `TK-416`, `TK-516` | 2026-03-19 | 2026-03-19 | active |
| DA-029 | `docs/dev/milestone-02-m2-workspace-memory-session/sprint-002/artifact-registry-foundation-and-dependency-resolver-contract-baseline.md` | `TK-217` | `TK-307`, `TK-316`, `TK-501` | 2026-03-19 | 2026-03-19 | active |
| DA-030 | `docs/dev/milestone-03-m3-orchestration-hitl/sprint-001/dsl-ir-sequential-parallel-loop-condition-baseline.md` | `TK-301` | `TK-302`, `TK-303`, `TK-304` | 2026-03-19 | 2026-03-19 | active |
| DA-031 | `docs/dev/milestone-03-m3-orchestration-hitl/sprint-001/process-compiler-validation-and-artifact-baseline.md` | `TK-302` | `TK-303`, `TK-304`, `TK-307` | 2026-03-19 | 2026-03-19 | active |
| DA-032 | `docs/dev/milestone-03-m3-orchestration-hitl/sprint-001/policy-gate-rules-and-threshold-baseline.md` | `TK-303` | `TK-304`, `TK-305`, `TK-306` | 2026-03-19 | 2026-03-19 | active |
| DA-033 | `docs/dev/milestone-03-m3-orchestration-hitl/sprint-001/hitl-decision-model-confirm-escalate-reject-baseline.md` | `TK-304` | `TK-305`, `TK-306`, `TK-311` | 2026-03-19 | 2026-03-19 | active |
| DA-034 | `docs/dev/milestone-03-m3-orchestration-hitl/sprint-001/human-decision-feedback-loop-baseline.md` | `TK-305` | `TK-306`, `TK-316` | 2026-03-19 | 2026-03-19 | active |
| DA-035 | `docs/dev/milestone-03-m3-orchestration-hitl/sprint-001/timeout-cancel-concurrency-conflict-recovery-baseline.md` | `TK-306` | `TK-316`, `TK-416` | 2026-03-19 | 2026-03-19 | active |
| DA-036 | `docs/dev/milestone-03-m3-orchestration-hitl/sprint-001/dependency-artifact-auto-registration-and-context-injection-runtime-baseline.md` | `TK-307` | `TK-316`, `TK-501`, `TK-503` | 2026-03-19 | 2026-03-19 | active |

## Notes

1. `dependent_tasks` 字段使用任务 ID 列表，按时间先后排序。
2. 如产物废弃或被替代，新增记录并将旧记录标记为 `deprecated`，避免静默删除造成链路中断。
