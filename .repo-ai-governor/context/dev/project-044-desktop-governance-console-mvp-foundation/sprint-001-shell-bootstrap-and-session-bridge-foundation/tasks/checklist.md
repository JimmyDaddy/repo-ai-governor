# checklist

- [x] TK-539 freeze electron desktop shell package layout preload contract and phase-0 gate baseline
  - 2026-04-04：任务创建，状态初始化为 `planned`；承接 desktop shell contract 与 phase-0 gate 冻结，不在本任务里直接实现 utility-process bootstrap。
  - 2026-04-04：任务切换为 `active`；开始盘点现有 desktop entry smoke、service-host published surface、session bridge seams 与 shared agent projection seam 的可复用范围。
  - 2026-04-04：任务切换为 active，开始冻结 desktop shell package layout、typed preload contract 与 phase-0 smoke baseline。
  - 2026-04-04：完成 `integrations/desktop/**` baseline freeze、`apps/desktop` formal package ownership constants 与 artifact-pane deferred contract 收口。
- [x] TK-540 implement utility-process desktop host bootstrap typed preload bridge and shared agent projection seam extraction
  - 2026-04-04：任务创建，状态初始化为 `planned`；承接 utility-process bootstrap、typed preload bridge 与 shared seam extraction 实现。
  - 2026-04-04：完成 `DesktopShellBootstrap`、`DesktopPreloadBridge`、`DesktopSessionBridge` 与 shared `@repo-ai-governor/reporting` seam extraction，desktop 不再直接依赖 CLI internals。
- [x] TK-541 add shell bootstrap smoke session bridge validation and sprint-001 closeout evidence
  - 2026-04-04：任务创建，状态初始化为 `planned`；承接 sprint-001 的 smoke、session bridge validation 与 closeout evidence。
  - 2026-04-04：完成 desktop smoke / integration evidence，`pnpm run build`、`pnpm run check:desktop-entry-smoke`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1` 与 `pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1` 通过。
