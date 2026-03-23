# TK-096 Ollama 类 adapter 与 route fallback 基线

- Status: planned
- Date: 2026-03-23
- Owner: TBD
- Priority: P0
- Project: `project-010-local-model-and-ide-expansion`
- Sprint: `sprint-001-local-model-adapter-baseline`

## 1. 任务目标

实现本地模型 adapter 基线，并打通“远端能力不可用时回退到本地模型”的路由降级链路。

## 2. Depends On

1. `TK-095`

## 3. 预期产物

1. `DA-100` Ollama 类 adapter 与 route fallback 基线产物文档。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/plan.md`
2. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-001-local-model-adapter-baseline/plan.md`
3. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-001-local-model-adapter-baseline/tasks/TK-095-local-model-adapter-contract-and-config-extension-baseline.md`
4. `.repo-ai-governor/normative_knowledge_sources/product-requirements.md`
5. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`

## 5. 实施计划

1. 新增 `packages/adapters/ollama`（或等价命名）实现 `probe/invoke/stream` 最小能力。
2. 在 route runner/registry 中接线本地模型 surface 与回退策略。
3. 对远端不可达、凭据缺失、模型不可用场景输出标准化降级语义与审计字段。
4. 补齐 adapter 层 smoke/contract 测试，确保与现有 codex/copilot/claude-code 协议一致。
5. 回写台账并登记 `DA-100`。

## 6. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `pnpm run test:packages -- packages/adapters --maxWorkers=1 --maxConcurrency=1`
4. `pnpm run check`

## 7. 执行记录

1. 2026-03-23：任务创建，状态初始化为 `planned`。

## 8. 产出

1. `DA-100` `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-001-local-model-adapter-baseline/tasks/DA-100-ollama-like-adapter-and-route-fallback-baseline.md`
2. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-001-local-model-adapter-baseline/tasks/checklist.md`
3. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-001-local-model-adapter-baseline/tasks/tasks.csv`
