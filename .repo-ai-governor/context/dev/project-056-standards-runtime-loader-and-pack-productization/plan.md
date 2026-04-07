# project-056-standards-runtime-loader-and-pack-productization 计划

- Status: completed
- Date: 2026-04-06
- Stage Mapping: standards runtime productization
- Phase Mapping: runtime loader path / team pack path / AGENTS adoption boundary
- Upstream:
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/adopter-productization-priority-and-surface-sequencing.md`
  - `.repo-ai-governor/context/dev/project-051-priority-roadmap-promotion-and-decomposition/sprint-001-promotion-and-followup-decomposition/tasks/DA-588-priority-roadmap-promotion-and-rollout-decomposition-handoff.md`

## 1. 目标

1. 把当前已经很强的 `@repo-ai-governor/standards` 库能力推进成更真实的产品能力。
2. 明确 `official / team / repository` 三层 pack 的消费路径。
3. 决定 root `AGENTS.md` 是否进入 projector 自动产物链。

## 2. Sprint 细化

## 2.1 sprint-001-standards-runtime-loader-product-path

- Status: active
- Sprint Goal: 收口 standards runtime loader 的产品消费路径和文档示例。
- Task Package: `TK-618`、`TK-619`、`TK-620`。
- Task Package: `TK-618`、`TK-619`、`TK-620`、`TK-650`、`TK-651`。

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
|---|---|---|---|---|---|
| TK-618 | sprint-001 | freeze standards runtime loader product path and source-layering contract | standards/contract | project-052 closeout recommended | completed |
| TK-619 | sprint-001 | implement and document standards runtime consumption examples plus team-pack path | standards/implementation/docs | TK-618 | completed |
| TK-620 | sprint-001 | decide AGENTS projector adoption boundary and close standards runtime productization baseline | standards/closeout | TK-618、TK-619 | completed |
| TK-650 | sprint-001 | sprint-001 exit acceptance and project-final review activation handoff | closeout/handoff | TK-618、TK-619、TK-620、CR-001 | completed |
| TK-651 | sprint-001 | finalize project-056 closeout and clear the active primary stream | closeout/final-audit | TK-650、CR-002 | completed |

## 4. 依赖产物策略

1. standards runtime loader 的产品化优先收口 source-layering contract，再落地 consumption examples。
2. AGENTS projector adoption boundary 只在前两步稳定后决策，避免过早把自动投影当成既成事实。
3. 本项目默认排在 adopter truthfulness、real adapter path 与 GA evidence 之后激活。

## 5. DoD（project-056）

1. `official / team / repository` 三层 source group 有清晰消费路径。
2. standards runtime loader 不再只是 README 中的能力示例。
3. AGENTS 投影边界决策清楚，不再悬而未决。

## 6. 里程碑记录

1. 2026-04-06：基于 `DA-588` 创建 `project-056` planned stream，作为 standards runtime productization follow-up。
2. 2026-04-06：已写入 `sprint-001` 与 `TK-618 ~ TK-620` skeleton，待后续按顺序激活。
3. 2026-04-07：在 `project-057` final closeout 完成后被激活为当前 primary project，`sprint-001 / TK-618` 进入执行窗口。
4. 2026-04-07：`TK-618 ~ TK-620` 已在同一实现窗口完成，进入 sprint scoped CR 前验证与 closeout 准备阶段。
5. 2026-04-07：`CR-001` clean `resolved` 后，`TK-650 / DA-650` 已完成 sprint-001 closeout，并将同一 sprint surface 保留给 `project-056` 的 project-final CR loop。
6. 2026-04-07：`CR-002` 已作为 project-final delegated review round 打开；在该 round 收口前，`sprint-001` 聚合状态保持 `active`，用于承载 project-final CR task 与 review lifecycle。
7. 2026-04-07：`CR-002` clean `resolved` 后，`TK-651 / DA-651` 已完成 final closeout write-back；`project-056 / sprint-001` 已恢复为 `completed`，并从 active stream 移入 completed history。
8. 2026-04-07：项目完成态审计摘要已落盘：`project-056-standards-runtime-loader-and-pack-productization-completion-audit-summary.md`。
