# project-084-session-shell-theme-apply-followup 计划

- Status: completed
- Date: 2026-04-11
- Stage Mapping: session shell theme apply follow-up
- Phase Mapping: live theme apply fix + regression coverage + closeout
- Upstream:
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
  - `.repo-ai-governor/context/dev/project-083-session-shell-theme-choice-and-readability-followup/plan.md`

## 1. 目标

1. 修复 session shell 中 `workspace set-ui-theme` 成功后主题没有即时应用到当前前台壳层的问题。
2. 增加回归测试，确保主题切换成功后当前 shell frame 的 theme preset 会立即更新，而不是只能等下一次重开 shell。
3. 同步任务台账并在同一小窗口内完成 closeout。

## 2. Sprint 细化

## 2.1 sprint-001-live-theme-apply-fix

- Status: completed
- Sprint Goal: 修复 session shell live theme apply 缺口，并完成回归验证与 closeout。
- Task Package: `TK-771`、`TK-772`。

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
| --- | --- | --- | --- | --- | --- |
| TK-771 | sprint-001 | fix session-shell live theme apply after workspace set-ui-theme succeeds | cli/runtime/tests | project-083 theme discoverability baseline | completed |
| TK-772 | sprint-001 | finalize project-084 closeout after live theme apply fix | closeout/final-audit | TK-771 | completed |

## 4. 依赖产物策略

1. 本项目只修复“主题成功持久化后当前前台 shell 没跟着切换”的 live apply 缺口，不扩张到新的主题能力或新的配置层。
2. 继续复用现有 `workspace set-ui-theme <preset>` 语义与既有 theme preset 真值，不新增新的 CLI family。
3. closeout 必须把 task ledger、project/sprint plan 与 `current-context.md` 同步回最终真值。

## 5. DoD（project-084）

1. `workspace set-ui-theme <preset>` 成功后，当前 session shell 立即应用新的 theme preset。
2. 回归测试能够覆盖该主题即时应用行为。
3. 指定测试与 `pnpm run build` 通过，任务台账与 closeout 同步完成。

## 6. 里程碑记录

1. 2026-04-11：基于用户反馈“切换主题之后貌似没有生效”创建 `project-084`。
2. 2026-04-11：已确认问题边界是 session shell 前台 view-model 未同步成功命令返回的 theme preset，而不是 discoverability 或持久化写盘失败。
3. 2026-04-11：`TK-771` 已完成 runtime 修复与回归验证，`TK-772` 已完成最终 closeout；本项目在此里程碑回链 [project-084 completion audit summary](./project-084-session-shell-theme-apply-followup-completion-audit-summary.md)。
