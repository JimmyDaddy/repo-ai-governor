# TK-287 affected gate planner 与 ci matrix rollout

- Status: planned
- Date: 2026-03-28
- Owner: AI-Agent
- Priority: P0
- Project: `project-025-gate-execution-efficiency-implementation`
- Sprint: `sprint-003-project-references-affected-check-and-ci-matrix`

## 1. 任务目标

实装 affected gate planner，将 `--profile affected` 从 deferred 提示切换到真实执行路径，并建立 CI matrix 中 full / fast / affected 的分层执行模型。

## 2. Depends On

1. `TK-286`（ts project references 与 incremental build baseline）

## 3. 预期产物

1. `run-gate-check.js --profile affected` 可真实执行。
2. affected planner 基于粗粒度 diff routing 选择受影响的 gate 子集。
3. CI matrix 保持 full gate 仍可作为最终权威入口。

## 4. 实施计划

1. 实现 `scripts/ci/run-affected-check.js`（或在 `run-gate-check.js` 内扩展）。
2. 基于 `git diff` 的粗粒度文件变更范围，路由到受影响的 gate 子集。
3. 解除 `run-gate-check.js` 中 `affected` profile 的 deferred 限制。
4. 在 CI 配置中建立 full / fast / affected 的分层 matrix。

## 5. 待验证

```bash
node ./scripts/ci/run-gate-check.js --profile affected
pnpm run check
```

## 6. 执行记录

1. 2026-03-28：任务创建，状态初始化为 `planned`。
