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

## Program View

| Milestone | Priority | Phase | Steps | Sprints |
|---|---|---|---|---|
| M0 基线治理与重构起跑 | P0（已完成） | Phase A/B | Step 1 | 1 |
| M1 核心包抽离 | P1（已完成） | Phase B | Step 2 | 2 |
| M2 Workspace + Memory + Session 稳定化 | P1（已完成） | Phase C | Step 3~5 | 2 |
| M3 编排引擎与 HITL 闭环 | P1（已完成） | Phase D | Step 4~6 | 2 |
| M4 适配器模块化与 CLI 瘦身 | P1（进行中） | Phase D | Step 5~6 | 2 |
| M5 质量硬化与发布就绪 | P1->P2 过渡 | Phase E | Step 7 | 2 |

## Validation Targets

1. 每个里程碑目录包含 `index.md` 与 `plan.md`。
2. 每个 sprint 目录包含 `index.md`、`plan.md`、`tasks/checklist.md`、`tasks/tasks.csv`、`code-review/README.md` 与任务卡（默认 6 个，可按范围增补）。
3. 任务编号按百位段唯一：M0=TK-001~、M1=TK-101~、M2=TK-201~、M3=TK-301~、M4=TK-401~、M5=TK-501~。
