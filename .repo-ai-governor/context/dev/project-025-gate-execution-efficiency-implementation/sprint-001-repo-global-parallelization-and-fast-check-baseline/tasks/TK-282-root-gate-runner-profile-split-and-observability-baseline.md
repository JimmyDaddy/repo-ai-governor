# TK-282 root gate runner profile split 与 observability baseline

- Status: completed
- Date: 2026-03-27
- Owner: AI-Agent
- Priority: P1
- Project: `project-025-gate-execution-efficiency-implementation`
- Sprint: `sprint-001-repo-global-parallelization-and-fast-check-baseline`

## 1. 任务目标

建立 `full / fast` 的 root runner profile split 与相应 observability baseline，并明确 `affected` profile 的递延边界。

## 2. Depends On

1. `TK-280`
2. `package.json`
3. `scripts/ci/run-gate-check.js`

## 3. 预期产物

1. `run-gate-check.js` 支持 `--profile` 参数
2. `run-repo-global-gates.js` 独立编排脚本
3. 执行耗时 observability 输出

## 4. 实施计划

1. 为 `run-gate-check.js` 增加 `--profile full|fast` 参数选择不同 Turbo task，并对 `affected` 给出显式 deferred 提示。
2. 创建 `run-repo-global-gates.js` 独立运行 repo-global gate。
3. 添加 timing observability（每 gate 耗时、总耗时、状态），并保证 `json` 模式输出可直接被机器解析。

## 5. 实施记录（2026-03-27）

### 5.1 run-gate-check.js 变更

- 新增 `--profile fast|full` 参数，映射到 `gate:fast` / `gate:check` Turbo 任务
- 默认 `full`，保持调用 `pnpm run check` 时行为不变
- `--profile affected` 现返回显式 deferred 提示，避免把未落地能力误报为 unknown/已支持
- 新增 observability 输出：
  - 启动时打印 `profile=, task=, started at=`
  - 结束时打印 `profile=, status=PASSED|FAILED, elapsed=Ns`

### 5.2 run-repo-global-gates.js（新增）

- 独立编排 11 个 repo-global gate，并行执行
- 支持 `--group governance|docs|all` 过滤
- 支持 `--output json` 结构化输出，且 stdout 只保留 JSON payload
- 每个 gate 输出独立的 status + elapsed_ms
- 汇总输出 passed/total + 总耗时

### 5.3 范围收敛

- `affected` planner 的真实落地窗口保持在 `sprint-003 / TK-287`
- `TK-282` 当前 sprint 只承接 `full / fast` runner split、repo-global runner 与 observability baseline，不把 `affected` 伪装成已交付

## 6. 验证结果（2026-03-27）

```bash
node ./scripts/ci/run-repo-global-gates.js --output json
node ./scripts/ci/run-gate-check.js --profile affected
pnpm run test:integration -- test/gate-runner-output.integration.test.ts
pnpm run check:full
pnpm run check
```

## 7. 执行记录

1. 2026-03-27：任务创建，状态初始化为 `planned`。
2. 2026-03-27：状态切换为 `in_progress`，开始收敛 root runner profile split、repo-global runner 与 observability baseline。
3. 2026-03-27：验证通过并完成 sprint-001 closeout，状态切换为 `completed`。
