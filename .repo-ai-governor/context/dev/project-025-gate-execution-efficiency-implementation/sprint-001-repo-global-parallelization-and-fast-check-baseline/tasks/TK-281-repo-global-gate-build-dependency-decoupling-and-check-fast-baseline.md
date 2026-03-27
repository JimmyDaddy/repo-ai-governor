# TK-281 repo-global gate build dependency decoupling 与 check:fast baseline

- Status: completed
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

## 5. 实施记录（2026-03-27）

### 5.1 门禁分类

将 22+ 个 gate 分为三类：

**Category A — 无需 build（纯 JS 脚本，读 md/yaml/csv）**：
- `code-standards`、`docs-triad-sync`、`technical-solution-module-graph`
- `technical-solution-lifecycle-registry`、`technical-solution-delivery-registry`
- `task-ledger-sync`、`sprint-plan-status-sync`、`code-review-status-sync`
- `worktree-review-target`、`artifact-lifecycle`、`normative-loading-manifest`

**Category B — 需要 build**：
- `finite-literal-sets`、`dependency-boundary`、`standardized-errors`
- `examples-smoke`、`examples-runtime-smoke`、`ide-entry-smoke`
- `desktop-entry-smoke`、`ide-docs-parity`、`stage9-handoff`
- `i18n-parity-fallback`、`test:*`

**Category C — 组合入口（新增）**：
- `gate:fast` — 只含 format + lint + 全部 Category A gate
- `gate:check` — 依赖 `gate:fast` + 全部 Category B gate（完整语义不变）

### 5.2 已落地变更

1. **turbo.json**：Category A gate 的 `dependsOn` 已从 `gate:build` 移除，`cache` 改为 `true`；新增 `gate:fast` 组合任务。
2. **package.json**：新增 `check:fast`、`check:full`、`gate:fast` 脚本。
3. **run-gate-check.js**：新增 `--profile fast|full` 参数支持，默认 `full` 保持向下兼容。
4. **gate-fast-complete.js**（新增）：`gate:fast` Turbo terminal node。

### 5.3 CR 复核修复

1. 修复 `run-repo-global-gates.js --output json` 在 stdout 前输出 banner 的契约问题，确保机器消费者可直接解析 JSON。
2. 为 runner wrapper 新增集成测试，覆盖纯 JSON stdout 与 `affected` deferred 提示场景。

## 6. 验证结果（2026-03-27）

```bash
node ./scripts/ci/run-repo-global-gates.js --output json
pnpm run test:integration -- test/gate-runner-output.integration.test.ts
pnpm run check:fast
```

## 7. 执行记录

1. 2026-03-27：任务创建，状态初始化为 `planned`。
2. 2026-03-27：状态切换为 `in_progress`，开始拆解 repo-global gate 与 build 的依赖边界，并建立 `check:fast` baseline。
3. 2026-03-27：验证通过并完成 sprint-001 closeout，状态切换为 `completed`。
