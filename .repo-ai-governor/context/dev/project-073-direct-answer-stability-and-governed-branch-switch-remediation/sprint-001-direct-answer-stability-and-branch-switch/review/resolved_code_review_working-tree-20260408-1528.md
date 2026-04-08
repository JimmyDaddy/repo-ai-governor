# Code Review: TK-714 direct-answer stability hardening round 1

- Status: resolved
- Date: 2026-04-08
- Reviewer: AI-Agent
- Task: `TK-714`
- Review Type: delegated task review
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/execution-gate-layering-spec.md`
  - `.codex/skills/workspace-code-review-workflow/SKILL.md`
  - `.codex/skills/workspace-delivery-finisher/SKILL.md`

## 1. Review Scope
1. `apps/cli/src/runtime/session-main-supervisor-runtime.ts`
2. `packages/adapters/codex/src/codex-agent-adapter.ts`
3. `apps/cli/test/runtime/session-main-supervisor-runtime.test.ts`
4. `packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts`

## 2. Findings
### 2.1 [P1] direct-answer fallback can suppress the recovered answer after a failed surface already streamed partial tokens
- 位置: `apps/cli/src/runtime/session-main-supervisor-runtime.ts:333-338,388-407,500-514`
- 问题描述: 本轮 fresh reviewer 识别出 direct-answer fallback loop 早先把 `relayState` 放在整个 retry loop 外层复用。一旦首个 surface 已经输出 partial token 后又在 invoke 阶段失败，后续 fallback surface 即使成功返回完整答案，只要它自己没有新的 token 事件，成功路径仍会因为沿用了前一轮的 `sawToken=true` 而跳过 `publishAssistantTokenStream`。这会让前台停留在失败 surface 的半截草稿，而不是恢复后的最终答案。
- 影响: 这是用户可见的恢复路径回归。`TK-714` 新增的 invoke fallback 本来是为了减少“回答失败”，但如果恢复答案未被重新推送到前台，用户仍会看到错误或不完整输出，等价于把恢复逻辑做成了后台成功、前台失败。
- 建议: 将 direct-answer retry 的 relay state 改为 per-attempt 隔离，只使用成功 surface 的 relay state 决定是否补发 `publishAssistantTokenStream`；并补一条覆盖“partial token -> invoke failure -> fallback success without tokens”路径的回归测试。

## 3. Notes
1. 该 finding 由 delegated reviewer 先发现，属于 fallback 可见性回归的 risk-based finding。
2. Codex watchdog 阈值扩大本轮没有发现直接错误，但仍建议后续结合真实长会话继续观察。

## 4. Verification
1. `pnpm exec vitest run apps/cli/test/runtime/session-main-supervisor-runtime.test.ts packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts apps/cli/test/runtime/session-shell-turn-progress-dock.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `pnpm run build`（通过）

## 复核结论（2026-04-08）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：主 agent 复核确认该风险成立。旧实现把 `relayState` 声明在 direct-answer retry loop 外层，并在成功路径统一用同一个 `sawToken` gate 决定是否补发 `publishAssistantTokenStream`。因此首个 surface 只要先输出 partial token 再失败，就会污染后续 fallback 成功路径的前台 token 判定。
   - 处理：已接受并在同一变更集中修复为 per-attempt relay state，同时补充“partial token -> invoke failure -> fallback success without tokens”回归测试。

### 验证命令
1. `pnpm exec vitest run apps/cli/test/runtime/session-main-supervisor-runtime.test.ts packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts apps/cli/test/runtime/session-shell-turn-progress-dock.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `pnpm run build`（通过）

### 风险与后续
1. Codex watchdog 阈值扩大本轮主要由 targeted smoke 和静态复核支撑，后续仍建议结合真实长会话观察。

## 修复执行记录（2026-04-08）

1. `2.1`：已完成
   - 变更文件：`apps/cli/src/runtime/session-main-supervisor-runtime.ts`、`apps/cli/test/runtime/session-main-supervisor-runtime.test.ts`
   - 验证：`pnpm exec vitest run apps/cli/test/runtime/session-main-supervisor-runtime.test.ts packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts apps/cli/test/runtime/session-shell-turn-progress-dock.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）；`pnpm run build`（通过）
   - 说明：direct-answer retry 现在为每个 attempt 单独维护 relay state，只让成功 surface 的 relay 结果决定是否补发前台 token；同时新增 partial-token fallback 回归测试，锁住这条恢复链路。

## 处置结果与剩余风险
1. delegated reviewer 本轮提出的 actionable finding 已全部完成处理，`CR-001` 可收口为 `resolved`。
2. 剩余风险：watchdog 阈值扩大仍建议结合真实长会话继续观察，但当前 targeted tests、smoke tests 与 build 证据未发现新增回归。
