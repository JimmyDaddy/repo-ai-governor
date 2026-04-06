# project-053-real-adapter-invocation-productization 计划

- Status: active
- Date: 2026-04-06
- Stage Mapping: adapter real-invocation rollout
- Phase Mapping: Claude Code baseline / Codex rollout / Copilot boundary and local-model positioning
- Upstream:
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/adopter-productization-priority-and-surface-sequencing.md`
  - `.repo-ai-governor/context/dev/project-051-priority-roadmap-promotion-and-decomposition/sprint-001-promotion-and-followup-decomposition/tasks/DA-588-priority-roadmap-promotion-and-rollout-decomposition-handoff.md`

## 1. 目标

1. 将多工具适配从“正式支持但偏 fixture-backed”的状态推进到更可信的真实调用产品路径。
2. 按风险和收益顺序推进 `Claude Code -> Codex -> GitHub Copilot`。
3. 明确 `local-model` 的 fallback / restricted-network 产品定位。

## 2. Sprint 细化

## 2.1 sprint-001-claude-code-real-invocation-baseline

- Status: completed
- Sprint Goal: 先收口最容易形成真实调用产品路径的 `Claude Code`。
- Task Package: `TK-598`、`TK-599`、`TK-600`。

## 2.2 sprint-002-codex-real-invocation-and-cross-tool-routing

- Status: completed
- Sprint Goal: 推进 `Codex` 真实调用，并验证跨工具 routing handoff。
- Task Package: `TK-601`、`TK-602`、`TK-603`。

## 2.3 sprint-003-github-copilot-boundary-and-local-model-positioning

- Status: planned
- Sprint Goal: 收口 `GitHub Copilot` 真实路径边界，并明确 `local-model` 的正式 fallback 口径。
- Task Package: `TK-604`、`TK-605`、`TK-606`。

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
|---|---|---|---|---|---|
| TK-598 | sprint-001 | freeze Claude Code real invocation config probe timeout and degrade contract | adapter/contract | project-052 closeout recommended | planned |
| TK-599 | sprint-001 | implement Claude Code real invocation defaultable path with structured parsing and timeout handling | adapter/implementation | TK-598 | planned |
| TK-600 | sprint-001 | close Claude Code real invocation baseline with verify run and docs evidence | adapter/acceptance | TK-598、TK-599 | planned |
| TK-601 | sprint-002 | freeze Codex real invocation and cross-tool routing handoff contract | adapter/contract | TK-600 | planned |
| TK-602 | sprint-002 | implement Codex real invocation fallback and route handoff hardening | adapter/implementation | TK-601 | planned |
| TK-603 | sprint-002 | close first-batch multi-tool real invocation routing acceptance | adapter/acceptance | TK-601、TK-602 | planned |
| TK-604 | sprint-003 | freeze GitHub Copilot real invocation boundary and local-model fallback positioning | adapter/product-boundary | TK-603 | planned |
| TK-605 | sprint-003 | implement Copilot real path degrade handling and local-model support matrix alignment | adapter/implementation/docs | TK-604 | planned |
| TK-606 | sprint-003 | close real adapter invocation rollout with support matrix and verify evidence refresh | project/closeout | TK-604、TK-605 | planned |

## 4. 依赖产物策略

1. 先用 `Claude Code` 建立第一条稳定真实调用路径，再推进 `Codex` 与 `GitHub Copilot`。
2. `project-052` 建议先完成 adopter truthfulness 基线，再激活本项目，避免产品叙事和真实调用边界相互漂移。
3. `local-model` 只作为 fallback / restricted-network 边界收口，不抢占主 adapter 路线。
4. 本项目收口前，不把真实调用路径误报为“所有 adapter 已默认稳定可用”。

## 5. DoD（project-053）

1. 至少 1 到 2 个主 adapter 拥有稳定的真实调用产品路径。
2. `verify --adapters` 与 `run --dry-run --trace` 对真实路径有正式证据支撑。
3. support matrix 能区分 fixture-backed、正式真实调用与 fallback/degraded 三类状态。

## 6. 里程碑记录

1. 2026-04-06：基于 `DA-588` 创建 `project-053` planned stream，作为 priority roadmap 的第二顺位 implementation line。
2. 2026-04-06：已写入 `sprint-001 ~ sprint-003` 与 `TK-598 ~ TK-606` skeleton，待后续按顺序激活。
3. 2026-04-06：`project-052` final closeout 完成后，`project-053 / sprint-001` 被激活为当前 primary stream，`TK-598` 进入 `in_progress`。
4. 2026-04-07：`sprint-001` 已通过 `CR-001` clean closeout，`TK-607 / DA-607` 固定下一边界为 `sprint-002 / TK-601`，等待 sprint-001 boundary commit 后激活。
5. 2026-04-07：`sprint-001` boundary commit `e75028f` 已完成，primary stream 切换到 `sprint-002`，`TK-601` 进入 `in_progress`。
6. 2026-04-07：`sprint-002` 已完成 accepted finding 修复与 fresh clean recheck，`TK-608 / DA-608` 已完成 sprint closeout，并将下一边界固定为 `sprint-003 / TK-604`，等待 sprint-002 boundary commit 后激活。
