# Technical Solution Review

- Status: review_pending
- Date: 2026-04-12
- Solution ID: `technical-solution.session-shell-secure-secret-input-and-redacted-command-handoff`
- Draft Path: `.repo-ai-governor/draft/session-shell-secure-secret-input-and-redacted-command-handoff-technical-solution.md`
- Reviewer: `AI-Agent`
- Verdict: `changes_required`
- Related Lifecycle Entry: `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`

## Review Scope

1. Review mode: `review-draft-solution`
2. Target modules:
   - `runtime.cli-interactive-shell`
   - `runtime.governance-clients`
3. Boundary areas requiring explicit formal landing before approval:
   - `entry.cli` implementation surface
   - future service-owned `session.main` secure-input outcome
4. Primary comparison surfaces:
   - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
   - `.repo-ai-governor/normative_knowledge_sources/product-requirements.md`
   - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
   - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`
   - `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/technical-solution-module-registry.yaml`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/module-overview.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/contracts/cli-session-shell-contract.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/adrs/ink-owned-input-and-action-driven-session-shell.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/module-overview.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/local-user-config-and-secret-command-contract.md`
   - `.repo-ai-governor/draft/local-user-config-and-secret-backed-command-configuration-technical-solution.md`
5. Canonical artifact path:
   - `.repo-ai-governor/context/dev/project-090-session-shell-secure-secret-input-solution-review/sprint-001-draft-review-and-lifecycle-writeback/review/solution_review_session-shell-secure-secret-input-and-redacted-command-handoff.md`
6. Review focus:
   - whether the draft really closes the `slashQuery / composer / preview` leakage surface it claims to eliminate
   - whether the new secure-input flow has one formal producer/consumer landing instead of mixing registered modules with unregistered implementation surfaces
   - whether Phase B can be promoted later without inventing a new service-owned outcome contract during implementation

## Blocking Findings

1. The draft does not yet explain how raw secret bytes are prevented from entering `slashQuery`/`composer` before the shell rejects `/secret set <keyName> <secret>` input.
   - Draft evidence:
     - `.repo-ai-governor/draft/session-shell-secure-secret-input-and-redacted-command-handoff-technical-solution.md:51`
     - `.repo-ai-governor/draft/session-shell-secure-secret-input-and-redacted-command-handoff-technical-solution.md:53`
     - `.repo-ai-governor/draft/session-shell-secure-secret-input-and-redacted-command-handoff-technical-solution.md:235`
     - `.repo-ai-governor/draft/session-shell-secure-secret-input-and-redacted-command-handoff-technical-solution.md:295`
     - `.repo-ai-governor/draft/session-shell-secure-secret-input-and-redacted-command-handoff-technical-solution.md:439`
     - `.repo-ai-governor/draft/session-shell-secure-secret-input-and-redacted-command-handoff-technical-solution.md:456`
   - Comparison surface:
     - `contract.cli.session-shell.v1` currently models `composer_value` and `slash_query` as active presenter state, and the draft itself only says “detect extra token then clear buffer”. That is not enough to satisfy the stronger requirement “raw secret never enters `slashQuery`”.
   - Why this blocks approval:
     - the draft’s primary success criterion is eliminating secret exposure on the shell presenter path; without an explicit state-transition point that takes ownership before secret characters land in slash/composer state, the most important safety claim remains under-specified.
   - Required remediation:
     - either narrow Phase A to a submitted `/secret set <keyName>` transition that opens secure capture before any secret bytes are typed, or explicitly specify a keystroke-level interception model that keeps post-`<keyName>` input out of `composer_value` / `slash_query`.

2. Phase B introduces a new service-owned `local_secure_input_request` outcome, but the draft does not assign that outcome to a formal producer module / contract or keep the scope limited to already-declared module ownership.
   - Draft evidence:
     - `.repo-ai-governor/draft/session-shell-secure-secret-input-and-redacted-command-handoff-technical-solution.md:6`
     - `.repo-ai-governor/draft/session-shell-secure-secret-input-and-redacted-command-handoff-technical-solution.md:10`
     - `.repo-ai-governor/draft/session-shell-secure-secret-input-and-redacted-command-handoff-technical-solution.md:328`
     - `.repo-ai-governor/draft/session-shell-secure-secret-input-and-redacted-command-handoff-technical-solution.md:330`
     - `.repo-ai-governor/draft/session-shell-secure-secret-input-and-redacted-command-handoff-technical-solution.md:399`
   - Comparison surface:
     - `contract.cli.session-shell.v1` does not currently expose `local_secure_input_request`, and `technical-solution-module-registry.yaml` has no registered module `entry.cli`; the draft therefore mixes formal module ids with implementation surfaces while also proposing a new service-owned outcome shape.
   - Why this blocks approval:
     - promotion would not know whether the new outcome belongs under `runtime.cli-interactive-shell`, `runtime.governance-clients`, another service-owned runtime module, or a split follow-up artifact; that leaves formal landing and direct-consumer sync unresolved.
   - Required remediation:
     - either keep this solution explicitly Phase-A-only and move Phase B to a separate follow-up solution, or add explicit producer/consumer landing for the new secure-input request outcome and remove `entry.cli` from the target-module truth surface.

## Non-Blocking Suggestions

1. 在 Phase A 补一张简短状态机表，明确 `/secret set <keyName>`、`Esc`、`/clear`、取消、失败、`resume` 的前台状态迁移与 transcript 行为。
2. `secure_local` 更适合作为内部 controller/action 命名，而不是用户可见能力名；promotion 时最好把对外表述继续固定为 “secure local capture / secret authoring flow”。

## Promotion Interlocks

1. 若 formal cutover 会修改 `contract.cli.session-shell.v1`，必须在同一 change window 同步 `runtime-cli-interactive-shell/module-overview.md`。
2. 若 Phase B 仍保留在同一 solution scope 内，promotion 前必须为 `local_secure_input_request` 指定 formal producer module / contract，并同步 direct consumers。
3. `entry.cli` 只能作为实现落点或 code surface 记录；除非先更新 module registry，否则不能继续作为 target module truth 使用。

## Verification

1. Review baseline refreshed from:
   - draft file
   - lifecycle registry
   - module registry
   - PRD brief/full
   - overall technical solution + architecture blueprint
   - `runtime.cli-interactive-shell` overview + session-shell contract + Ink input ADR
   - `runtime.governance-clients` overview + local user config / secret contract
   - already-approved local user config / secret direction draft
2. Docs-only review window:
   - no executable code changed
   - build not required

## Decision

1. Review outcome: `changes_required`
2. Lifecycle recommendation:
   - create/update solution to `review_pending`
   - keep this canonical artifact path in `review_paths`
   - keep `approved_at` / `approved_by` empty
   - keep `final_paths` empty
   - revise the draft, then rerun `technical-solution-review`
