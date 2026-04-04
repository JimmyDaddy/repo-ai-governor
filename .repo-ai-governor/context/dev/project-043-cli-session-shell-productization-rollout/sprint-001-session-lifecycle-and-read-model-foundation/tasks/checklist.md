# checklist

- [x] TK-530 freeze session lifecycle dto action seam and projection schema baseline
  - 2026-04-04：任务创建，状态初始化为 `planned`；承接 lifecycle seam 与 projection schema 冻结，不在本任务里直接实现 service action。
  - 2026-04-04：完成 session lifecycle seam freeze 回填；`CliSessionShellServiceClient` 与 `CliSessionShellTranscriptStore` 已形成统一 lifecycle/projection contract。
- [x] TK-531 implement session lifecycle service actions and sqlite-backed session projection read model
  - 2026-04-04：任务创建，状态初始化为 `planned`；承接 lifecycle service action 与 sqlite-backed session projection 实现。
  - 2026-04-04：确认 service-backed `start/resume/send/append/list/subscribe` 与 transcript projection/read-model 已在 CLI 现有实现落地，并通过 build + session-shell regression suites 验证。
  - 2026-04-04：补齐 `ARCHIVED` 状态、`fork/archive/unarchive` orchestration contract、shared-session status transition 与 local orchestration runtime projection 字段，并通过 targeted lifecycle suites 验证。
- [x] TK-532 wire resume picker session list fork archive presenter and regression acceptance
  - 2026-04-04：任务创建，状态初始化为 `planned`；承接 sprint-001 的 presenter 接线与回归收口。
  - 2026-04-04：完成 resume/list continuity 与 sprint-001 regression closeout；session parity 与 output contract integration 通过。
  - 2026-04-04：补齐 `/sessions` `/fork` `/archive` `/unarchive` presenter 接线、continuation notice 与 `/status` projection 输出；expanded package suites 与 integration suites 通过。
  - 2026-04-04：补齐 `/unarchive <sessionId>` 成功 attach 与缺参校验的 runner 回归，覆盖 presenter 层恢复路径与参数门禁。
  - 2026-04-04：补齐 `/fork` `/archive` `/unarchive` failure-path runner 回归，覆盖 presenter-safe 失败回执与“失败后仍保持当前 attach”语义。
