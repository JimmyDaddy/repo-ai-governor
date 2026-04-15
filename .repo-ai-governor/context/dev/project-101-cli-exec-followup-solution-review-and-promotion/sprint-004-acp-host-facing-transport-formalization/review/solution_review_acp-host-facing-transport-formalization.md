# Technical Solution Review

- Status: approved
- Date: 2026-04-13
- Solution ID: `technical-solution.acp-host-facing-transport-formalization`
- Draft Path: `.repo-ai-governor/draft/acp-host-facing-transport-formalization-technical-solution.md`
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
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-projection-contract.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/native-cli-exec-runtime-hardening-and-explicit-acp-extension-seam.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/cli-exec-onboarding-and-adoption-readiness-productization.md`
   - `.repo-ai-governor/draft/cli-exec-five-direction-dependency-and-sequencing-analysis-technical-solution.md`
   - `packages/adapter-sdk/src/native-cli-exec-internal-acp-extension-seam.ts`
   - `packages/adapter-sdk/src/native-cli-exec-process-runtime.ts`
4. Canonical artifact path:
   - `.repo-ai-governor/context/dev/project-101-cli-exec-followup-solution-review-and-promotion/sprint-004-acp-host-facing-transport-formalization/review/solution_review_acp-host-facing-transport-formalization.md`
5. Review focus:
   - whether ACP is formalized as a distinct transport truth instead of a `cli_exec` alias
   - whether ACP-local companion state is bound to a concrete carrier and ownership split
   - whether packaging / verify / distribution uplift stays deferred to `project-105` rollout instead of being implied in this sprint

## Reviewer Round

1. Round 1:
   - fresh delegated reviewer round
   - verdict: `changes_required`
   - result: 2 blocking findings, 1 non-blocking suggestion, 2 promotion interlocks
2. Round 2:
   - fresh delegated reviewer round after draft remediation
   - verdict: `approved`
   - result: no actionable finding

## Blocking Findings

1. `[resolved 2026-04-13]` The draft originally left ACP-local `session / permission / terminal` state unbound to a concrete carrier, which risked letting promotion leak those ids into `ProviderContinuationHandle`, shared `session_id`, or `AgentSessionRegistry` projection truth.
   - Reviewer evidence:
     - `.repo-ai-governor/draft/acp-host-facing-transport-formalization-technical-solution.md:87`
     - `.repo-ai-governor/draft/acp-host-facing-transport-formalization-technical-solution.md:101`
     - `.repo-ai-governor/draft/acp-host-facing-transport-formalization-technical-solution.md:102`
     - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/module-overview.md:21`
     - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/module-overview.md:23`
     - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/module-overview.md:43`
     - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-projection-contract.md:81`
     - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-projection-contract.md:127`
   - Main-agent disposition:
     - `accepted`
     - the draft now binds ACP-local ids to a projection-owned, transport-scoped additive companion such as `acp_host_companion`, and explicitly forbids reusing `session_id`, `AgentSessionRegistry`, or `ProviderContinuationHandle`.

2. `[resolved 2026-04-13]` The draft originally left the packaging / verify / distribution uplift boundary too soft, which could be misread as requiring host-facing distribution contract work inside `project-101 / sprint-004`.
   - Reviewer evidence:
     - `.repo-ai-governor/draft/acp-host-facing-transport-formalization-technical-solution.md:104`
     - `.repo-ai-governor/draft/acp-host-facing-transport-formalization-technical-solution.md:105`
     - `.repo-ai-governor/draft/acp-host-facing-transport-formalization-technical-solution.md:117`
     - `.repo-ai-governor/draft/acp-host-facing-transport-formalization-technical-solution.md:129`
     - `.repo-ai-governor/context/dev/project-101-cli-exec-followup-solution-review-and-promotion/sprint-004-acp-host-facing-transport-formalization/plan.md:18`
     - `.repo-ai-governor/context/dev/project-101-cli-exec-followup-solution-review-and-promotion/sprint-004-acp-host-facing-transport-formalization/plan.md:19`
     - `.repo-ai-governor/context/dev/project-101-cli-exec-followup-solution-review-and-promotion/sprint-004-acp-host-facing-transport-formalization/plan.md:38`
     - `.repo-ai-governor/context/dev/project-101-cli-exec-followup-solution-review-and-promotion/plan.md:21`
   - Main-agent disposition:
     - `accepted`
     - the draft now states that packaged distribution, runtime-service enablement, clean-room verify execution, and support/docs uplift are all post-promotion rollout work owned by `project-105`.

## Non-Blocking Suggestions

1. no actionable finding.

## Promotion Interlocks

1. sprint-004 promotion must remain limited to `runtime.agent-projection` additive contract clarification plus a new ADR; `docs/support-matrix.md`, packaged distribution, runtime-service uplift, and clean-room verify execution are not formal cutover targets in this sprint.
2. the internal-only ACP seam under `packages/adapter-sdk` is implementation input only; it must not be treated as host-facing contract proof or rollout evidence.

## Main-Agent Recheck

1. Both round-1 blocking findings were rechecked against the current runtime-agent-projection overview, the agent-projection continuation boundary, and the sprint-004 plan scope.
2. The accepted remediation now keeps ACP-local ids inside a transport-scoped projection companion and explicitly defers rollout execution surfaces to `project-105`.
3. The latest fresh reviewer round returned `approved` with no actionable finding, so the loop exit condition is satisfied.

## Verification

1. Review baseline refreshed from:
   - draft file
   - lifecycle registry
   - module registry
   - PRD brief
   - overall technical solution + architecture blueprint
   - `runtime.agent-projection` overview + onboarding / projection contracts + active ACP seam ADR
   - internal ACP seam implementation references
   - fresh delegated reviewer round results
2. Docs-only review window:
   - no executable code changed
   - build not required

## Decision

1. Review outcome: `approved`
2. Lifecycle recommendation for the current round:
   - set solution to `approved`
   - keep this canonical artifact path in `review_paths`
   - fill `approved_at` / `approved_by`
   - keep `final_paths` empty
   - hand off to `technical-solution-promotion` for formal cutover
