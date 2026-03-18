# Dev Program Index

- Status: active
- Date: 2026-03-18
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

## Program View

| Milestone | Priority | Phase | Steps | Sprints |
|---|---|---|---|---|
| M0 基线治理与重构起跑 | P0（已完成） | Phase A/B | Step 1 | 1 |
| M1 核心包抽离 | P1（进行中） | Phase B | Step 2 | 2 |
| M2 Workspace + Memory + Session 稳定化 | P1（进行中） | Phase C | Step 3~5 | 2 |
| M3 编排引擎与 HITL 闭环 | P1（进行中） | Phase D | Step 4~6 | 2 |
| M4 适配器模块化与 CLI 瘦身 | P1（进行中） | Phase D | Step 5~6 | 2 |
| M5 质量硬化与发布就绪 | P1->P2 过渡 | Phase E | Step 7 | 2 |

## Validation Targets

1. 每个里程碑目录包含 `index.md` 与 `plan.md`。
2. 每个 sprint 目录包含 `index.md`、`plan.md`、`tasks/checklist.md`、`tasks/tasks.csv`、`code-review/README.md` 与任务卡（默认 6 个，可按范围增补）。
3. 任务编号按百位段唯一：M0=TK-001~、M1=TK-101~、M2=TK-201~、M3=TK-301~、M4=TK-401~、M5=TK-501~。
