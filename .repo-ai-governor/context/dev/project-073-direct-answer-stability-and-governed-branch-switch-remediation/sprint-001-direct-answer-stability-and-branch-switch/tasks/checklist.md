# checklist

- [x] TK-714 stabilize session.main direct-answer preflight and liveness degradation handling
  - 2026-04-08：任务创建并直接切换为 `in_progress`，当前先修复 direct-answer 稳定性边界。
  - 2026-04-08：已将 direct-answer preflight 收敛为“首个安全 surface 快路径”，避免慢 probe 持续阻塞整轮自由回答。
  - 2026-04-08：已为首选 direct-answer surface 的 invoke failure 增加自动 fallback 到下一个安全 surface 的恢复路径，并补充对应 supervisor regression tests。
  - 2026-04-08：已将 Codex CLI liveness suspect 阈值调整得更保守，并通过 `pnpm exec vitest run apps/cli/test/runtime/session-main-supervisor-runtime.test.ts packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts apps/cli/test/runtime/session-shell-turn-progress-dock.test.ts --maxWorkers=1 --maxConcurrency=1` 与 `pnpm run build`，任务状态切换为 `completed`，下一边界进入 fresh reviewer CR loop。
  - 2026-04-08：在 `CR-001` 复核中确认了 direct-answer fallback 复用跨 attempt relay state 的可见性回归风险，已修正为 per-attempt relay state，并新增 partial-token fallback 回归测试；`CR-001` 已 resolved，当前任务边界 clean。
  - 2026-04-08: CR-001 resolved after fixing the per-attempt relay-state fallback visibility gap; TK-714 remains completed and clean.
- [ ] TK-715 add governed branch-switch execution path for session.main
  - 2026-04-08：任务创建，状态初始化为 `planned`，等待 `TK-714` clean 后进入执行窗口。
- [ ] TK-716 sprint-001 closeout and project-final review activation handoff
  - 2026-04-08：任务创建，状态初始化为 `planned`，待 sprint 内实现任务与 CR rounds clean 后推进。
- [x] CR-001 TK-714 delegated review loop round 1
  - 2026-04-08：任务创建，状态初始化为 `review_pending`。
  - 2026-04-08：fresh reviewer round 识别出 direct-answer fallback 复用了跨 attempt 的 relay state，可能让失败 surface 的 partial token 覆盖恢复后的最终答案，进入主 agent 复核与修复窗口。
  - 2026-04-08：主 agent 复核确认 finding 2.1 成立，判定为 `认可`，并已完成最小安全修复与回归测试补强，当前状态推进到 `verified`。
  - 2026-04-08：已将 direct-answer retry relay state 修正为 per-attempt 语义，并新增 partial-token fallback 回归测试；targeted vitest 与 build 均通过，`CR-001` 收口为 `resolved`。
