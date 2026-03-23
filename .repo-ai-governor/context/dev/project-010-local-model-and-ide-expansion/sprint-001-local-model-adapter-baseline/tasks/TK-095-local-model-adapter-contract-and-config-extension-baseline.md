# TK-095 本地模型适配契约与配置扩展基线

- Status: completed
- Date: 2026-03-24
- Owner: AI-Agent
- Priority: P0
- Project: `project-010-local-model-and-ide-expansion`
- Sprint: `sprint-001-local-model-adapter-baseline`

## 1. 任务目标

补齐本地模型（Ollama 类）接入所需的 adapter 协议、配置模型与 schema 校验契约，为后续实现与门禁接线提供稳定基础。

## 2. Depends On

1. `TK-086`（`DA-098` 输入约束）

## 3. 预期产物

1. `DA-099` 本地模型适配契约与配置扩展基线产物文档。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/plan.md`
2. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-001-local-model-adapter-baseline/plan.md`
3. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-002-automation-observability-and-ga-rollout/tasks/TK-086-project-009-exit-acceptance-and-operations-feedback-loop.md`（`DA-098`）
4. `.repo-ai-governor/normative_knowledge_sources/product-requirements.md`
5. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
6. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`

## 5. 实施计划

1. 扩展 adapter 协议与 capability matrix，新增本地模型 surface 语义。
2. 扩展 `governor.yaml` 配置模型与 schema（endpoint/model/timeout/retry 等），并保证兼容现有远端 adapter 配置。
3. 明确本地模型错误映射与标准化错误码边界，禁止 native Error 漫游。
4. 补齐契约测试与配置校验测试，确保 `check` 门禁稳定。
5. 回写台账并登记 `DA-099`。

## 6. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `pnpm run test:packages -- packages/config/test --maxWorkers=1 --maxConcurrency=1`
4. `pnpm run check`

## 7. 执行记录

1. 2026-03-23：任务创建，状态初始化为 `planned`。
2. 2026-03-23：任务启动，状态切换为 `in_progress`；先执行契约层收敛（`AdapterSurface` 扩展、config/schema 校验、默认配置与测试基线），不在本任务内引入真实调用逻辑。
3. 2026-03-23：已完成第一批契约实现：新增 `ollama` surface、本地模型 `localModel` 配置契约与 schema 校验、`adapter-local-model` baseline 包与 CLI 路由/探测接线；`tsc` 与关键测试集通过。
4. 2026-03-24：补齐 `DA-099` 产物文档、台账与 artifact registry 登记，并通过 `task-ledger/sprint-plan/artifact-lifecycle` 与本任务关键测试回归，任务收尾为 `completed`。

## 8. 产出

1. `DA-099` `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-001-local-model-adapter-baseline/tasks/DA-099-local-model-adapter-contract-and-config-extension-baseline.md`
2. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-001-local-model-adapter-baseline/tasks/checklist.md`
3. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-001-local-model-adapter-baseline/tasks/tasks.csv`
