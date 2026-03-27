# TK-272 workspace artifact locality execute rollback cutover 与 CLI truthfulness

- Status: completed
- Date: 2026-03-27
- Owner: AI-Agent
- Priority: P0
- Project: `project-023-workspace-migration-artifact-locality-and-scratch-cleanup`
- Sprint: `sprint-001-workspace-artifact-locality-and-scratch-cleanup-baseline`

## 1. 任务目标

将 workspace artifact locality 的决策落实到 dry-run/execute/rollback 产物路径与 CLI 输出，让 adopter 能直接在正确的 workspace 面定位 plan、execution、failure 与 rollback 证据。

## 2. Depends On

1. `TK-271`
2. `packages/config/src/workspace-migration-service.ts`
3. `apps/cli/src/commands/workspace-command.ts`

## 3. 预期产物

1. `DA-272`
2. 更新后的 workspace migration 实现与测试
3. 更新后的 adopter-facing output truth

## 4. Required Inputs

1. `packages/config/src/workspace-migration-service.ts`
2. `apps/cli/src/commands/workspace-command.ts`
3. `apps/cli/test/commands/workspace-command.test.ts`
4. `apps/cli/test/cli-output-contract.integration.test.ts`
5. `scripts/release/verify-cleanroom-local-install.js`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-020-adoption-productization-and-upgrade-ux/sprint-004-adopter-pilot-and-documentation-closure/tasks/DA-235-playground-adopter-pilot-baseline-and-gap-register.md`
2. `.repo-ai-governor/context/dev/project-020-adoption-productization-and-upgrade-ux/sprint-004-adopter-pilot-and-documentation-closure/tasks/DA-236-react-native-image-marker-complex-adopter-pilot-and-gap-register.md`

## 6. 实施计划

1. 按 `TK-271` 的 contract 决策调整 migration plan/execution/rollback artifact path。
2. 同步 CLI detail/check/message 输出，确保 adopter 可以直接定位新路径。
3. 补齐命令测试、output contract 测试与 clean-room rehearsal 证据，避免 locality 修复引入 workspace regression。

## 7. Development Verification

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm exec vitest run apps/cli/test/commands/workspace-command.test.ts apps/cli/test/cli-output-contract.integration.test.ts packages/config/test/workspace-migration-service.integration.test.ts --maxWorkers=1 --maxConcurrency=1`

## 8. Delivery Verification

1. `node ./scripts/release/verify-cleanroom-local-install.js`
2. `node ./scripts/governance/run-normative-loading-manifest-gate.js`

## 9. 执行记录

1. 2026-03-27：任务创建，状态初始化为 `planned`。
2. 2026-03-27：状态切换为 `in_progress`，开始将 execute 成功后的 plan/execution artifact path 与 CLI 输出切到 target workspace root。
3. 2026-03-27：已完成 artifact locality cutover、CLI truthfulness、命令/集成测试与 clean-room 验证，并形成 `DA-272`。

## 10. 产出

1. `DA-272`
