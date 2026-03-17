# Coverage Baseline (2026-03-18)

## Baseline Command

```bash
npm run test:coverage
```

## Overall Baseline

1. statements: `78.53%`
2. branches: `60.66%`
3. functions: `90.43%`
4. lines: `78.29%`

## Core Scope Baseline

1. `src/commands/`: statements `77.04%` / branches `57.44%` / functions `92.22%` / lines `76.83%`
2. `src/config/`: statements `88.52%` / branches `73.62%` / functions `93.62%` / lines `88.43%`
3. `src/workflow/`: statements `90.06%` / branches `77.73%` / functions `100.00%` / lines `89.83%`
4. `src/reporting/`: statements `91.55%` / branches `71.93%` / functions `93.88%` / lines `91.24%`
5. `src/slots/`: statements `80.60%` / branches `69.03%` / functions `88.24%` / lines `81.08%`

## Threshold Strategy

1. 采用 “全局阈值 + 核心目录阈值” 双层门禁，避免仅看全局均值掩盖核心模块回退。
2. 阈值定义落盘于 `scripts/ci/coverage-thresholds.json`，采用“贴近当前基线并保留小幅回退缓冲”的方式设置。
3. 校验脚本为 `scripts/ci/check-coverage-thresholds.js`，可输出明确失败原因（scope + metric + expected + actual）。

## Gate Integration

1. `npm run check:coverage-thresholds`：只校验覆盖率报告与阈值匹配关系。
2. `npm run check:coverage`：执行 `test:coverage` 并进行阈值门禁。
3. `npm run ci:quality`：已纳入覆盖率门禁（`typecheck -> check -> check:coverage`）。
