# TK-097 本地模型诊断校验与受限网络演练基线

- Status: completed
- Date: 2026-03-24
- Owner: AI-Agent
- Priority: P0
- Project: `project-010-local-model-and-ide-expansion`
- Sprint: `sprint-001-local-model-adapter-baseline`

## 1. 任务目标

将本地模型路径接入 `doctor/verify` 与受限网络演练，形成可诊断、可阻断、可回放的运行时门禁基线。

## 2. Depends On

1. `TK-095`
2. `TK-096`

## 3. 预期产物

1. `DA-101` 本地模型诊断校验与受限网络演练基线产物文档。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/plan.md`
2. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-001-local-model-adapter-baseline/plan.md`
3. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-001-local-model-adapter-baseline/tasks/TK-095-local-model-adapter-contract-and-config-extension-baseline.md`
4. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-001-local-model-adapter-baseline/tasks/TK-096-ollama-like-adapter-and-route-fallback-baseline.md`
5. `.repo-ai-governor/normative_knowledge_sources/product-requirements.md`
6. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`

## 5. 实施计划

1. 在 `doctor --adapters` 增加本地模型健康检查、配置提示与 `safe_local` 修复边界说明。
2. 在 `verify --adapters` 增加本地模型角色可用性判定并输出 `pass/warn/fail`。
3. 增加 restricted network 演练脚本与集成测试，验证远端失败时本地路径可接管。
4. 增加失败归因字段（环境前置/配置缺失/模型不可用/能力不足）并接入报告回链。
5. 回写台账并登记 `DA-101`。

## 6. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `pnpm run test:packages -- apps/cli/test --maxWorkers=1 --maxConcurrency=1`
4. `pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`
5. `pnpm run check`

## 7. 执行记录

1. 2026-03-23：任务创建，状态初始化为 `planned`。
2. 2026-03-24：任务启动，状态切换为 `in_progress`；当前按 `TK-096/DA-100` 作为唯一实现输入，优先补齐本地模型失败归因、safe_local 边界说明与 restricted network CLI 演练链路。
3. 2026-03-24：完成本地模型失败归因、`doctor` safe_local 边界产物一致性、restricted-network CLI rehearsal 与 resilience regression 场景接线，并生成 `DA-101` 与 resolved review；任务状态更新为 `completed`。
4. 2026-03-24：复核 follow-up CR 后，已修正 restricted fallback 绕过 capability gate 与 `doctor --fix` 无 adapters 不落 diagnostics 的问题，并将 follow-up CR 收尾为 `resolved`。

## 8. 产出

1. `DA-101` `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-001-local-model-adapter-baseline/tasks/DA-101-local-model-diagnostics-and-restricted-network-rehearsal-baseline.md`
2. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-001-local-model-adapter-baseline/tasks/checklist.md`
3. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-001-local-model-adapter-baseline/tasks/tasks.csv`
