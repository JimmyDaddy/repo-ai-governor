# sprint-001-continuity-fallback-and-real-probe-recovery 计划

- Status: completed
- Date: 2026-04-07
- Project: `project-058-cli-session-continuity-and-claude-recovery`
- Sprint Goal: 修复 `session.main` continuity fallback 与 `Claude Code` real-path CLI 回归。

## 1. Task Package

1. `TK-652` fix session.main continuity fallback and Claude Code real-path CLI regression
2. `TK-653` sprint-001 exit acceptance and follow-up handoff readiness
3. `TK-654` finalize project-058 closeout and clear the active primary stream

## 2. Exit Criteria

1. `session.main` 在 provider continuation `unsupported` 时仍能把 lightweight session note 传入后续轮次输入。
2. `Claude Code` probe 与真实 invoke 不再因 CLI prompt 参数被误当作 `--add-dir` 额外目录而失败。
3. targeted regression evidence 与同窗口 build evidence 已记录到任务台账。

## 3. Milestones

1. 2026-04-07：创建 sprint-001 active execution surface，并分配 `TK-652 / TK-653`。
2. 2026-04-07：`TK-652` 已完成，实现 `session.main` continuity fallback、修复 `Claude Code` CLI 参数拼装，并记录 targeted tests + build + compiled real probe evidence；`TK-653` 为当前下一边界。
3. 2026-04-07：`TK-653 / DA-653` 已完成 sprint-001 closeout，确认本 sprint 无需额外 CR round，project-final closeout 边界固定为 `TK-654`。
4. 2026-04-07：`TK-654 / DA-654` 已完成 project-final closeout write-back，`sprint-001` 已恢复为最终 `completed` 真值并准备移入 completed stream history。
