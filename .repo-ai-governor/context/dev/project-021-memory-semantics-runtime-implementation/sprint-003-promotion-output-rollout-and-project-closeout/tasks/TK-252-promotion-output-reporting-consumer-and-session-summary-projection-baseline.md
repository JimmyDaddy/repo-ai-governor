# TK-252 promotion output reporting consumer 与 session-summary projection baseline

- Status: completed
- Date: 2026-03-27
- Owner: AI-Agent
- Priority: P0
- Project: `project-021-memory-semantics-runtime-implementation`
- Sprint: `sprint-003-promotion-output-rollout-and-project-closeout`

## 1. 任务目标

将 `runtime.memory-semantics` 的 `promotionSummary` 或 session-summary projection 接到至少一个 reporting-facing consumer，并保持 consumer 只读 contract-safe 输出。

## 2. Depends On

1. `TK-251`
2. `DA-248`
3. `DA-249`
4. `DA-250`

## 3. 预期产物

1. `DA-252`
2. 更新后的 runtime/reporting consumer 实现与测试
3. rollout evidence

## 4. Required Inputs

1. `packages/core-memory-semantics/src/memory-promotion-service.ts`
2. `.repo-ai-governor/context/dev/project-021-memory-semantics-runtime-implementation/sprint-002-promotion-pipeline-and-runtime-consumer-rollout/tasks/DA-248-memory-promotion-pipeline-and-contract-safe-summary-baseline.md`
3. `.repo-ai-governor/context/dev/project-021-memory-semantics-runtime-implementation/sprint-002-promotion-pipeline-and-runtime-consumer-rollout/tasks/DA-249-second-runtime-consumer-rollout-and-memory-context-consumer-cutover.md`
4. `.repo-ai-governor/context/dev/project-021-memory-semantics-runtime-implementation/sprint-002-promotion-pipeline-and-runtime-consumer-rollout/tasks/DA-250-sprint-002-exit-acceptance-and-sprint-003-input-constraints.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-021-memory-semantics-runtime-implementation/plan.md`
2. `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`

## 6. 实施计划

1. 识别一个当前尚未消费 promotion output / session-summary projection 的 runtime 或 reporting consumer。
2. 仅通过 `promotionSummary`、session-summary projection 或更窄的 contract-safe shape 接入该 consumer。
3. 补齐目标回归测试与 rollout evidence，确认未重新暴露底层 snapshot。

## 7. Development Verification

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm exec vitest run packages/core-memory-semantics/test/memory-semantics.unit.test.ts apps/cli/test/cli-governance-runtime.integration.test.ts --maxWorkers=1 --maxConcurrency=1`

## 8. Delivery Verification

1. `node ./scripts/governance/check-technical-solution-delivery-registry.js`
2. `pnpm run check`

## 9. 执行记录

1. 2026-03-27：任务创建，状态初始化为 `planned`。
2. 2026-03-27：状态切换为 `in_progress`，开始将 `execution_report` 识别为 reporting-facing consumer，并把 promotion summary / session-summary projection 接到 report contract。
3. 2026-03-27：已完成 execution report memorySemantics augmentation、session-summary projection 持久化接线、report-builder/CLI integration tests 与 `DA-252`。

## 10. 产出

1. `DA-252`
