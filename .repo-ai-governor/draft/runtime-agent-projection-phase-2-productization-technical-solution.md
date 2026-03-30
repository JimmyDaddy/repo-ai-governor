# Runtime Agent Projection Phase 2 Productization Technical Solution (Draft)

- Status: draft
- Date: 2026-03-30
- Scope: adopter onboarding / connect apply workflow / agent projection presentation / UI consumer
- Related:
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/module-overview.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-onboarding-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-projection-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/multi-tool-onboarding-and-role-agent-projection-cutover.md`
  - `.repo-ai-governor/context/dev/project-028-multi-ai-tools-onboarding-role-agent-projection/project-028-multi-ai-tools-onboarding-role-agent-projection-completion-audit-summary.md`
  - `apps/cli/src/commands/connect-command.ts`
  - `apps/cli/src/cli-output-presenter.ts`
  - `apps/cli/src/react-cli/views/session-shell-app.tsx`
  - `packages/reporting/src/report-builder.ts`
  - `integrations/desktop/README.md`

## 1. Context

`runtime.agent-projection` v1 has already landed the core runtime seam:

1. `connect / doctor / verify` can generate onboarding diagnostics and agent view payloads.
2. `run / review / reporting` can consume `AgentDescriptor` and shared-session projection.
3. LangGraph supervisor now consumes descriptors without becoming a new canonical runtime.

The remaining gap is no longer "does the runtime seam exist?" but "is the adopter path complete enough to feel productized?"

The main residual gaps are:

1. `connect` only generates a candidate config artifact; there is no official apply step.
2. Candidate generation has no first-class diff / merge explain artifact.
3. The recommended adopter chain `connect -> doctor -> verify -> run --dry-run --trace` lacks a stronger automated smoke path for real external repositories.
4. `agentView` is structurally available but its human-facing presenters still hide important routing facts such as `selected_by`, fallback reasons, and capability gaps.
5. Desktop / richer UI surfaces only have data readiness today; they do not yet have one formal consumer surface dedicated to agent projection.

## 2. Goals

1. Keep `connect` safe by default while closing the candidate-to-active-config gap with one explicit apply workflow.
2. Make candidate config output self-explanatory by adding stable diff / merge explain artifacts and presenter summaries.
3. Strengthen adopter confidence with one repeatable smoke gate that exercises the full onboarding chain in a real external repository rehearsal path.
4. Upgrade `agentView` from "available in JSON" to "obvious in pretty / session-shell / reporting surfaces".
5. Introduce one formal UI consumer baseline that desktop or richer UI surfaces can reuse without inventing their own projection semantics.

## 3. Non-Goals

1. Do not change the canonical rule that `connect` itself remains analyze-first and non-mutating by default.
2. Do not turn `AgentProjectionService` into a second execution runtime.
3. Do not let desktop or presenter layers become new sources of route / role / session truth.
4. Do not block phase-2 on a full desktop product; one formal consumer baseline is sufficient.

## 4. Decision Summary

### 4.1 Keep `connect` default behavior non-mutating

`connect` should continue to generate a reviewable candidate artifact and diagnostics payload by default. This preserves the current contract boundary and keeps onboarding safe in adopter repositories.

### 4.2 Add explicit `connect diff` and `connect apply` surfaces

Phase-2 should extend the command family with:

1. `connect`
   - Generate candidate config, diagnostics, agent view, diff summary, and merge explain artifacts.
2. `connect diff [candidate-path]`
   - Re-render the diff / merge explain against the current active config without regenerating the candidate.
3. `connect apply [candidate-path]`
   - Apply one previously generated candidate to the active `governor.yaml` with rollback and receipt artifacts.

### 4.3 Apply must be explicit, reviewable, and reversible

`connect apply` must:

1. Require one frozen candidate artifact path or one recent `connect` diagnostics reference.
2. Verify the candidate's source-config fingerprint before writing the active file.
3. Create one rollback snapshot before mutating `governor.yaml`.
4. Write one apply receipt artifact with before/after hashes and the paths involved.
5. Never silently regenerate the candidate during apply.

### 4.4 Diff / merge explain is a first-class artifact

Phase-2 should produce both machine-readable and human-readable summaries:

1. `candidate-diff.json`
2. `candidate-diff.md`
3. `candidate-merge-explain.json`

The summary must highlight:

1. Added / removed / changed roles.
2. Tool enablement changes.
3. Routing changes by role.
4. Overwrite vs merge behavior.
5. Risk notes such as downgraded capability coverage or fallback-only bindings.

### 4.5 `agentView` becomes presenter-owned, not just JSON-owned

Phase-2 should add one shared presenter/view-model seam so CLI pretty, session shell, and future UI consumers can render the same projection facts:

1. Selected surface.
2. `selected_by` source (`primary`, `fallback`, `manual_override`, and similar routing causes).
3. Projection status.
4. Fallback reasons / unavailable reasons.
5. Capability degradation or unsupported capability gaps.
6. Shared-session status when available.

### 4.6 UI consumer baseline should target transport-neutral desktop consumption

The first formal UI consumer should not bypass runtime internals. It should consume transport-neutral projection data and session projection facts derived from the existing service-backed runtime.

## 5. Detailed Design

### 5.1 Candidate Artifact Model

The current candidate YAML and diagnostics JSON remain, but phase-2 adds:

1. `source_config_hash`
2. `candidate_config_hash`
3. `diff_summary`
4. `merge_explain`
5. `apply_ready`
6. `apply_blockers[]`

Recommended artifact set:

1. `<workspace_root>/context/diagnostics/connect/<connect-id>.governor.yaml`
2. `<workspace_root>/context/diagnostics/connect/<connect-id>.json`
3. `<workspace_root>/context/diagnostics/connect/<connect-id>.diff.json`
4. `<workspace_root>/context/diagnostics/connect/<connect-id>.diff.md`
5. `<workspace_root>/context/diagnostics/connect/<connect-id>.merge-explain.json`

### 5.2 `connect diff`

`connect diff` should support:

1. `connect diff <candidate-path>`
2. `connect diff --latest`

It should fail closed when:

1. The candidate file is unreadable.
2. The candidate does not match the expected schema family.
3. The active config changed in a way that makes the original diff stale and no recomputation path is available.

### 5.3 `connect apply`

Recommended command shape:

```bash
pnpm exec repo-ai-governor connect apply <candidate-path> --output json
```

Optional flags:

1. `--latest`
2. `--force`
3. `--no-rollback`
4. `--write-mode merge|overwrite`

Apply flow:

1. Read candidate artifact.
2. Read active `governor.yaml`.
3. Verify source fingerprint unless `--force` is explicitly set.
4. Create rollback snapshot.
5. Apply candidate semantics to the active config.
6. Validate the resulting config.
7. Write apply receipt artifact.
8. Return one follow-up suggestion to run `doctor --adapters`, `verify --adapters`, and `run --dry-run --trace`.

Apply artifacts:

1. `<workspace_root>/context/diagnostics/connect/apply/<apply-id>.json`
2. `<workspace_root>/context/diagnostics/connect/apply/<apply-id>.rollback.governor.yaml`

### 5.4 Merge Semantics

`connect` already supports candidate generation in merge or overwrite mode. Phase-2 must make that behavior legible.

The merge explain artifact should answer:

1. Which fields come from the existing active config untouched.
2. Which fields come from the candidate.
3. Which roles or tools are being removed only because overwrite is active.
4. Which route bindings are fallback-preserving vs replacement.

### 5.5 Stronger Adopter Smoke Gate

Phase-2 should add one stronger automation path for external repository rehearsal.

Recommended scope:

1. Bootstrap one target repository.
2. Run `connect`.
3. Assert candidate / diff / merge explain artifacts exist.
4. Run `connect apply`.
5. Run `doctor --adapters`.
6. Run `verify --adapters`.
7. Run `run --dry-run --trace`.
8. Collect all resulting artifacts and fail on hard onboarding blocks.

Suggested delivery shape:

1. One acceptance script under `scripts/acceptance/`
2. One documented runbook entry in the adoption playbook
3. One smoke gate wrapper that can target a real external repo path

### 5.6 Agent View Presenter Upgrade

Phase-2 should add one shared presenter/view-model builder for agent projection facts instead of scattering formatting logic.

The presenter should provide:

1. A compact summary row per agent.
2. A richer detail block for pretty / session-shell surfaces.
3. Stable labels for `selected_by`, capability gaps, and fallback reasons.
4. One reporting-safe view model shared by CLI and future UI consumers.

CLI pretty should show:

1. `agent_role`
2. `role_profile_id`
3. `selected_surface`
4. `selected_by`
5. `projection_status`
6. `capability_gap_summary`

Session shell should gain one dedicated "Agent View" area or section that can surface:

1. Active route.
2. Current selection reason.
3. Degraded capability warnings.
4. Shared-session status summary.

### 5.7 Formal UI Consumer Baseline

The first formal UI consumer should be one projection panel / view-model path that is desktop-ready but still compatible with React CLI surfaces.

Recommended structure:

1. Introduce one transport-neutral `AgentProjectionViewModel` builder.
2. Introduce one React consumer component that renders the view model.
3. Keep desktop integration consuming the same DTO / view-model seam instead of runtime internals.

This can land as:

1. One shared projection presenter in CLI/runtime code.
2. One React panel component consumed first by session shell or a desktop-ready example surface.

The important part is not the package name; it is keeping the consumer contract neutral and reusable.

## 6. Contract Impact

### 6.1 `contract.runtime.agent-onboarding.v1`

No breaking change is required if:

1. `connect` itself remains non-mutating.
2. `connect apply` is treated as a separate config-application surface.

Additive fields or companion artifacts are acceptable as long as current v1 fields remain stable.

### 6.2 `contract.runtime.agent-projection.v1`

No breaking field removal is required. Phase-2 mainly changes consumption semantics by making existing fields more visible and adding richer derived presentation.

If new machine fields are added, they should be additive and backwards-compatible.

## 7. Risks

1. `connect apply` must not become an implicit rewrite hidden behind the default `connect` command.
2. Source-config fingerprint drift must be handled explicitly, otherwise stale candidates can overwrite unrelated edits.
3. Presenter upgrades must remain derived views; they cannot become new route-selection logic.
4. The UI consumer baseline must stay service-backed and transport-neutral, or it will fork runtime truth.

## 8. Review Questions

1. Do we accept `connect diff` and `connect apply` as the command family shape, or do we prefer flags on top of `connect`?
2. Should fingerprint mismatch hard-block apply by default, with `--force` as the only bypass?
3. Should the first formal UI consumer land in the session shell first, or as a desktop-facing example surface first?
4. Do we want apply to be limited to `adapters` block updates only in phase-2, or to support broader config replacement immediately?

## 9. Recommended Phase Map

1. Phase A: finalize the technical solution and activation baseline.
2. Phase B: implement `connect diff` / `connect apply`, rollback snapshotting, and merge explain artifacts.
3. Phase C: implement stronger adopter smoke gate plus richer CLI/session-shell `agentView` presenters.
4. Phase D: add one formal UI consumer baseline and close out docs, review, and rollout evidence.

## 10. Conclusion

`runtime.agent-projection` does not need a new runtime rewrite. It needs one phase-2 productization pass that closes the last adopter-facing gaps:

1. candidate -> diff -> apply
2. stronger automated onboarding validation
3. clearer human-facing agent projection
4. one reusable UI consumer baseline

The safest path is to preserve the current analyze-first `connect` default while adding an explicit, reversible, and reviewable apply workflow.
