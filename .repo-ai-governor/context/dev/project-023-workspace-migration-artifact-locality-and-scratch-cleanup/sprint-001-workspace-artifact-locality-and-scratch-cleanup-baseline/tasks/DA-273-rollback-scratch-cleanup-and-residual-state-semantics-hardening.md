# DA-273 rollback scratch cleanup and residual-state semantics hardening

- Status: active
- Date: 2026-03-27
- Owner: AI-Agent
- Task: `TK-273`
- Project: `project-023-workspace-migration-artifact-locality-and-scratch-cleanup`
- Sprint: `sprint-001-workspace-artifact-locality-and-scratch-cleanup-baseline`

## 1. Delivery Conclusion

1. rollback 成功后，空的 `.repo-ai-governor-migration/<migration-id>` scratch 目录现在会被自动清理，不再把无语义残留留给 adopter 手工删除。
2. rollback output 现在显式暴露 cleanup 状态：
   - `scratch_cleanup_status=removed|retained`
   - `scratch_cleanup_root=<path>`
3. cleanup 仅针对成功回滚后已经没有恢复语义的空目录，不会为了“看起来干净”而删除仍承担恢复语义的内容。

## 2. Evidence Snapshot

1. `packages/config/src/workspace-migration-service.ts` 在 rollback 成功路径下会清理空的 backup / migration scratch root。
2. `apps/cli/test/commands/workspace-command.test.ts` 与 `packages/config/test/workspace-migration-service.integration.test.ts` 已验证 per-migration scratch root 会在 rollback 成功后消失。
3. `README` 与 playbook 已从“手工删除 backup 目录”的已知限制切换为新的 cleanup contract。

## 3. Validation

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm exec vitest run apps/cli/test/commands/workspace-command.test.ts packages/config/test/workspace-migration-service.integration.test.ts --maxWorkers=1 --maxConcurrency=1`
3. `node ./scripts/release/verify-cleanroom-local-install.js`
