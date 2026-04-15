# TK-865 capture compatibility baseline evidence pack and closeout guidance for future runtime windows

- Status: completed
- Date: 2026-04-14
- Owner: AI-Agent
- Priority: P1
- Project: `project-106-cli-exec-compatibility-and-stability-rollout`
- Sprint: `sprint-002-verification-profiles-trigger-matrix-and-closeout`

## 1. 任务目标

沉淀 compatibility baseline evidence pack 与 closeout guidance，供后续 native `cli_exec` runtime 变更窗口直接复用。

## 2. Depends On

1. `TK-864`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/module-overview.md`

## 3. 预期产物

1. compatibility evidence pack
2. future runtime closeout guidance
3. synced task ledger once activation begins

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-106-cli-exec-compatibility-and-stability-rollout/sprint-002-verification-profiles-trigger-matrix-and-closeout/tasks/TK-864-wire-focused-compatibility-verification-profiles-and-trigger-matrix-routing-without-promoting-them-to-governance-gates.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/module-overview.md`
3. `.repo-ai-governor/context/dev/project-098-cli-exec-runtime-rollout/project-098-cli-exec-runtime-rollout-completion-audit-summary.md`

## 5. Traceback References

1. `.repo-ai-governor/draft/cli-exec-compatibility-and-stability-productization-technical-solution.md`

## 6. 实施计划

1. 固定 compatibility evidence pack 的采集边界与回链方式。
2. 将 future runtime window 的 closeout guidance 写成可执行 handoff，而不是抽象说明。
3. 为 `TK-866` final closeout 准备 delivery-ready evidence surface。

## 7. Development Verification

1. `pnpm exec vitest run test/cli-exec-compatibility-profile.integration.test.ts --maxWorkers=1 --maxConcurrency=1`
2. `node ./scripts/ci/run-cli-exec-compatibility-profile.js --changed-file packages/adapter-sdk/src/native-cli-exec-process-runtime.ts --output json`
3. `node ./scripts/ci/run-cli-exec-compatibility-profile.js --changed-file packages/adapters/codex/src/codex-agent-adapter.ts --changed-file packages/adapters/claude-code/src/claude-code-agent-adapter.ts --output json`
4. `node ./scripts/ci/run-cli-exec-compatibility-profile.js --changed-file packages/adapters/github-copilot/src/github-copilot-agent-adapter.ts --output json`

## 8. Delivery Verification

1. `pnpm run build`
2. `pnpm run verify:cli-exec-compatibility -- --profile cli_exec_compatibility_full --execute`
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`

## 9. 执行记录

1. 2026-04-14：任务创建，状态初始化为 `planned`。
2. 2026-04-14：已创建 `DA-865-cli-exec-compatibility-baseline-evidence-pack-and-closeout-guidance.md`，把三档 profile 的路由证据、当前窗口验证结果与 future closeout guidance 固定为可回链 handoff 面。
3. 2026-04-14：fresh reviewer round 4 暴露 shared `adapter-sdk` false-positive trigger 后，当前已刷新 `DA-865` 的 trigger matrix 与验证证据，使 handoff artifact 与最新真实 routing 行为保持一致。
4. 2026-04-14：fresh reviewer round 5 暴露 adapter-slice 仍把 contract-only `constants / interfaces` 当成触发面后，当前已再次刷新 `DA-865`，确保 handoff artifact 与 runtime/parser-only adapter boundary 保持一致。
5. 2026-04-14：fresh reviewer round 6 暴露 shared native `cli_exec` internal ACP seam 未被 profile router 覆盖、且 adapter-slice 执行入口说明过宽后，当前已刷新 `DA-865` 的 seam guidance、adapter-slice invocation contract 与验证证据。
6. 2026-04-14：fresh reviewer round 7 暴露 CI `git_range` 分支缺少回归保护后，当前已刷新 `DA-865` 的 targeted suite 统计，确保 handoff artifact 与最新 regression baseline 保持一致。
7. 2026-04-14：fresh reviewer round 8 暴露 compatibility router 自身与 guarding integration suite 仍可能绕过 baseline 后，当前已刷新 `DA-865` 的 trigger guidance 与验证证据，确保“谁修改 trigger matrix，谁先跑 full”成为 handoff truth。
8. 2026-04-14：fresh reviewer round 9 暴露显式无效 `--base-ref` 会静默降级到 working-tree mode 后，当前已刷新 `DA-865` 的 CI diff-routing guidance，确保 explicit git-range 输入在 ref 无法解析时 fail-fast。
9. 2026-04-14：fresh reviewer round 10 暴露 explicit invalid `--base-ref` 仍可能被 env base-ref 接管、且 `package.json` verify entrypoint 改动仍可绕过 baseline 后，当前已刷新 `DA-865` 的 explicit-ref priority 与 full-profile trigger guidance。
10. 2026-04-14：当前任务状态切换为 `completed`，下一步等待 sprint-002 fresh reviewer round 与 `TK-866` project-final closeout 收口。

## 10. 产出

1. `.repo-ai-governor/context/dev/project-106-cli-exec-compatibility-and-stability-rollout/sprint-002-verification-profiles-trigger-matrix-and-closeout/tasks/DA-865-cli-exec-compatibility-baseline-evidence-pack-and-closeout-guidance.md`
