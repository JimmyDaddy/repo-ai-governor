# checklist

- [x] TK-536 freeze session note trigger schema and startup budget instrumentation boundary
  - 2026-04-04：任务创建，状态初始化为 `planned`；承接 session note / startup budget contract 冻结。
  - 2026-04-04：完成 session note / startup diagnostics baseline freeze 回填；startup query 与 transcript note contract 已由现有 CLI runtime 承接。
- [x] TK-537 implement session note persistence projection and session-shell startup lazy-load cutover
  - 2026-04-04：任务创建，状态初始化为 `planned`；承接 session note persistence 与 startup lazy-load cutover 实现。
  - 2026-04-04：确认 persisted transcript note continuity、session-first startup path 与 startup diagnostics 已在 CLI 现有实现落地，并通过 build + regression suites 验证。
  - 2026-04-04：补齐 `previewSummary/latestNoteSummary` 会话投影、fork/archive continuity 摘要与 startup continuation notice，并回归验证 presenter-safe continuity。
- [x] TK-538 add session note presenter startup diagnostics regression evidence and rollout closeout acceptance
  - 2026-04-04：任务创建，状态初始化为 `planned`；承接 sprint-003 的 presenter / diagnostics / closeout acceptance 收口。
  - 2026-04-04：完成 resolved review、completion audit summary 与 `project-043` closeout acceptance 收口。
  - 2026-04-04：补齐 startup diagnostics 与 `/status` projection 输出回归，并以真实 build/test evidence 重写 resolved review 与 completion audit summary。
