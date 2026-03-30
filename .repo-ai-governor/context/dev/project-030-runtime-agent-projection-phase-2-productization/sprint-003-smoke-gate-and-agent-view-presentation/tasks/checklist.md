# checklist

- [x] TK-426 strengthen adopter onboarding smoke gate and external repo rehearsal automation
  - 2026-03-30：任务创建，状态初始化为 `planned`。
  - 2026-03-30：完成 `scripts/acceptance/run-project-030-agent-projection-phase-2-smoke.js` 与 `pnpm run check:project-030-adopter-smoke`，覆盖 `connect -> diff -> apply -> doctor -> verify -> run --dry-run --trace`。
- [x] TK-427 enrich agentView presenter in pretty and session-shell surfaces
  - 2026-03-30：任务创建，状态初始化为 `planned`。
  - 2026-03-30：完成 shared `CliAgentProjectionPresenter`，并接入 CLI pretty output 与 session-shell nested command summary，补齐 targeted tests。
