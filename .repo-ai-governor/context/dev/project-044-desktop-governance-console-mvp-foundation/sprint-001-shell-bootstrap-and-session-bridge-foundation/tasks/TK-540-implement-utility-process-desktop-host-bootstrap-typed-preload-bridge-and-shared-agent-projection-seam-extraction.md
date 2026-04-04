# TK-540 implement utility-process desktop host bootstrap typed preload bridge and shared agent projection seam extraction

- Status: planned
- Date: 2026-04-04
- Owner: AI-Agent
- Priority: P0
- Project: `project-044-desktop-governance-console-mvp-foundation`
- Sprint: `sprint-001-shell-bootstrap-and-session-bridge-foundation`

## 1. 任务目标

基于 `TK-539` 冻结的 shell contract，实现 Electron utility-process host bootstrap、typed preload bridge，并将 `AgentProjectionPanelViewModel` 抽离为 desktop/CLI 共用的 shared seam。

## 2. Depends On

1. `TK-539`

## 3. 预期产物

1. utility-process desktop host bootstrap
2. typed preload bridge
3. shared `AgentProjectionPanelViewModel` seam extraction

## 4. Required Inputs

1. `apps/cli/src/runtime/presentation/agent-projection-panel-view-model-builder.ts`
2. `apps/cli/src/react-cli/views/agent-projection-panel.tsx`
3. `integrations/desktop/README.md`
4. `.repo-ai-governor/draft/desktop-surface-technical-selection-and-design.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-044-desktop-governance-console-mvp-foundation/plan.md`
2. `.repo-ai-governor/context/dev/project-044-desktop-governance-console-mvp-foundation/sprint-001-shell-bootstrap-and-session-bridge-foundation/plan.md`
3. `.repo-ai-governor/context/dev/project-041-desktop-surface-tech-selection-and-design/project-041-desktop-mvp-implementation-activation-handoff.md`

## 6. 实施计划

1. 建立 desktop host bootstrap 与 utility-process 生命周期接线。
2. 实现受控 preload bridge，并接入 session health/list/subscribe 所需的最小 bridge surface。
3. 抽离 shared agent projection seam，移除 desktop 对 `apps/cli` 内部实现的直接依赖风险。

## 7. Development Verification

1. 实现窗口内需通过 `pnpm run build`
2. 实现窗口内需通过 `pnpm run check:desktop-entry-smoke`
3. 需补充 desktop host / preload / shared seam 定向测试

## 8. Delivery Verification

1. `pnpm run build`
2. `pnpm run check:desktop-entry-smoke`
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`
4. relevant desktop host / preload regression evidence

## 9. 执行记录

1. 2026-04-04：任务创建，状态初始化为 `planned`；承接 utility-process bootstrap、typed preload bridge 与 shared seam extraction 实现。

## 10. 产出

1. 待执行：desktop host bootstrap implementation
2. 待执行：typed preload bridge implementation
3. 待执行：shared agent projection seam extraction record
