# TK-822 project codex lifecycle observer partial-output and terminate-phase semantics onto the shared runtime

- Status: completed
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
2. 2026-04-13：任务状态切换为 `active`；已将 `Codex` 的 streaming / non-streaming CLI 执行切到 shared runtime，同时保留 adapter parser-side semantic progress owner，并把 `graceful_interrupting` / `hard_terminating` / partial snapshot preservation 继续投影到现有 liveness contract。
3. 2026-04-13：已通过 `pnpm run build` 与 Codex/adapter-sdk focused smoke + unit suite；当前等待 sprint-001 delegated CR 对 lifecycle observer 收敛与 terminate-phase 语义做 clean recheck。
4. 2026-04-13：`CR-001` resolved 后，reviewer 未对 `Codex` lifecycle observer、partial snapshot preservation 或 terminate-phase 投影提出新增 actionable finding；当前 boundary 已通过 `pnpm run build`、focused Codex/runtime suite、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1` 与 `pnpm run check` 复核，任务收口为 `completed`。
