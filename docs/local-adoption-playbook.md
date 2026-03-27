# Local Adoption Playbook

## 1. Scope

This playbook is for repository users who need to onboard, debug, and upgrade `repo-ai-governor` locally without waiting for npm release publication.

## 2. Install Strategy Matrix

| Mode | Typical Use | Command |
|---|---|---|
| `path` | Fast local iteration | `pnpm add --save-exact <governor-repo>` |
| `link` | Source-linked development | `pnpm add --save-exact link:<governor-repo>` |
| `tgz` | Candidate/GA rehearsal and reproducible package install | `pnpm pack --json` + `pnpm add --save-exact <tarball>` |
| `dist-binary` | No-install rehearsal for Yarn/npm or dirty repositories | `node <governor-repo>/dist/bin/repo-ai-governor.js <command>` |

Operational baseline:

1. `path + link` remain the default local adoption paths.
2. `tgz` is supported for clean-room and release-candidate rehearsal when the install environment can reach the npm registry.
3. `tgz` is not offline/self-contained; external dependencies such as `commander`, `i18next`, and `yaml` are still resolved during `pnpm add`.
4. `dist-binary` is the preferred rehearsal path when you need to validate CLI behavior before mutating an existing Yarn/npm repository dependency graph.

## 2.1 Published Package Surface

Published tarballs are expected to include:

1. `README.md` and `README.zh-CN.md`
2. `docs/local-adoption-playbook.md` and `docs/local-adoption-playbook.zh-CN.md`
3. `examples/`
4. `integrations/ide/` and `integrations/desktop/`
5. `.codex/skills/`

Repo-local skills under `.codex/skills/` are reference assets only. If you want Codex to discover them in a target repository, copy the selected skill into that target repository's `.codex/skills/` directory.

## 3. Bootstrap And Read-only Precheck

Run the baseline chain in target repo:

```bash
pnpm exec repo-ai-governor --help
pnpm exec repo-ai-governor init --output json
pnpm exec repo-ai-governor doctor --output json
pnpm exec repo-ai-governor check --output json
```

If you are using `dist-binary` rehearsal, replace `pnpm exec repo-ai-governor` with:

```bash
node <governor-repo>/dist/bin/repo-ai-governor.js <command>
```

When repository is non-writable, `doctor` should report read-only attach semantics.

Bootstrap notes from pilot validation:

1. `init` defaults to `tool_managed`, so fresh target repositories may not create `.repo-ai-governor/` immediately.
2. Fresh external repos may see `doctor` warning `baseline_docs missing=5/5`; treat this as current external-adopter baseline, not bootstrap failure.
3. External target repos may see `check` warnings such as `check-task-ledger-sync=script_not_found`; this is expected unless the target repo also vendors self-host governance scripts.

## 3.1 Multi-tool Onboarding (Codex / Claude Code / GitHub Copilot)

Use a three-step path: tool readiness -> Governor wiring -> diagnostics verification.

1. First make sure each target AI tool can run independently in the target repository (pick only what you use):
   - Codex CLI: `codex --help`
   - Claude Code CLI: `claude --help`
   - GitHub Copilot: open this repository in IDE and confirm Copilot chat is available (for CLI-oriented setup, validate `gh auth status` first).
2. Register role contracts in `.repo-ai-governor/governor.yaml` (current config entry is `roles`; no separate `adapters` block required):

```yaml
roles:
  - roleProfileId: coder-codex
    roleProfileVersion: "1.0.0"
    displayName: Codex Coder
    responsibilities:
      - implement task cards
    capabilities:
      - code generation
      - unit test update
    permissionCeiling:
      - repo.read
      - repo.write
    roleSource: custom
    status: active
```

3. Run governance flow and verify routing/handling signals:

```bash
pnpm exec repo-ai-governor run --output json --dry-run --trace
```

Check `context/diagnostics/trace/<execution_id>.trace.json`:

1. `adapterInvocationSummary[].routeKey` for expected route semantics.
2. `adapterInvocationSummary[].handledBy` for current execution surface.
3. `summary.policyOutcome` for risk/policy gate behavior.

Notes:

1. In Stage 9A baseline, `handledBy=cli-governance-runtime` is expected (governance chain first).
2. Stage 9B (`TK-082`) continues with real Codex/Claude Code/Copilot invocation paths while keeping the same diagnostics contract.

## 4. Workspace Mode Switch And Rollback

Default mode is `tool_managed`.

Switch to `repo_local` with explicit migration commands:

```bash
pnpm exec repo-ai-governor workspace --workspace-action dry-run --workspace-mode repo_local --output json
pnpm exec repo-ai-governor workspace --workspace-action execute --workspace-mode repo_local --output json
pnpm exec repo-ai-governor workspace --workspace-action rollback --workspace-plan <plan-path> --output json
```

Rollback plan:

1. Keep the printed `plan-path` from `workspace dry-run` or `workspace execute`.
2. Use that same `plan-path` for explicit rollback.
3. Re-run `doctor` and verify `workspaceRoot` resolves back to `tool_managed`.

Artifact locality contract:

1. `workspace dry-run` writes the plan artifact under the current active workspace root.
2. A successful `workspace execute` rewrites the plan and execution artifacts under the target workspace root.
3. `workspace rollback` writes the rollback artifact under the restored source workspace root and removes empty `.repo-ai-governor-migration/<migration-id>` scratch directories after cleanup.

## 5. Local Debug Path

### 5.1 Dry-run and Trace

```bash
pnpm exec repo-ai-governor run --output json --dry-run --trace
```

### 5.2 Replay

```bash
pnpm exec repo-ai-governor run --output json --replay <replay-file-path>
```

Use replay for deterministic diagnosis when runtime outputs already exist.

## 6. Review-verify And Ledger Backfill

Run end-to-end collaboration path:

```bash
pnpm exec repo-ai-governor review --output json
pnpm exec repo-ai-governor review-verify --output json
```

Expected artifact paths are under workspace context:

1. `context/review-queue/requests`
2. `context/review-queue/results`
3. `context/ledger-backfill/review-verify`

These artifacts are required for Stage 9B rehearsal where review verification and task-ledger backfill should be auditable.

## 7. Examples Mapping

Use root examples as the canonical rehearsal assets:

1. `examples/single-role-minimal-flow`
2. `examples/multi-role-collaboration-flow`
3. `examples/hitl-escalation-flow`
4. `examples/restricted-network-degrade-flow`

Validation commands:
Run from `<governor-repo>`:

```bash
pnpm run check:examples-doc-smoke
pnpm run check:examples-runtime-smoke
pnpm run check:examples-smoke
```

## 8. Clean-room Verification And Differences

Run clean-room verification baseline from governor repository:

```bash
pnpm run release:verify-cleanroom-local-install
```

Notes:

1. Stage 9A baseline enforces repeated path/link validation.
2. Stage 9B+ baseline includes `tgz` install smoke to verify packaged runtime dependency resolution.
3. `tgz` validation is an online check, not proof of offline/self-contained installation.

## 9. Governance Gates For Adoption

For full local delivery confidence:
Run from `<governor-repo>`:

```bash
pnpm run check
pnpm run release:verify-local
pnpm run release:ga-check
```

## 10. Upgrade Checklist

1. Read `CHANGELOG.md` for migration notes.
2. Re-run baseline bootstrap chain in one fresh target repo.
3. Re-run examples smoke gates.
4. Re-run clean-room verification before broader rollout.

## 11. Known Limitations

1. `dist-binary` validates CLI/runtime behavior but does not prove packaged install surface.
2. `doctor` / `check` still emit external-baseline warnings in fresh target repos until self-host governance docs/scripts are explicitly vendored there.
