# TK-488 align claude-code and github-copilot with shared invoke liveness contract

- Status: planned
- Date: 2026-04-02
- Owner: AI-Agent
- Priority: P0
- Project: `project-037-agent-invoke-liveness-and-timeout-governance-rollout`
- Sprint: `sprint-002-cross-adapter-liveness-rollout-and-diagnostics`

## 1. 任务目标

让 `Claude Code` 与 `GitHub Copilot` invoke 路径共享 `contract.runtime.agent-invoke-liveness.v1` 的状态机、reason code、budget 与 partial-output 语义。

## 2. Depends On

1. `TK-486`
2. `TK-487`
3. `packages/adapters/claude-code/src/claude-code-agent-adapter.ts`
4. `packages/adapters/github-copilot/src/github-copilot-agent-adapter.ts`

## 3. 预期产物

1. Claude Code invoke-liveness rollout
2. GitHub Copilot invoke-liveness rollout
3. shared reason code / timeout budget 映射
4. partial-output preservation 与 graceful interrupt 对齐
5. cross-adapter diagnostics 一致性 baseline

## 4. 实施计划

1. 将 Claude Code 的 `stream-json` / partial message / hook event 信号映射到 shared runtime。
2. 将 GitHub Copilot 的 CLI 事件、auth/protocol 运行态与 assistant output 映射到同一状态机。
3. 统一 stalled / timeout / graceful interrupt / hard terminate 的 reason code 与前台可见诊断。
4. 补齐两条 adapter 的定向测试与 failure-classification 验证。

## 5. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `pnpm run build`
4. `claude-code + github-copilot adapter` 相关定向测试集合

## 6. 执行记录

1. 2026-04-02：任务创建，状态初始化为 `planned`。
