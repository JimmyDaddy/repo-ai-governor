# TK-870 prove compatibility-baseline alignment without widening scope into general adapter test strategy

- Status: completed
- Date: 2026-04-14
- Owner: AI-Agent
- Priority: P1
- Project: `project-102-cli-exec-launch-authoring-contract-tests-rollout`
- Sprint: `sprint-002-failure-path-coverage-and-rollout-closeout`

## 1. 任务目标

证明 launch-authoring contract coverage 与 compatibility baseline 对齐，同时保持本项目不扩面成全量 adapter test strategy。

## 2. Depends On

1. `TK-869`
2. `.repo-ai-governor/context/dev/project-106-cli-exec-compatibility-and-stability-rollout/plan.md`

## 3. 预期产物

1. compatibility-aligned launch-authoring evidence
2. scope guardrail against general adapter test strategy
3. synced task ledger once activation begins

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-102-cli-exec-launch-authoring-contract-tests-rollout/sprint-002-failure-path-coverage-and-rollout-closeout/tasks/TK-869-extend-launch-authoring-contract-coverage-across-spawn-parse-non-zero-signal-timeout-and-abort-paths.md`
2. `.repo-ai-governor/context/dev/project-106-cli-exec-compatibility-and-stability-rollout/plan.md`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/module-overview.md`

## 5. Traceback References

1. `.repo-ai-governor/draft/cli-exec-five-direction-dependency-and-sequencing-analysis-technical-solution.md`

## 6. 实施计划

1. 对齐 compatibility baseline 与 launch-authoring coverage 的共享 vocabulary。
2. 明确哪些证据属于 alignment，哪些内容仍然不在本项目 scope 内。
3. 为 `TK-871` final closeout 准备 delivery-ready evidence surface。

## 7. Development Verification

1. `pnpm exec vitest run packages/adapter-sdk/test/native-cli-exec-process-runtime.unit.test.ts --maxWorkers=1 --maxConcurrency=1`
2. `pnpm exec vitest run packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts --maxWorkers=1 --maxConcurrency=1`
3. `pnpm exec vitest run packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts --maxWorkers=1 --maxConcurrency=1`
4. `pnpm exec vitest run packages/adapters/github-copilot/test/github-copilot-agent-adapter.smoke.test.ts --maxWorkers=1 --maxConcurrency=1`

## 8. Delivery Verification

1. `pnpm run build`
2. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`

## 9. 执行记录

1. 2026-04-14：任务创建，状态初始化为 `planned`。
2. 2026-04-14：已新增 `launch-authoring-compatibility-alignment-evidence.md`，把 `project-102` 的 shared harness vocabulary 明确映射到 `project-106` 的 scenario-class compatibility taxonomy，并将 `spawn / parse / non_zero / signal / timeout / abort` 的 coverage anchors、preserved facts 与 scope guardrail 固化为可复用 evidence；focused suites、`pnpm run build` 与 `pnpm run test:packages` 已在同窗通过，当前任务完成。

## 10. 产出

1. `launch-authoring-compatibility-alignment-evidence.md`
