# Technical Solution Review

- Status: approved
- Date: 2026-04-22
- Solution ID: `technical-solution.vscode-direct-workbench-orchestration-runtime-hitl`
- Draft Path: `.repo-ai-governor/draft/vscode-direct-workbench-orchestration-runtime-hitl-technical-solution.md`
- Reviewer: `AI-Agent`
- Verdict: `approved`
- Related Lifecycle Entry: `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`

## Review Scope

1. Review mode: `review-draft-solution`
   - local review only
   - the user asked to continue `technical-solution-review` but did not request delegated sub-agent rounds
2. Target modules:
   - `runtime.governance-clients`
   - `runtime.orchestration`
3. Primary comparison surfaces:
   - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
   - `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/technical-solution-module-registry.yaml`
   - `.repo-ai-governor/draft/vscode-full-governance-workbench-and-task-driven-orchestration-technical-solution.md`
   - `.repo-ai-governor/draft/approved_solution_review_vscode-full-governance-workbench-and-task-driven-orchestration.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/module-overview.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/governance-surface-client-contract.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/vscode-governance-workbench-surface-contract.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/vscode-primary-full-governance-workbench.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/module-overview.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/contracts/governance-workbench-aggregation-facade-contract.md`
   - `.repo-ai-governor/normative_knowledge_sources/governance/risk-facts-and-hitl-sla-contract.md`
   - `apps/vscode-extension/README.md`
   - `apps/vscode-extension/src/runtime/vscode-extension-workflow-studio-provider.ts`
   - `apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts`
   - `apps/vscode-extension/src/types/interfaces/vscode-extension-surface.interface.ts`
4. Canonical artifact path:
   - `.repo-ai-governor/draft/approved_solution_review_vscode-direct-workbench-orchestration-runtime-hitl.md`
5. Review path decision:
   - `current-context.md` 当前为 `idle`，没有 active primary stream 可承载新的 solution review artifact
   - 因此本轮沿用 draft 邻接的单一 canonical artifact path，并在同一 review window 内收口为 `approved`
6. Approval focus:
   - 这份新方案是否是现有 active VS Code full-workbench 方案的实现型 follow-up，而不是竞争性替代
   - draft 的问题陈述是否与当前插件代码真值一致，而不是和既有 support docs 混淆
   - workflow draft session 是否足够避免 extension-local shadow state
   - hitl decision packet 是否完整复用 risk facts / SLA contract
   - promotion 是否已经明确要回写现有 `vscode-governance-workbench-surface` 与 `governance-workbench-aggregation-facade` contract

## Reviewer Round

1. Local review round: `round-1-baseline`
   - verdict: `changes_required`
   - outcome: returned `3` blocking findings focused on workflow draft revision semantics, HITL decision-packet contract reuse, and promotion-time contract/public-truth freeze
2. Main-agent remediation:
   - accepted all `3` blocking findings
   - revised the draft in the same review window before approval
3. Local recheck round: `round-2-post-fix`
   - outcome: no actionable blocker remained

## Blocking Findings

1. None. 本轮批准前复核未发现剩余阻断性问题；上一轮 blocking findings 已全部收口。

## Disposition Of Prior Blocking Findings

1. `[resolved 2026-04-22]` workflow draft session 缺少 revision/base-token/concurrency freeze，promotion 后容易重新长出 extension-local shadow state。
   - Updated draft evidence:
     - `.repo-ai-governor/draft/vscode-direct-workbench-orchestration-runtime-hitl-technical-solution.md:193`
     - `.repo-ai-governor/draft/vscode-direct-workbench-orchestration-runtime-hitl-technical-solution.md:207`
   - Runtime/code evidence:
     - `apps/vscode-extension/src/runtime/vscode-extension-workflow-studio-provider.ts:10`
     - `apps/vscode-extension/src/runtime/vscode-extension-workflow-studio-provider.ts:60`
     - `apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts:630`
     - `apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts:662`
     - `apps/vscode-extension/src/types/interfaces/vscode-extension-surface.interface.ts:253`
   - Approval note:
     - draft 现在明确冻结了 `draft_revision / base_definition_revision / supported_patch_ops[] / conflict_state`
     - `updateWorkflowDraft*` mutation 也已要求显式携带 base token，并由 service 返回新的 revision 与 conflict signal，足以支撑“插件只发 patch、不持有 canonical state”的边界

2. `[resolved 2026-04-22]` HITL decision packet 原先没有明确要求完整复用 risk facts / SLA contract，存在被 UI summary 化的风险。
   - Updated draft evidence:
     - `.repo-ai-governor/draft/vscode-direct-workbench-orchestration-runtime-hitl-technical-solution.md:234`
     - `.repo-ai-governor/draft/vscode-direct-workbench-orchestration-runtime-hitl-technical-solution.md:255`
   - Normative evidence:
     - `.repo-ai-governor/normative_knowledge_sources/governance/risk-facts-and-hitl-sla-contract.md:13`
     - `.repo-ai-governor/normative_knowledge_sources/governance/risk-facts-and-hitl-sla-contract.md:39`
     - `.repo-ai-governor/normative_knowledge_sources/governance/risk-facts-and-hitl-sla-contract.md:46`
     - `.repo-ai-governor/normative_knowledge_sources/governance/risk-facts-and-hitl-sla-contract.md:60`
   - Approval note:
     - draft 现在显式要求保留 `risk_id / risk_category / risk_level / evidence / change_scope / confidence / trigger_rule`
     - 还补上了 `default_timeout_action`，与既有 `confirm/escalate -> timeout default block` 的 SLA 事实一致

3. `[resolved 2026-04-22]` promotion delta 原先不够具体，容易在 formalization 时只加代码接口、不回写现有 active contract，而且还可能误伤当前已经激活的 built-source `primary_workbench_claim` truth。
   - Updated draft evidence:
     - `.repo-ai-governor/draft/vscode-direct-workbench-orchestration-runtime-hitl-technical-solution.md:270`
     - `.repo-ai-governor/draft/vscode-direct-workbench-orchestration-runtime-hitl-technical-solution.md:279`
   - Normative evidence:
     - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/vscode-governance-workbench-surface-contract.md:12`
     - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/vscode-governance-workbench-surface-contract.md:48`
     - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/contracts/governance-workbench-aggregation-facade-contract.md:12`
     - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/contracts/governance-workbench-aggregation-facade-contract.md:23`
     - `apps/vscode-extension/README.md:9`
     - `apps/vscode-extension/README.md:13`
     - `apps/vscode-extension/README.md:87`
     - `apps/vscode-extension/README.md:123`
   - Approval note:
     - draft 现在明确把自己定义为 active full-workbench 方向的 implementation follow-up，而不是竞争性替代
     - promotion 也已被要求把 `workflow_draft_session / role_lane_status / session_continuity / hitl_decision_packet / workflow_mutation` materialize 到 formal contract
     - 同时冻结了“不能回退已激活的 built-source primary-workbench truth，只能为更强的 direct authoring / runtime-lanes / decision-cockpit claim 增补证据”

## Non-Blocking Suggestions

1. None. 本轮 review 没有剩余需要阻止批准的建议项；余下事项均已转为 promotion interlocks。

## Promotion Interlocks

1. promotion 必须把新增 seam 写回现有 active contract，而不是只在实现代码或 README 中出现方法名：
   - `runtime-governance-clients` 需要 formalize 可稳定映射 `workflow_draft_session / runtime_lane_status / hitl_decision_packet` 的 surface capability
   - `runtime-orchestration` 需要 formalize `workflow_draft_session / role_lane_status / session_continuity / hitl_decision_packet / workflow_mutation` 的 aggregation seam
2. promotion 必须保留这份方案是 `technical-solution.vscode-full-governance-workbench-and-task-driven-orchestration` 的 follow-up，而不是对其做隐式 supersede；如果未来要替换那条 active solution，必须单独提交 replacement / supersede decision。
3. 当前 built-source checkout 的 `primary_workbench_claim` 与 workflow-authoring 支持口径已经是 active truth；promotion 不得回退这条事实。只有更强的“direct graph authoring / runtime lanes / HITL decision cockpit” claim 仍需继续 evidence-gated。
4. lifecycle 在本 review workflow 中只推进到 `approved`；`final_paths` 必须继续留空，直到后续 `technical-solution-promotion` 完成 formal cutover。

## Main-Agent Recheck

1. `[resolved]` 这份方案保留了清晰的 follow-up 身份。
   - draft 明确不 supersede 既有 active full-workbench 方案，适合作为实现型补充 solution id 单独存在。
2. `[resolved]` draft 的问题陈述与当前插件代码真值一致。
   - 当前 `Workflow Studio` provider 与 snapshot 仍是 evidence-only / service-backed 形态，还没有 direct draft-session authoring、runtime lanes、decision packet 这组 DTO surface。
3. `[resolved]` 关键边界已经 promotion-ready。
   - workflow authoring 的 revision/concurrency 语义、risk facts/SLA contract 复用、以及现有 active contract 的扩展点都已经写清。

## Verification

1. Review baseline built from:
   - target draft
   - lifecycle registry entry
   - module registry
   - existing active VS Code full-workbench solution + approved review
   - `runtime.governance-clients` module overview / contracts / ADR
   - `runtime.orchestration` module overview / aggregation contract
   - risk facts / HITL SLA contract
   - current VS Code extension README and runtime/type surfaces
2. Verification commands:
   - `node ./scripts/governance/check-technical-solution-lifecycle-registry.js`
   - Result: `pass`
3. Docs-only review window:
   - no executable code changed
   - build not required

## Decision

1. Review outcome: `approved`
2. Approval verdict:
   - no blocking findings remain
   - the draft is approved for later promotion cutover
3. Lifecycle recommendation:
   - update solution to `approved`
   - update `review_paths` to the canonical approved artifact path
   - fill `approved_at` / `approved_by`
   - keep `final_paths` empty
   - hand off to `technical-solution-promotion` when the formal contract/doc cutover is ready
