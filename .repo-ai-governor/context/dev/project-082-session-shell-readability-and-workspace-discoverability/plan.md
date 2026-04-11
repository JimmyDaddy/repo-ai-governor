# project-082-session-shell-readability-and-workspace-discoverability 计划

- Status: completed
- Date: 2026-04-11
- Stage Mapping: session shell readability and nested command discoverability
- Phase Mapping: readability tuning + workspace nested slash discoverability + delegated CR closeout
- Upstream:
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/contracts/cli-session-shell-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/module-overview.md`

## 1. 目标

1. 在不新增宿主字号控制能力的前提下，提升 session shell 默认阅读面的可见度，避免关键文本继续依赖过多 dim 呈现。
2. 补齐 `/workspace` 的 nested slash discoverability，让 `/workspace` 前缀能够直接提示 `dry-run / execute / rollback / clear-config / switch-branch / set-ui-theme`。
3. 同步 session shell 规范、CLI 用户说明、任务台账与 delegated CR lifecycle，并在同一项目窗口内完成 clean closeout。

## 2. Sprint 细化

## 2.1 sprint-001-readability-tuning-and-workspace-subcommand-hints

- Status: completed
- Sprint Goal: 收口 session shell 可读性增强与 `/workspace` 子命令提示，并在同一 sprint 内完成 delegated CR loop 和项目 closeout。
- Task Package: `TK-765`、`TK-766`、`TK-767`。

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
| --- | --- | --- | --- | --- | --- |
| TK-765 | sprint-001 | improve default session-shell readability without host-level font scaling | cli/session-shell-ui | current session-shell presenter baseline | completed |
| TK-766 | sprint-001 | add workspace nested slash-command discoverability and palette coverage | cli/discoverability/tests/docs | TK-765 | completed |
| TK-767 | sprint-001 | finalize project-082 closeout after delegated CR loop | closeout/final-audit | TK-765、TK-766、CR-001 | completed |

## 4. 依赖产物策略

1. `TK-765` 只做 presenter-level 可读性增强，不扩张到新的 font flag、theme preset 或宿主集成配置。
2. `TK-766` 复用现有 `workspace` bridge argv 与 i18n 真值，不新增第二套 parser family 或 capability truth。
3. delegated CR loop 必须在 `TK-765 / TK-766` 实现与验证完成后启动，并以同一 sprint 的 `review/` 和 `CR-001` 生命周期收口。
4. `TK-767` 只在最新一轮 fresh reviewer 无 actionable finding 且 `CR-001` 进入 `resolved` 后推进，用于收口 completion audit、completed history 与 idle context write-back。

## 5. DoD（project-082）

1. session shell 默认阅读面减少关键文本的 dim 依赖，slash palette 的可读性与可见条目数得到提升。
2. `/workspace`、`/workspace ` 与 `/workspace s` 等前缀能够给出完整且稳定的 nested discoverability 提示，而 bare `/` launcher shortlist 不漂移。
3. 相关测试、`pnpm run build`、任务台账与 delegated CR lifecycle 同步完成。
4. 规范与用户文档明确说明：真实字体大小仍由宿主终端/IDE 控制，本次只增强 presenter 默认可读性。

## 6. 里程碑记录

1. 2026-04-11：基于用户反馈“交互窗口字体太小”和“`/workspace` 没有子命令提示”创建 `project-082`。
2. 2026-04-11：已确认当前 session shell 无应用层字号控制点，因此将“字体太小”收敛为 presenter-level 可读性增强，而非宿主级 font-size 配置能力。
3. 2026-04-11：已激活 `project-082 / sprint-001` 作为当前 primary stream，后续将在同一窗口内完成实现、delegated CR loop 与 closeout。
4. 2026-04-11：`TK-765/TK-766` 已完成实现、文档同步与指定回归验证；下一步进入 delegated `CR-001` 评审闭环。
5. 2026-04-11：`CR-001` 已 clean 收口且 `TK-767` 已完成最终 closeout；本项目在此里程碑回链 [project-082 completion audit summary](./project-082-session-shell-readability-and-workspace-discoverability-completion-audit-summary.md)。
