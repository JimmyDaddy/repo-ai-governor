# TK-738 remove remaining hidden `/verify` shims and docs residue

- Status: in_progress
- Date: 2026-04-10
- Owner: AI-Agent
- Priority: P0
- Project: `project-077-session-main-command-model-rollout`
- Sprint: `sprint-005-regression-migration-cleanup-and-project-closeout`

## 1. 任务目标

清除 hidden `/verify` shim、残余 i18n/help/README/IDE wrapper 引用，确保 public command surface 真正完成 removal。

## 2. Depends On

1. `TK-737`
2. `apps/cli/README.md`
3. `packages/shared/src/i18n/locales/en-us.ts`

## 3. 预期产物

1. removed remaining verify residue
2. cleaned docs/help/i18n references
3. public surface consistency

## 4. Required Inputs

1. `apps/cli/src/main.ts`
2. `apps/cli/README.md`
3. `packages/shared/src/i18n/locales/en-us.ts`
4. `packages/shared/src/i18n/locales/zh-cn.ts`

## 5. Traceback References

1. `TK-733`
2. `TK-737`

## 6. 实施计划

1. 搜索并清理任何残余 public `/verify` surface。
2. 确保 internal verification seam 仍由 `connect` / `doctor` / internal gate 持有。
3. 为 clean public surface 做最后一轮 consistency 校验。

## 7. Development Verification

1. `pnpm run build`
2. `rg -n \"sessionMainCapabilities\\.catalog\\.verify|CliCommandName\\.VERIFY|/verify\" apps/cli packages/core-orchestration-service packages/shared`

## 8. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-10：任务创建，状态初始化为 `planned`。
2. 2026-04-10：`TK-746 / DA-746` 已完成 sprint-004 closeout 与 sprint-005 activation handoff，`TK-738` 切换为 `in_progress`，并接管为 sprint-005 的当前 active implementation boundary。

## 10. 产出

1. 待执行：removed remaining verify residue
2. 待执行：public surface consistency
