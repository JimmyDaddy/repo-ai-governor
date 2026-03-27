# Repo AI Governor Project 拆解总览

- Status: active
- Date: 2026-03-27
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
| `project-008-workflow-optimization` | Cross-Stage | Process Optimization | 优化执行流程治理（门禁分层、台账同步、风险契约、拆解协议） |
| `project-009-production-readiness` | Stage 9 | Phase E 收口 + GA Readiness overlay | 命令去 skeleton 化、本地安装与调试、自动执行闭环、角色级观测、examples 与发布门禁生产化 |
| `project-010-local-model-and-ide-expansion` | Stage 9 follow-up backlog | P1 扩展（本地模型 + IDE 入口） | 落地本地模型适配路径与多 IDE 生产化接入模板，收敛后续 rollout 输入约束 |
| `project-011-cli-package-decomposition` | Stage 9 enabling refactor | CLI 架构分解 | 已完成 `apps/cli` 的 bounded-context 拆分与 package hardening，为 project-010 主链与后续 rollout 提供正式工程边界 |
| `project-012-execution-context-optimization` | Cross-Stage follow-up | Context Efficiency / Governance Simplification | 收敛启动加载、active stream 上下文、TK 单写源与任务模板输入分层，降低单任务默认上下文成本 |
| `project-013-remote-provider-and-adapter-ops` | Stage 9 remaining closure | Phase E follow-up + Adapter Operations Hardening | 收敛 Codex / GitHub Copilot / Claude Code 远端 provider 真实调用、adapter 运维契约与统一路由 truthfulness，补齐 Stage 9 剩余真实执行面 |
| `project-014-langgraph-orchestration-runtime-adoption` | Post-Stage-9 runtime modernization | Runtime Modernization / CLI + Desktop Convergence | 采用 LangGraph 作为编排运行时方向，收敛 dual-runtime 迁移与 shared local orchestration service，为 CLI 与未来 desktop 共用执行面铺路 |
| `project-015-memory-provider-pluginization` | Post-Stage-9 runtime packaging modularization | Runtime Modularity / Optional Plugin Resolution | 已完成 built-in registry、optional plugin、shared loader / service reuse 与 service-host packaging / clean-room / release gate 收口 |
| `project-016-langgraph-runtime-productization` | Post-Stage-9 runtime modernization follow-up | Runtime Productization / Vendor Adapter + Service Host | 已完成 LangGraph runtime truthfulness、graph-first execution、`sidecar + ipc` host 与 desktop execution/service-ops baseline 收口 |
| `project-017-technical-solution-modularization` | Cross-stage normative modularization follow-up | Normative Loading / Module Graph / Spec Sync Hardening | 已完成总技术方案模块化、lifecycle/promotion 治理，并补齐 repo-local promotion skill |
| `project-018-technical-solution-promotion-pilots` | Cross-stage normative consumption follow-up | Technical Solution Promotion / Consumption Proof | 已完成 `memory-provider-pluginization` 与 LangGraph promotion/backfill，并补齐 `core-runtime-langgraph` hard dependency truthfulness follow-up；同时为 `memory-module` 保留 prepare-promotion readiness/blocker baseline |
| `project-019-product-gap-assessment` | Cross-stage product alignment follow-up | PRD Gap Assessment / Priority Recalibration | 盘点当前工具对 PRD 的真实覆盖面，形成“现状 vs 目标”差距评估 draft，并为下一阶段优先级重排提供输入 |
| `project-020-adoption-productization-and-upgrade-ux` | Post-Stage-9 external adoption closure | Packaging Truthfulness / Upgrade UX / Adopter Pilot | 已完成打包分发真值、upgrade/workspace adopter UX 与双仓库真实 pilot；当前仅保留 closeout surface，等待下一条主执行流激活 |

## 2. 依赖顺序

1. `project-001-foundation`
2. `project-002-governance-core`
3. `project-003-standards-and-slots`
4. `project-008-workflow-optimization`（流程优化优先治理轨）
5. `project-004-agent-adapter-runtime`
6. `project-005-observability-and-artifacts`
7. `project-006-hardening-and-release`
8. `project-007-platformization`
9. `project-009-production-readiness`
10. `project-010-local-model-and-ide-expansion`
11. `project-011-cli-package-decomposition`
12. `project-012-execution-context-optimization`
13. `project-013-remote-provider-and-adapter-ops`
14. `project-014-langgraph-orchestration-runtime-adoption`
15. `project-015-memory-provider-pluginization`
16. `project-016-langgraph-runtime-productization`
17. `project-017-technical-solution-modularization`
18. `project-018-technical-solution-promotion-pilots`
19. `project-019-product-gap-assessment`
20. `project-020-adoption-productization-and-upgrade-ux`

说明：Stage 主链按 001-007、009、010、013 推进；`project-008` 作为跨阶段治理优化轨可优先执行；`project-011` 作为 `project-010` 的工程支撑分解轨，为 CLI package 重构提供独立执行流；`project-012` 作为 `project-008` 的上下文效率 follow-up，负责收敛当前仓库的启动加载与台账上下文成本；`project-013` 已完成 Stage 9 最后业务阻断项收口；`project-014` 承接 post-Stage-9 的运行时现代化主线，但只完成了第一阶段 adoption/service-backed execution 收口；`project-015`、`project-016`、`project-017`、`project-018`、`project-019` 与 `project-020` 均已完成并进入完成态消费面；当前 `current-context` 暂保留 `project-020` 作为 closeout surface，直到下一条主执行流显式激活。

## 3. 交付原则

1. 每个 project 必须至少包含一个 `plan.md`。
2. 主执行流 project 必须维护 `sprint-xxx/tasks/checklist.md` 与 `sprint-xxx/tasks/tasks.csv`。
3. 涉及评审时，评审文件按 `review_ -> verified_review_ -> resolved_review_` 生命周期推进。
