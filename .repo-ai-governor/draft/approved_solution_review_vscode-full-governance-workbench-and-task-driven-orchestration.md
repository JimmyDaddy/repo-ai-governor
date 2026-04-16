# Technical Solution Review

- Status: approved
- Date: 2026-04-16
- Solution ID: `technical-solution.vscode-full-governance-workbench-and-task-driven-orchestration`
- Draft Path: `.repo-ai-governor/draft/vscode-full-governance-workbench-and-task-driven-orchestration-technical-solution.md`
- Reviewer: `AI-Agent`
- Verdict: `approved`
- Related Lifecycle Entry: `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`

## Review Scope

1. Review mode: `review-draft-solution`
   - same-turn delegated review findings were accepted and remediated before approval
   - the latest fresh delegated post-fix recheck returned clean, and the main agent rechecked that clean result against repository truth before approval
2. Target module:
   - `runtime.governance-clients`
   - `runtime.orchestration`
3. Primary comparison surfaces:
   - `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
   - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
   - `.repo-ai-governor/normative_knowledge_sources/product-requirements.md`
   - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
   - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/module-overview.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/governance-surface-client-contract.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/desktop-command-center-and-vscode-editor-companion-split.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/adopter-productization-priority-and-surface-sequencing.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/current-surface-baseline-classification-and-followup-decomposition.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/module-overview.md`
   - `apps/vscode-extension/README.md`
   - `docs/support-matrix.md`
   - `integrations/desktop/README.md`
4. Canonical artifact path:
   - `.repo-ai-governor/draft/approved_solution_review_vscode-full-governance-workbench-and-task-driven-orchestration.md`
5. Review path decision:
   - `current-context.md` 当前为 `idle`，没有 active primary stream 可承载新的 review artifact，因此本轮沿用 draft 邻接的单一 canonical artifact path，并在同一 review window 内收口为 `approved`
6. Approval focus:
   - supersede scope 是否只替换 split / companion-only truth，而不是误伤仍 active 的 host-distribution truth
   - `runtime.orchestration` 是否已经从“可选补充”冻结为本方案必需的 target module
   - phased rollout 是否已把 `formal direction` 与 `public support truth` 分层冻结
   - `governance-surface-client` contract 是否已经具备 field-level delta，而不只是方向性叙述
   - typed CLI bridge 是否都被标为 temporary 并拥有统一退出条件

## Reviewer Round

1. Delegated review round: `round-1-initial-review`
   - verdict: `changes_required`
   - outcome: returned `3` actionable blocking findings focused on supersede scope, `runtime.orchestration` ownership, and phased support freeze
2. Main-agent remediation:
   - accepted the delegated blocking findings
   - added one extra local hardening item for `governance-surface-client` field-level contract delta and typed bridge exit criteria
   - revised the draft before approval
3. Fresh delegated post-fix recheck: `round-2-post-fix-recheck`
   - outcome: no actionable blocker remained
4. Main-agent final recheck:
   - revalidated the clean delegated result against lifecycle truth, module boundaries, support-truth constraints, and promotion interlocks before approving

## Blocking Findings

1. None. 本轮批准前复核未发现剩余阻断性问题；上一轮 blocking findings 已全部收口。

## Disposition Of Prior Blocking Findings

1. `[resolved 2026-04-16]` phased rollout 的中间态与 public support truth 已冻结，不再允许“先改支持口径、后补证据”。
   - Updated draft evidence:
     - `.repo-ai-governor/draft/vscode-full-governance-workbench-and-task-driven-orchestration-technical-solution.md:147`
     - `.repo-ai-governor/draft/vscode-full-governance-workbench-and-task-driven-orchestration-technical-solution.md:149`
     - `.repo-ai-governor/draft/vscode-full-governance-workbench-and-task-driven-orchestration-technical-solution.md:176`
     - `.repo-ai-governor/draft/vscode-full-governance-workbench-and-task-driven-orchestration-technical-solution.md:181`
     - `.repo-ai-governor/draft/vscode-full-governance-workbench-and-task-driven-orchestration-technical-solution.md:336`
     - `.repo-ai-governor/draft/vscode-full-governance-workbench-and-task-driven-orchestration-technical-solution.md:345`
     - `.repo-ai-governor/draft/vscode-full-governance-workbench-and-task-driven-orchestration-technical-solution.md:371`
     - `.repo-ai-governor/draft/vscode-full-governance-workbench-and-task-driven-orchestration-technical-solution.md:377`
   - Normative evidence:
     - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/module-overview.md:15`
     - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/module-overview.md:16`
     - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/module-overview.md:35`
     - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/module-overview.md:37`
     - `docs/support-matrix.md:83`
     - `docs/support-matrix.md:85`
     - `docs/support-matrix.md:164`
     - `docs/support-matrix.md:173`
     - `integrations/desktop/README.md:33`
     - `integrations/desktop/README.md:36`
   - Approval note:
     - draft 现在明确区分了 planning-side formal direction 与 adopter-facing support truth
     - VS Code 的 primary workbench claim 被冻结到 Phase C evidence 之后，desktop 的 foundation-only secondary-surface truth 也被保留下来

2. `[resolved 2026-04-16]` `governance-surface-client` contract 已从方向性改写收口为 field-level delta freeze。
   - Updated draft evidence:
     - `.repo-ai-governor/draft/vscode-full-governance-workbench-and-task-driven-orchestration-technical-solution.md:256`
     - `.repo-ai-governor/draft/vscode-full-governance-workbench-and-task-driven-orchestration-technical-solution.md:267`
     - `.repo-ai-governor/draft/vscode-full-governance-workbench-and-task-driven-orchestration-technical-solution.md:309`
     - `.repo-ai-governor/draft/vscode-full-governance-workbench-and-task-driven-orchestration-technical-solution.md:318`
   - Normative evidence:
     - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/governance-surface-client-contract.md:37`
     - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/governance-surface-client-contract.md:42`
     - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/governance-surface-client-contract.md:52`
     - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/governance-surface-client-contract.md:61`
     - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/governance-surface-client-contract.md:63`
   - Approval note:
     - draft 现在已经写清 companion-era `surface_id / surface_role / webview_usage_mode` 为什么不够，以及 promotion 需要补哪些最小字段变化
     - typed CLI bridge 也被统一标记为 temporary，并要求 service-native seam 与 evidence 触发退出

3. `[resolved 2026-04-16]` `runtime.orchestration` 的 owner split 与 formal scope 已冻结，不再留成 promotion 时猜测。
   - Updated draft evidence:
     - `.repo-ai-governor/draft/vscode-full-governance-workbench-and-task-driven-orchestration-technical-solution.md:224`
     - `.repo-ai-governor/draft/vscode-full-governance-workbench-and-task-driven-orchestration-technical-solution.md:245`
     - `.repo-ai-governor/draft/vscode-full-governance-workbench-and-task-driven-orchestration-technical-solution.md:247`
     - `.repo-ai-governor/draft/vscode-full-governance-workbench-and-task-driven-orchestration-technical-solution.md:254`
     - `.repo-ai-governor/draft/vscode-full-governance-workbench-and-task-driven-orchestration-technical-solution.md:415`
   - Normative evidence:
     - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/module-overview.md:15`
     - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/module-overview.md:19`
     - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/module-overview.md:42`
     - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/module-overview.md:43`
     - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/technical-solution-module-registry.yaml:347`
     - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/technical-solution-module-registry.yaml:355`
     - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/technical-solution-module-registry.yaml:367`
     - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/technical-solution-module-registry.yaml:375`
   - Approval note:
     - draft 现在明确区分 execution/session/HITL/queue、tasks/reviews、workflow、adoption/host 的 canonical truth 与 service-owned projection
     - `runtime.orchestration` 被保留为必需 target module，不再是“视 review 结果决定是否补充”

4. `[resolved 2026-04-16]` supersede scope 已冻结为 partial supersede，不再模糊处理旧 `technical-solution.governance-surface-clients` 的 active truth。
   - Updated draft evidence:
     - `.repo-ai-governor/draft/vscode-full-governance-workbench-and-task-driven-orchestration-technical-solution.md:184`
     - `.repo-ai-governor/draft/vscode-full-governance-workbench-and-task-driven-orchestration-technical-solution.md:198`
     - `.repo-ai-governor/draft/vscode-full-governance-workbench-and-task-driven-orchestration-technical-solution.md:416`
   - Normative evidence:
     - `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml:639`
     - `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml:659`
     - `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml:672`
     - `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml:690`
   - Approval note:
     - draft 现在明确只替换 split / companion-only truth
     - host-distribution / installer / adoption 相关 active truth 继续保留，promotion 被明确禁止“顺手把整条旧 solution 标成 superseded”

## Non-Blocking Suggestions

1. None. 本轮 review 没有剩余需要阻止批准的建议项；余下事项均已转为 promotion interlocks 或后续 delivery evidence 约束。

## Promotion Interlocks

1. promotion 必须把 `runtime.orchestration` 的新增 aggregation seam materialize 到 formal docs / contracts，或采用等价的 explicit contract write-back；不能只在 draft 里冻结、正式文档里留空。
2. promotion 若仍使用当前 lifecycle registry 的整条 `supersedes` 语义，必须先完成旧 `technical-solution.governance-surface-clients` 的 finer-grained decomposition，避免误伤 host-distribution / installer active truth。
3. `docs/support-matrix*.md`、`apps/vscode-extension/README.md`、`docs/local-adoption-playbook*.md` 与 `integrations/desktop/README.md` 仍然必须 evidence-gated；本轮 review approval 不等于 public support claim 已经切换。
4. 若 `adopt bootstrap`、`host export/verify/pack`、`verify`、`upgrade` 中仍有 bridge 存在，promotion 必须保留 temporary bridge + exit criteria 的术语，直到 service-native seam 与 evidence 同时到位。

## Main-Agent Recheck

1. `[resolved]` reviewer round 1 的 supersede/cutover blocker 已收口。
   - 新 draft 不再把“替换 split truth”混写成“整包废弃 governance-surface-clients”。
2. `[resolved]` reviewer round 1 的 `runtime.orchestration` blocker 已收口。
   - owner split 与 required target module 现在已经是明确写死的方案事实，而不是 promotion 时临场决定。
3. `[resolved]` reviewer round 1 的 phased support freeze blocker 已收口。
   - public support docs 的更新条件、desktop middle-state、VS Code primary claim 的证据门槛都已明确。
4. `[resolved]` local main-agent hardening 也已收口。
   - `governance-surface-client` contract delta 与 typed bridge exit criteria 现在具备 promotion-ready precision。

## Verification

1. Review baseline built from:
   - target draft
   - lifecycle registry entry
   - PRD brief + full PRD
   - overall technical solution
   - architecture blueprint
   - `runtime.governance-clients` overview / contract / split ADR / sequencing ADR / current-surface ADR
   - `runtime.orchestration` overview
   - current VS Code / desktop support truth docs
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
   - hand off to `technical-solution-promotion` for formal cutover when the target docs / contracts are ready
