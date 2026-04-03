# TK-489 align ollama local-model and long-operation progress protections with invoke liveness governance

- Status: completed
- Date: 2026-04-02
- Owner: AI-Agent
- Priority: P1
- Project: `project-037-agent-invoke-liveness-and-timeout-governance-rollout`
- Sprint: `sprint-002-cross-adapter-liveness-rollout-and-diagnostics`

## 1. 任务目标

将 `Ollama / local-model` 当前已支持的 streaming、content 与 `done_reason` 映射到 shared invoke-liveness governance，并为长等待阶段补齐 progress protection。

## 2. Depends On

1. `TK-486`
2. `packages/adapters/local-model/src/local-model-agent-adapter.ts`

## 3. 预期产物

1. Ollama / local-model invoke-liveness rollout
2. `content/done/done_reason` 到 shared state machine 的映射
3. 长 stream idle 保护与 local-model timeout budget baseline
4. local-model 特定 timeout budget baseline
5. partial-output 与 graceful interrupt 兼容策略

## 4. 实施计划

1. 将 Ollama streaming `content / done / done_reason` 映射到 transport activity 与 semantic progress。
2. 为 local-model surface 补齐无新 token 阶段的长操作 progress 保护。
3. 保证 `done` / `done_reason`、manual abort 与 hard-timeout fuse 的终态分类一致。
4. 补齐 local-model 定向回归与 shared diagnostics 对齐验证。

## 5. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `pnpm run build`
4. `local-model adapter` 相关定向测试集合

## 6. 执行记录

1. 2026-04-02：任务创建，状态初始化为 `planned`。
2. 2026-04-03：任务激活，开始为 `Ollama / local-model` 补齐 shared `invokeLiveness` snapshot、stream idle progress protection、timeout budget 终态分类与 partial-output preservation。
3. 2026-04-03：完成收口：`local-model` stream 现已 materialize shared `invokeLiveness` snapshot、`transportKind=baseline`、`content/done/done_reason` 投影、长 idle progress 事件、覆盖整个 body consumption 的 timeout budget 与 partial-output preservation/abort semantics；当前 surface 仍保持 `TOOL_CALLING=UNSUPPORTED`，因为上游协议没有结构化 `thinking/tool_call` 事件源。定向 smoke、`pnpm run build`、`check-task-ledger-sync` 与 `check-sprint-plan-status-sync` 通过，任务标记 `completed`。
