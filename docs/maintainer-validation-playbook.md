# Maintainer Validation Playbook

This playbook is for people maintaining, validating, or releasing `repo-ai-governor` itself.

Use it when you need to answer questions like:

1. Which command chain proves the current packaged CLI surface?
2. Which checks belong to adopter truth, and which belong only to maintainer confidence?
3. Where should I look for evidence after a validation run?
4. Which runbook should I use for VS Code, desktop, host-native assets, or release gates?

This document is intentionally procedural. It does not redefine support status. `docs/support-matrix.md` is the single public support truth.

## 1. Use The Right Truth Surface

Keep the docs separated like this:

| Document | Purpose |
|---|---|
| `README.md` | Product overview and shortest path to first success |
| `docs/local-adoption-playbook.md` | Adopter runbook |
| `docs/support-matrix.md` | Formal support truth |
| `docs/maintainer-validation-playbook.md` | Maintainer validation workflow and evidence routing |
| `docs/ga-readiness-evidence.md` | Broader program-level GA signal rollup |

Rule of thumb:

1. If you are describing what is supported, update `docs/support-matrix.md`.
2. If you are explaining how to validate it, update this playbook.
3. If you are recording a broader release-readiness assessment, update `docs/ga-readiness-evidence.md`.

## 2. Start With The Validation Goal

Pick the runbook that matches the question you are trying to answer.

| Goal | Primary commands | What it proves |
|---|---|---|
| Check the published CLI and shipped docs/reference assets | `pnpm run release:verify-local`, `pnpm pack --json --dry-run` | Local distribution truthfulness |
| Rehearse a clean-room install path | `pnpm run release:verify-cleanroom-local-install` | Install-mode evidence |
| Rehearse real-project interactive behavior | Build once, then run the real-target command chain | Real target operator flow |
| Recheck examples and docs-backed scenarios | `pnpm run check:examples-doc-smoke`, `pnpm run check:examples-runtime-smoke` | Example coherence and runnable scenario contract |
| Recheck VS Code primary-workbench boundary | targeted vitest slice plus `release:verify-vscode-extension-distribution` | Editor-native primary-workbench packaging and contract |
| Recheck host-native asset boundary | targeted vitest slice plus `release:verify-host-distribution` | Codex / Claude Code / GitHub Copilot host follow-up boundary |
| Recheck desktop foundation boundary | targeted vitest slice plus `check:desktop-entry-smoke` and `release:verify-local` | Desktop foundation-only truth |
| Recheck official governance pack catalog | targeted vitest slice plus `pnpm run build` | Pack catalog contract and runtime loader compatibility |
| Make a broader release call | `pnpm run check`, `pnpm run release:ga-check` | Maintainer confidence for wider release |

## 3. Packaged Surface Validation

Use this when the question is "what does the packaged CLI surface currently ship, and is the documentation truthful about it?"

This runbook is the maintainer entry for packaged delivery surfaces: it tells you which packaged assets, docs, and evidence paths still match the public claims.

```bash
cd <governor-repo>
pnpm run release:verify-local
pnpm pack --json --dry-run
```

Expect this to answer:

1. Does the packaged CLI still behave like the currently documented local distribution?
2. Does the tarball still ship the expected adopter docs and reference assets?
3. Are we accidentally overstating packaged support for non-CLI surfaces?

Published tarballs are expected to carry:

1. `README.md` and `README.zh-CN.md`
2. `docs/local-adoption-playbook.md` and `docs/local-adoption-playbook.zh-CN.md`
3. `docs/maintainer-validation-playbook.md` and `docs/maintainer-validation-playbook.zh-CN.md`
4. `docs/support-matrix.md` and `docs/support-matrix.zh-CN.md`
5. `examples/`
6. `integrations/ide/` and `integrations/desktop/`
7. `.codex/skills/`

Repo-local skills ship as reference assets only. They are not automatically installed into target repositories.

## 4. Real-project Rehearsal

Use this when you need evidence from one actual target repository before widening rollout or changing public narrative.

Current wrapper entry:

```bash
TARGET_REPO=/absolute/path/to/real-target-repo \
bash "$GOVERNOR_REPO/scripts/acceptance/run-project-027-real-project-validation.sh"
```

Suggested environment:

```bash
export GOVERNOR_REPO=/absolute/path/to/repo-ai-governor
export TARGET_REPO=/absolute/path/to/real-target-repo
export CLI_BIN="$GOVERNOR_REPO/dist/bin/repo-ai-governor.js"
export ACCEPTANCE_HOME="$TARGET_REPO/.project-027-acceptance/home"
export REPO_LOCAL_ROOT="$TARGET_REPO/.repo-ai-governor"
```

Minimum rehearsal chain:

```bash
cd "$GOVERNOR_REPO"
pnpm run build

HOME="$ACCEPTANCE_HOME" node "$CLI_BIN" --output json init
HOME="$ACCEPTANCE_HOME" node "$CLI_BIN" --output json doctor
HOME="$ACCEPTANCE_HOME" node "$CLI_BIN" --output json check
HOME="$ACCEPTANCE_HOME" node "$CLI_BIN" --output json --workspace-action dry-run --workspace-mode repo_local --workspace-root "$REPO_LOCAL_ROOT" workspace
HOME="$ACCEPTANCE_HOME" node "$CLI_BIN" --output json --workspace-action execute --workspace-mode repo_local --workspace-root "$REPO_LOCAL_ROOT" workspace
HOME="$ACCEPTANCE_HOME" node "$CLI_BIN" --output json --workspace-action rollback --workspace-plan <plan-path> workspace
HOME="$ACCEPTANCE_HOME" node "$CLI_BIN" --output pretty --ui react
HOME="$ACCEPTANCE_HOME" node "$CLI_BIN" resume
```

Use this runbook when you need confidence in operator experience, not just unit or integration coverage.

## 5. Example And Documentation Smoke

Use this when you changed examples, adopter docs, or command narratives that examples depend on.

```bash
cd <governor-repo>
pnpm run check:examples-doc-smoke
pnpm run check:examples-runtime-smoke
pnpm run check:examples-smoke
```

This runbook is most valuable when you need to answer:

1. Do the example docs still describe runnable command chains?
2. Do example assertions still match actual output contracts?
3. Did documentation drift away from the example assets without anyone noticing?

## 6. Editor-native And Secondary-surface Validation

### VS Code primary workbench

Use this runbook when refreshing the editor-native primary-workbench boundary:

```bash
pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-host.activation.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-selection-store.test.ts apps/vscode-extension/test/vscode-extension-packaging-boundary.test.ts
pnpm run build
pnpm run release:verify-vscode-extension-distribution -- --output .tmp/vscode-extension-distribution-report.json
pnpm pack --json --dry-run
pnpm run check:ide-entry-smoke
pnpm run check:ide-docs-parity
```

Optional manual rehearsal:

```bash
code --extensionDevelopmentPath <governor-repo>/apps/vscode-extension <target-repo>
```

This refresh now expects the packaged extension root and the extracted VSIX to both pass module smoke, sidecar smoke, CLI-backed secure-authoring, scratch-isolated `doctor` diagnostics capture with surfaced check totals, pnpm-metadata closure checks, and the symlink-payload allowlist gate before public docs can stay at `primary_workbench_claim`.
Use the rerun evidence to validate the zero-CLI human-path claim as well: the public story is no longer "CLI first, VS Code second", but "VS Code for supported human work, CLI for optional automation / scriptable / session-shell use". Treat `.tmp/project-114-project-final-vscode-distribution-report.json` as scratch output only, then promote it into the active sprint's immutable evidence snapshot plus the sprint-local zero-cli rehearsal summary before refreshing `docs/support-matrix*` or any maintainer-facing backlink.
This refresh also validates the direct-provider-onboarding boundary: `Connect Provider` / `Update API Key` / `Reconnect Provider` must remain host-native, raw API-key capture must stay behind the secure prompt plus managed-secret-backed `credentialRef`, and the built-source/local-VSIX evidence must not regress into manual `credentialEnvVar` authoring for the plugin human path. Treat `.tmp/vscode-extension-distribution-report.json` as scratch rerun output only, then promote it into the active sprint's immutable evidence snapshot plus the sprint-local zero-env-var clean-room summary and rollout claim-parity summary before refreshing README/playbook/support wording. The final support claim remains conservative: live remote-provider success is still out of scope, GUI `Install from VSIX...` remains optional manual evidence, and CLI/headless `credentialEnvVar` compatibility stays supported outside the plugin-first human path.

### Host-native asset boundary

Use this when refreshing the Codex / Claude Code / GitHub Copilot host follow-up story:

```bash
pnpm exec vitest run apps/cli/test/commands/host-command.test.ts apps/cli/test/host-command.integration.test.ts packages/adapters/codex/test/codex-host-renderer.test.ts packages/adapters/claude-code/test/claude-code-host-renderer.test.ts --maxWorkers=1 --maxConcurrency=1
pnpm run build
pnpm run release:verify-host-distribution -- --output .tmp/project-067-sprint-001-host-distribution-report.json
```

When the change touches the reserved GitHub.com target contract, also run:

```bash
pnpm run release:verify-github-com-agent-reserved-target -- --output .tmp/project-068-sprint-002-github-com-agent-reserved-target-report.json
```

### Desktop foundation

Use this when refreshing the desktop foundation-only boundary:

```bash
pnpm exec vitest run apps/desktop/test/desktop-governance-console-view-model-builder.test.ts apps/desktop/test/desktop-preload-bridge.test.ts apps/desktop/test/desktop-shell-bootstrap.test.ts apps/desktop/test/desktop-session-bridge.test.ts test/desktop-entry-smoke.integration.test.ts --maxWorkers=1 --maxConcurrency=1
pnpm run build
pnpm run check:desktop-entry-smoke
pnpm run release:verify-local -- --output .tmp/project-065-sprint-001-desktop-foundation-report.json
```

## 7. Official Governance Pack Catalog Validation

Use this when changing the built-in standards-pack catalog, pack runtime loading, or related docs.

```bash
pnpm exec vitest run packages/standards/test/language-minimal-governance-packs.integration.test.ts packages/standards/test/standards-runtime-loader.integration.test.ts packages/config/test/config.unit.test.ts --maxWorkers=1 --maxConcurrency=1
pnpm run build
```

This is the right runbook when the question is "does the documented official pack catalog still match what the product can actually load and validate?"

## 8. Clean-room And Release Gates

Use this when you need the higher-confidence maintainer gate, not just a focused subsystem refresh.

```bash
cd <governor-repo>
pnpm run release:verify-cleanroom-local-install
pnpm run check
pnpm run release:verify-host-distribution
pnpm run release:verify-local
pnpm run release:ga-check
```

Read these commands as a ladder:

1. `release:verify-cleanroom-local-install` proves install-mode behavior.
2. `check` proves the repository-level quality baseline.
3. `release:verify-host-distribution` rechecks host-native follow-up surfaces.
4. `release:verify-local` rechecks the packaged/local distribution surface.
5. `release:ga-check` is the maintainers' broader release decision gate.

## 9. Evidence Expectations

When you update docs or support claims, keep the evidence model disciplined:

1. Update `docs/support-matrix.md` first when the supported boundary changes.
2. Keep this playbook focused on command order, operator intent, and evidence backlinks.
3. Prefer one authoritative evidence file per validation chain over scattered status notes.
4. For the current VS Code surfaces, keep the claim-specific timestamped snapshot authoritative: use `.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/sprint-005-support-truth-migration-and-cli-deprecation-closeout/` plus `project-114-sprint-005-zero-cli-rehearsal-summary.md` for the primary-workbench cutover, and use `.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-005-clean-room-validation-and-rollout-closeout/` plus `project-116-sprint-005-zero-env-var-clean-room-summary.md` and `project-116-sprint-005-rollout-claim-parity-summary.md` for the direct-provider-onboarding final closeout. Treat `.tmp/project-114-project-final-vscode-distribution-report.json` and `.tmp/vscode-extension-distribution-report.json` as scratch rerun outputs only.
5. Do not turn this playbook into a second support matrix.

Common evidence paths referenced by this runbook include:

1. `.tmp/project-063-sprint-001-local-distribution-report.json`
2. `.tmp/project-063-sprint-001-cleanroom-tgz-report.json`
3. `.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/sprint-005-support-truth-migration-and-cli-deprecation-closeout/project-114-sprint-005-vscode-distribution-report-20260418T124824Z.json` (authoritative snapshot for the current VS Code primary-workbench claim)
4. `.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/sprint-005-support-truth-migration-and-cli-deprecation-closeout/project-114-sprint-005-zero-cli-rehearsal-summary.md`
5. `.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-005-clean-room-validation-and-rollout-closeout/project-116-sprint-005-vscode-distribution-report-20260420T193604Z.json` (authoritative snapshot for the final direct-provider-onboarding closeout)
6. `.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-005-clean-room-validation-and-rollout-closeout/project-116-sprint-005-zero-env-var-clean-room-summary.md`
7. `.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-005-clean-room-validation-and-rollout-closeout/project-116-sprint-005-rollout-claim-parity-summary.md`
8. `.tmp/project-065-sprint-001-desktop-foundation-report.json`
9. `.tmp/project-067-sprint-001-host-distribution-report.json`
10. `.tmp/project-068-sprint-002-github-com-agent-reserved-target-report.json`
11. `.tmp/project-076-sprint-003-cleanroom-report.json`
12. `.tmp/project-076-sprint-003-local-distribution-report.json`

## 10. Interpreting Adopter Warnings

Fresh external repositories may still surface warnings such as:

1. `baseline_docs missing=5/5`
2. `script_not_found`

Interpret them carefully:

1. For adopters, they are usually informational unless the target repository is intentionally vendoring this repository's own governance stack.
2. For maintainers, they are useful signals about whether adopter docs are setting expectations clearly enough.

## 11. Related References

1. `README.md`
2. `docs/local-adoption-playbook.md`
3. `docs/support-matrix.md`
4. `docs/ga-readiness-evidence.md`
5. `examples/`
