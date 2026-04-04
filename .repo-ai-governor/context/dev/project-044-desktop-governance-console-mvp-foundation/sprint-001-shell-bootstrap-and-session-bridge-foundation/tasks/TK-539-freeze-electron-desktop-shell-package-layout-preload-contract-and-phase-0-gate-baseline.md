# TK-539 freeze electron desktop shell package layout preload contract and phase-0 gate baseline

- Status: completed
- Date: 2026-04-04
- Owner: AI-Agent
- Priority: P0
- Project: `project-044-desktop-governance-console-mvp-foundation`
- Sprint: `sprint-001-shell-bootstrap-and-session-bridge-foundation`

## 1. 任务目标

冻结 desktop shell 的 package layout、main/preload/renderer 权责边界、typed preload contract 与 `Phase 0` smoke baseline，使后续实现不在 desktop host、renderer 与 service-host bootstrap 之间各自演化私有语义。

## 2. Depends On

1. `.repo-ai-governor/context/dev/project-041-desktop-surface-tech-selection-and-design/project-041-desktop-mvp-implementation-activation-handoff.md`
2. `.repo-ai-governor/draft/desktop-surface-technical-selection-and-design.md`
3. `integrations/desktop/README.md`
4. `docs/support-matrix.md`

## 3. 预期产物

1. desktop shell package / ownership baseline
2. typed preload bridge contract baseline
3. `Phase 0` smoke gate 清单

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-041-desktop-surface-tech-selection-and-design/project-041-desktop-mvp-implementation-activation-handoff.md`
2. `.repo-ai-governor/draft/desktop-surface-technical-selection-and-design.md`
3. `integrations/desktop/README.md`
4. `docs/support-matrix.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-044-desktop-governance-console-mvp-foundation/plan.md`
2. `.repo-ai-governor/context/dev/project-044-desktop-governance-console-mvp-foundation/sprint-001-shell-bootstrap-and-session-bridge-foundation/plan.md`
3. `.repo-ai-governor/context/dev/project-041-desktop-surface-tech-selection-and-design/plan.md`

## 6. 实施计划

1. 盘点现有 desktop entry baseline、service host bootstrap 与 sidecar + ipc 的正式约束。
2. 冻结 `main / preload / renderer / utility-process` 的包边界与 privilege boundary。
3. 冻结 desktop smoke baseline，包括 health、session bridge 与 utility-process lifecycle 基线。

## 7. Development Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. docs-only decomposition；当前阶段未修改 `apps/**`、`packages/**`、`bin/**`、`test/**`

## 8. Delivery Verification

1. 当前拆解窗口需通过 `node ./scripts/governance/check-task-ledger-sync.js`
2. 当前拆解窗口需通过 `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. 后续实现完成并宣告 `completed` 前，必须补 `pnpm run build`、`pnpm run check:desktop-entry-smoke` 与 desktop shell integration evidence

## 9. 执行记录

1. 2026-04-04：任务创建，状态初始化为 `planned`；承接 desktop shell contract 与 phase-0 gate 冻结，不在本任务里直接实现 utility-process bootstrap。
2. 2026-04-04：任务切换为 `active`；开始盘点现有 desktop entry smoke、service-host published surface、session bridge seams 与 shared agent projection seam 的可复用范围。
3. 2026-04-04：完成 `integrations/desktop/README.md`、`integrations/desktop/examples/README.md` 与 `integrations/desktop/examples/desktop-sidecar-runtime.sample.json` 的 baseline freeze，明确 desktop 只消费 service-owned contract 且 artifact pane 继续 gated。
4. 2026-04-04：通过 `apps/desktop/README.md` 与 `apps/desktop/src/constants/desktop.constant.ts` 冻结 `apps/desktop` 的 package ownership、session bridge operations 与 artifact-pane deferred baseline。

## 10. 产出

1. 已完成：desktop shell ownership baseline -> `integrations/desktop/README.md` + `apps/desktop/README.md`
2. 已完成：typed preload contract freeze note -> `integrations/desktop/examples/desktop-sidecar-runtime.sample.json`
3. 已完成：phase-0 smoke baseline -> `apps/desktop/src/constants/desktop.constant.ts`
