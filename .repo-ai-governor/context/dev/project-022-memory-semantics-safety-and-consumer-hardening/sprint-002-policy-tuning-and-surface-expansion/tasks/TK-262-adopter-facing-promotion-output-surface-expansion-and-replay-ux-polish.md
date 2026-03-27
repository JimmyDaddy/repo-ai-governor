# TK-262 adopter-facing promotion output surface expansion 与 replay UX polish

- Status: completed
- Date: 2026-03-27
- Owner: AI-Agent
- Priority: P1
- Project: `project-022-memory-semantics-safety-and-consumer-hardening`
- Sprint: `sprint-002-policy-tuning-and-surface-expansion`

## 1. 任务目标

在现有 `run/replay` 基线之上继续扩展 adopter-facing promotion output surface，并改善 replay UX 的可解释性。

## 2. Depends On

1. `TK-260`
2. `DA-258`
3. `DA-259`

## 3. 预期产物

1. `DA-262`
2. 更新后的 adopter-facing consumer 与测试

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-022-memory-semantics-safety-and-consumer-hardening/sprint-002-policy-tuning-and-surface-expansion/tasks/DA-260-sprint-002-activation-and-sprint-001-closeout-handoff.md`
2. `.repo-ai-governor/context/dev/project-022-memory-semantics-safety-and-consumer-hardening/sprint-001-contract-alignment-safety-and-adopter-output-baseline/tasks/DA-258-adopter-facing-promotion-output-and-replay-diagnostics-baseline.md`
3. `.repo-ai-governor/context/dev/project-022-memory-semantics-safety-and-consumer-hardening/sprint-001-contract-alignment-safety-and-adopter-output-baseline/tasks/DA-259-sprint-001-exit-acceptance-and-sprint-002-input-constraints.md`

## 5. Traceback References

1. `apps/cli/src/runtime/presentation/**`

## 6. 实施计划

1. 选择下一条最有价值的 adopter-facing surface。
2. 保持只消费 contract-safe promotion output / replay diagnostics augmentation。
3. 补齐 unit/integration tests 与 rollout evidence。

## 7. Development Verification

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm exec vitest run apps/cli/test/runtime/replay-explain-builder.test.ts apps/cli/test/runtime/command-experience-builder.test.ts apps/cli/test/cli-governance-runtime.integration.test.ts --maxWorkers=1 --maxConcurrency=1`

## 8. Delivery Verification

1. `node ./scripts/governance/check-artifact-registry-lifecycle.js`

## 9. 执行记录

1. 2026-03-27：任务创建，状态初始化为 `planned`。
2. 2026-03-27：状态切换为 `in_progress`，开始将 memory policy / promotion summary 扩展到 adopter-facing check、layered logs、replay explain 与 diagnostics summary。
3. 2026-03-27：已完成 adopter-facing surface expansion、replay UX polish、相关 unit/integration tests 与 `DA-262`。

## 10. 产出

1. `DA-262`
