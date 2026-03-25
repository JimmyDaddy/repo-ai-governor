# TK-062 GA 候选联合门禁（契约+稳定性+发布）基线

- Status: completed
- Date: 2026-03-22
- Owner: AI-Agent
- Priority: P0
- Project: `project-006-hardening-and-release`
- Sprint: `sprint-002-resilience-and-ga-readiness`

## 1. 任务目标

建立 GA 候选联合门禁，将契约测试、稳定性回归、发布治理与回滚约束收敛为统一准入检查。

## 2. Depends On

1. `TK-060`
2. `TK-061`
3. `DA-072`
4. `DA-073`

## 3. 预期产物

1. `DA-074` GA 候选联合门禁基线文档。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-006-hardening-and-release/sprint-002-resilience-and-ga-readiness/tasks/TK-060-restricted-network-and-offline-degrade-regression-baseline.md`
2. `.repo-ai-governor/context/dev/project-006-hardening-and-release/sprint-002-resilience-and-ga-readiness/tasks/TK-061-rollback-rehearsal-and-recovery-playbook-baseline.md`
3. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`（`4.8`）

## 5. 实施计划

1. 收敛 GA 前必须通过的契约、稳定性、发布与回滚检查项。
2. 定义统一执行命令与失败阻断语义。
3. 输出可审计、可回放、可复现实验记录模板。

## 6. GA 候选联合门禁基线（DA-074）

1. 联合门禁入口
   - 新增 `pnpm run release:ga-candidate-unified-gate`。
   - 新增脚本 `scripts/release/check-ga-candidate-unified-gate.js` 作为统一执行器。
2. 联合校验分组
   - `contract-baseline`：`test:contract`
   - `resilience-regression`：`test:resilience`
   - `integration-regression`：`test:integration`
   - `e2e-regression`：`test:e2e`
   - `release-ga-check`：`release:ga-check`
   - `rollback-rehearsal`：`release:rollback-rehearsal`
   - `governance-gate`：`check`
3. 失败阻断语义
   - 任一分组失败立即返回非零退出码，阻断 GA 候选推进。
4. 审计回放模板
   - 报告文件：`.tmp/ci/release/ga-candidate-unified-gate-report.json`
   - 该报告为运行态产物，不进入任务台账版本管理。
   - 报告字段：`stepId`、`command`、`exitCode`、`durationMs`、`generatedAt`。

## 7. 验证

1. `pnpm run check`
2. `pnpm run release:ga-check`
3. `pnpm run release:ga-candidate-unified-gate`

## 8. 执行记录

1. 2026-03-22：任务创建，状态初始化为 `planned`。
2. 2026-03-22：任务启动，状态切换为 `active`，开始收敛 GA 候选联合门禁执行器与审计报告模板。
3. 2026-03-22：完成 `DA-074`，落地 `release:ga-candidate-unified-gate` 并完成门禁验证，状态切换为 `completed`。

## 9. 产出

1. `DA-074` `.repo-ai-governor/context/dev/project-006-hardening-and-release/sprint-002-resilience-and-ga-readiness/tasks/TK-062-ga-candidate-unified-gate-baseline.md`
2. `.tmp/ci/release/ga-candidate-unified-gate-report.json`
3. `scripts/release/check-ga-candidate-unified-gate.js`
4. `scripts/release/release-governance-policy.json`
5. `.repo-ai-governor/normative_knowledge_sources/governance/release-governance-spec.md`
6. `package.json`
