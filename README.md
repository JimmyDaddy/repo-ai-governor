# Repo AI Governor

Repository-local AI governance CLI for teams that want to connect tools like Codex, Claude Code, and GitHub Copilot to one governed workflow inside their own repository.

- Chinese guide: `README.zh-CN.md`
- Local adoption playbook: `docs/local-adoption-playbook.md`
- Maintainer validation playbook: `docs/maintainer-validation-playbook.md`
- Support matrix: `docs/support-matrix.md`
- Examples: `examples/`
- Changelog: `CHANGELOG.md`

## 1. Current Surface

Today the public CLI and package surface covers:

1. Bootstrap and audit: `init`, `doctor`, `check`
2. Managed repo installation lifecycle: `adopt list`, `adopt apply`, `adopt diff`, `adopt verify`, `adopt upgrade`, `adopt remove`
3. Multi-tool onboarding: `connect`, `verify`
4. Governed execution: `plan`, `run`, `review`, `review-verify`
5. Session-first shell: run `repo-ai-governor` with no subcommand, then `resume`
6. Workflow and schema lifecycle utilities: `workflow`, `upgrade`
7. Workspace and shell preferences: `workspace`, `set-ui-theme`
8. Lower-level host distribution: `host export`, `host verify`, `host pack`
9. Optional secondary/public package surfaces: source-checkout VS Code companion, desktop foundation, and the root-package export `@cjhdev/repo-ai-governor/service-host`

The formal support boundary for these surfaces lives in `docs/support-matrix.md`.

## 2. Quick Start

### 2.1 Prerequisites

1. Node.js `>=18`
2. `pnpm` when using `path`, `link`, or `tgz`
3. A target repository where you want to run governed AI workflows

### 2.2 Choose an install path

Assume this repository is `<governor-repo>` and your target repository is `<target-repo>`.

Recommended start order:

1. Start with `path` when the target repo already uses `pnpm` and you want the default local adoption route.
2. Move to `link` only when the target repo should follow local governor source changes closely.
3. Use `dist-binary` when the target repo is dirty, uses Yarn/npm, or you want a no-install CLI/runtime rehearsal first.
4. Use `tgz` only for an online packaged CLI-install rehearsal in an environment that can still reach the npm registry.

The formal acceptance contract for these install modes lives in `docs/support-matrix.md`.

#### Option A: `path`

```bash
cd <target-repo>
pnpm add --save-exact <governor-repo>
```

Use this when you want the simplest local adoption path.

#### Option B: `link`

```bash
cd <target-repo>
pnpm add --save-exact link:<governor-repo>
```

Use this when the target repo should follow local governor source changes closely.

#### Option C: `tgz`

```bash
cd <governor-repo>
pnpm pack --json

cd <target-repo>
pnpm add --save-exact /absolute/path/to/cjhdev-repo-ai-governor-<version>.tgz
```

Use this when you want an online packaged CLI-install rehearsal. It still requires registry access for external dependencies and does not widen packaged VS Code or other secondary-surface support.

#### Option D: `dist-binary`

```bash
cd <governor-repo>
pnpm run build

cd <target-repo>
node <governor-repo>/dist/bin/repo-ai-governor.js --help
```

Use this when you want to validate CLI/runtime behavior before changing the target repo dependency graph. It does not prove packaged-install behavior.

### 2.3 First run in a target repository

```bash
pnpm exec repo-ai-governor --help
pnpm exec repo-ai-governor init --output pretty
pnpm exec repo-ai-governor doctor --output json
pnpm exec repo-ai-governor check --output json
```

If you use the `dist-binary` path, replace `pnpm exec repo-ai-governor` with:

```bash
node <governor-repo>/dist/bin/repo-ai-governor.js <command>
```

What to expect:

1. `init --output pretty` gives you a guided first-time setup.
2. In local TTY + `pretty`, running `repo-ai-governor` with no subcommand opens the session-first shell on `stderr`.
3. `resume [session-id]` can reattach the latest or a named persisted session.
4. Fresh external repositories may still show self-host-specific warnings such as `baseline_docs missing=5/5` or `script_not_found`; treat them as informational unless you intentionally vendor this repository's own governance docs and scripts.
5. Human-readable help and status text is localized; use `--locale en-US` or `--locale zh-CN` when you want to pin the language explicitly.

### 2.4 Apply the managed adoption baseline

```bash
pnpm exec repo-ai-governor adopt list --output json
pnpm exec repo-ai-governor adopt apply adopter-complete --repo . --hosts codex,claude-code,github-copilot --output json
pnpm exec repo-ai-governor adopt verify --repo . --output json
```

Use this when you want the preferred whole-repository install path instead of manually staging lower-level host exports.

Notes:

1. Built-in adoption packs materialize managed host assets, guides, and install metadata under `.repo-ai-governor/adoption/installations/**`.
2. Built-in `adopt apply` does not require a pre-existing source-local `.codex/skills/**` tree in the target repository.
3. For the advanced self-host path, use `adopt apply adopter-complete --adoption-profile self-host-complete --workspace-mode repo_local`.

## 3. Common User Paths

### 3.1 Install or maintain one managed repository baseline

```bash
pnpm exec repo-ai-governor adopt apply adopter-complete --repo . --hosts codex,claude-code,github-copilot --output json
pnpm exec repo-ai-governor adopt verify --repo . --output json
pnpm exec repo-ai-governor adopt diff --repo . --output json
pnpm exec repo-ai-governor adopt upgrade adopter-complete --repo . --output json
pnpm exec repo-ai-governor adopt remove adopter-complete --repo . --force --output json
```

Use this when you want the supported high-level install, drift check, upgrade, and removal path for a target repository.

### 3.2 Connect multiple AI tools

```bash
pnpm exec repo-ai-governor connect --tools codex,claude-code --preset multi-tool-default --output json
pnpm exec repo-ai-governor doctor --adapters --fix --output json
pnpm exec repo-ai-governor verify --adapters --output json
pnpm exec repo-ai-governor run --output json --dry-run --trace
```

This flow generates a reviewable candidate config, checks adapter readiness, and verifies routing before real execution.

### 3.3 Run your first governed loop

```bash
pnpm exec repo-ai-governor plan --output json
pnpm exec repo-ai-governor run --output json --dry-run --trace
pnpm exec repo-ai-governor review --output json
pnpm exec repo-ai-governor review-verify --output json
```

Use this when you want the full plan -> run -> review -> verify path with audit artifacts under the active workspace.

In managed review workspaces, `review` allocates a canonical `CR-xxx` task card for the round, and `review-verify` advances that same card through `review_pending -> verified -> resolved`.

### 3.4 Switch workspace mode or shell theme

```bash
pnpm exec repo-ai-governor workspace dry-run --workspace-mode repo_local --output json
pnpm exec repo-ai-governor workspace execute --workspace-mode repo_local --output json
pnpm exec repo-ai-governor workspace rollback <plan-path> --output json
pnpm exec repo-ai-governor workspace set-ui-theme --output pretty
pnpm exec repo-ai-governor set-ui-theme calm --theme-scope workspace --output pretty
```

Keep the printed `plan-path`. It is your rollback reference for that workspace migration.

`workspace` also accepts `clear-config` and `switch-branch` as direct shorthand actions. In interactive TTY + `pretty`, omitting `[theme]` from `workspace set-ui-theme` or `set-ui-theme` opens the theme selector instead of requiring a preset.

### 3.5 Preview, Apply, Or Roll Back Upgrades

```bash
pnpm exec repo-ai-governor upgrade --output json
pnpm exec repo-ai-governor upgrade apply <report-path> --confirm-upgrade approve --output json
pnpm exec repo-ai-governor upgrade rollback <apply-receipt-or-rollback-snapshot> --output json
```

Use `upgrade` preview first. Keep the emitted `report_path` from preview and the `apply_receipt_path` from apply; those are the supported hand-off artifacts for the adopter-facing apply/rollback path.

### 3.6 Refresh Optional Source-checkout Host Assets

```bash
pnpm exec repo-ai-governor host export --host codex --mode project-local --output-dir .repo-ai-governor/generated/hosts/codex --apply-to-repo /absolute/path/to/<target-repo>
pnpm exec repo-ai-governor host verify --manifest .repo-ai-governor/generated/hosts/codex/host-export.manifest.json
pnpm exec repo-ai-governor host export --host github-copilot --mode project-local --copilot-target repo-local --output-dir .repo-ai-governor/generated/hosts/github-copilot --apply-to-repo /absolute/path/to/<target-repo>
pnpm exec repo-ai-governor host verify --manifest .repo-ai-governor/generated/hosts/github-copilot/host-export.manifest.json
pnpm exec repo-ai-governor host pack --host claude-code --mode plugin-bundle --output-dir .repo-ai-governor/generated/hosts/claude-code-plugin --bundle-dir .repo-ai-governor/generated/bundles/claude-code
pnpm exec repo-ai-governor host verify --manifest .repo-ai-governor/generated/hosts/claude-code-plugin/host-export.manifest.json
```

Run these commands from `<governor-repo>` and point `--apply-to-repo` at the actual adopter repository root you want to receive the generated files.

Use this only when you are working from a built governor source checkout and want optional host-native follow-up assets on top of the normal CLI bootstrap path.

Public host families currently include Codex, Claude Code, and GitHub Copilot. For GitHub Copilot, keep adopter-facing flows on targets such as `repo-local`; `github-com-agent` remains a reserved fail-closed target until the support matrix says otherwise.

The supported refresh path is: update the governor source checkout or the vendored host-facing skills, rerun `host export` or `host pack`, then rerun `host verify`. This is a source-checkout follow-up surface, not a packaged-install baseline or a separate installer contract.

## 4. Notes For External Adopters

1. `dist-binary` rehearsal proves CLI/runtime behavior, not packaged-install behavior.
2. `tgz` is not offline/self-contained; package installation still resolves external dependencies from the npm registry.
3. The `tgz` path validates the published CLI tarball surface and shipped docs/reference assets only; it does not widen packaged VS Code support beyond the built-source local VSIX / packaged-extension-root path, and it does not provide Marketplace or published-installable extension support.
4. If a target repository already uses Yarn/npm or has a dirty worktree, start with `dist-binary`; otherwise start with `path` and move to `link` or `tgz` only when the workflow requires it.
5. Session shell, React-shell command surfaces, workflow editing, upgrade analysis, host distribution, workspace utilities, HITL notifications, and troubleshooting details are covered in the local adoption playbook.
6. The optional VS Code companion surface supports either one extension-development host or one locally generated VSIX / packaged extension root from a built governor source checkout via `apps/vscode-extension` and the release packaging scripts. Published npm/tgz install may still carry internal `dist/apps/vscode-extension/**` payloads, but it does not ship a supported installable extension bundle, and Marketplace remains unsupported.
7. The optional desktop surface stays desktop foundation-only on a built governor source checkout. There is no supported standalone desktop installer, published desktop bundle, or packaged desktop product claim.
8. Built-in `adopt apply` does not require a pre-existing source-local `.codex/skills/**` tree in the target repository; repository-local Codex helpers ship under `.codex/skills/` for self-host and maintainer flows, and external adopters only need to vendor them when they want the same local skill ergonomics.
9. Optional host-native follow-up assets (`host export` / `host verify` / `host pack`) stay on the source-checkout follow-up surface. Public host families include Codex, Claude Code, and GitHub Copilot, but target support still varies; keep the emitted manifest/verification summary, rerun the host command plus `host verify` after a governor or skill refresh, and treat `github-com-agent` as reserved/blocked until `docs/support-matrix.md` says otherwise.
10. For clean-room or desktop-sidecar bootstrap, `@cjhdev/repo-ai-governor/service-host` is the only supported root-package service-host import path; do not deep-import internal `dist/**` host files.

## 5. Read More

1. Use `docs/local-adoption-playbook.md` for day-to-day adoption, onboarding, rollback, workflow, and troubleshooting guidance.
2. Use `docs/support-matrix.md` when you want the current support boundary for install modes, adapters, and validation status.
3. Use `docs/maintainer-validation-playbook.md` only if you maintain or release `repo-ai-governor` itself.
4. Use `examples/` when you want starter assets for team adoption drills.
