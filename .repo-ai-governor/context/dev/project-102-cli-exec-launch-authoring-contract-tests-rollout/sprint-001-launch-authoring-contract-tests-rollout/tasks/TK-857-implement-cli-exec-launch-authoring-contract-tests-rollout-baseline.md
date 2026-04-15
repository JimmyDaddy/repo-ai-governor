# TK-857 implement cli-exec launch authoring contract tests rollout baseline

- Status: completed
- Date: 2026-04-13
- Owner: AI-Agent
- Priority: P0
- Project: `project-102-cli-exec-launch-authoring-contract-tests-rollout`
- Sprint: `sprint-001-launch-authoring-contract-tests-rollout`

## 1. 任务目标

将 `technical-solution.cli-exec-adapter-launch-authoring-contract-tests` 的 formal direction 落成真实 rollout baseline，启动 shared harness、adapter fixture 接入与 failure-path preservation evidence 的 implementation planning。

## 2. Depends On

1. `DA-846`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/adapter-authored-launch-plan-ownership-and-contract-tests.md`

## 3. 预期产物

1. rollout implementation baseline
2. follow-up execution notes and verification evidence
3. updated task ledger once activation begins

## 4. Required Inputs

1. `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
2. `.repo-ai-governor/context/dev/project-101-cli-exec-followup-solution-review-and-promotion/sprint-001-launch-authoring-contract-tests/tasks/DA-846-cli-exec-launch-authoring-contract-tests-promotion-cutover.md`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/adapter-authored-launch-plan-ownership-and-contract-tests.md`

## 5. Traceback References

1. `.repo-ai-governor/draft/cli-exec-adapter-launch-authoring-contract-tests-technical-solution.md`
2. `.repo-ai-governor/context/dev/project-101-cli-exec-followup-solution-review-and-promotion/sprint-001-launch-authoring-contract-tests/review/solution_review_cli-exec-adapter-launch-authoring-contract-tests.md`

## 6. 实施计划

1. 以 launch-authoring ownership guardrail 为前置，拆分 shared harness 与 adapter fixture implementation scope。
2. 对齐 failure-path taxonomy 与 fallback entrypoint projection，避免 rollout window 缩窄 active compatibility baseline。
3. 激活时同步 task ledger、checklist、tasks.csv 与后续 CR loop surface。

## 7. Development Verification

1. `pnpm exec vitest run packages/adapter-sdk/test/native-cli-exec-process-runtime.unit.test.ts packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts packages/adapters/github-copilot/test/github-copilot-agent-adapter.smoke.test.ts --maxWorkers=1 --maxConcurrency=1`
2. `pnpm run build`
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`

## 8. Delivery Verification

1. `pnpm run build`
2. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`
3. `node ./scripts/governance/check-task-ledger-sync.js`
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-13：任务创建，状态初始化为 `planned`，作为 `followup_required` rollout skeleton 的 canonical task。
2. 2026-04-14：`project-106` final closeout 完成后，当前任务切换为 `in_progress`，并把 `project-102 / sprint-001` 激活为 primary execution surface；下一步先本地预留 `CR-001`，再开始 shared harness baseline implementation。
3. 2026-04-14：已新增 shared `native-cli-exec-launch-authoring-harness`，并把 shared runtime unit test 与 `Codex / Claude Code / GitHub Copilot` smoke tests 接入 probe/invoke split 与 fallback entrypoint projection vocabulary；focused suites、`pnpm run build` 与 `pnpm run test:packages` 已在同窗通过，当前任务完成。

## 10. 产出

1. `test/native-cli-exec-launch-authoring-harness.ts`
2. `packages/adapter-sdk/test/native-cli-exec-process-runtime.unit.test.ts`
3. `packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts`
4. `packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts`
5. `packages/adapters/github-copilot/test/github-copilot-agent-adapter.smoke.test.ts`
