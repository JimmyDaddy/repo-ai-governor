# TK-057 分层测试（contract/integration/e2e）稳定基线

- Status: completed
- Date: 2026-03-22
- Owner: AI-Agent
- Priority: P0
- Project: `project-006-hardening-and-release`
- Sprint: `sprint-001-contract-and-release-governance-baseline`

## 1. 任务目标

建立 `tests/contract`、`tests/integration`、`tests/e2e` 的分层职责与稳定性执行基线，避免测试职责交叉与回归盲区。

## 2. Depends On

1. `TK-056`
2. `DA-067`

## 3. 预期产物

1. `DA-068` 分层测试稳定基线文档与最小样例覆盖清单。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-006-hardening-and-release/plan.md`
2. `.repo-ai-governor/context/dev/project-006-hardening-and-release/sprint-001-contract-and-release-governance-baseline/plan.md`
3. `.repo-ai-governor/context/dev/project-006-hardening-and-release/sprint-001-contract-and-release-governance-baseline/tasks/TK-056-cross-package-contract-test-matrix-baseline.md`（`DA-067`）
4. `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`（`CS-024`）

## 5. 实施计划

1. 定义三层测试目录的职责边界与命名规则。
2. 明确包级测试与跨包测试的归属分界与执行顺序。
3. 输出最小稳定样例集，并纳入后续 GA 联合门禁输入。

## 6. 分层测试稳定基线（DA-068）

1. 分层职责收敛：
   - `test:contract`：运行 `packages/**/test/**/*.contract.test.ts` 与 `test/contract/**/*.contract.test.ts`。
   - `test:integration`：运行 `test/**/*.test.ts`（跨包集成/治理脚本集成）。
   - `test:e2e`：运行 `test/e2e/**/*.e2e.test.ts`（从运行时入口验证用户路径）。
2. 最小样例覆盖：
   - contract：`test/contract/contract-test-matrix.contract.test.ts`。
   - integration：既有 root `test/*.integration.test.ts` 套件。
   - e2e：新增 `test/e2e/cli-help.e2e.test.ts`。
3. 门禁接线：
   - 新增 `vitest.e2e.config.ts` 与 `test:e2e`。
   - Turbo 新增 `//#gate:test:contract` 与 `//#gate:test:e2e`。
   - 执行顺序收敛为：`test:packages + test:contract -> test:integration -> test:e2e`。

## 7. 验证

1. `pnpm run test:contract -- --maxWorkers=1 --maxConcurrency=1`（通过）
2. `pnpm run test:integration -- test/contract/contract-test-matrix.contract.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
3. `pnpm run test:e2e -- --maxWorkers=1 --maxConcurrency=1`（通过）
4. `node ./scripts/governance/reconcile-artifact-dependencies.js`（通过）
5. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
6. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
7. `node ./scripts/governance/check-artifact-registry-lifecycle.js`（通过）
8. `pnpm run check`（通过）

## 8. 执行记录

1. 2026-03-22：任务创建，状态初始化为 `planned`。
2. 2026-03-22：任务启动，状态切换为 `in_progress`，开始落地 contract/integration/e2e 分层入口与门禁接线。
3. 2026-03-22：完成 `DA-068` 分层基线、e2e 样例与 Turbo 门禁编排，状态切换为 `completed`。

## 9. 产出

1. `DA-068` `.repo-ai-governor/context/dev/project-006-hardening-and-release/sprint-001-contract-and-release-governance-baseline/tasks/TK-057-layered-test-contract-integration-e2e-stability-baseline.md`
2. `vitest.e2e.config.ts`
3. `test/e2e/cli-help.e2e.test.ts`
4. `turbo.json`
5. `package.json`
6. `.repo-ai-governor/context/artifact-registry/artifacts.csv`
7. `.repo-ai-governor/context/dev/project-006-hardening-and-release/sprint-001-contract-and-release-governance-baseline/review/verified_review_tk-057-layered-test-contract-integration-e2e-stability-baseline.md`
