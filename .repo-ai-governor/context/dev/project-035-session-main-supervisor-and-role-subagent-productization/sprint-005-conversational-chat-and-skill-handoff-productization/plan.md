# sprint-005-conversational-chat-and-skill-handoff-productization 计划

- Status: completed
- Date: 2026-04-01
- Project: `project-035-session-main-supervisor-and-role-subagent-productization`
- Sprint Goal: 让 `session.main` 具备可闲聊主入口、foreground skill registry，以及按风险分层的 `direct_execute / preview_confirm` handoff continuity。

## 1. Task Package

1. `TK-471` harden conversational routing and direct-answer chatability
2. `TK-472` introduce foreground skill registry and risk-tiered governed handoff
3. `TK-473` align direct-execute and preview-confirm continuity with resume and command bundles

## 2. Exit Criteria

1. greeting / social chat / repo question / follow-up continuation 至少形成一条稳定的 conversation classification contract，并允许真实 direct answer 运行在 tool-capable surface 上。
2. natural-language skill 至少形成一套 deterministic foreground skill registry，并能按 `risk + cost + scope + confidence` 决定 `direct_execute` 与 `preview_confirm`。
3. `help`、`doctor`、`verify` 与 scope-resolved `review` 至少有一条低风险直跑路径；`connect`、`run`、`review verify` 与多步 bundle 继续保持 preview + confirm。
4. `preview_confirm` 与 `direct_execute` 两类 continuity 至少在 transcript / resume / shared session truth 中达到一致恢复能力。

## 3. Milestones

1. 2026-04-01：创建 `sprint-005`，将 approved conversational chat and skill handoff technical solution 从 formal docs 拆成可执行任务包。
2. 2026-04-01：冻结 `TK-471 ~ TK-473`，分别承接 conversation routing/chatability、foreground skill registry/risk gate，以及 continuity/bundle/resume parity。
3. 2026-04-01：正式执行 `sprint-005`；已将 `session.main` follow-up 从短输入兜底收紧为 continuation whitelist，并开放 tool-capable surface 上的 direct-answer chatability。
4. 2026-04-01：完成 `TK-472`；已引入 deterministic foreground skill registry、`direct_execute / preview_confirm` 风险分层，以及 `help / doctor / verify / scope-resolved review` 低风险直跑路径。
5. 2026-04-01：完成 `TK-473` 并收口 `sprint-005`；自然语言 skill handoff 现已在 shared session truth、transcript presenter、`/clear`、`resume` 与 command bundle 顺序执行上形成 continuity parity，见 `sprint-005-completion-summary.md`。
