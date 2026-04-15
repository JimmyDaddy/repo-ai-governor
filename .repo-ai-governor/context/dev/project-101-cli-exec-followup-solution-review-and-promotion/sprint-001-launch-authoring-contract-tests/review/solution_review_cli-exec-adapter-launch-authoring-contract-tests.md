# Technical Solution Review

- Status: approved
- Date: 2026-04-13
- Solution ID: `technical-solution.cli-exec-adapter-launch-authoring-contract-tests`
- Draft Path: `.repo-ai-governor/draft/cli-exec-adapter-launch-authoring-contract-tests-technical-solution.md`
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
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-invoke-liveness-contract.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/adapter-health-and-route-probe-contract.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/native-cli-exec-runtime-hardening-and-explicit-acp-extension-seam.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/native-cli-exec-compatibility-and-stability-productization.md`
   - `.repo-ai-governor/draft/cli-exec-five-direction-dependency-and-sequencing-analysis-technical-solution.md`
4. Canonical artifact path:
   - `.repo-ai-governor/context/dev/project-101-cli-exec-followup-solution-review-and-promotion/sprint-001-launch-authoring-contract-tests/review/solution_review_cli-exec-adapter-launch-authoring-contract-tests.md`
5. Review focus:
   - whether the draft maps adapter-authored launch truth onto probe-visible versus invoke-visible preserved facts clearly enough to be implementable
   - whether the scenario taxonomy fully covers the already-active compatibility/stability baseline instead of narrowing it
   - whether fallback entrypoint resolution is formalized as an explicit ownership-preservation scenario

## Reviewer Round

1. Round 1:
   - fresh delegated reviewer round
   - verdict: `changes_required`
   - result: 3 blocking findings, 2 non-blocking suggestions, 3 promotion interlocks
2. Round 2:
   - fresh delegated reviewer round after draft remediation
   - verdict: `approved`
   - result: no actionable findings

## Blocking Findings

1. `[resolved 2026-04-13]` The draft originally treated probe and invoke as if they could share one identical invariant set, but the formal contracts expose different preserved facts on the two surfaces.
   - Reviewer evidence:
     - `.repo-ai-governor/draft/cli-exec-adapter-launch-authoring-contract-tests-technical-solution.md:85`
     - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/adapter-health-and-route-probe-contract.md:25`
     - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-invoke-liveness-contract.md:33`
   - Main-agent disposition:
     - `accepted`
     - round-2 draft now explicitly splits adapter authoring truth from probe-visible preserved facts and invoke-visible preserved facts.

2. `[resolved 2026-04-13]` The scenario taxonomy originally omitted `non_zero_exit` and `signal_exit`, which would make the ownership guardrail narrower than the already-active compatibility/stability baseline.
   - Reviewer evidence:
     - `.repo-ai-governor/draft/cli-exec-adapter-launch-authoring-contract-tests-technical-solution.md:92`
     - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/native-cli-exec-compatibility-and-stability-productization.md:20`
   - Main-agent disposition:
     - `accepted`
     - round-2 draft now aligns its shared scenario taxonomy with the active compatibility baseline instead of shrinking it.

3. `[resolved 2026-04-13]` The draft named probe fallback as a regression-prone path but did not turn fallback entrypoint resolution into a first-class scenario in the proposed harness.
   - Reviewer evidence:
     - `.repo-ai-governor/draft/cli-exec-adapter-launch-authoring-contract-tests-technical-solution.md:29`
     - `.repo-ai-governor/draft/cli-exec-adapter-launch-authoring-contract-tests-technical-solution.md:85`
   - Main-agent disposition:
     - `accepted`
     - round-2 draft now adds a fallback entrypoint projection scenario and makes it part of the shared taxonomy.

## Non-Blocking Suggestions

1. 可以后续在 terminology bridge 再补一句，明确 `request_cancellation_mode` 同时属于 adapter-authored truth 与 probe surface preserved fact。
2. promotion 时可把 section 7 的 flat test names 明确标注为 `shared harness case names`，避免与 active compatibility ADR 的 matrix 竞争主语义。

## Promotion Interlocks

1. This solution should coexist with the already-active compatibility/stability solution rather than supersede it.
2. Lifecycle `final_paths` should stay limited to the solution-owned ADR; shared overview / contract edits must remain additive reuse.
3. The solution must remain runtime guidance / follow-up rollout truth, not drift into `governance.execution-gates` formal gate truth.

## Main-Agent Recheck

1. Round-1 的 3 条 blocking finding 已全部由主 agent 接受并修订 draft，修订方向与 active compatibility baseline、probe contract、invoke contract 保持一致。
2. 最新 fresh reviewer round 已明确返回 `approved`，没有新的 actionable finding。
3. 非阻断建议保留为 promotion 前的可选 polish，不影响本轮 `approved` 结论。

## Verification

1. Review baseline refreshed from:
   - draft file
   - lifecycle registry
   - module registry
   - PRD brief
   - overall technical solution + architecture blueprint
   - `runtime.agent-projection` overview + liveness / route-probe contracts + active native-cli-exec ADRs
   - fresh delegated reviewer round result
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
