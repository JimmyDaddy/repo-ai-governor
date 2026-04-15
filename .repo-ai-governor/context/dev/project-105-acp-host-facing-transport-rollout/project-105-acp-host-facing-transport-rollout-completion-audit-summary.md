# project-105-acp-host-facing-transport-rollout completion audit summary

- Status: completed
- Date: 2026-04-15
- Project: `project-105-acp-host-facing-transport-rollout`
- Scope: `sprint-001-acp-host-facing-transport-rollout` -> `sprint-003-clean-room-verify-support-truth-and-rollout-closeout`

## 1. Completion Verdict

1. `completed`

## 2. Audit Scope

1. code-affecting rollout for `technical-solution.acp-host-facing-transport-formalization`
2. explicit `acp_exec` routing, `acp_host_companion` carrier, packaged-distribution and runtime-service readiness, clean-room verification, support/docs uplift, project-final CR loop, and delivery closeout

## 3. Task Completion Summary

1. `TK-860`：completed
2. `TK-882`：completed
3. `TK-883`：completed
4. `TK-884`：completed
5. `TK-885`：completed
6. `TK-886`：completed
7. `TK-887`：completed
8. `TK-888`：completed
9. `TK-889`：completed
10. `TK-890`：completed

## 4. Key Evidence

1. `./plan.md`
2. `./sprint-001-acp-host-facing-transport-rollout/plan.md`
3. `./sprint-002-distribution-and-runtime-service-enablement/plan.md`
4. `./sprint-003-clean-room-verify-support-truth-and-rollout-closeout/plan.md`
5. `./sprint-003-clean-room-verify-support-truth-and-rollout-closeout/review/resolved_code_review_working-tree-20260415-0752.md`
6. `./sprint-003-clean-room-verify-support-truth-and-rollout-closeout/review/resolved_code_review_working-tree-20260415-0947.md`
7. `./sprint-003-clean-room-verify-support-truth-and-rollout-closeout/review/resolved_code_review_working-tree-20260415-1002.md`
8. `./sprint-003-clean-room-verify-support-truth-and-rollout-closeout/tasks/TK-890-finalize-project-105-closeout-and-delivery-evidence-handoff.md`
9. `../project-101-cli-exec-followup-solution-review-and-promotion/sprint-004-acp-host-facing-transport-formalization/tasks/DA-855-acp-host-facing-transport-formalization-promotion-cutover.md`
10. `../../generated/acp/acp-cleanroom-verification.summary.json`
11. `../../../.tmp/project-105-sprint-003-acp-cleanroom-report.json`

## 5. Residual Risks And Follow-Up Input

1. 当前 rollout 只 formalize 了 evidence-backed ACP host-facing readiness 与 host/service-host surfaces；它没有把 ACP 变成 `cli_exec` fallback，也没有承诺同-surface invoke parity。
2. 后续若要扩展 ACP runtime-service packaging、installer 或 broader support wording，仍需保持 `acp_exec` 与 `cli_exec` 分离，并继续以 clean-room evidence 为前置。
3. project-final closeout 窗口额外清理了 artifact lifecycle backlog；后续若再积压 `deprecated` artifact，应在独立治理窗口及时 archive，避免再次阻塞 release gate。

## 6. Verification

1. `pnpm vitest run apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/adapter-diagnostics-runtime.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts apps/cli/test/host-command.integration.test.ts apps/cli/test/commands/host-command.test.ts packages/adapters/codex/test/codex-host-renderer.test.ts packages/adapters/claude-code/test/claude-code-host-renderer.test.ts packages/adapters/github-copilot/test/github-copilot-host-renderer.test.ts` 在 sprint-003 clean closeout 窗口通过。
2. `pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`node ./scripts/release/verify-cleanroom-local-install.js --modes path,link,tgz --iterations 1 --acp-host-verify --emit-acp-evidence .repo-ai-governor/generated/acp/acp-cleanroom-verification.summary.json --output .tmp/project-105-sprint-003-acp-cleanroom-report.json` 与 `pnpm run check` 在同一 project-final closeout window 通过。
3. `node ./scripts/governance/check-code-review-status-sync.js`、`node ./scripts/governance/check-task-ledger-sync.js`、`node ./scripts/governance/check-sprint-plan-status-sync.js`、`node ./scripts/governance/check-technical-solution-delivery-registry.js`、`node ./scripts/governance/check-technical-solution-lifecycle-registry.js`、`node ./scripts/governance/check-worktree-review-target.js` 与 `node ./scripts/governance/check-artifact-registry-lifecycle.js` 在 project-final closeout 窗口通过。
