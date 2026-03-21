# TK-059 sprint-001 出口验收与 sprint-002 输入约束

- Status: completed
- Date: 2026-03-22
- Owner: AI-Agent
- Priority: P0
- Project: `project-006-hardening-and-release`
- Sprint: `sprint-001-contract-and-release-governance-baseline`

## 1. 任务目标

汇总 sprint-001 交付证据，形成统一出口验收基线并沉淀 sprint-002 输入约束清单。

## 2. Depends On

1. `TK-056`
2. `TK-057`
3. `TK-058`
4. `DA-067`
5. `DA-068`
6. `DA-069`

## 3. 预期产物

1. `DA-070` sprint-001 出口验收基线文档。
2. `DA-071` sprint-002 输入约束清单。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-006-hardening-and-release/sprint-001-contract-and-release-governance-baseline/tasks/TK-056-cross-package-contract-test-matrix-baseline.md`
2. `.repo-ai-governor/context/dev/project-006-hardening-and-release/sprint-001-contract-and-release-governance-baseline/tasks/TK-057-layered-test-contract-integration-e2e-stability-baseline.md`
3. `.repo-ai-governor/context/dev/project-006-hardening-and-release/sprint-001-contract-and-release-governance-baseline/tasks/TK-058-release-governance-and-canary-rc-ga-channel-baseline.md`
4. `.repo-ai-governor/context/dev/project-006-hardening-and-release/plan.md`
5. `.repo-ai-governor/context/dev/project-006-hardening-and-release/sprint-002-resilience-and-ga-readiness/plan.md`
6. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`（`§4.2`、`§4.2.1`、`§11`）
7. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`（`§2`、`§4`、`§6`）
8. `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`（`CS-021`、`CS-023`、`CS-024`、`CS-025`）

## 5. sprint-001 出口验收基线（DA-070）

1. 跨包契约测试矩阵基线（`TK-056` / `DA-067`）
   - 验收结果：通过
   - 关键证据：
     - `test/contract/contract-test-matrix.manifest.json` 与 `test/contract/contract-test-matrix.contract.test.ts` 已建立 Stage 7 契约矩阵与守卫测试。
     - `verified_review_tk-056-cross-package-contract-test-matrix-baseline.md` 已验证并完成台账回链。
2. 分层测试稳定基线（`TK-057` / `DA-068`）
   - 验收结果：通过
   - 关键证据：
     - `test:contract / test:integration / test:e2e` 分层执行入口已接入 gate 链路。
     - `verified_review_tk-057-layered-test-contract-integration-e2e-stability-baseline.md` 已验证并完成台账回链。
3. 发布治理与通道基线（`TK-058` / `DA-069`）
   - 验收结果：通过
   - 关键证据：
     - 已落地 release governance spec、release policy config、runtime JS whitelist、local distribution verify 与 release notes renderer。
     - `release:check`、`release:ga-check`、`release:verify-local` 已可执行通过。
4. 台账一致性与生命周期治理
   - 验收结果：通过
   - 关键证据：
     - `node ./scripts/governance/reconcile-artifact-dependencies.js`
     - `node ./scripts/governance/check-task-ledger-sync.js`
     - `node ./scripts/governance/check-sprint-plan-status-sync.js`
     - `node ./scripts/governance/check-artifact-registry-lifecycle.js`
5. 综合门禁
   - 验收结果：通过
   - 关键证据：
     - `pnpm run check`
     - `pnpm run release:check`
     - `pnpm run release:ga-check`

## 6. sprint-002 输入约束总览

1. 已输出 `DA-071`：`.repo-ai-governor/context/dev/project-006-hardening-and-release/sprint-001-contract-and-release-governance-baseline/tasks/TK-059-sprint-002-resilience-and-ga-readiness-input-constraints-checklist.md`。
2. `TK-060` 启动前必须消费 `DA-071`，聚焦受限网络/离线降级稳定性回归基线。
3. `TK-061` 必须在 `DA-069` 发布治理基线与 `TK-060` 稳定性回归结果基础上执行回滚演练。
4. `TK-062` 必须收敛 `TK-060/TK-061` 的结果，形成 GA 候选联合门禁。
5. 依赖消费约束：只允许消费 `active/frozen` 产物，`dependent_tasks` 由脚本回填，禁止手工漂移。

## 7. 验证

1. `node ./scripts/governance/reconcile-artifact-dependencies.js`（通过）
2. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
3. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
4. `node ./scripts/governance/check-artifact-registry-lifecycle.js`（通过）
5. `pnpm run check`（通过）
6. `pnpm run release:check`（通过）
7. `pnpm run release:ga-check`（通过）

## 8. 执行记录

1. 2026-03-22：任务创建，状态初始化为 `planned`。
2. 2026-03-22：任务启动，状态切换为 `in_progress`，开始汇总 `TK-056/TK-057/TK-058` 证据并整理 sprint-002 输入约束。
3. 2026-03-22：产出 `DA-071` 输入约束清单，并完成 `DA-070/DA-071` 在 artifact registry 与索引台账登记。
4. 2026-03-22：完成治理脚本与综合门禁复核，任务状态切换为 `completed`。

## 9. 产出

1. `DA-070` `.repo-ai-governor/context/dev/project-006-hardening-and-release/sprint-001-contract-and-release-governance-baseline/tasks/TK-059-sprint-001-exit-acceptance-and-sprint-002-input-constraints.md`
2. `DA-071` `.repo-ai-governor/context/dev/project-006-hardening-and-release/sprint-001-contract-and-release-governance-baseline/tasks/TK-059-sprint-002-resilience-and-ga-readiness-input-constraints-checklist.md`
3. `.repo-ai-governor/context/artifact-registry/artifacts.csv`
4. `.repo-ai-governor/context/dev/project-006-hardening-and-release/sprint-001-contract-and-release-governance-baseline/review/verified_review_tk-059-sprint-001-exit-acceptance-and-sprint-002-input-constraints.md`
