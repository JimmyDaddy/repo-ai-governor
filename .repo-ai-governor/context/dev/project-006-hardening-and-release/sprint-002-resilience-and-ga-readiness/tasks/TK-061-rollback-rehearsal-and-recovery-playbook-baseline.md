# TK-061 回滚演练与恢复流程基线

- Status: completed
- Date: 2026-03-22
- Owner: AI-Agent
- Priority: P0
- Project: `project-006-hardening-and-release`
- Sprint: `sprint-002-resilience-and-ga-readiness`

## 1. 任务目标

建立 canary/rc/ga 异常场景下的回滚演练与恢复流程基线，确保发布失败后可快速恢复并保留审计证据。

## 2. Depends On

1. `TK-058`
2. `TK-060`
3. `DA-069`
4. `DA-072`

## 3. 预期产物

1. `DA-073` 回滚演练与恢复流程基线文档。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-006-hardening-and-release/sprint-001-contract-and-release-governance-baseline/tasks/TK-058-release-governance-and-canary-rc-ga-channel-baseline.md`
2. `.repo-ai-governor/context/dev/project-006-hardening-and-release/sprint-002-resilience-and-ga-readiness/tasks/TK-060-restricted-network-and-offline-degrade-regression-baseline.md`
3. `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`

## 5. 实施计划

1. 建立回滚触发条件、回滚步骤与恢复校验清单。
2. 建立演练证据落盘路径与审计回放要求。
3. 对齐后续 GA 联合门禁中的回滚必经检查项。

## 6. 回滚演练与恢复流程基线（DA-073）

1. 回滚触发条件（来自 release policy）
   - `critical production regression detected`
   - `release gate violation after channel promotion`
   - `incompatible contract change in lockstep group`
2. 回滚演练执行入口
   - 新增 `pnpm run release:rollback-rehearsal`，统一执行三类触发场景演练。
   - 新增脚本 `scripts/release/run-rollback-rehearsal.js`，逐场景执行并在失败时立即阻断。
3. 恢复校验清单
   - 关键发布门禁：`release:check`、`release:verify-local`、`release:ga-check`。
   - 治理总线门禁：`pnpm run check`。
4. 审计回放证据落盘
   - 演练报告：`.tmp/ci/release/rollback-rehearsal-report.json`
   - 该报告为运行态产物，不进入任务台账版本管理。
   - 结构化报告至少包含：`scenarioId`、`rollbackTrigger`、`command`、`exitCode`、`durationMs`、`generatedAt`。

## 7. 验证

1. `pnpm run release:check`
2. `pnpm run release:ga-check`
3. `pnpm run check`
4. `pnpm run release:rollback-rehearsal`

## 8. 执行记录

1. 2026-03-22：任务创建，状态初始化为 `planned`。
2. 2026-03-22：任务启动，状态切换为 `active`，开始固化 canary/rc/ga 异常场景下的回滚演练与恢复流程基线。
3. 2026-03-22：完成 `DA-073`，落地 `release:rollback-rehearsal` 与审计报告落盘路径，状态切换为 `completed`。

## 9. 产出

1. `DA-073` `.repo-ai-governor/context/dev/project-006-hardening-and-release/sprint-002-resilience-and-ga-readiness/tasks/TK-061-rollback-rehearsal-and-recovery-playbook-baseline.md`
2. `.tmp/ci/release/rollback-rehearsal-report.json`
3. `scripts/release/run-rollback-rehearsal.js`
4. `scripts/release/release-governance-policy.json`
5. `.repo-ai-governor/normative_knowledge_sources/governance/release-governance-spec.md`
6. `package.json`
