# Local Adoption Playbook

This playbook is for people adopting `repo-ai-governor` in a target repository.

Use it when you want a practical answer to questions like:

1. How should I install or rehearse this tool in a real repo?
2. What is the safest path to first success?
3. How do I connect tools, secrets, and user-local defaults?
4. How do I run the first governed loop without taking avoidable risks?

If you maintain or release `repo-ai-governor` itself, use `docs/maintainer-validation-playbook.md` instead.

`docs/support-matrix.md` remains the formal support truth. This playbook is the operator runbook.

## Default Path In One Screen

Most adopters do not need to compare every mode and every command first.

If you want the shortest safe default path, do this:

1. Use `dist-binary` for a no-install rehearsal, or `path` for a real `pnpm` repository.
2. Run `init`.
3. Run `doctor`.
4. Run `adopt bootstrap`.
5. Run `check`.
6. Run `connect`, then `run --dry-run --trace`.

The rest of this document explains when to choose a different path and how to interpret the resulting diagnostics.

## 1. Choose The Lightest Install Path

Start with the smallest thing that proves the behavior you care about.

| Mode | Use it when... | Main command |
|---|---|---|
| `dist-binary` | You want a no-install rehearsal, or the target repo is dirty or non-`pnpm` | `node <governor-repo>/dist/bin/repo-ai-governor.js <command>` |
| `path` | You want the normal local adoption path in a `pnpm` repository | `pnpm add --save-exact <governor-repo>` |
| `link` | The target repo should track your local source checkout closely | `pnpm add --save-exact link:<governor-repo>` |
| `tgz` | You want to rehearse the packaged CLI tarball in an online environment | `pnpm pack --json` then `pnpm add --save-exact <tarball>` |

Rules of thumb:

1. Start with `dist-binary` if you want the lowest-risk proof.
2. Start with `path` if the repo already uses `pnpm` and you expect to keep the governor installed.
3. Use `link` only when live source-following is intentional.
4. Use `tgz` only when you explicitly need packaged-install evidence and the environment can still reach the npm registry. It is not an offline/self-contained installer.

## 2. Fastest Path To First Success

Assume the governor source checkout is `<governor-repo>` and the target repository is `<target-repo>`.

### Path A: no-install rehearsal

```bash
cd <governor-repo>
pnpm run build

cd <target-repo>
node <governor-repo>/dist/bin/repo-ai-governor.js --help
node <governor-repo>/dist/bin/repo-ai-governor.js init --output pretty
node <governor-repo>/dist/bin/repo-ai-governor.js doctor --output json
node <governor-repo>/dist/bin/repo-ai-governor.js check --output json
```

### Path B: install into the target repo

```bash
cd <target-repo>
pnpm add --save-exact <governor-repo>
pnpm exec repo-ai-governor --help
pnpm exec repo-ai-governor init --output pretty
pnpm exec repo-ai-governor doctor --output json
pnpm exec repo-ai-governor check --output json
```

Success looks like this:

1. `init` completes one guided setup path.
2. `doctor` reports facts instead of crashing.
3. `check` returns machine-readable totals even in a repo that is not a self-host copy of this repository.

Notes for external adopters:

1. Fresh target repositories may still report warnings such as `baseline_docs missing=5/5` or `script_not_found`.
2. Treat those as informational unless you are intentionally vendoring this repository's own governance docs and scripts.
3. `init` defaults to `tool_managed`, so a fresh target repo may not create `.repo-ai-governor/` immediately.

## 3. Prefer Managed Installation With `adopt bootstrap`

Once the basic environment bootstrap (`init` + `doctor`) succeeds, use the managed installer quickstart before reaching for lower-level host export commands.

```bash
pnpm exec repo-ai-governor adopt list --output json
pnpm exec repo-ai-governor adopt bootstrap --repo . --hosts codex,claude-code,github-copilot --output json
pnpm exec repo-ai-governor check --output json
```

Why this is the default path:

1. `adopt bootstrap` runs `init -> bootstrap doctor preflight -> adopt apply -> adopt verify` in one fixed installer quickstart.
2. If you omit the selector, bootstrap defaults to the official built-in pack; explicit selectors reuse the current pack-id/profile-alias rules and stay fail-closed on ambiguity.
3. Bootstrap init/bootstrap-doctor/bootstrap-summary artifacts are additive hand-off diagnostics only; the install receipt and `adopt verify` summary remain the canonical install truth under `.repo-ai-governor/adoption/installations/**`.
4. Clean reruns may reuse one matching clean installation, while drift or pack/profile mismatch redirects back to `adopt diff/upgrade/remove`.
5. `check` remains the explicit broader governance follow-up after installation instead of being absorbed into the install result.

After the quickstart succeeds, keep using the managed lifecycle commands for later rechecks or changes:

```bash
pnpm exec repo-ai-governor adopt verify --repo . --output json
pnpm exec repo-ai-governor adopt diff --repo . --output json
pnpm exec repo-ai-governor adopt upgrade --repo . --output json
pnpm exec repo-ai-governor adopt remove --repo . --output json
```

Use the self-host profile only if the target repository should own a repo-local governance workspace template:

```bash
pnpm exec repo-ai-governor adopt bootstrap --adoption-profile self-host-complete --repo . --workspace-mode repo_local --hosts codex --output json
pnpm exec repo-ai-governor check --output json
```

That path seeds empty or template-backed governance surfaces. It does not copy live execution state from this repository.

Read the self-host verification result conservatively:

1. A fresh `self-host-complete + repo_local` bootstrap or follow-up `adopt verify` is expected to return `warn` while starter governance, product-direction, or execution placeholders are still untouched.
2. Those warnings are self-host-only readiness signals; the default `adopter-complete` install path does not inherit them.
3. `adopt verify` now surfaces an `execution_preflight_signal=blocked` warning for untouched self-host starter placeholders; treat that signal as a hard blocker before unattended self-host execution, because the current public contract does not expose a separate automatic preflight command yet.
4. After the repository authors its own repo-local surfaces, use `check` as the explicit broader governance audit instead of treating `adopt verify` as a substitute for full workspace readiness.

## 4. Connect Tools Before You Run

Use `connect` when you want one repository baseline to route multiple tools through the same governed flow.

```bash
pnpm exec repo-ai-governor connect --tools codex,claude-code --preset multi-tool-default --output json
pnpm exec repo-ai-governor doctor --adapters --fix --output json
pnpm exec repo-ai-governor doctor --adapters --output json
pnpm exec repo-ai-governor run --output json --dry-run --trace
```

What each step proves:

1. `connect` writes a reviewable candidate config instead of mutating the active config in place.
2. `doctor --adapters --fix` performs safe local repairs only.
3. A second `doctor --adapters` is the read-only readiness check before real execution.
4. `run --dry-run --trace` is the lowest-risk proof that routing and projected descriptors make sense.

If you want `remote_api` from the start, use explicit authoring flags instead of hand-editing config first. This is the lowest-risk remote-api rehearsal path:

```bash
pnpm exec repo-ai-governor connect --tools codex --remote-api-model codex=gpt-5 --output pretty
pnpm exec repo-ai-governor connect --tools claude-code --remote-api-model claude-code=<model> --remote-api-credential-env-var claude-code=ANTHROPIC_API_KEY --remote-api-endpoint claude-code=https://api.anthropic.com/v1/messages --output pretty
```

Important boundaries:

1. Explicit `remote_api` selection is environment-gated. Warn states do not mean the system silently reused `cli_exec`.
2. `local-model` is a constrained fallback surface, not a drop-in replacement for routes that require `tool_calling`, `structured_output`, or `confirmation_gate`.

### Read Back The Readiness Chain Before The First Real Run

Treat the emitted diagnostics payload as the source of truth. The playbook explains that payload; it does not recalculate readiness on its own.

Use the same commands you already run for onboarding:

```bash
pnpm exec repo-ai-governor connect --tools codex,claude-code --preset multi-tool-default --output json
pnpm exec repo-ai-governor doctor --adapters --fix --output json
pnpm exec repo-ai-governor doctor --adapters --output json
```

Read the fields in this order:

| Field | Where to read it | How to use it |
|---|---|---|
| `verification_status` | `verificationMatrix.verification_status` in the latest emitted `connect` or `doctor` diagnostics artifact | Treat this as the current public readiness verdict for the surface you just ran. Do not infer `pass` from a successful command exit alone. |
| `diagnostic_summary` | `verificationMatrix.diagnostic_summary` | Use it as the compact readback of required-role failures, fallback/degraded role counts, and `doctor --fix` `safe_local_fix=<n>` activity. A `safe_local_fix` count means local workspace/config repairs happened; it does not mean missing CLIs, auth, or models were fixed for you. |
| `next_action` / `next_actions` | `verificationMatrix.next_action` and `verificationMatrix.next_actions` | Treat these as the canonical operator next steps. The playbook may regroup or explain them, but it should not invent a greener state. |
| `launch_diagnostics` | `verificationMatrix.tool_transport_matrix[]` and `verificationMatrix.role_binding_matrix[]` rows for the affected tool/role | Use these additive details only after you know the readiness verdict. They explain facts such as `selected_entrypoint`, `shell_wrapped`, `process_tree_policy`, and `spawn_error_code`. |

If you need help or want a support-truth refresh later, keep the latest `connect` / `doctor` diagnostics artifact path plus the latest `verification_status`, `diagnostic_summary`, and `next_action(s)` together. If the issue only appears on the execution path, add the `run --dry-run --trace` artifact path too. That packet is the evidence hand-off.

## 5. Keep Shared Config And Personal Secrets Separate

Use workspace config for repository-owned truth. Use `config` and `secret` when the setting belongs to one machine or one operator.

```bash
pnpm exec repo-ai-governor config set tools.codex.transport remote_api
pnpm exec repo-ai-governor config set tools.codex.remoteApi.model gpt-5
pnpm exec repo-ai-governor config set tools.codex.remoteApi.credentialRef secret://openai/api-key
printf '%s' "$OPENAI_API_KEY" | pnpm exec repo-ai-governor secret set openai/api-key --stdin
pnpm exec repo-ai-governor secret status
pnpm exec repo-ai-governor connect --tools codex --output pretty
```

Use this pattern when:

1. You want the repo to refer to a stable selector such as `secret://openai/api-key`.
2. You do not want the real API key value committed into `governor.yaml`.
3. Different operators on different machines need different personal defaults.

## 6. Run The First Governed Loop

When the repository is bootstrapped and at least one adapter path is ready, use this minimum end-to-end loop:

```bash
pnpm exec repo-ai-governor plan --output json
pnpm exec repo-ai-governor run --output json --dry-run --trace
pnpm exec repo-ai-governor review --output json
pnpm exec repo-ai-governor review-verify --output json
```

Look for artifacts under the active workspace root, especially:

1. `context/diagnostics/connect/`
2. `context/diagnostics/doctor/`
3. `context/diagnostics/run/`
4. `context/diagnostics/trace/`
5. `context/review-queue/requests`
6. `context/review-queue/results`

In workspaces with canonical sprint `tasks/` surfaces, the review chain can also allocate and advance a `CR-xxx` lifecycle.

## 7. Use The Session Shell When Conversation Is Faster

Use the session shell when you want a conversation-first entry point instead of one-shot commands.

```bash
pnpm exec repo-ai-governor --output pretty
pnpm exec repo-ai-governor --output pretty "summarize this repository"
pnpm exec repo-ai-governor resume [session-id]
```

Quick checks:

1. In local TTY plus `pretty`, the no-subcommand entry should attach to the interactive shell.
2. `resume` should reattach the latest or named persisted session.
3. `/help`, `/history`, `/search <term>`, `/multiline`, and `!<shell-command>` should be available.
4. `plain`, `json`, non-TTY, and `--no-interactive` surfaces should stay non-interactive.

## 8. Common Operations After Day One

### Workspace migration and rollback

Use this when you want the governance workspace inside the target repo instead of tool-managed storage:

```bash
pnpm exec repo-ai-governor workspace dry-run --workspace-mode repo_local --output json
pnpm exec repo-ai-governor workspace execute --workspace-mode repo_local --output json
pnpm exec repo-ai-governor workspace rollback <plan-path> --output json
```

Keep the emitted `plan-path`. That is the hand-off artifact for rollback.

### Controlled upgrades

Use this when the workspace schema or config baseline needs a governed change:

```bash
pnpm exec repo-ai-governor upgrade --output json
pnpm exec repo-ai-governor upgrade apply <report-path> --confirm-upgrade approve --output json
pnpm exec repo-ai-governor upgrade rollback <apply-receipt-or-rollback-snapshot> --output json
```

Preview first. Keep the preview report and apply receipt artifacts.

### Theme and shell preference changes

```bash
pnpm exec repo-ai-governor workspace set-ui-theme --output pretty
pnpm exec repo-ai-governor set-ui-theme calm --theme-scope workspace --output pretty
```

## 9. Optional Editor-native Surfaces And Lower-level Paths

These surfaces are real, but they are not the default adopter story.

### VS Code primary workbench

```bash
cd <governor-repo>
pnpm run build
code --extensionDevelopmentPath <governor-repo>/apps/vscode-extension <target-repo>
```

Use this when you want the built-source editor-native primary workbench on top of the normal CLI path. Public support currently covers the built source checkout plus one locally generated VSIX or packaged extension root. It does not replace CLI ownership of automation, CI, or session-shell entry points, and it does not widen support to Marketplace or published npm/tgz install surfaces.

### Desktop foundation

```bash
cd <governor-repo>
pnpm run build
pnpm run check:desktop-entry-smoke
pnpm run release:verify-local
```

Use this only when you want to validate the desktop sidecar foundation from a built source checkout. It is not a standalone desktop installer or a published desktop bundle.

### Host-native asset generation

```bash
pnpm exec repo-ai-governor host export --host codex --mode project-local --output-dir .repo-ai-governor/generated/hosts/codex --apply-to-repo /absolute/path/to/<target-repo>
pnpm exec repo-ai-governor host verify --manifest .repo-ai-governor/generated/hosts/codex/host-export.manifest.json
```

Treat built-in `adopt bootstrap` as the preferred whole-repository quickstart, keep `adopt apply` as the explicit lower-level install surface, and use `host export`, `host verify`, and `host pack` as lower-level follow-up surfaces.
For packaged local host bootstrap, import the sidecar only from `repo-ai-governor/service-host`.

### ACP host-facing readiness

If you want to switch Codex explicitly to ACP instead of continuing on `remote_api` or the default CLI-backed path, use this minimum sequence:

```bash
pnpm exec repo-ai-governor config set tools.codex.transport acp_exec
pnpm exec repo-ai-governor config get tools.codex.transport
pnpm exec repo-ai-governor host export --host codex --mode project-local --output-dir .repo-ai-governor/generated/hosts/codex --apply-to-repo /absolute/path/to/<target-repo>
pnpm exec repo-ai-governor host pack --host codex --mode plugin-bundle --output-dir .repo-ai-governor/generated/hosts/codex-plugin --bundle-dir .repo-ai-governor/generated/bundles/codex-plugin
pnpm exec repo-ai-governor host verify --manifest .repo-ai-governor/generated/hosts/codex/host-export.manifest.json
pnpm exec repo-ai-governor doctor --adapters --output json
```

Read this surface conservatively:

1. The ACP config value is `acp_exec`. It is not `remote_api`, and it is never an alias or silent fallback of `cli_exec`.
2. If you already keep `tools.codex.remoteApi.*` endpoint/model/credential truth in config, you usually do not need to remove it first; explicit `transport=acp_exec` can coexist with that configuration.
3. Treat ACP as support-ready only when `doctor` or `verify` projects `transport=acp_exec` and `acp_host_companion` with runtime-service readiness, packaged-distribution readiness, and the clean-room verified summary.
4. If ACP invoke, stream, or confirm still reports a blocked/fail-closed state, keep it blocked. Do not reinterpret that result as same-surface `cli_exec` success.

## 10. Troubleshooting And Known Boundaries

If the first run feels confusing, these are the usual reasons:

1. You are mixing adopter-facing docs with maintainer-only validation docs. Stay on this playbook unless you are validating the governor project itself.
2. You are trying to prove packaged-install truth with `dist-binary`. It only proves CLI/runtime behavior.
3. You are treating `host export` as the default installer. It is not.
4. You are reading environment-gated adapter warnings as governance failure. They usually mean missing auth, endpoint, CLI health, or quota preconditions.
5. You are expecting `local-model` to cover the same capability envelope as primary remote adapters. It does not.

When in doubt:

1. Re-run `doctor --output json`.
2. Re-run `doctor --adapters --fix --output json`.
3. Re-run `doctor --adapters --output json`.
4. Prefer `run --dry-run --trace` over a real run until the trace artifacts look healthy.
5. Read back `verification_status`, `diagnostic_summary`, and `next_action(s)` before escalating; use `launch_diagnostics` only as additive detail about the selected route.
6. Check `docs/support-matrix.md` before assuming a surface is formally supported.

## 11. What To Read Next

1. Use `README.md` when you need the short product overview.
2. Use `docs/support-matrix.md` when you need formal support truth.
3. Use `docs/maintainer-validation-playbook.md` only when you maintain or release this repository.
4. Use `examples/` when you want runnable scenarios instead of a generic runbook.
