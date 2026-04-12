# TK-806 implement secure route parsing and pre-commit extra-token rejection for `/secret set`

- Status: completed
- Date: 2026-04-12
- Owner: AI-Agent
- Priority: P0
- Project: `project-092-session-shell-secure-secret-input-rollout`
- Sprint: `sprint-001-secure-local-capture-and-redacted-secret-mutation`

## 1. 任务目标

让 session shell 能识别 explicit `/secret set <keyName>` secure route，并在 presenter-state commit 之前丢弃额外 typed/pasted suffix。

## 2. Depends On

1. `apps/cli/src/runtime/interactive-shell/session-slash-command-registry.ts`
2. `apps/cli/src/runtime/interactive-shell/session-shell-ink-controller.ts`
3. `apps/cli/src/runtime/interactive-shell/session-shell-runner.ts`
4. `.repo-ai-governor/context/dev/project-091-session-shell-secure-secret-input-promotion-and-decomposition/sprint-001-review-promotion-and-followup-decomposition/tasks/DA-804-session-shell-secure-secret-input-promotion-and-rollout-decomposition-handoff.md`
5. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/contracts/cli-session-shell-contract.md`

## 3. 预期产物

1. secure route parsing 代码与测试
2. pre-commit suffix rejection 代码与测试
3. redacted rejection guidance
4. runner branch update，确保 secure route 不再进入普通 pending handoff preview

## 4. Required Inputs

1. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/contracts/cli-session-shell-contract.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/adrs/secure-local-secret-capture-and-redacted-command-handoff.md`
3. `.repo-ai-governor/draft/session-shell-secure-secret-input-and-redacted-command-handoff-technical-solution.md`
4. `apps/cli/test/runtime/session-slash-command-registry.test.ts`
5. `apps/cli/test/runtime/session-shell-ink-controller.test.ts`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-091-session-shell-secure-secret-input-promotion-and-decomposition/sprint-001-review-promotion-and-followup-decomposition/review/approved_solution_review_session-shell-secure-secret-input-and-redacted-command-handoff.md`

## 6. 实施计划

1. 在 `session-slash-command-registry.ts` 中区分 exact `/secret set <keyName>` 与普通 bridge command，冻结 secure-route-first 的解析语义。
2. 在 `session-shell-ink-controller.ts` 中实现 typed / pasted suffix 的 pre-commit rejection，确保额外 token 不进入 `composerValue`、`slashQuery`、palette highlight/suggestion state。
3. 在 `session-shell-runner.ts` 中让 secure route 在 transcript append、pending command preview 与 `bridgeArgv` handoff 之前分流，避免 raw suffix 先进入普通 slash 流程再被清理。
4. 为 exact route、非法 suffix、typed/pasted rejection 与 redacted warning 补齐 focused regression tests。

## 7. Development Verification

1. `pnpm exec vitest run apps/cli/test/runtime/session-slash-command-registry.test.ts apps/cli/test/runtime/session-shell-ink-controller.test.ts apps/cli/test/runtime/session-shell-runner.test.ts --maxWorkers=1 --maxConcurrency=1`

## 8. Delivery Verification

1. `pnpm exec vitest run apps/cli/test/runtime/session-slash-command-registry.test.ts apps/cli/test/runtime/session-shell-ink-controller.test.ts apps/cli/test/runtime/session-shell-runner.test.ts --maxWorkers=1 --maxConcurrency=1`
2. `pnpm run build`
3. `node ./scripts/governance/sync-task-ledger.js --task-id TK-806 --tasks-dir ".repo-ai-governor/context/dev/project-092-session-shell-secure-secret-input-rollout/sprint-001-secure-local-capture-and-redacted-secret-mutation/tasks"`
4. `node ./scripts/governance/check-task-ledger-sync.js`
5. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-12：任务创建，状态初始化为 `planned`。
2. 2026-04-12：`project-092 / sprint-001` 已激活为 primary execution surface；本任务切换为 `active`，范围冻结到 registry/controller/runner 三个 secure route 入口与对应 focused tests。
3. 2026-04-12：已在 slash registry 中把显式 `/secret set <keyName>` 解析为 secure-local route 元数据，并在 Ink controller 中新增 pre-commit suffix rejection，确保额外 token 不进入 `composerValue`、`slashQuery` 或 palette state。
4. 2026-04-12：runner 已改为对 secure route 先做安全分流，extra suffix 只写入 redacted warning；focused vitest 与 `pnpm run build` 已通过，下一步进入 delegated CR loop。
5. 2026-04-12：`CR-001` 接受 1 条 finding，已补 controller -> runner `systemNoticeLines` effect，确保 Ink 路径的 secure suffix rejection warning 能持久写入本地 transcript。
6. 2026-04-12：post-fix clean recheck 未发现新的 actionable findings；本任务进入 `completed`，待切换到 `TK-807`。

## 10. 产出

1. 已实现 secure route parsing：`/secret set <keyName>` 不再被当作普通 bridge handoff 预览源。
2. 已实现 pre-commit extra-token rejection：typed/pasted suffix 会在 presenter-state commit 前被丢弃，并改写为 redacted guidance。
3. 已实现 runner secure-route-first branching：secure route 不再进入普通 `pendingCommand` preview，history 仅记录 redacted `displayCommand`。
4. 已补齐 Ink regression：rejected suffix warning 不再只停留在瞬时 `commandPreview`，即使 composer 被清空或发生空提交，也会以本地 `system_notice` 保留在 transcript 中。
5. 已完成验证：`pnpm exec vitest run apps/cli/test/runtime/session-slash-command-registry.test.ts apps/cli/test/runtime/session-shell-ink-controller.test.ts apps/cli/test/runtime/session-shell-runner.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm run build`。
