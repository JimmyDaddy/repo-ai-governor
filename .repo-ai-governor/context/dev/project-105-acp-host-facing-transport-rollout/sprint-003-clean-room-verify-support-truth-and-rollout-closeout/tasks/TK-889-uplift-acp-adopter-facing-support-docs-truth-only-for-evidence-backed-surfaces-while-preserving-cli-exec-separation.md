# TK-889 uplift ACP adopter-facing support docs truth only for evidence-backed surfaces while preserving cli_exec separation

- Status: completed
- Date: 2026-04-15
- Owner: AI-Agent
- Priority: P1
- Project: `project-105-acp-host-facing-transport-rollout`
- Sprint: `sprint-003-clean-room-verify-support-truth-and-rollout-closeout`

## 1. 任务目标

仅对 evidence-backed ACP surfaces uplift adopter-facing support/docs truth，同时保持 ACP 与 `cli_exec` 的严格分离。

## 2. Depends On

1. `TK-888`
2. `.repo-ai-governor/context/dev/project-104-cli-exec-onboarding-adoption-readiness-rollout/plan.md`

## 3. 预期产物

1. ACP support/docs truth uplift plan
2. evidence-backed surface boundary
3. synced task ledger once activation begins

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-105-acp-host-facing-transport-rollout/sprint-003-clean-room-verify-support-truth-and-rollout-closeout/tasks/TK-888-execute-clean-room-acp-verification-and-distribution-runtime-evidence-capture.md`
2. `.repo-ai-governor/context/dev/project-104-cli-exec-onboarding-adoption-readiness-rollout/plan.md`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/module-overview.md`

## 5. Traceback References

1. `.repo-ai-governor/draft/cli-exec-five-direction-dependency-and-sequencing-analysis-technical-solution.md`

## 6. 实施计划

1. 基于 clean-room verify 与 runtime evidence 决定哪些 ACP surfaces 可以 uplift support/docs truth。
2. 固定 ACP 与 `cli_exec` 的 truthfulness boundary，避免 adopter-facing 叙述重新混淆 transport。
3. 为 `TK-890` final closeout 准备 delivery-ready evidence surface。

## 7. Development Verification

1. `pnpm vitest run apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/adapter-diagnostics-runtime.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts apps/cli/test/host-command.integration.test.ts apps/cli/test/commands/host-command.test.ts packages/adapters/codex/test/codex-host-renderer.test.ts packages/adapters/claude-code/test/claude-code-host-renderer.test.ts packages/adapters/github-copilot/test/github-copilot-host-renderer.test.ts`
2. `node ./scripts/release/verify-cleanroom-local-install.js --modes path,link,tgz --iterations 1 --acp-host-verify --emit-acp-evidence .repo-ai-governor/generated/acp/acp-cleanroom-verification.summary.json --output .tmp/project-105-sprint-003-acp-cleanroom-report.json`
3. `pnpm run build`
4. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`

## 8. Delivery Verification

1. `node ./scripts/governance/sync-task-ledger.js --tasks-dir ".repo-ai-governor/context/dev/project-105-acp-host-facing-transport-rollout/sprint-003-clean-room-verify-support-truth-and-rollout-closeout/tasks"`
2. `node ./scripts/governance/check-task-ledger-sync.js`
3. `node ./scripts/governance/check-sprint-plan-status-sync.js`
4. `node ./scripts/governance/check-code-review-status-sync.js`

## 9. 执行记录

1. 2026-04-14：任务创建，状态初始化为 `planned`。
2. 2026-04-15：已基于 clean-room ACP report 与 aggregated ACP evidence summary 收口 adopter-facing support/docs truth。`docs/support-matrix*.md`、`docs/local-adoption-playbook*.md` 现已只对 evidence-backed `acp_exec` readiness / host surfaces uplift 正式口径，并显式保留 ACP 与 `cli_exec` 的 fail-closed separation；同时已把 `repo-ai-governor/service-host` 修正为唯一 supported root-package import path。当前实现边界完成，进入 `CR-001` fresh reviewer loop。

## 10. 产出

1. support-truth uplift in `docs/support-matrix.md` and `docs/support-matrix.zh-CN.md`
2. ACP onboarding/adoption guidance update in `docs/local-adoption-playbook.md` and `docs/local-adoption-playbook.zh-CN.md`
3. public service-host package export truth sync in `README{,.zh-CN}.md`, `apps/cli/README.md`, and `integrations/desktop{,/examples}/README.md`
