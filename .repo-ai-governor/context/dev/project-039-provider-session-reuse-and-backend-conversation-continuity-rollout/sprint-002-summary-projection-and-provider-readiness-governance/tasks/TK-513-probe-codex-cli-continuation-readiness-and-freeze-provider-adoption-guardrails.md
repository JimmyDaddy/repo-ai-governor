# TK-513 probe codex cli continuation readiness and freeze provider adoption guardrails

- Status: completed
- Date: 2026-04-04
- Owner: AI-Agent
- Priority: P1
- Project: `project-039-provider-session-reuse-and-backend-conversation-continuity-rollout`
- Sprint: `sprint-002-summary-projection-and-provider-readiness-governance`

## 1. 任务目标

探测 `Codex CLI` 是否存在正式 continuation contract，并把 `Claude remote API / Claude CLI / GitHub Copilot` 的 adoption 决策冻结为显式 provider readiness guardrail；若 contract 不成熟，系统必须诚实保持 `unsupported`。

## 2. Depends On

1. `TK-510`
2. `TK-512`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/provider-session-reuse-and-continuation-handle-seam.md`
4. `packages/adapters/codex/src/codex-agent-adapter.ts`
5. `packages/adapters/claude-code/src/claude-code-agent-adapter.ts`
6. `packages/adapters/github-copilot/src/github-copilot-agent-adapter.ts`

## 3. 预期产物

1. `Codex CLI` continuation readiness verdict
2. explicit unsupported fallback baseline for CLI/provider paths lacking official contracts
3. provider adoption guardrail matrix for `Claude / GitHub Copilot`
4. 后续 rollout 是否继续扩张的明确决策输入

## 4. 实施计划

1. 核查 `Codex CLI` 是否提供正式 continuation flag、stdin/session contract 或等价官方接缝；不存在时不得用 undocumented hack 伪造 reuse。
2. 将 `Claude remote API / Claude CLI / GitHub Copilot` 的后续 adoption 条件整理为 guardrail matrix，并对当前 runtime 行为冻结为 truthful `unsupported`。
3. 把 readiness verdict 与 follow-up recommendation 写回 sprint ledger，为是否开启下一轮 rollout 提供治理锚点。

## 5. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `pnpm run build`
4. `codex / claude-code / github-copilot` adapter smoke 与相关治理检查集合

## 6. 执行记录

1. 2026-04-04：任务创建，状态初始化为 `planned`；当前默认结论保持 `Codex CLI / Claude / GitHub Copilot` 未承诺 continuation reuse，待正式 readiness 验证后再决定是否扩张 rollout。
2. 2026-04-04：任务完成：Codex CLI、Claude CLI / remote API 与 GitHub Copilot CLI 在 continuation request 下均稳定返回显式 `unsupported`；当前 provider adoption guardrail 已冻结为“仅 Codex remote 正式复用，其余 path truthful unsupported”。
