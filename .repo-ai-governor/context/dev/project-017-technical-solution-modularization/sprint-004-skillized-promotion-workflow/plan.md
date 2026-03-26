# sprint-004-skillized-promotion-workflow 计划

- Status: completed
- Date: 2026-03-26
- Project: `project-017-technical-solution-modularization`

## 1. Sprint Goal

将技术方案 `draft -> final` promotion workflow 固化为 repo-local skill，减少后续执行时对口头流程的依赖。

## 2. Task Package

1. `TK-194` sprint-004 激活与 project-017 reopen handoff（completed）
2. `TK-195` technical-solution-promotion skill workflow 与 trigger mapping（completed）
3. `TK-196` promotion guardrails、portable prompt 与 repo alignment（completed）
4. `TK-197` sprint-004 出口验收与 project-017 re-closeout（completed）

## 3. Exit Criteria

1. repo-local skill 已能覆盖 `prepare-promotion / promote-approved-solution / supersede-active-solution` 三类动作。
2. skill 已明确必读事实源、状态切换 guardrails 与必跑 gate。
3. sprint-004 验收与 project-017 再次 closeout 已完成。

## 4. Completion Notes

1. `.codex/skills/technical-solution-promotion/` 已成为 promotion workflow 的仓库内操作入口。
2. skill 明确了 lifecycle registry、module registry、manifest、task ledger 与 review/artifact 的同步顺序。
3. sprint-004 已完成验收，`project-017` 再次收口为 completed。
