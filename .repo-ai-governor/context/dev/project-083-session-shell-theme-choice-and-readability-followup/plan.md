# project-083-session-shell-theme-choice-and-readability-followup 计划

- Status: completed
- Date: 2026-04-11
- Stage Mapping: session shell readability and theme preset choice follow-up
- Phase Mapping: readability follow-up + theme preset palette choice + delegated CR closeout
- Upstream:
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/contracts/cli-session-shell-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/module-overview.md`

## 1. 目标

1. 基于用户“字体依然很小”的回归反馈，继续提升 session shell 默认阅读面的强调和对比度，但仍不宣称真实终端字号控制。
2. 让 `/workspace set-ui-theme` 在 session shell 里直接暴露可选 theme preset，而不是用户先提交一个无 preset 的命令再收到错误。
3. 同步相关规范、文档、任务台账与 delegated CR lifecycle，并在同一项目窗口内完成 clean closeout。

## 2. Sprint 细化

## 2.1 sprint-001-theme-preset-choice-and-readability-followup

- Status: completed
- Sprint Goal: 完成 session shell 进一步的 presenter 可读性增强、`/workspace set-ui-theme` preset-choice discoverability 与 delegated CR loop 收口。
- Task Package: `TK-768`、`TK-769`、`TK-770`。

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
| --- | --- | --- | --- | --- | --- |
| TK-768 | sprint-001 | strengthen session-shell readability emphasis without claiming host font scaling | cli/session-shell-ui | current presenter readability baseline | completed |
| TK-769 | sprint-001 | add preset-choice slash discoverability for workspace set-ui-theme | cli/discoverability/tests/docs | TK-768 | completed |
| TK-770 | sprint-001 | finalize project-083 closeout after delegated CR loop | closeout/final-audit | TK-768、TK-769、CR-001 | completed |

## 4. 依赖产物策略

1. `TK-768` 继续限制在 presenter/readability 层，不引入新的 host font-size、terminal zoom 或持久化字体偏好。
2. `TK-769` 优先复用现有 `workspace set-ui-theme <preset>` 语义与现有 theme preset i18n 真值，只增强 session shell 的 discoverability 和选择路径。
3. delegated CR loop 必须在 `TK-768 / TK-769` 实现与验证完成后启动，并以同一 sprint 的 `review/` 和 `CR-001` 生命周期收口。
4. `TK-770` 只在最新一轮 fresh reviewer 无 actionable finding 且 `CR-001` 进入 `resolved` 后推进，用于收口 completion audit、completed history 与 idle/current-context write-back。

## 5. DoD（project-083）

1. session shell 默认阅读面继续减少低对比提示样式，让关键 chrome、palette 和 runtime hint 不再显得“像更小的字”。
2. `/workspace set-ui-theme`、`/workspace set-ui-theme ` 与 `/workspace set-ui-theme c` 等前缀能够直接给出 preset 选项提示，并允许通过高亮接受更具体的子命令。
3. 相关测试、`pnpm run build`、任务台账与 delegated CR lifecycle 同步完成。
4. 规范与用户文档明确说明：真实字体大小仍由宿主终端/IDE 控制，但 session shell 现在会提供更强的默认可读性与 theme preset 选项化选择路径。

## 6. 里程碑记录

1. 2026-04-11：基于用户 follow-up 反馈“字体依然很小”和“主题设置最好给选项而不是输入”创建 `project-083`。
2. 2026-04-11：已确认当前 CLI session shell 仍无应用层字号控制点，因此本项目继续收敛为 presenter/readability follow-up，而非宿主级字号能力。
3. 2026-04-11：已激活 `project-083 / sprint-001` 作为当前 primary stream，后续将在同一窗口内完成实现、delegated CR loop 与 closeout。
4. 2026-04-11：`TK-768 / TK-769` 已完成实现、文档同步与指定 vitest + build 验证；下一步进入 delegated `CR-001` 评审闭环。
5. 2026-04-11：`CR-001` 已 clean 收口且 `TK-770` 已完成最终 closeout；本项目在此里程碑回链 [project-083 completion audit summary](./project-083-session-shell-theme-choice-and-readability-followup-completion-audit-summary.md)。
