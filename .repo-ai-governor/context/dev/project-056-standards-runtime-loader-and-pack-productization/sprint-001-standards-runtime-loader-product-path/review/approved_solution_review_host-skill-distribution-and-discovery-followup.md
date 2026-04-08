# Technical Solution Review

- Status: approved
- Date: 2026-04-09
- Solution ID: `technical-solution.host-skill-distribution-and-discovery-followup`
- Draft Path: `.repo-ai-governor/draft/host-skill-distribution-and-discovery-follow-up-technical-solution.md`
- Reviewer: `AI-Agent`
- Verdict: `approved`
- Related Lifecycle Entry: `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`

## Review Scope

1. Review mode: `approve-reviewed-solution`
2. Target module: `runtime.governance-clients`
3. Primary comparison surfaces:
   - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
   - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
   - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/module-overview.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/governance-host-distribution-contract.md`
   - `packages/standards/README.md`
4. Canonical artifact path evolved from:
   - `.repo-ai-governor/context/dev/project-056-standards-runtime-loader-and-pack-productization/sprint-001-standards-runtime-loader-product-path/review/solution_review_host-skill-distribution-and-discovery-followup.md`
   - to `.repo-ai-governor/context/dev/project-056-standards-runtime-loader-and-pack-productization/sprint-001-standards-runtime-loader-product-path/review/verified_solution_review_host-skill-distribution-and-discovery-followup.md`

## Blocking Findings

1. None. 本轮 re-review 未发现新的阻断性问题；上一轮的三条 blocking finding 已全部收口。

## Disposition Of Prior Blocking Findings

1. `[resolved 2026-04-09]` installer-layer 抽象与现有 `Standards Pack` 的关系已被显式拆清。
   - Updated draft evidence:
     - `.repo-ai-governor/draft/host-skill-distribution-and-discovery-follow-up-technical-solution.md:115`
     - `.repo-ai-governor/draft/host-skill-distribution-and-discovery-follow-up-technical-solution.md:121`
     - `.repo-ai-governor/draft/host-skill-distribution-and-discovery-follow-up-technical-solution.md:161`
     - `.repo-ai-governor/draft/host-skill-distribution-and-discovery-follow-up-technical-solution.md:360`
     - `.repo-ai-governor/draft/host-skill-distribution-and-discovery-follow-up-technical-solution.md:425`
     - `.repo-ai-governor/draft/host-skill-distribution-and-discovery-follow-up-technical-solution.md:856`
   - Re-review note:
     - draft 已统一改用 `adoption pack` 作为 installer-layer 抽象，并把 `standards_pack_refs[]` 明确收口到现有 `StandardsRuntimeLoader` / `StandardsPackRegistry`；不再引入平行 rule registry。

2. `[resolved 2026-04-09]` manifest / coverage / contract mapping 已把 workflow assets、CLI command entrypoints 与 guide entrypoints 分层。
   - Updated draft evidence:
     - `.repo-ai-governor/draft/host-skill-distribution-and-discovery-follow-up-technical-solution.md:151`
     - `.repo-ai-governor/draft/host-skill-distribution-and-discovery-follow-up-technical-solution.md:191`
     - `.repo-ai-governor/draft/host-skill-distribution-and-discovery-follow-up-technical-solution.md:360`
     - `.repo-ai-governor/draft/host-skill-distribution-and-discovery-follow-up-technical-solution.md:584`
     - `.repo-ai-governor/draft/host-skill-distribution-and-discovery-follow-up-technical-solution.md:748`
   - Re-review note:
     - `workflow_asset_ids[]` 现在只表示 host renderer 可消费的结构化 workflow assets；`command_entrypoints[]` / `guide_entrypoints[]` 独立建模，且 installer 仅在进入 host projection 子链时才把 workflow assets 转译成现有 contract 的 `workflow_ids`。

3. `[resolved 2026-04-09]` workspace truth boundary 已通过显式 truth table 与落地清单修订收口。
   - Updated draft evidence:
     - `.repo-ai-governor/draft/host-skill-distribution-and-discovery-follow-up-technical-solution.md:444`
     - `.repo-ai-governor/draft/host-skill-distribution-and-discovery-follow-up-technical-solution.md:478`
     - `.repo-ai-governor/draft/host-skill-distribution-and-discovery-follow-up-technical-solution.md:526`
     - `.repo-ai-governor/draft/host-skill-distribution-and-discovery-follow-up-technical-solution.md:546`
     - `.repo-ai-governor/draft/host-skill-distribution-and-discovery-follow-up-technical-solution.md:672`
   - Re-review note:
     - draft 现在明确区分 `tool_managed` 与 `repo_local`；repo-visible `adoption/**` 只承载 installer metadata / guide / template，`.repo-ai-governor/governor.yaml`、workflow definitions 与 readiness diagnostics 只在显式 `repo_local` 激活后作为 runtime-owned 产物出现，不再被描述成默认 install-time payload。

## Non-Blocking Suggestions

1. promotion 前最好再补一张“`command_entrypoints[] -> wrapper/guide/asset`”映射附表，降低后续实现时的解释漂移。
2. `AGENTS.md` 是否对所有 host profile 都由 installer 统一持有，仍需在实现前定版；当前覆盖差距表已正确把 Claude project-local 的共享 `AGENTS.md` 策略标成 follow-up。
3. clean-room rehearsal 阶段建议分别覆盖默认 `tool_managed` 与显式 `repo_local` 两条路径，确保 README 的未来文案不会再次把运行态 state 和安装态 asset 混淆。

## Promotion Interlocks

1. promotion 前仍需决定 installer-focused contract 的正式落点与命名，例如是否采用 `contract.runtime.adoption-pack-install.v1`。
2. promotion 前仍需把 `adoption/bootstrap/**` template schema 与 installer metadata schema 固化为正式 contract 字段，而不是只停留在 draft 清单。
3. promotion 前仍需补至少一轮 clean-room install / upgrade / remove rehearsal，验证文档中的 `tool_managed` vs `repo_local` 承诺可真实落地。

## Verification

1. Review baseline built from:
   - draft file
   - lifecycle registry entry
   - `runtime.governance-clients` module overview and host-distribution contract
   - tool-level overall solution and architecture blueprint
   - `packages/standards/README.md`
2. Supplemental evidence:
   - `stitch-skills` only used as external UX inspiration; repository truth remained primary.
3. Re-review focus:
   - installer-layer naming and registry boundary
   - field split between workflow assets / commands / guides
   - workspace-mode truth table and repo-visible state boundary

## Delegated Re-Review Addendum

1. `[delegated reviewer round 2026-04-09]` 子 agent 针对新增 `self-host-complete` profile 做了收敛复核，未提出新的 blocking finding。
2. Delegated evidence emphasized:
   - `self-host-complete` 仍然是显式 opt-in profile，并绑定 `workspace.mode=repo_local`
   - installer-seeded template 与 runtime-owned canonical state 仍保持分层，没有把 install-time payload 误写成 runtime truth
   - `template bootstrap != live-state clone` 的边界在 truth table、user flow 与 acceptance criteria 中保持一致
3. Delegated non-blocking carry-forward:
   - promotion/cutover 时应继续把 `self-host-complete` 作为独立 interlock 处理，不与 baseline adopter pack 隐式捆绑
   - 后续正式 contract / README 示例应继续把 “template bootstrap, not live-state clone” 警示紧邻 `self-host-complete` 示例保留

## Decision

1. Review outcome: `approved`
2. Lifecycle recommendation:
   - update solution to `approved`
   - update `review_paths` to the canonical approved artifact path
   - fill `approved_at` / `approved_by`
   - keep `final_paths` empty
   - hand off to formal promotion cutover for later `active` wiring
