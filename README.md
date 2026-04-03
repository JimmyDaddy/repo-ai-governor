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

Use this when you frequently edit governor source and want the target repo to follow it closely.

#### Option C: `tgz`

```bash
cd <governor-repo>
pnpm pack --json

cd <target-repo>
pnpm add --save-exact /absolute/path/to/cjhdev-repo-ai-governor-<version>.tgz
```

Use this when you want a packaged-install rehearsal. It still requires registry access for external dependencies.

#### Option D: `dist` binary

```bash
cd <governor-repo>
pnpm run build

cd <target-repo>
node <governor-repo>/dist/bin/repo-ai-governor.js --help
```

Use this when you want to validate CLI behavior before changing the target repo dependency graph.

### 1.3 First run in a target repository

```bash
pnpm exec repo-ai-governor --help
pnpm exec repo-ai-governor init --output pretty
pnpm exec repo-ai-governor doctor --output json
pnpm exec repo-ai-governor check --output json
```

If you use the `dist` binary path, replace `pnpm exec repo-ai-governor` with:

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

### 2.3 Switch workspace mode

```bash
pnpm exec repo-ai-governor workspace dry-run --workspace-mode repo_local --output json
pnpm exec repo-ai-governor workspace execute --workspace-mode repo_local --output json
pnpm exec repo-ai-governor workspace rollback <plan-path> --output json
```

Keep the printed `plan-path`. It is your rollback reference for that workspace migration.

## 3. Notes For External Adopters

1. `dist` binary rehearsal proves CLI/runtime behavior, not packaged-install behavior.
2. `tgz` is not offline/self-contained; package installation still resolves external dependencies.
3. If a target repository already uses Yarn/npm or has a dirty worktree, start with the `dist` binary path and move to package installation later.
4. Session shell, React-shell command surfaces, workflow editing, upgrade analysis, HITL notifications, and troubleshooting details are covered in the local adoption playbook.

## 4. Read More

1. Use `docs/local-adoption-playbook.md` for day-to-day adoption, onboarding, rollback, workflow, and troubleshooting guidance.
2. Use `docs/support-matrix.md` when you want the current support boundary for install modes, adapters, and validation status.
3. Use `docs/maintainer-validation-playbook.md` only if you maintain or release `repo-ai-governor` itself.
4. Use `examples/` when you want starter assets for team adoption drills.
