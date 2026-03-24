# TK-108 黑盒 E2E、CI/release gate 与 GA 指标收口

- Status: in_progress
- Date: 2026-03-24
- Owner: AI-Agent
- Priority: P0
- Project: `project-010-local-model-and-ide-expansion`
- Sprint: `sprint-003-delivery-ide-and-ga-hardening`

## 1. 任务目标

覆盖 Stage 9 主路径与降级路径的黑盒验证、CI/release gate 与 GA 指标沉淀，形成可运营稳定性基线。

## 2. Depends On

1. `TK-102`
2. `TK-107`

## 3. 预期产物

1. `DA-108` 黑盒 E2E、CI/release gate 与 GA 指标收口产物文档。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/plan.md`
2. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-003-delivery-ide-and-ga-hardening/plan.md`
3. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-003-delivery-ide-and-ga-hardening/tasks/TK-107-controlled-delivery-rehearsal-and-audit-replay-integration.md`
4. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`
5. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
6. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`

## 5. 实施计划

1. 为 provider outage、restricted network、retry exhaustion、fallback success/failure 等场景建立黑盒 E2E。
2. 将关键黑盒场景接入 CI 与 release gate，明确 blocking 语义。
3. 沉淀 Stage 9 GA 指标：`time_to_first_success`、`unattended_success_rate`、`human_intervention_rate`、`fallback_rate`、`delivery_rehearsal_pass_rate`。
4. 补齐报告与审计回链，回写 `DA-108`。
5. 同步台账与 artifact registry。

## 6. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`
4. `pnpm run release:ga-check`
5. `pnpm run check`

## 7. 执行记录

1. 2026-03-24：任务创建，状态初始化为 `planned`。
2. 2026-03-24：任务启动，已将 `DA-107` 固化为 delivery rehearsal 输入基线；下一步聚焦 blackbox/CI/release/GA 指标的场景矩阵与 gate 接线。

## 8. 产出

1. `DA-108` `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-003-delivery-ide-and-ga-hardening/tasks/DA-108-unattended-blackbox-ga-metrics-and-release-gate-hardening.md`
2. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-003-delivery-ide-and-ga-hardening/tasks/checklist.md`
3. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-003-delivery-ide-and-ga-hardening/tasks/tasks.csv`
