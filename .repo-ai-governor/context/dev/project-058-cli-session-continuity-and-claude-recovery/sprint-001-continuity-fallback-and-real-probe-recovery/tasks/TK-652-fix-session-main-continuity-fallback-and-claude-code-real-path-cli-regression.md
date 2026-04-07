# TK-652 fix session.main continuity fallback and Claude Code real-path CLI regression

- Status: completed
- Date: 2026-04-07
- Owner: `AI-Agent`
- Priority: `P0`
- Project: `project-058-cli-session-continuity-and-claude-recovery`
- Sprint: `sprint-001-continuity-fallback-and-real-probe-recovery`

## 1. 任务目标

修复两个当前 CLI 产品缺口：`session.main` 在 provider backend continuation 不支持时仍要保留 lightweight continuity；`Claude Code` real-path `cli_exec` probe/invoke 在本机可用环境下不应再因为参数拼装回归而失败。

## 2. Depends On

1. `project-039` provider session reuse rollout tracebacks
2. `project-043` CLI session shell productization rollout tracebacks
3. `project-053` Claude Code real invocation baseline tracebacks

## 3. 预期产物

1. `apps/cli` `session.main` continuity fallback runtime updates
2. `packages/adapters/claude-code` real-path CLI argument fix
3. targeted regression coverage plus same-window build evidence

## 4. Required Inputs

1. `.repo-ai-governor/context/current-context.md`
2. `apps/cli/src/runtime/session-main-supervisor-runtime.ts`
3. `packages/core-orchestration-service/src/local-orchestration-service-session-runtime.ts`
4. `packages/adapters/claude-code/src/claude-code-agent-adapter.ts`
5. `apps/cli/src/runtime/interactive-shell/session-shell-transcript-store.ts`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-039-provider-session-reuse-and-backend-conversation-continuity-rollout/plan.md`
2. `.repo-ai-governor/context/dev/project-043-cli-session-shell-productization-rollout/plan.md`
3. `.repo-ai-governor/context/dev/project-053-real-adapter-invocation-productization/sprint-001-claude-code-real-invocation-baseline/plan.md`
4. `apps/cli/test/runtime/session-main-supervisor-runtime.test.ts`
5. `packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts`

## 6. 实施计划

1. 修复 `Claude Code` CLI 参数拼装，让 prompt 不再落入 `--add-dir <directories...>` 可变参数范围。
2. 将现有 `latestNoteSummary / previewSummary` 作为 lightweight continuity note 注入 `session.main` 后续轮次输入，并更新误导性的 unsupported 文案。
3. 补齐 targeted regression，并记录 build/test evidence。

## 7. Development Verification

1. `pnpm vitest run packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts --maxWorkers=1 --maxConcurrency=1`
2. `pnpm vitest run apps/cli/test/runtime/session-main-supervisor-runtime.test.ts apps/cli/test/runtime/session-shell-transcript-store.test.ts --maxWorkers=1 --maxConcurrency=1`

## 8. Delivery Verification

1. `pnpm run build`
2. `node ./scripts/governance/sync-task-ledger.js --task-id TK-652`
3. `node ./scripts/governance/check-task-ledger-sync.js`
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-07：任务创建，状态初始化为 `in_progress`；本轮先修复真实 CLI 回归并补上 continuity fallback。
2. 2026-04-07：定位 `Claude Code` real-path probe 失败根因是 `--add-dir <directories...>` 为可变参数，原实现把 prompt 紧跟在该参数后面，导致 prompt 被误吃成额外目录。
3. 2026-04-07：已在 `packages/adapters/claude-code` 为 CLI prompt 增加 `--` 分隔符，并新增默认 exec-runner regression test，确保 prompt 不再被 `--add-dir` 吞掉。
4. 2026-04-07：已把 `latestNoteSummary / previewSummary` 从 shared session context 注入 `session.main` direct-answer / role-delegate 输入，使 provider continuation `unsupported` 时仍有 lightweight continuity note 可用，同时将 transcript 文案改为显式说明会回退到轻量会话摘要。
5. 2026-04-07：同窗口 `pnpm vitest run packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm vitest run apps/cli/test/runtime/session-main-supervisor-runtime.test.ts apps/cli/test/runtime/session-shell-transcript-store.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm run build` 全部通过；编译后真实 `Claude Code` adapter probe 已在本机返回 `availabilityStatus=available`，任务完成。

## 10. 产出

1. `apps/cli/src/runtime/session-main-supervisor-runtime.ts`、`packages/core-orchestration-service/src/local-orchestration-service-session-runtime.ts`、`packages/core-orchestration-service/src/types/interfaces/session-main-supervisor-runtime.interface.ts`
2. `packages/adapters/claude-code/src/claude-code-agent-adapter.ts`、`packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts`
3. `apps/cli/test/runtime/session-main-supervisor-runtime.test.ts`、`apps/cli/test/runtime/session-shell-transcript-store.test.ts`
4. `packages/shared/src/i18n/locales/en-us.ts`、`packages/shared/src/i18n/locales/zh-cn.ts`
