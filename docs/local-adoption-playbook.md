# Local Adoption Playbook

## 1. Scope

This playbook is for repository users who need to onboard, debug, and upgrade `repo-ai-governor` locally without waiting for npm release publication.

## 2. Install Strategy Matrix

| Mode | Typical Use | Command |
|---|---|---|
| `path` | Fast local iteration | `pnpm add --save-exact <governor-repo>` |
| `link` | Source-linked development | `pnpm add --save-exact link:<governor-repo>` |
| `tgz` | Stage 9B follow-up (known limitation in Stage 9A) | `pnpm pack --json` + `pnpm add --save-exact <tarball>` |

Operational baseline for Stage 9A clean-room: `path + link`.
Known limitation baseline: `tgz` currently fails at `pnpm exec repo-ai-governor --help` with
`ERR_MODULE_NOT_FOUND(@repo-ai-governor/cli)` in clean-room validation, so it is not a Stage 9A recommended path.

## 3. Bootstrap And Read-only Precheck

Run the baseline chain in target repo:

```bash
pnpm exec repo-ai-governor --help
pnpm exec repo-ai-governor init --output json
pnpm exec repo-ai-governor doctor --output json
pnpm exec repo-ai-governor check --output json
```

When repository is non-writable, `doctor` should report read-only attach semantics.

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

Switch to `repo_local` via `.repo-ai-governor/governor.yaml`:

```yaml
schemaVersion: "1.1"
workspace:
  mode: repo_local
  migrationPolicy: copy_verify_switch_rollback
```

Rollback plan:

1. Set `workspace.mode` back to `tool_managed`.
2. Run `init` and then `doctor`.
3. Verify `workspaceRoot` and attach mode in JSON output diagnostics.

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
2. `tgz` remains a Stage 9B hardening/fix-forward item until the runtime package resolution issue is closed.

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
