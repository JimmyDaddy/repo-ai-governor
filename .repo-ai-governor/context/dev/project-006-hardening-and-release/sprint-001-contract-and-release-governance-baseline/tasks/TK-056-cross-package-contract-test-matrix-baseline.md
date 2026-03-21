# TK-056 跨包契约测试矩阵基线

- Status: completed
- Date: 2026-03-22
- Owner: AI-Agent
- Priority: P0
- Project: `project-006-hardening-and-release`
- Sprint: `sprint-001-contract-and-release-governance-baseline`

## 1. 任务目标

建立 Stage 7 跨包契约测试矩阵，统一关键模块契约入口、失败语义与回归边界。

## 2. Depends On

1. `DA-065`
2. `DA-066`

## 3. 预期产物

1. `DA-067` 跨包契约测试矩阵基线文档与执行入口说明。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-006-hardening-and-release/plan.md`
2. `.repo-ai-governor/context/dev/project-005-observability-and-artifacts/sprint-002-dependency-runtime-and-output-governance/tasks/TK-053-project-005-exit-acceptance-and-project-006-input-constraints.md`（`DA-065`）
3. `.repo-ai-governor/context/dev/project-005-observability-and-artifacts/sprint-002-dependency-runtime-and-output-governance/tasks/TK-053-project-006-input-constraints-checklist.md`（`DA-066`）
4. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`（`4.8`）
5. `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`（`CS-024`）

## 5. 实施计划

1. 定义模块覆盖清单：`adapter-sdk`、`memory-store-adapter`、`artifact-registry`、`notification-dispatcher`、`process DSL/IR`、`risk-policy`、`standards projection parity`。
2. 定义契约测试入口、固定输出字段与失败分级（block/warn）语义。
3. 将执行入口纳入 sprint 台账与后续 GA 联合门禁输入链路。

## 6. 跨包契约测试矩阵（DA-067）

1. 已新增 `test:contract` 执行入口（`vitest.contract.config.ts`）并落盘契约矩阵清单：
   - `test/contract/contract-test-matrix.manifest.json`
   - `test/contract/contract-test-matrix.contract.test.ts`
2. 矩阵覆盖（Stage 7 必选组件）：

| component | baseline test path | failure policy | 说明 |
|---|---|---|---|
| `adapter-sdk` | `packages/adapter-sdk/test/agent-route-runner.smoke.test.ts` | `warn` | 先用 smoke 语义兜底，后续在 `TK-057` 升级为独立 contract 套件 |
| `memory-store-adapter` | `packages/memory-store-adapter/test/memory-store-adapter.unit.test.ts` | `warn` | 当前以 unit 契约行为兜底，后续补齐 contract 测试 |
| `artifact-registry` | `packages/artifact-registry/test/artifact-registry.unit.test.ts` | `warn` | 解析契约先由 unit 约束，后续补齐跨包 contract |
| `notification-dispatcher` | `packages/notification-dispatcher/test/notification-dispatcher.integration.test.ts` | `block` | HITL 通知分发链路必须阻断回归 |
| `process-dsl-ir` | `packages/core-process/test/process-compiler.contract.test.ts` | `block` | IR 编译契约属于运行时硬边界 |
| `risk-policy` | `packages/core-change-risk/test/change-risk-evaluator.contract.test.ts` + `packages/core-policy/test/policy-gate-engine.contract.test.ts` | `block` | 风险事实与策略决策字段必须保持兼容 |
| `standards-projection-parity` | `packages/standards/test/standards-pack.contract.test.ts` + `packages/standards/test/standards-projection-parity.integration.test.ts` | `block` | human/ai/agents 投影一致性必须阻断漂移 |

3. 新增矩阵守卫测试能力：
   - 校验 Stage 7 必选组件是否被矩阵覆盖；
   - 校验 `contractId` 唯一性与 `failurePolicy` 合法性；
   - 校验矩阵中声明的测试文件路径全部可解析。

## 7. 验证

1. `pnpm run test:contract -- --maxWorkers=1 --maxConcurrency=1`（通过）
2. `pnpm run test:integration -- test/contract/contract-test-matrix.contract.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
3. `node ./scripts/governance/reconcile-artifact-dependencies.js`（通过）
4. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
5. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
6. `node ./scripts/governance/check-artifact-registry-lifecycle.js`（通过）
7. `pnpm run check`（通过）

## 8. 执行记录

1. 2026-03-22：任务创建，状态初始化为 `planned`。
2. 2026-03-22：任务启动，状态切换为 `in_progress`，开始建立 Stage 7 跨包契约测试矩阵与 `test:contract` 执行入口。
3. 2026-03-22：完成 `DA-067` 矩阵清单、守卫测试、台账与 artifact 回链同步，状态切换为 `completed`。

## 9. 产出

1. `DA-067` `.repo-ai-governor/context/dev/project-006-hardening-and-release/sprint-001-contract-and-release-governance-baseline/tasks/TK-056-cross-package-contract-test-matrix-baseline.md`
2. `test/contract/contract-test-matrix.manifest.json`
3. `test/contract/contract-test-matrix.contract.test.ts`
4. `vitest.contract.config.ts`
5. `package.json`
6. `.repo-ai-governor/context/artifact-registry/artifacts.csv`
7. `.repo-ai-governor/context/dev/project-006-hardening-and-release/sprint-001-contract-and-release-governance-baseline/review/verified_review_tk-056-cross-package-contract-test-matrix-baseline.md`
