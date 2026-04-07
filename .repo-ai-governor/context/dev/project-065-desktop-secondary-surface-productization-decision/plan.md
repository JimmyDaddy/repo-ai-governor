# project-065-desktop-secondary-surface-productization-decision 计划

- Status: planned
- Date: 2026-04-08
- Stage Mapping: desktop productization decision
- Phase Mapping: surface decision + packaging/support boundary
- Upstream:
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/adopter-productization-priority-and-surface-sequencing.md`
  - `.repo-ai-governor/context/dev/project-072-current-surface-priority-promotion-and-decomposition/sprint-001-promotion-and-formal-followup-decomposition/tasks/DA-696-current-surface-priority-promotion-and-followup-decomposition-handoff.md`

## 1. 目标

1. 决定 desktop 是否真的进入正式 secondary-surface 产品化路径。
2. 若继续保留 foundation-only，则把非目标与 public support claim 说得更硬；若升级，则收最小 packaged/support boundary。
3. 避免 desktop 在“基础能力不少”与“产品口径很保守”之间长期含混。

## 2. Sprint 细化

## 2.1 sprint-001-secondary-surface-decision-and-packaging-boundary

- Status: planned
- Sprint Goal: 冻结 desktop 的产品化决策与最小支持边界。
- Task Package: `TK-673`、`TK-674`、`TK-675`。

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
| --- | --- | --- | --- | --- | --- |
| TK-673 | sprint-001 | freeze desktop secondary-surface productization decision and packaging boundary | product/contract | project-064 recommended | planned |
| TK-674 | sprint-001 | implement minimum desktop productization seam or reaffirm foundation-only guardrails with explicit evidence | implementation/boundary | TK-673 | planned |
| TK-675 | sprint-001 | close desktop surface recommendation with support-truth refresh | docs/evidence/closeout | TK-673、TK-674 | planned |

## 4. 依赖产物策略

1. 先冻结 desktop 的产品化决策，再决定做最小 seam 还是明确保留 foundation-only。
2. closeout 必须输出 public support-truth 与 evidence，而不是只停留在内部判断。

## 5. DoD（project-065）

1. desktop 的正式支持口径有明确答案。
2. 若仍保留 foundation-only，也有更强的 public support boundary 和 evidence。
3. 若升级 secondary surface，则至少具备最小 packaged/support story。
