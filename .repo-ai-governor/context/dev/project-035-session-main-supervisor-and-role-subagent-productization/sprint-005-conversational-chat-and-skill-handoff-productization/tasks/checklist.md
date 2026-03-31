# checklist

- [x] TK-471 harden conversational routing and direct-answer chatability
  - 2026-04-01：任务创建，状态初始化为 `planned`；承接 conversation classification、follow-up whitelist 与 tool-capable direct-answer chatability formal direction。
  - 2026-04-01：`TK-471` 已切换为 `active`；当前先收敛 continuation whitelist、greeting/repo question 分类与 tool-capable direct-answer seam。
  - 2026-04-01：已完成 `TK-471`；`follow_up` 现只拦截明确 continuation utterance，greeting/social chat/repo question 可稳定进入真实 direct answer。

- [x] TK-472 introduce foreground skill registry and risk-tiered governed handoff
  - 2026-04-01：任务创建，状态初始化为 `planned`；承接 deterministic skill registry、risk gate 与 low-risk direct-execute / high-risk preview-confirm 分层。
  - 2026-04-01：`TK-472` 已切换为 `active`；当前在 `session.main` 引入 service-owned foreground skill registry，并把 handoff 统一投影为 `handoffExecutionMode + commandBatches`。
  - 2026-04-01：已完成 `TK-472`；`help / doctor / verify / scope-resolved review` 已具备低风险直跑路径，`connect / plan / run / review verify / onboarding bundle` 继续走受治理 preview-confirm。

- [x] TK-473 align direct-execute and preview-confirm continuity with resume and command bundles
  - 2026-04-01：任务创建，状态初始化为 `planned`；承接 transcript/resume/shared-session continuity 与小型 command-bundle preview 语义。
  - 2026-04-01：`TK-473` 已切换为 `active`；当前先把 direct-execute 与 preview-confirm 的 shared-session / transcript / resume 恢复链统一起来。
  - 2026-04-01：已完成 `TK-473`；natural-language handoff 现可在 `/clear`、`resume` 与 command-bundle sequential execution 中保持 continuity parity，`pnpm run build` 与 `pnpm run check` 已通过。
  - 2026-04-01：已完成 sprint-005 working-tree CR 接受项修补；unresolved `direct_execute` handoff 在 startup、显式 `/resume` 与 `/clear` 后会继续自动执行，不再掉回 preview-confirm。
