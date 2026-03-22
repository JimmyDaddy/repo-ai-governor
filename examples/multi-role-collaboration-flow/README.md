# Example: Multi Role Collaboration Flow

## 输入

1. 已执行基础初始化（`init/doctor/check`）。
2. 允许在当前仓库生成 `context/plan`、`context/review` 与 `context/ledger-backfill` 产物。
3. 预期串联 `plan -> run -> review -> review-verify -> ledger backfill`。

## 命令

```bash
pnpm exec repo-ai-governor plan --output json
pnpm exec repo-ai-governor run --output json --dry-run --trace
pnpm exec repo-ai-governor review --output json
pnpm exec repo-ai-governor review-verify --output json
```

## 预期输出

1. `plan` 产出计划快照 artifact。
2. `run` 产出运行链路诊断与 replay/report 相关 artifact。
3. `review` 产出 review request artifact。
4. `review-verify` 产出 verify artifact，并写入 `ledger backfill` 回填记录。

## 排障

1. 若 `review-verify` 无可消费请求，先执行一次 `review` 并确认 request 目录已落盘。
2. 若 `run --trace` 无诊断文件，检查输出目录权限与当前 workspace 根是否正确。
3. 若回填链路异常，检查 `review-verify` 的 `command_result.artifacts` 是否包含 ledger backfill 路径。

## 可执行资产

1. 机器可执行场景：`examples/multi-role-collaboration-flow/scenario.json`
2. 固定输入约束：`examples/multi-role-collaboration-flow/fixtures/input.md`
3. 运行基线断言：`examples/multi-role-collaboration-flow/expected/runtime-baseline.json`
