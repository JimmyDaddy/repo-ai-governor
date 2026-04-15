# project-105-acp-host-facing-transport-rollout completion audit summary (sprint-003 clean-room recloseout)

- Status: completed
- Date: 2026-04-15
- Project: `project-105-acp-host-facing-transport-rollout`
- Scope: `sprint-001-acp-host-facing-transport-rollout` -> `sprint-003-clean-room-verify-support-truth-and-rollout-closeout`

## 1. Completion Verdict

1. `completed`
2. 本摘要对应 reopened canonical closeout：此前并发写入的 `CR-003` / `TK-890` / idle 结论已被 `CR-012` clean recheck 取代，当前 summary 才是最终有效的 project-105 收口记录。

## 2. Audit Scope

1. code-affecting rollout for `technical-solution.acp-host-facing-transport-formalization`
2. explicit `acp_exec` routing、`acp_host_companion` carrier、packaged-distribution/runtime-service readiness、clean-room verification、support/docs uplift
3. reopened project-final CR loop (`CR-007` ~ `CR-012`)、portable tracked receipt/provenance hardening、final closeout write-back

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
5. `./sprint-003-clean-room-verify-support-truth-and-rollout-closeout/review/resolved_code_review_working-tree-20260415-1240.md`
6. `./sprint-003-clean-room-verify-support-truth-and-rollout-closeout/review/resolved_code_review_working-tree-20260415-1310.md`
7. `./sprint-003-clean-room-verify-support-truth-and-rollout-closeout/review/resolved_code_review_working-tree-20260415-1334.md`
8. `./sprint-003-clean-room-verify-support-truth-and-rollout-closeout/tasks/CR-012.md`
9. `./sprint-003-clean-room-verify-support-truth-and-rollout-closeout/tasks/TK-890-finalize-project-105-closeout-and-delivery-evidence-handoff.md`
10. `./project-105-acp-host-facing-transport-rollout-completion-audit-summary.md`
11. `.repo-ai-governor/generated/acp/acp-cleanroom-verification.summary.json`
12. `.repo-ai-governor/generated/acp/acp-cleanroom-verification.provenance/`
13. `.repo-ai-governor/context/current-context.md`
14. `.repo-ai-governor/context/completed-streams-history.md`

## 5. Residual Risks And Follow-Up Input

1. provenance portability 目前仍依赖字符串匹配来发现 repo-owned path；本轮 clean reviewer 明确未将其升级为 actionable finding，但后续如再调整 tracked receipt schema 或 provenance payload，应继续保留 `test/release-cleanroom-portability.integration.test.ts` 作为防回退锚点。
2. ACP 仍然保持为独立 `acp_exec` transport truth；本 project 没有把 ACP 回写为 `cli_exec` fallback，也没有承诺 invoke parity。
3. delivery registry 在 reopen closeout 窗口中只做重新校验，没有重新打开 `technical-solution.acp-host-facing-transport-formalization` 的 `completed/completed` truth；后续若要继续扩展 distribution/runtime-service/support wording，应另起新窗口。

## 6. Verification

1. `pnpm vitest run apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/adapter-diagnostics-runtime.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts apps/cli/test/host-command.integration.test.ts apps/cli/test/commands/host-command.test.ts packages/adapters/codex/test/codex-host-renderer.test.ts packages/adapters/claude-code/test/claude-code-host-renderer.test.ts packages/adapters/github-copilot/test/github-copilot-host-renderer.test.ts test/release-cleanroom-portability.integration.test.ts` 在 latest project-final clean window 通过。
2. `pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`node ./scripts/release/verify-cleanroom-local-install.js --modes path,link,tgz --iterations 1 --acp-host-verify --emit-acp-evidence .repo-ai-governor/generated/acp/acp-cleanroom-verification.summary.json --output .tmp/project-105-sprint-003-acp-cleanroom-report.json`、portable temp-root grep、repo-relative provenance sweep、`pnpm exec biome format --write apps/cli/test/runtime/adapter-routing-runtime.test.ts test/task-required-input-boundary.integration.test.ts test/artifact-candidate-query.integration.test.ts scripts/governance/query-artifact-candidates.js` 与 `pnpm run check` 在同一 closeout window 通过。
3. `node ./scripts/governance/check-code-review-status-sync.js`、`node ./scripts/governance/check-task-ledger-sync.js`、`node ./scripts/governance/check-sprint-plan-status-sync.js`、`node ./scripts/governance/check-technical-solution-delivery-registry.js`、`node ./scripts/governance/check-technical-solution-lifecycle-registry.js`、`node ./scripts/governance/check-worktree-review-target.js` 与 `node ./scripts/governance/check-artifact-registry-lifecycle.js` 在 final closeout window 通过。
