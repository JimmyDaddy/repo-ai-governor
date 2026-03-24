# TK-096 Ollama 类 adapter 与 route fallback 基线

- Status: completed
- Date: 2026-03-24
- Owner: AI-Agent
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
2. 2026-03-24：任务启动，状态切换为 `in_progress`；当前按 `DA-099` 既有契约接入真实 Ollama 类 probe/invoke，并将 restricted fallback 从占位输出升级为真实本地模型调用路径。
3. 2026-03-24：已完成真实 Ollama 类 `probe/invoke`、retry/timeout 基线、CLI 自动追加 `ollama` fallback candidate、restricted fallback handler 本地模型接线，以及本地模型故障语义的人类可读诊断文案。
4. 2026-03-24：补齐 `DA-100`、artifact registry、resolved review 与任务台账同步，并通过 `tsc`、`packages/adapters`、CLI 集成与总门禁回归，任务收尾为 `completed`。
5. 2026-03-24：根据 follow-up CR 修正本地模型 capability matrix 与 endpoint-first probe 语义，避免将 `tool_calling` / `structured_output` / `confirmation_gate` 误报为已支持，并补齐确定性回归测试后保持 `completed`。

## 8. 产出

1. `DA-100` `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-001-local-model-adapter-baseline/tasks/DA-100-ollama-like-adapter-and-route-fallback-baseline.md`
2. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-001-local-model-adapter-baseline/tasks/checklist.md`
3. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-001-local-model-adapter-baseline/tasks/tasks.csv`
