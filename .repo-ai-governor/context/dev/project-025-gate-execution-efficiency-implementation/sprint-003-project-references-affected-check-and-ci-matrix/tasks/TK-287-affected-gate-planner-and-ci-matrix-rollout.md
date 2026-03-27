# TK-287 affected gate planner 与 ci matrix rollout

- Status: completed
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
2. 2026-03-28：状态切换为 `in_progress`，开始实现 `affected` planner、runner cutover 与 CI matrix 分层。
3. 2026-03-28：新增 `scripts/ci/run-affected-check.js`，将 docs-only 变更路由到 `check:fast`，将 `package_local_pilot` 范围路由到 `check:fast + check:package-local:pilot:incremental + check:package-local:pilot`，其余变更回退到 `check:full`。
4. 2026-03-28：完成 `run-gate-check.js` 的 `affected` profile script-backed cutover、`package.json` 新入口、`.github/workflows/quality-gate.yml` fast / affected / full matrix 分层与 integration test 更新。
5. 2026-03-28：验证通过：`pnpm exec biome check scripts/ci/run-gate-check.js scripts/ci/run-affected-check.js test/gate-runner-output.integration.test.ts .github/workflows/quality-gate.yml package.json tsconfig.package-local-pilot.build.json packages/shared/tsconfig.build.json packages/memory-store-adapter/tsconfig.build.json packages/core-memory/tsconfig.build.json packages/core-memory-semantics/tsconfig.build.json`、`pnpm vitest run --config vitest.integration.config.ts test/gate-runner-output.integration.test.ts`、`node ./scripts/ci/run-affected-check.js --dry-run --output json --changed-file packages/shared/src/index.ts`、`node ./scripts/ci/run-gate-check.js --profile affected --dry-run --changed-file packages/shared/src/index.ts`、`pnpm run check:affected -- --changed-file packages/shared/src/index.ts`；状态切换为 `completed`。
6. 2026-03-28：完成 CR `2.2` 修复，补充 `.codex/` 与 `docs/` 的 doc-only 路由覆盖，并新增 `.codex` 文档变更回归测试；`resolved_code_review_working-tree-20260328-sprint-003.md` 已收口。
