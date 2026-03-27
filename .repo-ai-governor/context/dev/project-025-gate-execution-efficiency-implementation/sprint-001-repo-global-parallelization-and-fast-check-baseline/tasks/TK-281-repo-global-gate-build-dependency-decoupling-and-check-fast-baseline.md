# TK-281 repo-global gate build dependency decoupling 与 check:fast baseline

- Status: planned
- Date: 2026-03-27
- Owner: AI-Agent
- Priority: P0
- Project: `project-025-gate-execution-efficiency-implementation`
- Sprint: `sprint-001-repo-global-parallelization-and-fast-check-baseline`

## 1. 任务目标

拆掉 `repo-global gate` 对全仓 `build` 的不必要前置，并建立 `check:fast` 的 phase-1 baseline。

## 2. Depends On

1. `TK-280`
2. `package.json`
3. `turbo.json`
4. `scripts/ci/run-gate-check.js`

## 3. 预期产物

1. 更新后的根 gate scripts
2. 更新后的 `turbo.json`
3. `check:fast` baseline

## 4. 实施计划

1. 识别可以脱离 `build` 的 repo-global gate。
2. 重构 `turbo.json` 依赖链，避免文档/治理 gate 被 build 串行阻塞。
3. 保持 `check` 仍指向完整 gate，不把 `fast` 伪装成 `full`。
