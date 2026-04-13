# TK-823 preserve adapter-owned entrypoint shell and process-tree policies while adding baseline launch diagnostics

- Status: planned
- Date: 2026-04-13
- Owner: AI-Agent
- Priority: P0
- Project: `project-098-cli-exec-runtime-rollout`
- Sprint: `sprint-001-native-cli-runtime-foundation-and-codex-convergence`

## 1. 任务目标

在 shared runtime 收敛的同时，保住 adapter-owned `entrypoint / shell / process-tree` authoring boundary，并补齐 baseline launch diagnostics。

## 2. Depends On

1. `TK-822`

## 3. 预期产物

1. adapter-owned launch ownership guardrail
2. baseline additive diagnostics
3. no-god-object runtime boundary

## 4. Required Inputs

1. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/adapter-health-and-route-probe-contract.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/native-cli-exec-runtime-hardening-and-explicit-acp-extension-seam.md`
3. `packages/adapters/claude-code/src/claude-code-agent-adapter.ts`
4. `packages/adapters/github-copilot/src/github-copilot-agent-adapter.ts`

## 5. 实施计划

1. 让 `entrypoint_resolution / shell_wrapped / process_tree_policy / spawn_error_code` 成为 additive diagnostics，而不是新的 minimum fields。
2. 避免 shared runtime 吞掉 shell wrapping、entrypoint fallback 与 route policy owner。
3. 为 sprint-002 的跨 adapter cutover 冻结统一 diagnostics baseline。

## 6. Development Verification

1. `pnpm run build`
2. targeted diagnostics and adapter runtime verification

## 7. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`

## 8. 执行记录

1. 2026-04-13：任务通过 `DA-819` 创建，当前保持 `planned`，等待 `TK-822` 完成后执行。
