# Vitest Stability Baseline (2026-03-18)

## Baseline Command

```bash
npm run test:stability -- --runs 3
```

- status: `pass`
- runs: `3`
- runFailures: `0`
- slowFileThresholdMs: `2000`
- slowFiles: `16`
- flakyFiles: `0`
- report json: `.repo-ai-governor/reports/vitest-stability/latest.json`
- report markdown: `.repo-ai-governor/reports/vitest-stability/latest.md`

## Top Slow Files (Avg Duration)

1. `test/commands/run-command.test.ts` - `30174.34ms`
2. `test/release/getting-started-acceptance.test.ts` - `8923.57ms`
3. `test/commands/review-command.test.ts` - `8499.54ms`
4. `test/release/release-distribution.test.ts` - `6346.04ms`
5. `test/commands/check-command.test.ts` - `5684.14ms`
6. `test/acceptance/mvp-acceptance-kit.test.ts` - `4514.86ms`
7. `test/commands/upgrade-command.test.ts` - `4479.70ms`
8. `test/commands/review-verify-command.test.ts` - `4452.27ms`
9. `test/ci/ci-scripts.test.ts` - `4439.89ms`
10. `test/acceptance/automation-v1-smoke.test.ts` - `4344.79ms`

## Slow/Flaky Trigger Signals

1. `child_process` 调用密集（命令编排、脚本执行类测试）。
2. 文件系统 I/O 较重（初始化/发布分发/验收套件）。
3. 跨模块端到端断言较多（run/review/check 命令链）。

## Layering Strategy (Draft)

1. Fast lane（默认 PR 门禁）：保留 `npm run test`，优先确保稳定通过与反馈速度。
2. Slow lane（稳定性巡检）：使用 `npm run test:stability -- --runs 3` 观察波动趋势，定位慢测与偶发失败。
3. Deep slow diagnostics（问题排查）：使用 `npm run test:slow` + 可选参数 `--maxWorkers=1 --no-file-parallelism` 复现并发敏感问题。

## Next Step

1. 2026-03-18 波动修复：为发布链路测试引入跨进程互斥锁 `test/release/release-test-lock.ts`，并应用于 `getting-started-acceptance`、`release-distribution` 用例，避免 `npm pack/install` 并发冲突。
2. 修复后连续两轮 `npm run test:stability -- --runs 3` 均为 `status=pass`（`runFailures=0`、`flakyFiles=0`）。
3. 将 `test/commands/run-command.test.ts`、`test/release/*` 继续纳入慢测优先治理批次，按模块拆分可并发子集。
4. 在 `quality-gate` 之外追加可选稳定性工作流（夜间或手动触发）执行 `test:stability`。
