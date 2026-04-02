# Code Review: TK-485 agent invoke liveness and timeout governance promotion

- Status: resolved
- Date: 2026-04-02
- Reviewer: AI-Agent
- Task: `TK-485`
- Review Type: approved-solution promotion self-review
- Normative References:
  - `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
  - `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/technical-solution-module-registry.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`

## 1. Review Scope

1. `technical-solution.agent-invoke-liveness-and-timeout-governance` lifecycle activation metadata
2. `runtime.agent-projection` invoke-liveness contract / ADR wiring
3. `followup_required` delivery handoff 与 closeout-surface task 对齐

## 2. Findings

未发现阻断本次技术方案 promotion 的问题。

## 3. Notes

1. 这次 promotion 不是新建模块，而是把新的 invoke liveness / timeout governance 方案正式并入现有 `runtime.agent-projection` 模块。
2. 该方案当前采用 `followup_required` + `rollout_status=planned`，表示 formal docs 已激活，但真实 runtime rollout 仍需在后续任务中将 idle watchdog、semantic watchdog、graceful interrupt 与 hard-timeout fuse 落到各 adapter/runtime。
3. `hard timeout` 在 formal contract 中已被明确降级为最后保险丝；system heartbeat 不再允许作为 transport 或 semantic 续命信号。

## 4. Verification

1. `node ./scripts/governance/check-technical-solution-lifecycle-registry.js`
2. `node ./scripts/governance/check-technical-solution-delivery-registry.js`
3. `node ./scripts/governance/check-technical-solution-module-graph.js`
4. `node ./scripts/governance/check-normative-loading-manifest.js --mode block`
5. `node ./scripts/governance/check-docs-triad-sync.js`
6. `node ./scripts/governance/check-task-ledger-sync.js`
7. `node ./scripts/governance/check-sprint-plan-status-sync.js`
8. `node ./scripts/governance/check-code-review-status-sync.js`
9. `node ./scripts/governance/check-artifact-registry-lifecycle.js`
