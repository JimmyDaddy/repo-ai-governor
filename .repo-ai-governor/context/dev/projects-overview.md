# Repo AI Governor Project 拆解总览

- Status: active
- Date: 2026-03-19
- Basis:
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`

## 1. Project 分解映射

| Project | 覆盖 Stage | 对应 Phase | 目标 |
|---|---|---|---|
| `project-001-foundation` | Stage 0-1 | Phase A | 建立 monorepo 边界、配置层、安装初始化与基础 CI 治理 |
| `project-002-governance-core` | Stage 2-3 | Phase A/B | 跑通流程执行 + 策略门禁 + HITL，含策略规则输入基线 |
| `project-003-standards-and-slots` | Stage 4 | Phase B/C | Standards 渲染投影、Spec Sync Guard、Slot 双轨安全、升级 UX |
| `project-004-agent-adapter-runtime` | Stage 5 | Phase C | 多 Agent 协议/角色模型、适配器体系、受限网络模式 |
| `project-005-observability-and-artifacts` | Stage 6 | Phase D | 审计回放、依赖产物运行时、CLI 输出契约、隐私治理 |
| `project-006-hardening-and-release` | Stage 7 | Phase E | 契约测试、稳定性、发布治理与离线回归 |
| `project-007-platformization` | Stage 8 | P2 扩展 | 插槽市场、可视化面板、组织级审计与策略分发 |

## 2. 依赖顺序

1. `project-001-foundation`
2. `project-002-governance-core`
3. `project-003-standards-and-slots`
4. `project-004-agent-adapter-runtime`
5. `project-005-observability-and-artifacts`
6. `project-006-hardening-and-release`
7. `project-007-platformization`

说明：默认串行推进；仅允许在前置 DoD 达成后并行启动后续低耦合任务。

## 3. 交付原则

1. 每个 project 必须至少包含一个 `plan.md`。
2. 主执行流 project 必须维护 `sprint-xxx/tasks/checklist.md` 与 `sprint-xxx/tasks/tasks.csv`。
3. 涉及评审时，评审文件按 `review_ -> verified_review_ -> resolved_review_` 生命周期推进。
