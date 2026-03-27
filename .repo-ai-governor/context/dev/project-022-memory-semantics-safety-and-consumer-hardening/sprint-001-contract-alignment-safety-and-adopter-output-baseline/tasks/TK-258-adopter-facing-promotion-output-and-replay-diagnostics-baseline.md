# TK-258 adopter-facing promotion output 与 replay diagnostics baseline

- Status: completed
- Date: 2026-03-27
- Owner: AI-Agent
- Priority: P1
- Project: `project-022-memory-semantics-safety-and-consumer-hardening`
- Sprint: `sprint-001-contract-alignment-safety-and-adopter-output-baseline`

## 1. 任务目标

把 `runtime-memory-semantics` 的 promotion output 从当前内部 `execution_report` consumer 扩到至少一个 adopter-facing CLI / replay diagnostics 相邻 surface。

## 2. Depends On

1. `TK-255`
2. `DA-255`
3. `DA-252`

## 3. 预期产物

1. `DA-258`
2. 更新后的 adopter-facing consumer 与测试

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-022-memory-semantics-safety-and-consumer-hardening/sprint-001-contract-alignment-safety-and-adopter-output-baseline/tasks/DA-255-project-022-activation-and-project-021-closeout-handoff.md`
2. `.repo-ai-governor/context/dev/project-021-memory-semantics-runtime-implementation/sprint-003-promotion-output-rollout-and-project-closeout/tasks/DA-252-promotion-output-reporting-consumer-and-session-summary-projection-baseline.md`
3. `apps/cli/src/cli-governance-runtime.ts`
4. `apps/cli/src/runtime/presentation/**`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-021-memory-semantics-runtime-implementation/project-021-memory-semantics-runtime-implementation-completion-audit-summary.md`

## 6. 实施计划

1. 识别一个最接近 adopter-facing 的 CLI / replay diagnostics consumer。
2. 仅通过 contract-safe promotion output 或 replay diagnostics augmentation 接入该 consumer。
3. 补齐对应 integration tests 与 rollout evidence。

## 7. Development Verification

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm exec vitest run apps/cli/test/cli-governance-runtime.integration.test.ts packages/reporting/test/report-builder.unit.test.ts --maxWorkers=1 --maxConcurrency=1`

## 8. Delivery Verification

1. `pnpm run check`

## 9. 执行记录

1. 2026-03-27：任务创建，状态初始化为 `planned`。
2. 2026-03-27：状态切换为 `in_progress`，开始把 promotion output 扩展到 adopter-facing `run`/`replay` CLI surface 与 replay diagnostics artifact。
3. 2026-03-27：已完成 `run`/`replay` message augmentation、replay explain lines、replay diagnostics summary、相关 unit/integration tests 与 `DA-258`。

## 10. 产出

1. `DA-258`
