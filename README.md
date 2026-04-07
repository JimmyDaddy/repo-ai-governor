# Repo AI Governor

Repository-local AI governance CLI for teams that want to connect tools like Codex, Claude Code, and GitHub Copilot to one governed workflow inside their own repository.

- Chinese guide: `README.zh-CN.md`
- Local adoption playbook: `docs/local-adoption-playbook.md`
- Maintainer validation playbook: `docs/maintainer-validation-playbook.md`
- Support matrix: `docs/support-matrix.md`
- Examples: `examples/`
- Changelog: `CHANGELOG.md`

## 1. Quick Start

### 1.1 Prerequisites

1. Node.js `>=18`
2. `pnpm` when using `path`, `link`, or `tgz`
3. A target repository where you want to run governed AI workflows

### 1.2 Choose an install path

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

### 1.3 First run in a target repository

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

## 2. Common User Paths

### 2.1 Connect multiple AI tools

```bash
pnpm exec repo-ai-governor connect --tools codex,claude-code --preset multi-tool-default --output json
pnpm exec repo-ai-governor doctor --adapters --fix --output json
pnpm exec repo-ai-governor verify --adapters --output json
pnpm exec repo-ai-governor run --output json --dry-run --trace
```

This flow generates a reviewable candidate config, checks adapter readiness, and verifies routing before real execution.

### 2.2 Run your first governed loop

```bash
pnpm exec repo-ai-governor plan --output json
pnpm exec repo-ai-governor run --output json --dry-run --trace
pnpm exec repo-ai-governor review --output json
pnpm exec repo-ai-governor review-verify --output json
```

Use this when you want the full plan -> run -> review -> verify path with audit artifacts under the active workspace.

In managed review workspaces, `review` allocates a canonical `CR-xxx` task card for the round, and `review-verify` advances that same card through `review_pending -> verified -> resolved`.

### 2.3 Switch workspace mode

```bash
pnpm exec repo-ai-governor workspace dry-run --workspace-mode repo_local --output json
pnpm exec repo-ai-governor workspace execute --workspace-mode repo_local --output json
pnpm exec repo-ai-governor workspace rollback <plan-path> --output json
```

Keep the printed `plan-path`. It is your rollback reference for that workspace migration.

### 2.4 Preview, Apply, Or Roll Back Upgrades

```bash
pnpm exec repo-ai-governor upgrade --output json
pnpm exec repo-ai-governor upgrade apply <report-path> --confirm-upgrade approve --output json
pnpm exec repo-ai-governor upgrade rollback <apply-receipt-or-rollback-snapshot> --output json
```

Use `upgrade` preview first. Keep the emitted `report_path` from preview and the `apply_receipt_path` from apply; those are the supported hand-off artifacts for the adopter-facing apply/rollback path.

### 2.5 Refresh Optional Codex / Claude Code Host Assets

```bash
pnpm exec repo-ai-governor host export --host codex --mode project-local --output-dir .repo-ai-governor/generated/hosts/codex --apply-to-repo /absolute/path/to/<target-repo>
pnpm exec repo-ai-governor host verify --manifest .repo-ai-governor/generated/hosts/codex/host-export.manifest.json
pnpm exec repo-ai-governor host pack --host claude-code --mode plugin-bundle --output-dir .repo-ai-governor/generated/hosts/claude-code-plugin --bundle-dir .repo-ai-governor/generated/bundles/claude-code
pnpm exec repo-ai-governor host verify --manifest .repo-ai-governor/generated/hosts/claude-code-plugin/host-export.manifest.json
```

Run these commands from `<governor-repo>` and point `--apply-to-repo` at the actual adopter repository root you want to receive the generated files.

Use this only when you are working from a built governor source checkout and want optional Codex / Claude Code host-native assets on top of the normal CLI bootstrap path.

The supported refresh path is: update the governor source checkout or the vendored host-facing skills, rerun `host export` or `host pack`, then rerun `host verify`. This is a source-checkout follow-up surface, not a packaged-install baseline or a separate installer contract.

## 3. Notes For External Adopters

1. `dist-binary` rehearsal proves CLI/runtime behavior, not packaged-install behavior.
2. `tgz` is not offline/self-contained; package installation still resolves external dependencies from the npm registry.
3. The `tgz` path validates the published CLI tarball surface and shipped docs/reference assets only; it does not widen packaged VS Code support beyond the built-source local VSIX / packaged-extension-root path, and it does not provide Marketplace or published-installable extension support.
4. If a target repository already uses Yarn/npm or has a dirty worktree, start with `dist-binary`; otherwise start with `path` and move to `link` or `tgz` only when the workflow requires it.
5. Session shell, React-shell command surfaces, workflow editing, upgrade analysis, HITL notifications, and troubleshooting details are covered in the local adoption playbook.
6. The optional VS Code companion surface supports either one extension-development host or one locally generated VSIX / packaged extension root from a built governor source checkout via `apps/vscode-extension` and the release packaging scripts. Published npm/tgz install may still carry internal `dist/apps/vscode-extension/**` payloads, but it does not ship a supported installable extension bundle, and Marketplace remains unsupported.
7. Repository-local Codex workflow helpers ship under `.codex/skills/`; they are included for self-host and maintainer flows, but external adopters do not need to vendor them unless they want the same local skill ergonomics inside their own repository.
8. Optional Codex / Claude Code host-native assets (`host export` / `host verify` / `host pack`) are supported only as source-checkout follow-up surfaces. After a governor or skill refresh, rerun the host command plus `host verify`; do not treat that path as packaged-install proof or a separate host upgrader.

## 4. Read More

1. Use `docs/local-adoption-playbook.md` for day-to-day adoption, onboarding, rollback, workflow, and troubleshooting guidance.
2. Use `docs/support-matrix.md` when you want the current support boundary for install modes, adapters, and validation status.
3. Use `docs/maintainer-validation-playbook.md` only if you maintain or release `repo-ai-governor` itself.
4. Use `examples/` when you want starter assets for team adoption drills.
