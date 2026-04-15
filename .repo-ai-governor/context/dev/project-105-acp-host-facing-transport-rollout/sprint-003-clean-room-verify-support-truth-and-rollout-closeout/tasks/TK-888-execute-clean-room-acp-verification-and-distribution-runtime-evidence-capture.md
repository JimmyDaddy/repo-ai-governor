# TK-888 execute clean-room ACP verification and distribution runtime evidence capture

- Status: completed
- Date: 2026-04-15
- Owner: AI-Agent
- Priority: P1
- Project: `project-105-acp-host-facing-transport-rollout`
- Sprint: `sprint-003-clean-room-verify-support-truth-and-rollout-closeout`

## 1. 任务目标

执行 ACP clean-room verify，并收集 distribution/runtime evidence，作为 adopter-facing truth uplift 的前置条件。

## 2. Depends On

1. `TK-887`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/acp-host-facing-transport-formalization-and-distribution-boundary.md`

## 3. 预期产物

1. clean-room ACP verify plan
2. distribution/runtime evidence capture boundary
3. synced task ledger once activation begins

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-105-acp-host-facing-transport-rollout/sprint-003-clean-room-verify-support-truth-and-rollout-closeout/plan.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/acp-host-facing-transport-formalization-and-distribution-boundary.md`
3. `.repo-ai-governor/context/dev/project-104-cli-exec-onboarding-adoption-readiness-rollout/plan.md`

## 5. Traceback References

1. `.repo-ai-governor/draft/acp-host-facing-transport-formalization-technical-solution.md`

## 6. 实施计划

1. 将 clean-room ACP verify 与 distribution/runtime evidence capture 固定为独立 closeout前置面。
2. 保持 verify 结果只服务于 `acp_exec` host-facing path，不回写 `cli_exec` truth。
3. 为 `TK-889` support/docs truth uplift 准备清晰 evidence boundary。

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
2. 2026-04-15：`sprint-002` clean closeout 完成后，当前任务切换为 `in_progress`，并作为 `project-105 / sprint-003` 的 implementation 入口；下一步先本地预留 `CR-001`，再开始 clean-room ACP verify 与 distribution/runtime evidence capture implementation。
3. 2026-04-15：已补齐 ACP clean-room verification summary 读取链路，扩展 `verify-cleanroom-local-install.js` 以真实执行 ACP host export/pack/verify，并修复 clean-room service-host import path truth 为 `repo-ai-governor/service-host`。当前已生成 `.tmp/project-105-sprint-003-acp-cleanroom-report.json` 与 `.repo-ai-governor/generated/acp/acp-cleanroom-verification.summary.json`，实现边界完成，进入 `CR-001` fresh reviewer loop。

## 10. 产出

1. clean-room ACP report at `.tmp/project-105-sprint-003-acp-cleanroom-report.json`
2. aggregated ACP evidence summary at `.repo-ai-governor/generated/acp/acp-cleanroom-verification.summary.json`
3. ACP evidence/runtime wiring in `apps/cli/src/runtime/{cli-acp-host-evidence-runtime,adapter-verification-runtime}.ts`, `apps/cli/src/constants/cli-acp-host.constant.ts`, and `scripts/release/verify-cleanroom-local-install.js`
