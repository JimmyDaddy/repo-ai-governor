# Technical Solution Review

- Status: approved
- Date: 2026-04-13
- Solution ID: `technical-solution.cli-exec-additive-diagnostics-consumer-productization`
- Draft Path: `.repo-ai-governor/draft/cli-exec-additive-diagnostics-consumer-productization-technical-solution.md`
- Reviewer: `AI-Agent`
- Verdict: `approved`
- Related Lifecycle Entry: `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`

## Review Scope

1. Review mode: `review-draft-solution`
2. Target module:
   - `runtime.agent-projection`
3. Primary comparison surfaces:
   - `.repo-ai-governor/context/current-context.md`
   - `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
   - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
   - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
   - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/technical-solution-module-registry.yaml`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/module-overview.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-onboarding-contract.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/adapter-health-and-route-probe-contract.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-invoke-liveness-contract.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/adapter-authored-launch-plan-ownership-and-contract-tests.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/native-cli-exec-compatibility-and-stability-productization.md`
   - `.repo-ai-governor/draft/cli-exec-five-direction-dependency-and-sequencing-analysis-technical-solution.md`
4. Canonical artifact path:
   - `.repo-ai-governor/context/dev/project-101-cli-exec-followup-solution-review-and-promotion/sprint-002-additive-diagnostics-consumer/review/solution_review_cli-exec-additive-diagnostics-consumer-productization.md`
5. Review focus:
   - whether additive launch diagnostics are formalized as consumer projection without flattening probe/invoke preserved facts
   - whether camelCase implementation carrier naming stays separate from snake_case formal canonical vocabulary
   - whether sprint-002 promotion scope stays limited to `agent-onboarding + adapter-health-and-route-probe + new ADR`

## Reviewer Round

1. Round 1:
   - fresh delegated reviewer round
   - verdict: `changes_required`
   - result: 2 blocking findings, 2 non-blocking suggestions, 1 promotion interlock
2. Round 2:
   - fresh delegated reviewer round after draft remediation
   - verdict: `approved`
   - result: no actionable finding

## Blocking Findings

1. `[resolved 2026-04-13]` The draft originally flattened probe and invoke into one unified `launch_diagnostics` minimum shape, which conflicted with the active launch-authoring ownership ADR and the current probe/invoke contract split.
   - Reviewer evidence:
     - `.repo-ai-governor/draft/cli-exec-additive-diagnostics-consumer-productization-technical-solution.md:85`
     - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/adapter-authored-launch-plan-ownership-and-contract-tests.md:25`
     - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/adapter-health-and-route-probe-contract.md:68`
     - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-invoke-liveness-contract.md:81`
   - Main-agent disposition:
     - `accepted`
     - round-2 draft now keeps probe-side canonical projection on `selected_entrypoint + request_cancellation_mode`, leaves invoke preserved facts on `terminate_phase + partial_output_preserved_when_available + cancel_mechanism`, and treats launch evidence as additive-only.

2. `[resolved 2026-04-13]` The draft originally mixed camelCase SDK carrier naming with snake_case formal contract vocabulary, which would have created a second diagnostics truth source at promotion time.
   - Reviewer evidence:
     - `.repo-ai-governor/draft/cli-exec-additive-diagnostics-consumer-productization-technical-solution.md:85`
     - `packages/adapter-sdk/src/types/interfaces/agent-cli-exec.interface.ts:16`
     - `apps/cli/src/runtime/agent-onboarding-runtime.ts:312`
   - Main-agent disposition:
     - `accepted`
     - round-2 draft now formalizes a one-way mapping from `AgentCliLaunchDiagnostics` as implementation carrier into snake_case formal projection and keeps sprint-002 promotion scope on onboarding/probe contracts plus a new ADR.

## Non-Blocking Suggestions

1. promotion handoff can later add one worked example that maps `AgentCliLaunchDiagnostics` camelCase carrier fields to probe/onboarding snake_case consumer payload.
2. promotion cutover should restate explicitly that the `agent-onboarding-contract` changes remain additive clarification and do not expand `Minimum Fields`.

## Promotion Interlocks

1. sprint-002 promotion must stay limited to `agent-onboarding-contract`、`adapter-health-and-route-probe-contract` and a new diagnostics-consumer ADR.
2. `agent-invoke-liveness-contract` remains an imported comparison surface in this sprint, not a promotion target.
3. `selected_entrypoint`、`request_cancellation_mode` remain probe-owned preserved facts, while `shell_wrapped`、`process_tree_policy` and `spawn_error_code` remain additive-only evidence.

## Main-Agent Recheck

1. round-1 的 2 条 blocking finding 已由主 agent 接受并修订 draft，且修订方向与 active launch-authoring ownership ADR、active compatibility/stability ADR、onboarding runtime现状和 current sprint promotion boundary 保持一致。
2. main-agent recheck 了 reviewer 引用的 code and docs evidence，包括 SDK camelCase carrier、onboarding runtime 的 snake_case consumer payload，以及 probe/invoke contracts 的现有 preserved-fact split。
3. 最新 fresh reviewer round 已明确返回 `approved`，没有新的 actionable finding。

## Verification

1. Review baseline refreshed from:
   - draft file
   - lifecycle registry
   - module registry
   - PRD brief
   - overall technical solution + architecture blueprint
   - `runtime.agent-projection` overview + onboarding / route-probe / invoke contracts + active cli_exec ADRs
   - fresh delegated reviewer round results
2. Docs-only review window:
   - no executable code changed
   - build not required

## Decision

1. Review outcome: `approved`
2. Lifecycle recommendation:
   - set solution to `approved`
   - record this canonical artifact path in `review_paths`
   - fill `approved_at` / `approved_by`
   - keep `final_paths` empty
   - hand off to `technical-solution-promotion` for formal cutover
