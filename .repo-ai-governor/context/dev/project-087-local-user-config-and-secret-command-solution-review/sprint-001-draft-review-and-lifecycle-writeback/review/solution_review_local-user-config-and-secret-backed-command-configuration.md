# Technical Solution Review

- Status: approved
- Date: 2026-04-11
- Solution ID: `technical-solution.local-user-config-and-secret-backed-command-configuration`
- Draft Path: `.repo-ai-governor/draft/local-user-config-and-secret-backed-command-configuration-technical-solution.md`
- Reviewer: `AI-Agent`
- Verdict: `approved`
- Related Lifecycle Entry: `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`

## Review Scope

1. Review mode: `approve-reviewed-solution`
2. Target modules:
   - `runtime.agent-projection`
   - `runtime.governance-clients`
3. Primary comparison surfaces:
   - `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
   - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
   - `.repo-ai-governor/normative_knowledge_sources/product-requirements.md`
   - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
   - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/module-overview.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-onboarding-contract.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-projection-contract.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/remote-api-transport-and-provider-binding-seam.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/module-overview.md`
   - `.repo-ai-governor/draft/api-key-remote-adapter-invocation-technical-solution.md`
4. Canonical artifact path:
   - `.repo-ai-governor/context/dev/project-087-local-user-config-and-secret-command-solution-review/sprint-001-draft-review-and-lifecycle-writeback/review/solution_review_local-user-config-and-secret-backed-command-configuration.md`
5. Re-review focus:
   - whether the draft now chooses a formal producer/consumer landing instead of leaving promotion ownership unresolved
   - whether `user-config` authoring facts now normalize into the existing transport-aware onboarding / projection truth
   - whether secret mutation stays outside `connect / doctor / verify` and remains aligned with the active remote-api seam

## Blocking Findings

1. None. 本轮 re-review 未发现新的阻断性问题；上一轮的两条 blocking finding 已全部收口。

## Disposition Of Prior Blocking Findings

1. `[resolved 2026-04-11]` formal landing / lifecycle relationship 现在已经明确收敛。
   - Updated draft evidence:
     - `.repo-ai-governor/draft/local-user-config-and-secret-backed-command-configuration-technical-solution.md:379`
     - `.repo-ai-governor/draft/local-user-config-and-secret-backed-command-configuration-technical-solution.md:394`
     - `.repo-ai-governor/draft/local-user-config-and-secret-backed-command-configuration-technical-solution.md:399`
     - `.repo-ai-governor/draft/local-user-config-and-secret-backed-command-configuration-technical-solution.md:407`
   - Lifecycle write-back evidence:
     - `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
   - Re-review note:
     - draft 现在明确采用 `runtime.agent-projection` producer + `runtime.governance-clients` consumer 的 split ownership，并把与 `technical-solution.api-key-remote-adapter-invocation` 的关系收敛为 companion follow-up，而不是 promotion 时临时发明新的模块归属。lifecycle entry 也同步补上了这两个 `target_module_ids`。

2. `[resolved 2026-04-11]` `user-config` 默认值现在已映射到 canonical transport-aware onboarding / projection truth。
   - Updated draft evidence:
     - `.repo-ai-governor/draft/local-user-config-and-secret-backed-command-configuration-technical-solution.md:465`
     - `.repo-ai-governor/draft/local-user-config-and-secret-backed-command-configuration-technical-solution.md:490`
     - `.repo-ai-governor/draft/local-user-config-and-secret-backed-command-configuration-technical-solution.md:511`
     - `.repo-ai-governor/draft/local-user-config-and-secret-backed-command-configuration-technical-solution.md:529`
     - `.repo-ai-governor/draft/local-user-config-and-secret-backed-command-configuration-technical-solution.md:574`
   - Re-review note:
     - draft 已把原来容易形成平行 vocabulary 的 `connect.defaults.*` authoring 改写为 `tools.<surface>.remoteApi.*`，并明确规定这些 authoring facts 在进入 runtime 时必须先归一化为 `enabled_tools[]`、`configured_remote_api` 与 `AgentDescriptor.selected_*`。同时它也保留了 `connect / doctor / verify` 的 analyze-first / read-only 边界，把 secret 创建更新继续放在显式 `config` / `secret` surface。

## Non-Blocking Suggestions

1. promotion 时建议把 `user-config.yaml` 示例再补一条 `claude-code` row，验证 `vendorBinding` 省略但 runtime materialize 的规则不是只对 `codex` 成立。
2. `cli-preferences.yaml -> user-config.yaml` 的迁移规则虽然已补边界，但 promotion 时最好再固定“首次写入自动迁移”还是“显式迁移命令”这件事，避免实现窗口再出现行为分叉。

## Promotion Interlocks

1. promotion 必须同时更新 `runtime.agent-projection` producer truth 与 `runtime.governance-clients` consumer truth；只 formalize command surface 而不补 canonical onboarding / projection contract 不算完成。
2. 若 formal cutover 会把 `workspace.mode_preference`、canonical `user-config.yaml` path 或 command-surface wording 提升为产品公开承诺，则必须在同一 change window 同步 PRD / overall / architecture docs。
3. `connect / doctor / verify` 必须继续尊重 secret store 与 provider-owned config 的 read-only discovery boundary；secret mutation 只能由显式 `config` / `secret` follow-up surface 承接。

## Verification

1. Review baseline refreshed from:
   - updated draft file
   - lifecycle registry entry
   - PRD brief/full
   - overall technical solution + architecture blueprint
   - `runtime.agent-projection` overview + onboarding/projection contracts + active remote-api ADR
   - `runtime.governance-clients` overview
   - prior canonical review artifact
   - active `api-key-remote-adapter-invocation` solution context
2. Docs-only re-review window:
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
