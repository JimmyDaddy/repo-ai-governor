# TK-826 cut github-copilot onto the shared native cli_exec runtime and aligned cancellation semantics

- Status: completed
- Date: 2026-04-13
- Owner: AI-Agent
- Priority: P0
- Project: `project-098-cli-exec-runtime-rollout`
- Sprint: `sprint-002-cross-adapter-runtime-hardening-and-diagnostics-evidence`

## 1. 任务目标

让 `GitHub Copilot` 切到 shared native `cli_exec` runtime，并对齐 cancellation / terminate semantics。

## 2. Depends On

1. `TK-825`

## 3. 预期产物

1. github-copilot shared runtime cutover
2. aligned cancellation semantics
3. preserved transport truth

## 4. Required Inputs

1. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-invoke-liveness-contract.md`
2. `packages/adapters/github-copilot/src/github-copilot-agent-adapter.ts`

## 5. 实施计划

1. 统一 `GitHub Copilot` 的 process lifecycle owner 与 cancel semantics。
2. 保持 `GitHub Copilot` 自有 parser / capability / route truth，不把 shared runtime 变成新 policy owner。
3. 对齐 additive diagnostics 与 partial-output retention baseline。

## 6. Development Verification

1. `pnpm run build`
2. targeted github-copilot runtime verification

## 7. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`

## 8. 执行记录

1. 2026-04-13：任务通过 `DA-819` 创建，当前保持 `planned`，等待 `TK-825` 完成后执行。
2. 2026-04-13：随着 `TK-824` 完成，任务状态切换为 `active`；`GitHub Copilot` 已切到 shared native `cli_exec` runtime，并与 shared graceful/hard terminate 语义对齐，同时保持 adapter-owned transport truth，并已通过 `pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1` 与 `pnpm run check`；当前等待 sprint-002 delegated CR。
3. 2026-04-13：`CR-001` 已 clean 收口；`GitHub Copilot` shared runtime cutover、取消/终止语义与 additive diagnostics 仍保持 adapter-owned transport truth，本任务收口为 `completed`。
