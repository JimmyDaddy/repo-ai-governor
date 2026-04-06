# project-045-governance-truth-alignment-and-primary-stream-cutover 计划

- Status: completed
- Date: 2026-04-05
- Stage Mapping: Governance truth alignment / current-context primary stream cutover
- Phase Mapping: Active stream handoff / delivery registry rollout truth repair / project status alignment / verification closeout
- Upstream:
  - `.repo-ai-governor/draft/repo-ai-governor-current-priority-backlog.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/context/completed-streams-history.md`
  - `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
  - `.repo-ai-governor/context/dev/project-038-session-main-capability-explainer-productization/plan.md`
  - `.repo-ai-governor/context/dev/project-041-desktop-surface-tech-selection-and-design/plan.md`
  - `.repo-ai-governor/context/dev/project-044-desktop-governance-console-mvp-foundation/plan.md`

## 1. 目标

1. 将 `.repo-ai-governor/draft/repo-ai-governor-current-priority-backlog.md -> P0` 从口头判断落实为一条正式治理执行流，而不是继续依附在 `project-044` 的 completed closeout surface 上。
2. 对齐 `current-context.md`、completed stream history、delivery registry 与相关 project plan 的 completed/planned 真值，消除“已完成但仍标 active / planned”的台账漂移。
3. 显式激活一条新的 primary stream，使后续 P1 工作有稳定的默认执行面与 ledger 入口。

## 2. Sprint 细化

## 2.1 sprint-001-governance-truth-alignment-and-context-cutover

- Status: completed
- Sprint Goal: 新建治理收口 stream，修正上下文与 delivery registry 真值，并完成 docs-only 验证闭环。
- Task Package: `TK-548`、`TK-549`、`TK-550`。

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
|---|---|---|---|---|---|
| TK-548 | sprint-001 | activate governance truth alignment stream and freeze p0 scope | governance/bootstrap | priority backlog draft + current-context | completed |
| TK-549 | sprint-001 | align current-context completed-stream history delivery registry and project status truth | governance/state-alignment | TK-548 | completed |
| TK-550 | sprint-001 | run governance verification and record p0 closeout acceptance | governance/verification-and-closeout | TK-548、TK-549 | completed |

## 4. 依赖产物策略

1. 本项目是 docs/ledger-only governance stream，不改写 executable runtime surface。
2. `current-context.md` 是 active stream 真值；`completed-streams-history.md` 只承接被移出的 completed stream。
3. `technical-solution-delivery-registry.yaml` 只修正 rollout truth，不重写历史技术方案语义。
4. 对历史 completion audit 的引用只用于证明 closeout 已完成，不重写其原始审计结论。

## 5. DoD（project-045）

1. `project-044` 不再占用 `current-context.md` 的 active primary slot。
2. `project-038`、`project-041` 与 delivery registry 中被点名的 planned/completed 状态漂移已收口。
3. 新 primary stream 的 `plan / checklist / tasks.csv / review` 路径已进入 `current-context.md` 真值。
4. docs-only 验证命令已通过，并形成 project-level completion audit summary。

## 6. 里程碑记录

1. 2026-04-05：根据 `.repo-ai-governor/draft/repo-ai-governor-current-priority-backlog.md` 的 `P0` 优先级待办，创建 `project-045-governance-truth-alignment-and-primary-stream-cutover` 作为新的治理收口 stream。
2. 2026-04-05：完成 `TK-548`，已为本轮治理收口冻结 `current-context / completed-streams-history / delivery-registry / project-plan` 四类真值范围。
3. 2026-04-05：完成 `TK-549`，已将 `current-context.md` 的 primary 从 `project-044` 切换到 `project-045`，将 `project-044 / sprint-003` 迁入 completed stream history，并把 delivery registry 中已完成 rollout 的 planned truth 修正为 completed。
4. 2026-04-05：完成 `project-038` completion audit summary，新建项目级收口证据并将顶层 project status 修正为 `completed`；同时将 `project-041` 计划中的 sprint status 对齐为 `completed`。
5. 2026-04-05：完成 `TK-550`，已通过 governance 定向校验与 `pnpm run check:fast` 收口本轮 docs-only 变更；项目级 completion audit summary 见 `project-045-governance-truth-alignment-and-primary-stream-cutover-completion-audit-summary.md`。
