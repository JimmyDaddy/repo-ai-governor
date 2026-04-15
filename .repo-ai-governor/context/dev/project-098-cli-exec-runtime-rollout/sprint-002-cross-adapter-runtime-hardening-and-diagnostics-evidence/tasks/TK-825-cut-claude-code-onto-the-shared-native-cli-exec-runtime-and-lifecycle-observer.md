# TK-825 cut claude-code onto the shared native cli_exec runtime and lifecycle observer

- Status: completed
- Date: 2026-04-13
- Owner: AI-Agent
- Priority: P0
- Project: `project-098-cli-exec-runtime-rollout`
- Sprint: `sprint-002-cross-adapter-runtime-hardening-and-diagnostics-evidence`

## 1. 任务目标

让 `Claude Code` 切到 shared native `cli_exec` runtime 与 lifecycle observer，同时保持 adapter parser / route truth 独立。

## 2. Depends On

1. `TK-823`

## 3. 预期产物

1. claude-code shared runtime cutover
2. lifecycle observer convergence
3. preserved parser ownership

## 4. Required Inputs

1. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/native-cli-exec-runtime-hardening-and-explicit-acp-extension-seam.md`
2. `packages/adapters/claude-code/src/claude-code-agent-adapter.ts`

## 5. 实施计划

1. 复用 shared runtime，而不复制第二套 `spawn + timeout + terminate` 逻辑。
2. 保持 `Claude Code` 自有参数 authoring、stdout/stderr parser 与 capability truth。
3. 对齐 shared lifecycle observer 与 additive diagnostics。

## 6. Development Verification

1. `pnpm run build`
2. targeted claude-code runtime verification

## 7. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`

## 8. 执行记录

1. 2026-04-13：任务通过 `DA-819` 创建，当前保持 `planned`，等待 sprint-002 激活后执行。
2. 2026-04-13：随着 `TK-824` 完成，任务状态切换为 `active`；`Claude Code` 已切到 shared native `cli_exec` runtime 与 lifecycle observer，保留 adapter-owned parser / route / capability truth，并已通过 `pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1` 与 `pnpm run check`；当前等待 sprint-002 delegated CR。
3. 2026-04-13：`CR-001` 已 clean 收口；`Claude Code` shared runtime cutover、launch diagnostics additive truth 与 hard terminate lifecycle surface 保持稳定，本任务收口为 `completed`。
