# sprint-006-interactive-cli-react-style-cli-promotion-cutover 计划

- Status: completed
- Date: 2026-03-28
- Project: `project-018-technical-solution-promotion-pilots`

## 1. Sprint Goal

将 `interactive-cli-react-style-technical-solution.md` 提升为 lifecycle-managed final solution，并同步落地 `runtime.cli-interactive-shell` 的正式模块文档、module registry 与 manifest 接线。

## 2. Task Package

1. `TK-242` sprint-006 激活与 react-style CLI promotion handoff（completed）
2. `TK-243` runtime.cli-interactive-shell 正式模块文档回填与 promotion doc cutover（completed）
3. `TK-244` interactive CLI technical solution lifecycle、module-registry 与 manifest promotion cutover（completed）
4. `TK-245` sprint-006 出口验收与 project-018 再次完成态审计（completed）

## 3. Exit Criteria

1. `technical-solution.interactive-cli-react-style-cli` 已具备 review evidence、final paths 与 activation metadata，并切换到 `active`。
2. `runtime.cli-interactive-shell` 的 module overview 与 contract 已正式落地并登记到 module registry / manifest。
3. `promotion` 所需 lifecycle/module/manifest/task/review/artifact gates 已通过。
4. 形成新的 project-018 完成态审计摘要，记录这次 docs-only promotion cutover。

## 4. Completion Notes

1. 这次 cutover 只 formalize CLI 交互壳层与 workflow 入口 contract，不改变当前运行时实现。
2. `stderr` 输出边界、i18n 注入、`SIGINT` 清理与 `workflow` 子命令树注册都被提升为正式 contract 约束。
3. 该 solution 现在可以作为后续实现与代码落地的规范输入，而不是仅仅停留在 draft。
