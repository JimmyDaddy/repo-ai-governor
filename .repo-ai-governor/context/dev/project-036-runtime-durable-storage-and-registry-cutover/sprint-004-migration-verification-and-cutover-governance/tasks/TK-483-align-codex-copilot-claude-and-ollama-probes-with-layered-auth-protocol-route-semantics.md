# TK-483 align codex copilot claude and ollama probes with layered auth protocol route semantics

- Status: completed
- Date: 2026-04-02
- Owner: AI-Agent
- Priority: P0
- Project: `project-036-runtime-durable-storage-and-registry-cutover`
- Sprint: `sprint-004-migration-verification-and-cutover-governance`

## 1. 任务目标

将 `Codex`、`GitHub Copilot`、`Claude Code`、`Ollama` 的 adapter-specific probe 对齐到新的 layered contract，使不同供应商可以保留底层实现差异，但输出统一的 install/auth/protocol/semantic/route-capability 诊断结果。

## 2. Depends On

1. `TK-482`

## 3. 预期产物

1. Codex 的 layered probe 实现
2. GitHub Copilot 的 layered probe 实现
3. Claude Code 的 layered probe 实现
4. Ollama 的 capability-based layered probe 对齐
5. adapter smoke / integration 回归

## 4. 实施计划

1. 将现有 CLI 文本回声 probe 改为 layered signal 生产者。
2. 保留 vendor-specific discovery/auth/session checks，但统一 result shape。
3. 把 trivial `OK` 文本差异从 hard-fail 降级为 semantic 层信号。
4. 为 auth failure、protocol failure、route-capability failure 补齐稳定 reason code。

## 5. 验证

1. adapter smoke / integration tests
2. `pnpm run build`
3. `check-task-ledger-sync`
4. `check-sprint-plan-status-sync`

## 6. 执行记录

1. 2026-04-02：任务创建，状态初始化为 `planned`；承接 Phase C adapter-specific layered probe rollout。
2. 2026-04-02：完成 adapter rollout：`Codex`、`GitHub Copilot`、`Claude Code` 与 `Ollama` probe 结果均开始返回统一 `healthCheck` payload，能够保留各自底层探测差异的同时输出一致的 layered diagnostics、route requirement 与 selected entrypoint 语义；对应 smoke 回归全部通过，任务收口为 `completed`。
