# Technical Solution Review

- Status: approved
- Date: 2026-04-20
- Solution ID: `technical-solution.vscode-plugin-direct-api-key-and-secret-backed-provider-onboarding`
- Draft Path: `.repo-ai-governor/draft/vscode-plugin-direct-api-key-and-secret-backed-provider-onboarding-technical-solution.md`
- Reviewer: `AI-Agent`
- Verdict: `approved`
- Related Lifecycle Entry: `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`

## Review Scope

1. Review mode: `review-draft-solution`
   - delegated reviewer rounds were not explicitly requested in this turn
   - the review was completed locally with one main-agent remediation pass and one local post-fix recheck
2. Target modules:
   - `runtime.governance-clients`
   - `runtime.agent-projection`
3. Primary comparison surfaces:
   - `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
   - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
   - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
   - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/module-overview.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/vscode-governance-workbench-surface-contract.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/local-user-config-and-secret-command-contract.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/module-overview.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-onboarding-contract.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/local-user-config-defaults-and-secret-backed-credential-resolution.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/remote-api-transport-and-provider-binding-seam.md`
   - `.repo-ai-governor/draft/local-user-config-and-secret-backed-command-configuration-technical-solution.md`
   - `.repo-ai-governor/draft/api-key-remote-adapter-invocation-technical-solution.md`
4. Canonical artifact path:
   - `.repo-ai-governor/draft/approved_solution_review_vscode-plugin-direct-api-key-and-secret-backed-provider-onboarding.md`
5. Review path decision:
   - `current-context.md` 当前为 `idle`，没有 active primary stream 可承载新的 review artifact
   - 本轮因此沿用 draft 邻接的单一 canonical artifact path，并在同一 review window 内收口为 `approved`
6. Approval focus:
   - 插件 direct onboarding 是否与 `connect / doctor / verify` 的 analyze-first 边界清晰分离
   - 插件是否错误重写了 `runtime.agent-projection` 已 formalize 的 `transport / provider binding / next_action(s)` truth
   - 本方案是否会在 promotion 时误 supersede 现有 active runtime solution
   - canonical secret owner 是否仍保持为 Governor managed secret backend，而不是 extension-local secret store

## Reviewer Round

1. Local review round: `round-1-initial-review`
   - verdict: `changes_required`
   - outcome: returned `2` blocking findings focused on analyze-first boundary ownership and active-solution relationship freeze
2. Main-agent remediation:
   - accepted both blocking findings
   - revised the draft to freeze:
     - plugin direct onboarding must use an explicit mutation seam instead of overloading `connect / doctor / verify`
     - `runtime.agent-projection` remains owner of `transport / provider / vendorBinding / next_action(s)` canonical truth
     - this solution is a host-facing follow-up rather than a supersede of the active `remote_api` and secret-backed onboarding solutions
3. Local post-fix recheck: `round-1-post-fix-recheck`
   - outcome: no actionable blocker remained

## Blocking Findings

1. None. 本轮批准前复核未发现剩余阻断性问题；初始 blocking findings 已全部收口。

## Disposition Of Prior Blocking Findings

1. `[resolved 2026-04-20]` draft 已冻结 analyze-first boundary，不再允许 promotion 把 direct API key entry 偷渡进 `connect / doctor / verify`。
   - Updated draft evidence:
     - `.repo-ai-governor/draft/vscode-plugin-direct-api-key-and-secret-backed-provider-onboarding-technical-solution.md:76`
     - `.repo-ai-governor/draft/vscode-plugin-direct-api-key-and-secret-backed-provider-onboarding-technical-solution.md:159`
     - `.repo-ai-governor/draft/vscode-plugin-direct-api-key-and-secret-backed-provider-onboarding-technical-solution.md:202`
     - `.repo-ai-governor/draft/vscode-plugin-direct-api-key-and-secret-backed-provider-onboarding-technical-solution.md:239`
     - `.repo-ai-governor/draft/vscode-plugin-direct-api-key-and-secret-backed-provider-onboarding-technical-solution.md:256`
   - Normative evidence:
     - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/module-overview.md`
     - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-onboarding-contract.md`
     - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/local-user-config-defaults-and-secret-backed-credential-resolution.md`
   - Approval note:
     - draft 现在明确把 plugin-native provider onboarding 定义为独立 host-facing mutation surface
     - `connect / doctor / verify` 继续保持 analyze-first / read-only onboarding truth

2. `[resolved 2026-04-20]` draft 已冻结 active-solution relationship，不再模糊重写 `runtime.agent-projection` 的 provider-binding / readiness owner split，也不再隐含 supersede 现有 active solution。
   - Updated draft evidence:
     - `.repo-ai-governor/draft/vscode-plugin-direct-api-key-and-secret-backed-provider-onboarding-technical-solution.md:15`
     - `.repo-ai-governor/draft/vscode-plugin-direct-api-key-and-secret-backed-provider-onboarding-technical-solution.md:76`
     - `.repo-ai-governor/draft/vscode-plugin-direct-api-key-and-secret-backed-provider-onboarding-technical-solution.md:160`
     - `.repo-ai-governor/draft/vscode-plugin-direct-api-key-and-secret-backed-provider-onboarding-technical-solution.md:202`
     - `.repo-ai-governor/draft/vscode-plugin-direct-api-key-and-secret-backed-provider-onboarding-technical-solution.md:230`
     - `.repo-ai-governor/draft/vscode-plugin-direct-api-key-and-secret-backed-provider-onboarding-technical-solution.md:261`
   - Normative evidence:
     - `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
     - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/module-overview.md`
     - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/remote-api-transport-and-provider-binding-seam.md`
     - `.repo-ai-governor/draft/local-user-config-and-secret-backed-command-configuration-technical-solution.md`
     - `.repo-ai-governor/draft/api-key-remote-adapter-invocation-technical-solution.md`
   - Approval note:
     - draft 现在明确写成 `runtime.governance-clients` 的 host-facing follow-up
     - promotion 默认只应新增/扩展 governance-clients formal docs；只有 generic onboarding truth 真正变化时，才最小增量修订 `runtime.agent-projection`

## Non-Blocking Suggestions

1. None. 本轮没有需要阻止批准的非阻断建议项；余下事项都已经转入 promotion interlocks。

## Promotion Interlocks

1. promotion 必须把本方案主要落在 `runtime.governance-clients` 的 host-facing contract / ADR，而不是把它写成对 `runtime.agent-projection` 的并行重定义。
2. promotion 不得把 VS Code `ExtensionContext.secrets` 或任何 extension-local persistence 写成 canonical secret owner；managed secret backend 仍是正式持久化真值。
3. 若 promotion 发现需要改变 generic `next_action(s)` taxonomy、`vendorBinding` 解析规则或 `credentialRef` canonical semantics，必须把这部分作为 `runtime.agent-projection` 的显式 contract change 处理，而不是在 VS Code ADR 中顺手改口。
4. README / playbook wording 的 editor-first uplift 必须与真实插件行为同步；不得出现 runtime 还没支持、文档先宣称的情况。

## Main-Agent Recheck

1. `[resolved]` analyze-first boundary 现已清晰。
   - new draft no longer leaves room for secret/config mutation to hide behind `connect / doctor / verify`
2. `[resolved]` owner split 现已清晰。
   - `runtime.agent-projection` 继续拥有 transport / provider-binding / readiness taxonomy
   - `runtime.governance-clients` 负责 host-facing onboarding UX 与 CTA 映射
3. `[resolved]` canonical secret boundary 现已清晰。
   - VS Code platform secret capability is supplemental evidence only
   - Governor managed secret backend remains the persisted secret owner
4. `[resolved]` lifecycle relationship 现已清晰。
   - the draft is approved as a follow-up technical solution, not as a silent supersede of the active `remote_api` and secret-backed onboarding solutions

## Verification

1. Review baseline built from:
   - target draft
   - lifecycle registry entry
   - PRD brief
   - overall technical solution
   - architecture blueprint
   - `runtime.governance-clients` overview / contracts
   - `runtime.agent-projection` overview / contract / active ADRs
   - related active solutions for `remote_api` and secret-backed local config
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
3. Lifecycle write-back:
   - update solution status to `approved`
   - add the canonical approved review artifact to `review_paths`
   - fill `approved_at` / `approved_by`
   - keep `final_paths` empty
4. Handoff:
   - ready for `technical-solution-promotion`
