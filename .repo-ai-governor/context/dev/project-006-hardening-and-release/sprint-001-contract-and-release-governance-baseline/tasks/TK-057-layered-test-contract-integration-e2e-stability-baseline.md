# TK-057 分层测试（contract/integration/e2e）稳定基线

- Status: planned
- Date: 2026-03-22
- Owner: TBD
- Priority: P0
- Project: `project-006-hardening-and-release`
- Sprint: `sprint-001-contract-and-release-governance-baseline`

## 1. 任务目标

建立 `tests/contract`、`tests/integration`、`tests/e2e` 的分层职责与稳定性执行基线，避免测试职责交叉与回归盲区。

## 2. Depends On

1. `TK-056`

## 3. 预期产物

1. `DA-068` 分层测试稳定基线文档与最小样例覆盖清单。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-006-hardening-and-release/plan.md`
2. `.repo-ai-governor/context/dev/project-006-hardening-and-release/sprint-001-contract-and-release-governance-baseline/plan.md`
3. `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`（`CS-024`）

## 5. 实施计划

1. 定义三层测试目录的职责边界与命名规则。
2. 明确包级测试与跨包测试的归属分界与执行顺序。
3. 输出最小稳定样例集，并纳入后续 GA 联合门禁输入。

## 6. 验证

1. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`
2. `pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`
3. `pnpm run check`

## 7. 执行记录

1. 2026-03-22：任务创建，状态初始化为 `planned`。
