# Technical Solution Review

- Status: approved
- Date: 2026-04-09
- Solution ID: `technical-solution.transport-selection-authority-and-strict-routing`
- Draft Path: `.repo-ai-governor/draft/transport-selection-authority-and-strict-routing-follow-up-technical-solution.md`
- Reviewer: `AI-Agent`
- Verdict: `approved`
- Related Lifecycle Entry: `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`

## Review Scope

1. Review mode: `approve-reviewed-solution`
2. Target module: `runtime.agent-projection`
3. Primary comparison surfaces:
   - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
   - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
   - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/module-overview.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-onboarding-contract.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-projection-contract.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/adapter-health-and-route-probe-contract.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/remote-api-transport-and-provider-binding-seam.md`
   - `apps/cli/src/runtime/agent-onboarding-runtime.ts`
   - `docs/local-adoption-playbook.md`
   - `docs/support-matrix.md`
4. Canonical artifact path:
   - `.repo-ai-governor/context/dev/project-074-transport-selection-authority-solution-review/sprint-001-draft-review-and-lifecycle-writeback/review/solution_review_transport-selection-authority-and-strict-routing-followup.md`
5. Re-review focus:
   - whether onboarding truth now converges to one canonical machine surface
   - whether `strict transport routing` is separated cleanly from role-level surface fallback
   - whether public `remote_api` support wording now has an explicit evidence gate aligned with the active ADR

## Blocking Findings

1. None. 本轮 re-review 未发现新的阻断性问题；上一轮的两条 blocking finding 已全部收口。

## Disposition Of Prior Blocking Findings

1. `[resolved 2026-04-09]` onboarding payload 的 canonical truth slot 已显式收敛到 `enabled_tools[]`。
   - Updated draft evidence:
     - `.repo-ai-governor/draft/transport-selection-authority-and-strict-routing-follow-up-technical-solution.md:32`
     - `.repo-ai-governor/draft/transport-selection-authority-and-strict-routing-follow-up-technical-solution.md:65`
     - `.repo-ai-governor/draft/transport-selection-authority-and-strict-routing-follow-up-technical-solution.md:148`
     - `.repo-ai-governor/draft/transport-selection-authority-and-strict-routing-follow-up-technical-solution.md:172`
     - `.repo-ai-governor/draft/transport-selection-authority-and-strict-routing-follow-up-technical-solution.md:180`
     - `.repo-ai-governor/draft/transport-selection-authority-and-strict-routing-follow-up-technical-solution.md:195`
   - Re-review note:
     - draft 现在明确把 `enabled_tools[]` 选为 onboarding canonical machine surface，并把当前 runtime 中的 `tool_transport_matrix` 降格为兼容期 bridge；`configured_remote_api` 成为正式 nested truth，`remote_api_candidate` 只保留为 alias。这个收敛方向也与现有 onboarding contract 已要求 `enabled_tools[]` row 显式携带 `transport_kind / provider_kind / vendor_binding_kind` 的事实一致。

2. `[resolved 2026-04-09]` support-matrix / playbook uplift 现在带有明确的 evidence gate，不再把 contract support 自动升级成 public support wording。
   - Updated draft evidence:
     - `.repo-ai-governor/draft/transport-selection-authority-and-strict-routing-follow-up-technical-solution.md:42`
     - `.repo-ai-governor/draft/transport-selection-authority-and-strict-routing-follow-up-technical-solution.md:117`
     - `.repo-ai-governor/draft/transport-selection-authority-and-strict-routing-follow-up-technical-solution.md:127`
     - `.repo-ai-governor/draft/transport-selection-authority-and-strict-routing-follow-up-technical-solution.md:246`
     - `.repo-ai-governor/draft/transport-selection-authority-and-strict-routing-follow-up-technical-solution.md:253`
     - `.repo-ai-governor/draft/transport-selection-authority-and-strict-routing-follow-up-technical-solution.md:292`
   - Re-review note:
     - draft 现在把 truth 明确拆成 `runtime / contract support` 与 `adopter-facing public support wording` 两层，并要求 clean-room / release verification、`verify --adapters` 投影证据以及同一 change window 的 evidence artifact 作为文档升级前提。这与现有 remote-api ADR 中“release gate / distribution matrix 只是 delivery follow-up guidance”的边界保持一致。

## Non-Blocking Suggestions

1. promotion 时建议把 `strict transport routing` 这一术语继续固定到 contract / module-overview 的同一套表述上，避免未来又被写回更高层的 `strict-surface` 语义。
2. 若后续真的创建 consumer migration tracker，最好让 `configured_remote_api` / `remote_api_candidate` 兼容桥与 release-note 回链使用同一条 owner surface，减少 cutover 时的解释漂移。

## Promotion Interlocks

1. 该 follow-up 若修改 `agent-onboarding-contract.md`、`agent-projection-contract.md` 或 `adapter-health-and-route-probe-contract.md`，promotion 时必须同步 producer `module-overview.md`。
2. `remote_api_candidate -> configured_remote_api` 的兼容期、降级窗口与 consumer migration owner 必须在 promotion 前定版。
3. public support wording 只有在 draft 中定义的证据门槛被满足后，才能进入 `docs/support-matrix.md` 与 adopter-facing playbook。

## Verification

1. Review baseline built from:
   - draft file
   - lifecycle registry entry
   - `runtime.agent-projection` overview + contracts + remote-api ADR
   - overall technical solution + architecture blueprint
   - current onboarding runtime implementation
   - current adopter-facing playbook + support matrix
2. Re-review focus:
   - whether same-surface transport failover remains absent in current runtime
   - whether the draft now chooses one canonical onboarding machine shape instead of leaving parallel truth slots
   - whether public support wording now has an explicit gate rather than being treated as an automatic contract by-product
3. Docs-only review window:
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
