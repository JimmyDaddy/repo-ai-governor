# DA-272 workspace artifact locality execute rollback cutover and cli truthfulness

- Status: active
- Date: 2026-03-27
- Owner: AI-Agent
- Task: `TK-272`
- Project: `project-023-workspace-migration-artifact-locality-and-scratch-cleanup`
- Sprint: `sprint-001-workspace-artifact-locality-and-scratch-cleanup-baseline`

## 1. Delivery Conclusion

1. `workspace execute` 成功后，plan / execution artifact 现在会重写到 target workspace root，而不是继续停留在 source root。
2. CLI output/detail 已同步新的 artifact contract：
   - execute 返回 `artifact_workspace_root=<target root>`
   - execute 的 `plan_path` / `execution_path` 与 target workspace root 保持一致
   - rollback 继续返回恢复后的 source workspace root 作为 artifact owner
3. README 与 local adoption playbook 中关于 artifact locality 的已知限制已被替换为正式 contract 说明。

## 2. Evidence Snapshot

1. `apps/cli/src/commands/workspace-command.ts` 现在会在 execute 成功后重写 target-side plan artifact，并以 target root 作为 execution artifact owner。
2. `apps/cli/test/commands/workspace-command.test.ts` 已验证 execute plan/execution path 跟随 target workspace root。
3. `node ./scripts/release/verify-cleanroom-local-install.js` 已通过，证明 workspace switch / rollback rehearsal 未因 locality cutover 回归。

## 3. Validation

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm exec vitest run apps/cli/test/commands/workspace-command.test.ts packages/config/test/workspace-migration-service.integration.test.ts apps/cli/test/cli-output-contract.integration.test.ts --maxWorkers=1 --maxConcurrency=1`
3. `node ./scripts/release/verify-cleanroom-local-install.js`
4. `node ./scripts/governance/run-normative-loading-manifest-gate.js`
