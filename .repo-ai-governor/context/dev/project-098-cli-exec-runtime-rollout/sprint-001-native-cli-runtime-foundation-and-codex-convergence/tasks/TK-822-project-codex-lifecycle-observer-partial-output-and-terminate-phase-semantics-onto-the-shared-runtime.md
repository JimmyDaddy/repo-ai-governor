# TK-822 project codex lifecycle observer partial-output and terminate-phase semantics onto the shared runtime

- Status: planned
- Date: 2026-04-13
- Owner: AI-Agent
- Priority: P0
- Project: `project-098-cli-exec-runtime-rollout`
- Sprint: `sprint-001-native-cli-runtime-foundation-and-codex-convergence`

## 1. 任务目标

将 `Codex` 已有的 lifecycle observer、partial-output checkpoint 与 `terminate_phase` 语义投影到 shared runtime，证明它们不再是单 adapter 特例。

## 2. Depends On

1. `TK-821`

## 3. 预期产物

1. shared lifecycle observer baseline
2. codex liveness convergence
3. partial snapshot preservation truth

## 4. Required Inputs

1. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-invoke-liveness-contract.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/agent-invoke-liveness-and-timeout-governance.md`
3. `packages/adapters/codex/src/codex-agent-adapter.ts`

## 5. 实施计划

1. 让 shared runtime 正式产出 lifecycle event / snapshot，而不是只返回终态 process result。
2. 通过 parser-side `markSemanticProgress()` 保持 semantic progress owner 在 adapter。
3. 证明 `graceful_interrupting / hard_terminating` 与 partial snapshot 可以跨 adapter 复用。

## 6. Development Verification

1. `pnpm run build`
2. targeted codex runtime and liveness regression verification

## 7. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`

## 8. 执行记录

1. 2026-04-13：任务通过 `DA-819` 创建，当前保持 `planned`，等待 `TK-821` 完成后执行。
