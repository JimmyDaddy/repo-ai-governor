# TK-273 rollback scratch cleanup 与 residual-state semantics hardening

- Status: completed
- Date: 2026-03-27
- Owner: AI-Agent
- Priority: P1
- Project: `project-023-workspace-migration-artifact-locality-and-scratch-cleanup`
- Sprint: `sprint-001-workspace-artifact-locality-and-scratch-cleanup-baseline`

## 1. 任务目标

清理 rollback 后无语义的 `.repo-ai-governor-migration` scratch 残留，并收敛 residual-state 的可解释语义。

## 2. Depends On

1. `TK-272`
2. `packages/config/src/workspace-migration-service.ts`
3. `apps/cli/src/commands/workspace-command.ts`

## 3. 预期产物

1. `DA-273`
2. 更新后的 cleanup 语义与测试
3. 更新后的 rollback 输出说明

## 4. Required Inputs

1. `packages/config/src/workspace-migration-service.ts`
2. `apps/cli/src/commands/workspace-command.ts`
3. `apps/cli/test/commands/workspace-command.test.ts`
4. `packages/config/test/workspace-migration-service.integration.test.ts`
5. `.repo-ai-governor/context/dev/project-020-adoption-productization-and-upgrade-ux/sprint-004-adopter-pilot-and-documentation-closure/tasks/DA-236-react-native-image-marker-complex-adopter-pilot-and-gap-register.md`

## 5. Traceback References

1. `docs/local-adoption-playbook.md`
2. `README.zh-CN.md`

## 6. 实施计划

1. 区分 rollback 成功后仍需保留的恢复证据与无语义 scratch 残留。
2. 在不破坏 rollback 可恢复性的前提下清理空目录或冗余 backup/staging 路径。
3. 同步 rollback 输出与文档，使残留目录的语义对 adopter 显式可见。

## 7. Development Verification

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm exec vitest run apps/cli/test/commands/workspace-command.test.ts packages/config/test/workspace-migration-service.integration.test.ts --maxWorkers=1 --maxConcurrency=1`

## 8. Delivery Verification

1. `node ./scripts/release/verify-cleanroom-local-install.js`
2. `node ./scripts/governance/run-normative-loading-manifest-gate.js`

## 9. 执行记录

1. 2026-03-27：任务创建，状态初始化为 `planned`。
2. 2026-03-27：状态切换为 `in_progress`，开始清理 rollback 后无语义的 `.repo-ai-governor-migration` scratch 残留，并补充 cleanup 状态输出。
3. 2026-03-27：已完成 rollback scratch cleanup hardening、cleanup 状态输出与相关测试，并形成 `DA-273`。

## 10. 产出

1. `DA-273`
