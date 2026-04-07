# project-054-vscode-secondary-surface-rollout 计划

- Status: active
- Date: 2026-04-06
- Stage Mapping: secondary surface selection and rollout
- Phase Mapping: support declaration / MVP hardening / desktop foundation guardrails
- Upstream:
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/adopter-productization-priority-and-surface-sequencing.md`
  - `.repo-ai-governor/context/dev/project-051-priority-roadmap-promotion-and-decomposition/sprint-001-promotion-and-followup-decomposition/tasks/DA-588-priority-roadmap-promotion-and-rollout-decomposition-handoff.md`

## 1. 目标

1. 明确选择 `VS Code extension` 作为当前更值得收口的 primary secondary surface。
2. 将 desktop 保持为 foundation surface，只补必要 seam，不做大规模产品壳扩张。
3. 为 secondary surface 建立更清晰的文档、验证和正式支持口径。

## 2. Sprint 细化

## 2.1 sprint-001-vscode-support-boundary-and-packaging-narrative

- Status: active
- Sprint Goal: 明确 VS Code extension 的正式支持边界、安装说明与 support matrix 口径。
- Task Package: `TK-607`、`TK-608`、`TK-609`。

## 2.2 sprint-002-vscode-mvp-hardening-and-desktop-foundation-guardrails

- Status: planned
- Sprint Goal: 对 VS Code MVP 做定向 hardening，同时把 desktop 的 non-goal 说清楚。
- Task Package: `TK-610`、`TK-611`、`TK-612`。

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
|---|---|---|---|---|---|
| TK-607 | sprint-001 | freeze VS Code secondary surface support boundary and packaging matrix | surface/contract | project-052 closeout recommended | in_progress |
| TK-608 | sprint-001 | align support matrix maintainer evidence and installer narrative for VS Code extension | docs/evidence | TK-607 | planned |
| TK-609 | sprint-001 | close VS Code secondary surface declaration with smoke and docs parity evidence | surface/acceptance | TK-607、TK-608 | planned |
| TK-610 | sprint-002 | freeze VS Code MVP gap list and desktop foundation non-goal guardrails | surface/boundary | TK-609 | planned |
| TK-611 | sprint-002 | implement targeted VS Code MVP hardening and trust-sensitive diagnostics follow-through | implementation | TK-610 | planned |
| TK-612 | sprint-002 | close project-054 with secondary surface rollout summary and desktop foundation recommendation | project/closeout | TK-610、TK-611 | planned |

## 4. 依赖产物策略

1. secondary surface 先做 boundary 与 packaging narrative，再做 MVP hardening。
2. 本项目默认遵循 `VS Code first / desktop foundation`，不把 desktop 再拉回并行主线。
3. `project-052` 建议先完成 primary CLI adopter truthfulness 基线，再激活本项目。

## 5. DoD（project-054）

1. support matrix 能清晰表达 VS Code extension 的正式状态。
2. VS Code extension 安装与验证叙事形成最小可采用路径。
3. desktop 保持 foundation 口径，不被误述为完整产品。

## 6. 里程碑记录

1. 2026-04-06：基于 `DA-588` 创建 `project-054` planned stream，作为 priority roadmap 的 secondary surface follow-up。
2. 2026-04-06：已写入 `sprint-001 ~ sprint-002` 与 `TK-607 ~ TK-612` skeleton，待后续按顺序激活。
3. 2026-04-07：`project-053` final closeout 完成后，`project-054 / sprint-001` 被激活为当前 primary stream，`TK-607` 已切换为 `in_progress`。
