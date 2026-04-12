# TK-808 wire secure secret mutation seam and fallback/error guidance

- Status: planned
- Date: 2026-04-12
- Owner: AI-Agent
- Priority: P0
- Project: `project-092-session-shell-secure-secret-input-rollout`
- Sprint: `sprint-001-secure-local-capture-and-redacted-secret-mutation`

## 1. 任务目标

将 secure local capture 连接到共享 secret mutation seam，并保证 fallback / failure / cancel guidance 保持 redacted。

## 2. Depends On

1. `TK-807`
2. `apps/cli/src/runtime/interactive-shell/session-shell-entrypoint-runtime.ts`
3. `apps/cli/src/commands/secret-command.ts`
4. `apps/cli/src/runtime/secrets/cli-secret-service.ts`
5. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/local-user-config-and-secret-command-contract.md`

## 3. 预期产物

1. local secret mutation seam wiring
2. fallback / failure / cancel guidance
3. transcript / error redaction tests
4. secure capture -> local mutation seam handoff，不经过 nested JSON CLI

## 4. Required Inputs

1. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/module-overview.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/local-user-config-and-secret-command-contract.md`
3. `.repo-ai-governor/draft/session-shell-secure-secret-input-and-redacted-command-handoff-technical-solution.md`
4. `apps/cli/test/commands/secret-command.test.ts`
5. `apps/cli/test/runtime/session-shell-entrypoint-runtime.test.ts`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-091-session-shell-secure-secret-input-promotion-and-decomposition/sprint-001-review-promotion-and-followup-decomposition/review/resolved_code_review_tk-802-805-session-shell-secure-secret-input-promotion-and-decomposition.md`

## 6. 实施计划

1. 设计 shell-local secure mutation seam，使 secure capture 可以直接复用 `CliSecretService` / shared secret mutation core，而不是回退到 `createNestedCommandExecutor()` 的 `--output json --no-interactive` 路径。
2. 调整 entrypoint/runtime handoff 语义，确保 raw secret 不经由 `argv`、`bridgeArgv`、preview、transcript、error payload 或 localized exception metadata 流动。
3. 为 fallback backend、mutation failure、用户取消与 redacted guidance 补齐 focused regression tests。
4. 校验 secure mutation 结果对用户只暴露 selector/backend/status 级 redacted metadata。

## 7. Development Verification

1. `pnpm exec vitest run apps/cli/test/commands/secret-command.test.ts apps/cli/test/runtime/cli-secret-service.test.ts apps/cli/test/runtime/session-shell-entrypoint-runtime.test.ts apps/cli/test/runtime/session-shell-runner.test.ts --maxWorkers=1 --maxConcurrency=1`

## 8. Delivery Verification

1. `pnpm exec vitest run apps/cli/test/commands/secret-command.test.ts apps/cli/test/runtime/cli-secret-service.test.ts apps/cli/test/runtime/session-shell-entrypoint-runtime.test.ts apps/cli/test/runtime/session-shell-runner.test.ts --maxWorkers=1 --maxConcurrency=1`
2. `pnpm run build`
3. `node ./scripts/governance/sync-task-ledger.js --task-id TK-808 --tasks-dir ".repo-ai-governor/context/dev/project-092-session-shell-secure-secret-input-rollout/sprint-001-secure-local-capture-and-redacted-secret-mutation/tasks"`
4. `node ./scripts/governance/check-task-ledger-sync.js`
5. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-12：任务创建，状态初始化为 `planned`。
2. 2026-04-12：拆解细化后，secure mutation seam 已固定为 Phase A 最后一个实现收口点；只有在 `TK-806` 与 `TK-807` 清零 presenter leakage 后才进入执行。

## 10. 产出

1. 待执行：secure secret mutation seam wiring and redacted guidance implementation
