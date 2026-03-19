# Dev Program Index

- Status: active
- Date: 2026-03-19
- Scope: 项目级总执行拆解（M0~M5）
- Sprint Cadence: 2 weeks

## Source Of Truth

1. [../product-requirements.md](../product-requirements.md)
2. [../repo-ai-governor-overall-technical-solution.md](../repo-ai-governor-overall-technical-solution.md)
3. [../repo-ai-governor-architecture-and-repo-layering.md](../repo-ai-governor-architecture-and-repo-layering.md)
4. [../repo-ai-governor-master-execution-plan.md](../repo-ai-governor-master-execution-plan.md)

## Milestones

1. [milestone-00-m0-baseline-governance/index.md](./milestone-00-m0-baseline-governance/index.md)
2. [milestone-01-m1-core-extraction/index.md](./milestone-01-m1-core-extraction/index.md)
3. [milestone-02-m2-workspace-memory-session/index.md](./milestone-02-m2-workspace-memory-session/index.md)
4. [milestone-03-m3-orchestration-hitl/index.md](./milestone-03-m3-orchestration-hitl/index.md)
5. [milestone-04-m4-adapter-cli-slimming/index.md](./milestone-04-m4-adapter-cli-slimming/index.md)
6. [milestone-05-m5-hardening-release/index.md](./milestone-05-m5-hardening-release/index.md)

## Core Governance Artifacts

1. [M0 边界规则与依赖方向检查策略](./milestone-00-m0-baseline-governance/sprint-001/boundary-and-dependency-check-strategy.md)
2. [Dependency Artifact Registry](./dependency-artifact-registry.md)
3. [M0 核心命令 Golden 回归清单](./milestone-00-m0-baseline-governance/sprint-001/golden-command-regression-checklist.md)
4. [M0 契约测试目录与命名基线](./milestone-00-m0-baseline-governance/sprint-001/contract-test-directory-and-naming-baseline.md)
5. [M0 风险台账与里程碑验收模板](./milestone-00-m0-baseline-governance/sprint-001/risk-register-and-milestone-acceptance-template.md)
6. [M1 Monorepo Workspace 骨架与构建入口基线](./milestone-01-m1-core-extraction/sprint-001/monorepo-workspace-skeleton-and-build-entry-baseline.md)
7. [M1 Core-Process 抽离基线](./milestone-01-m1-core-extraction/sprint-001/core-process-extraction-baseline.md)
8. [M1 Core-Policy 抽离基线](./milestone-01-m1-core-extraction/sprint-001/core-policy-extraction-baseline.md)
9. [M1 Core-Role-Registry 抽离基线](./milestone-01-m1-core-extraction/sprint-001/core-role-registry-extraction-baseline.md)
10. [M1 Adapter-SDK 初版契约基线](./milestone-01-m1-core-extraction/sprint-001/adapter-sdk-initial-contract-baseline.md)
11. [M1 CLI 桥接回归基线](./milestone-01-m1-core-extraction/sprint-001/cli-bridge-regression-baseline.md)
12. [M1 Core-Memory 抽离基线](./milestone-01-m1-core-extraction/sprint-002/core-memory-extraction-baseline.md)
13. [M1 Core-Session 抽离基线](./milestone-01-m1-core-extraction/sprint-002/core-session-extraction-baseline.md)
14. [M1 Memory-Store-Adapter 抽离基线](./milestone-01-m1-core-extraction/sprint-002/memory-store-adapter-extraction-baseline.md)
15. [M1 Notification-Dispatcher 抽离基线](./milestone-01-m1-core-extraction/sprint-002/notification-dispatcher-extraction-baseline.md)
16. [M1 依赖方向自动检查（Warning）接入基线](./milestone-01-m1-core-extraction/sprint-002/dependency-direction-warning-gate-baseline.md)
17. [M1 退出回归与 CR 收口报告](./milestone-01-m1-core-extraction/sprint-002/m1-exit-regression-and-cr-closure-report.md)
18. [M2 Workspace Schema 双模式基线](./milestone-02-m2-workspace-memory-session/sprint-001/workspace-schema-tool-managed-repo-local-baseline.md)
19. [M2 Workspace Resolver 与 Repo Fingerprint 基线](./milestone-02-m2-workspace-memory-session/sprint-001/workspace-resolver-and-repo-fingerprint-baseline.md)
20. [M2 Tool-Managed 默认路径与初始化基线](./milestone-02-m2-workspace-memory-session/sprint-001/tool-managed-default-path-and-initialization-baseline.md)
21. [M2 Repo-Local 模式接入与兼容基线](./milestone-02-m2-workspace-memory-session/sprint-001/repo-local-mode-integration-and-compatibility-baseline.md)
22. [M2 Workspace 迁移链路（Copy/Verify/Switch）基线](./milestone-02-m2-workspace-memory-session/sprint-001/workspace-migration-copy-verify-switch-baseline.md)
23. [M2 Workspace 回滚与失败错误模型基线](./milestone-02-m2-workspace-memory-session/sprint-001/workspace-rollback-and-failure-error-model-baseline.md)
24. [M2 Normative Knowledge Sources 接入基线](./milestone-02-m2-workspace-memory-session/sprint-002/normative-knowledge-sources-integration-baseline.md)
25. [M2 Operational State Source 接入基线](./milestone-02-m2-workspace-memory-session/sprint-002/operational-state-source-integration-baseline.md)
26. [M2 共享 execution_session_id 事件总线基线](./milestone-02-m2-workspace-memory-session/sprint-002/shared-execution-session-id-event-bus-baseline.md)
27. [M2 Session 快照与回放基线](./milestone-02-m2-workspace-memory-session/sprint-002/session-snapshot-and-replay-baseline.md)
28. [M2 审计字段补齐基线](./milestone-02-m2-workspace-memory-session/sprint-002/audit-field-completion-workspace-session-memory-baseline.md)
29. [M2 退出测试与文档收口报告](./milestone-02-m2-workspace-memory-session/sprint-002/m2-exit-test-and-documentation-closure-report.md)
30. [M2 Artifact Registry 与 Dependency Resolver 契约基线](./milestone-02-m2-workspace-memory-session/sprint-002/artifact-registry-foundation-and-dependency-resolver-contract-baseline.md)
31. [M3 DSL/IR 四节点契约基线](./milestone-03-m3-orchestration-hitl/sprint-001/dsl-ir-sequential-parallel-loop-condition-baseline.md)
32. [M3 Process Compiler 校验与产物基线](./milestone-03-m3-orchestration-hitl/sprint-001/process-compiler-validation-and-artifact-baseline.md)
33. [M3 Policy Gate 规则与阈值基线](./milestone-03-m3-orchestration-hitl/sprint-001/policy-gate-rules-and-threshold-baseline.md)
34. [M3 HITL 决策模型基线](./milestone-03-m3-orchestration-hitl/sprint-001/hitl-decision-model-confirm-escalate-reject-baseline.md)
35. [M3 人工决策回灌链路基线](./milestone-03-m3-orchestration-hitl/sprint-001/human-decision-feedback-loop-baseline.md)
36. [M3 超时取消并发冲突恢复基线](./milestone-03-m3-orchestration-hitl/sprint-001/timeout-cancel-concurrency-conflict-recovery-baseline.md)
37. [M3 依赖产物自动注册与上下文注入运行时基线](./milestone-03-m3-orchestration-hitl/sprint-001/dependency-artifact-auto-registration-and-context-injection-runtime-baseline.md)
38. [M3 Webhook 通知 Provider 基线](./milestone-03-m3-orchestration-hitl/sprint-002/notification-provider-webhook-baseline.md)
39. [M3 通知回退通道抽象基线](./milestone-03-m3-orchestration-hitl/sprint-002/notification-fallback-channel-abstraction-baseline.md)
40. [M3 自定义角色注册与生命周期基线](./milestone-03-m3-orchestration-hitl/sprint-002/custom-role-registration-and-role-profile-lifecycle-baseline.md)
41. [M3 Agent 与 Skill 契约边界基线](./milestone-03-m3-orchestration-hitl/sprint-002/agent-skill-contract-boundary-baseline.md)
42. [M3 多 Agent 共享 Session 协作约束基线](./milestone-03-m3-orchestration-hitl/sprint-002/multi-agent-shared-session-collaboration-constraints-baseline.md)
43. [M3 端到端编排链路回归基线](./milestone-03-m3-orchestration-hitl/sprint-002/m3-end-to-end-orchestration-regression-baseline.md)
44. [M4 Codex Adapter 模块化基线](./milestone-04-m4-adapter-cli-slimming/sprint-001/codex-adapter-modularization-baseline.md)
45. [M4 Copilot Adapter 模块化基线](./milestone-04-m4-adapter-cli-slimming/sprint-001/copilot-adapter-modularization-baseline.md)
46. [M4 Claude Adapter 模块化基线](./milestone-04-m4-adapter-cli-slimming/sprint-001/claude-adapter-modularization-baseline.md)
47. [M4 适配能力矩阵与降级策略基线](./milestone-04-m4-adapter-cli-slimming/sprint-001/adapter-capability-matrix-and-degradation-strategy-baseline.md)
48. [M4 Adapter 契约测试补齐基线](./milestone-04-m4-adapter-cli-slimming/sprint-001/adapter-contract-test-completion-baseline.md)
49. [M4 CLI 路由层设计冻结基线](./milestone-04-m4-adapter-cli-slimming/sprint-001/cli-routing-layer-design-freeze-baseline.md)
50. [M4 命令核心逻辑下沉基线](./milestone-04-m4-adapter-cli-slimming/sprint-002/run-check-review-review-verify-core-logic-package-downlift-baseline.md)
51. [M4 CLI 薄入口路由基线](./milestone-04-m4-adapter-cli-slimming/sprint-002/apps-cli-thin-routing-only-baseline.md)
52. [M4 Slot 安全执行模型基线](./milestone-04-m4-adapter-cli-slimming/sprint-002/slot-secure-execution-model-integration-baseline.md)
53. [M4 入口层权限风险门禁收口基线](./milestone-04-m4-adapter-cli-slimming/sprint-002/entry-layer-permission-risk-gate-convergence-baseline.md)
54. [M4 性能基线与瓶颈报告](./milestone-04-m4-adapter-cli-slimming/sprint-002/performance-baseline-and-bottleneck-report.md)
55. [M4 兼容性回归基线](./milestone-04-m4-adapter-cli-slimming/sprint-002/m4-compatibility-regression-baseline.md)
56. [M5 契约全覆盖基线](./milestone-05-m5-hardening-release/sprint-001/contract-test-full-coverage-baseline.md)
57. [M5 Integration/E2E 主链路基线](./milestone-05-m5-hardening-release/sprint-001/integration-e2e-mainline-baseline.md)
58. [M5 依赖边界 Blocking Gate 基线](./milestone-05-m5-hardening-release/sprint-001/dependency-boundary-blocking-gate-baseline.md)
59. [M5 版本策略门禁基线](./milestone-05-m5-hardening-release/sprint-001/lockstep-independent-version-policy-gate-baseline.md)
60. [M5 分级发布流程固化基线](./milestone-05-m5-hardening-release/sprint-001/canary-rc-ga-release-flow-hardening-baseline.md)
61. [M5 审计回放报告链路基线](./milestone-05-m5-hardening-release/sprint-001/audit-replay-reporting-pipeline-baseline.md)
62. [M5 依赖产物完整性 Blocking Gate 基线](./milestone-05-m5-hardening-release/sprint-001/dependency-artifact-integrity-blocking-gate-baseline.md)
63. [M5 质量门禁稳定性达标基线](./milestone-05-m5-hardening-release/sprint-002/quality-gate-stability-target-baseline.md)
64. [M5 升级迁移指南与回滚手册基线](./milestone-05-m5-hardening-release/sprint-002/upgrade-migration-and-rollback-manual-baseline.md)
65. [M5 发布验收 checklist 自动化基线](./milestone-05-m5-hardening-release/sprint-002/release-acceptance-checklist-automation-baseline.md)
66. [M5 可观测与报告基线收口](./milestone-05-m5-hardening-release/sprint-002/observability-and-reporting-baseline-closure.md)
67. [M5 数据隐私与保留策略验收基线](./milestone-05-m5-hardening-release/sprint-002/data-privacy-and-retention-policy-acceptance-baseline.md)
68. [M5 GA Readiness 最终评审包基线](./milestone-05-m5-hardening-release/sprint-002/ga-readiness-final-review-package-baseline.md)

## Program View

| Milestone | Priority | Phase | Steps | Sprints |
|---|---|---|---|---|
| M0 基线治理与重构起跑 | P0（已完成） | Phase A/B | Step 1 | 1 |
| M1 核心包抽离 | P1（已完成） | Phase B | Step 2 | 2 |
| M2 Workspace + Memory + Session 稳定化 | P1（已完成） | Phase C | Step 3~5 | 2 |
| M3 编排引擎与 HITL 闭环 | P1（已完成） | Phase D | Step 4~6 | 2 |
| M4 适配器模块化与 CLI 瘦身 | P1（已完成） | Phase D | Step 5~6 | 2 |
| M5 质量硬化与发布就绪 | P1->P2（已完成） | Phase E | Step 7 | 2 |

## Validation Targets

1. 每个里程碑目录包含 `index.md` 与 `plan.md`。
2. 每个 sprint 目录包含 `index.md`、`plan.md`、`tasks/checklist.md`、`tasks/tasks.csv`、`code-review/README.md` 与任务卡（默认 6 个，可按范围增补）。
3. 任务编号按百位段唯一：M0=TK-001~、M1=TK-101~、M2=TK-201~、M3=TK-301~、M4=TK-401~、M5=TK-501~。
