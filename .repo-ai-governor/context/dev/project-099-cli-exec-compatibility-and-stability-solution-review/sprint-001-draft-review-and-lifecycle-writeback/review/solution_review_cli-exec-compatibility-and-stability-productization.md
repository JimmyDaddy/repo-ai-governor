# Technical Solution Review

- Status: approved
- Date: 2026-04-13
- Solution ID: `technical-solution.cli-exec-compatibility-and-stability-productization`
- Draft Path: `.repo-ai-governor/draft/cli-exec-compatibility-and-stability-productization-technical-solution.md`
- Reviewer: `AI-Agent`
- Verdict: `approved`
- Related Lifecycle Entry: `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`

## Review Scope

1. Review mode: `approve-reviewed-solution`
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
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/governance-execution-gates/module-overview.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/governance-execution-gates/contracts/gate-execution-profile-contract.md`
   - `.repo-ai-governor/draft/cli-exec-five-direction-dependency-and-sequencing-analysis-technical-solution.md`
   - `.repo-ai-governor/context/dev/project-098-cli-exec-runtime-rollout/project-098-cli-exec-runtime-rollout-completion-audit-summary.md`
4. Canonical artifact path:
   - `.repo-ai-governor/context/dev/project-099-cli-exec-compatibility-and-stability-solution-review/sprint-001-draft-review-and-lifecycle-writeback/review/solution_review_cli-exec-compatibility-and-stability-productization.md`
5. Review focus:
   - whether the proposed compatibility taxonomy is concrete enough to become a stable runtime baseline
   - whether the proposal turns `project-098` evidence into an executable focused verification profile instead of a descriptive intent
   - whether the solution stays additive and avoids silently upgrading runtime contract minimum fields or ACP/public-surface scope

## Reviewer Round

1. Round 1:
   - local initial review
   - verdict: `changes_required`
2. Round 2:
   - fresh delegated reviewer round after draft remediation
   - reviewer result: `no actionable findings`

## Blocking Findings

1. None. 最新 fresh reviewer round 未发现新的阻断性问题；上一轮的两条 blocking finding 已全部收口。

## Disposition Of Prior Blocking Findings

1. `[resolved 2026-04-13]` compatibility taxonomy 现在已经从平铺列表收敛成 `scenario class x required preserved facts` 的二维矩阵。
   - Updated draft evidence:
     - `.repo-ai-governor/draft/cli-exec-compatibility-and-stability-productization-technical-solution.md:86`
     - `.repo-ai-governor/draft/cli-exec-compatibility-and-stability-productization-technical-solution.md:105`
     - `.repo-ai-governor/draft/cli-exec-compatibility-and-stability-productization-technical-solution.md:116`
     - `.repo-ai-governor/draft/cli-exec-compatibility-and-stability-productization-technical-solution.md:126`
   - Re-review note:
     - draft 现在明确区分 `scenario class`、`required preserved facts`、surface、owner 与 canonical evidence focus，不再把 scenario、termination outcome 和 invariant 混成单一 taxonomy。这和 `agent-invoke-liveness-contract` 中的 liveness facts / terminate phase 分层，以及 `adapter-health-and-route-probe-contract` 中 additive probe diagnostics 的表达方式保持一致。

2. `[resolved 2026-04-13]` focused verification 现在已经收敛成具名 profile、可执行命令、trigger matrix 与 evidence recording contract。
   - Updated draft evidence:
     - `.repo-ai-governor/draft/cli-exec-compatibility-and-stability-productization-technical-solution.md:135`
     - `.repo-ai-governor/draft/cli-exec-compatibility-and-stability-productization-technical-solution.md:156`
     - `.repo-ai-governor/draft/cli-exec-compatibility-and-stability-productization-technical-solution.md:172`
     - `.repo-ai-governor/draft/cli-exec-compatibility-and-stability-productization-technical-solution.md:182`
   - Comparison / evidence note:
     - `cli_exec_compatibility_full` 直接锚定到了 `project-098` 已记录的 concrete verification bundle，而 `runtime_foundation` 与 `adapter_slice` 进一步把较小 change slice 的 rerun 语义明确化。
   - Re-review note:
     - 这使“focused compatibility verification”不再只是方向性口头约定，而成为带 `profile_id + exact command + trigger matrix + evidence write-back` 的 canonical guidance。

## Non-Blocking Suggestions

1. 可以补一条短说明，明确 `native-cli-exec-internal-acp-extension-seam.unit.test.ts` 不在默认 compatibility profile 内，而是继续受独立 ACP seam boundary 管理。

## Promotion Interlocks

1. 如果 promotion 最终把 compatibility verification profile 提升为正式 gate/profile truth，而不仅是 runtime guidance，则必须在同一 change window 同步 `governance.execution-gates` 的 module overview / contract。
2. promotion 仍需保持 `partial_output_preserved`、`entrypoint_resolution`、`shell_wrapped`、`process_tree_policy`、`spawn_error_code` 等事实为 additive / optional truth，不能借稳定性方案把它们升级成新的 minimum fields。
3. ACP host-facing/public support work 仍必须留在独立 solution track，不能在本方案 promotion 窗口中隐式并入。

## Main-Agent Recheck

1. 两条 blocking finding 均已由主 agent 先本地复核，再由 fresh reviewer round 做只读 re-review；clean 结论与 repository truth 一致。
2. 最新 draft 已经把 rollout evidence 收敛为可 promotion 的 baseline guidance，同时仍保持 additive / non-public 边界。

## Verification

1. Review baseline refreshed from:
   - draft file
   - lifecycle registry
   - module registry
   - PRD brief
   - overall technical solution + architecture blueprint
   - `runtime.agent-projection` overview + liveness / route-probe contract + active native-cli-exec ADR
   - `governance.execution-gates` overview + gate-profile contract
   - `project-098` completion audit and current runtime/test evidence references
   - canonical sprint-001 review artifact
   - fresh delegated reviewer round result
2. Docs-only review window:
   - no executable code changed
   - build not required

## Decision

1. Review outcome: `approved`
2. Lifecycle recommendation:
   - update solution to `approved`
   - keep this canonical artifact path in `review_paths`
   - fill `approved_at` / `approved_by`
   - keep `final_paths` empty
   - hand off to `technical-solution-promotion` for later formal cutover
