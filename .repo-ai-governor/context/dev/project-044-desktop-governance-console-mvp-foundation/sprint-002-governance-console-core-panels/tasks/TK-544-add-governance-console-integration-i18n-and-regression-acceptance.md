# TK-544 add governance console integration i18n and regression acceptance

- Status: planned
- Date: 2026-04-04
- Owner: AI-Agent
- Priority: P1
- Project: `project-044-desktop-governance-console-mvp-foundation`
- Sprint: `sprint-002-governance-console-core-panels`

## 1. 任务目标

为 governance console 核心面板补齐 integration、i18n 与 regression acceptance，使 `sprint-002` 以可回归的产品化状态收口。

## 2. Depends On

1. `TK-542`
2. `TK-543`

## 3. 预期产物

1. governance console integration evidence
2. i18n parity / fallback evidence
3. sprint-002 closeout acceptance

## 4. Required Inputs

1. `TK-542`
2. `TK-543`
3. `packages/shared/src/i18n/locales/en-us.ts`
4. `packages/shared/src/i18n/locales/zh-cn.ts`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-044-desktop-governance-console-mvp-foundation/sprint-002-governance-console-core-panels/plan.md`
2. `.repo-ai-governor/context/dev/project-044-desktop-governance-console-mvp-foundation/sprint-002-governance-console-core-panels/tasks/checklist.md`
3. `.repo-ai-governor/context/dev/project-044-desktop-governance-console-mvp-foundation/sprint-002-governance-console-core-panels/tasks/tasks.csv`

## 6. 实施计划

1. 补齐 desktop governance console 相关 i18n key 与 parity evidence。
2. 为 panel integration、event flow 与 renderer/preload bridge 增加回归覆盖。
3. 回写 sprint-002 closeout 所需的 checklist 与 ledger 记录。

## 7. Development Verification

1. `pnpm run build`
2. `node ./scripts/governance/check-i18n-parity-fallback.js`
3. panel / renderer / preload regression tests

## 8. Delivery Verification

1. `pnpm run build`
2. `node ./scripts/governance/check-i18n-parity-fallback.js`
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`
4. `pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`
5. `pnpm run check:desktop-entry-smoke`

## 9. 执行记录

1. 2026-04-04：任务创建，状态初始化为 `planned`；承接 governance console 的 i18n 与 regression closeout。

## 10. 产出

1. 待执行：desktop governance console i18n evidence
2. 待执行：panel regression evidence
3. 待执行：sprint-002 closeout acceptance
