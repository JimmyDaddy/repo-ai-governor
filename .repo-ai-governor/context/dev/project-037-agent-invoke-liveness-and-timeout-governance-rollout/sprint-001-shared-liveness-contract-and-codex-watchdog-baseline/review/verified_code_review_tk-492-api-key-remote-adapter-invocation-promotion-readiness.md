# Code Review: TK-492 api-key remote adapter invocation promotion readiness

- Status: verified
- Date: 2026-04-02
- Reviewer: AI-Agent
- Task: `TK-492`
- Review Type: prepare-promotion readiness review
- Normative References:
  - `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
  - `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/technical-solution-module-registry.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`

## 1. Review Scope

1. `.repo-ai-governor/draft/api-key-remote-adapter-invocation-technical-solution.md` 的 promotion-readiness
2. `runtime.agent-projection` 模块归属、package ownership 与 consumer contract delta
3. follow-up delivery mapping 与 formal cutover 边界

## 2. Findings

未发现继续阻断本次 `prepare-promotion` 的 draft 结构性问题。

## 3. Notes

1. 这次窗口只完成 promotion readiness，不执行 formal docs materialization，因此 lifecycle 仅登记为 `review_pending`。
2. 该方案当前最合理的归属仍是 `runtime.agent-projection` follow-up technical solution，而不是新建独立 module。
3. `adapter-sdk` 应保持 provider-neutral；OpenAI / Anthropic / GitHub Models 的 vendor binding 更适合 colocate 在各自 `packages/adapters/*` package 内。
4. 真正 promotion 时，至少需要同步 producer module overview、相关 contracts、delivery handoff 与 follow-up rollout ownership。

## 4. Promotion Plan

1. Recommended target module: `runtime.agent-projection`
2. Recommended delivery mode: `followup_required`
3. Recommended follow-up rollout owner: `project-037 / sprint-002-cross-adapter-liveness-rollout-and-diagnostics`
4. Recommended formal doc path family:
   - `runtime-agent-projection/module-overview.md`
   - `runtime-agent-projection/contracts/agent-onboarding-contract.md`
   - `runtime-agent-projection/contracts/agent-projection-contract.md`
   - `runtime-agent-projection/contracts/adapter-health-and-route-probe-contract.md`
   - `runtime-agent-projection/contracts/agent-invoke-liveness-contract.md`（仅在采纳 liveness delta 时）
   - `runtime-agent-projection/adrs/remote-api-transport-and-provider-binding-seam.md`

## 5. Verification

1. `/opt/homebrew/bin/node ./scripts/governance/check-technical-solution-lifecycle-registry.js`
2. `/opt/homebrew/bin/node ./scripts/governance/check-task-ledger-sync.js`
3. `/opt/homebrew/bin/node ./scripts/governance/check-sprint-plan-status-sync.js`
4. `/opt/homebrew/bin/node ./scripts/governance/check-code-review-status-sync.js`
5. docs-only readiness window；未修改 `apps/**`、`packages/**`、`bin/**`、`test/**`，因此 `pnpm run build` not required

## 复核结论（2026-04-03）

- 整体结论：**认可**

### 逐条复核
1. `## 2. Findings`
   - 判定：**认可**
   - 证据：当前 `technical-solution.api-key-remote-adapter-invocation` 已在 `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml` 中处于 `active`，对应 delivery handoff 已登记在 `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`，且正式 ADR `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/remote-api-transport-and-provider-binding-seam.md` 已存在。说明本报告当时给出的“无继续阻断 prepare-promotion 的结构性问题”判断成立，后续 formal cutover 也已按预期落地。
   - 处理：将该 readiness review 从 `review_pending` 推进为 `verified`；formal promotion 与交付闭环继续以 `TK-500` / `DA-500` / sprint-002 rollout 记录为准。

### 验证命令
1. `PATH="/Users/jimmydaddy/Library/pnpm:/opt/homebrew/bin:$PATH" /opt/homebrew/bin/node ./scripts/governance/check-technical-solution-lifecycle-registry.js`（通过）
2. `PATH="/Users/jimmydaddy/Library/pnpm:/opt/homebrew/bin:$PATH" /opt/homebrew/bin/node ./scripts/governance/check-task-ledger-sync.js`（通过）
3. `PATH="/Users/jimmydaddy/Library/pnpm:/opt/homebrew/bin:$PATH" /opt/homebrew/bin/node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
