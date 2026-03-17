# Repo AI Governor

[English](./README.md) | [简体中文](./README.zh-CN.md)

`Repo AI Governor` is a repository-local CLI that helps teams keep AI coding aligned with one shared workflow and quality standard.

## What It Solves

1. Enforce plan-first delivery (`plan -> implement -> check -> review`).
2. Keep sprint artifacts consistent (`plan.md`, task checklist, CSV ledger, task cards, CR files).
3. Inject standards and project-specific rules through config + slots.
4. Reuse the same governance layer across `Codex`, `GitHub Copilot`, and `Claude Code`.

## Install

Node.js `>=18` is required.

```bash
# run without installation
npx @cjhdev/repo-ai-governor --help

# or install as dev dependency
npm install --save-dev @cjhdev/repo-ai-governor
npx repo-ai-governor --help
```

Package name and CLI command are different:

1. Package: `@cjhdev/repo-ai-governor`
2. Command: `repo-ai-governor`

## Quick Start

```bash
TMP_DIR="$(mktemp -d /tmp/repo-ai-governor-demo.XXXXXX)"
CLI="npx @cjhdev/repo-ai-governor"

# 1) bootstrap governance files
$CLI init \
  --cwd "$TMP_DIR" \
  --project demo \
  --sprint sprint-001 \
  --adapter codex \
  --locale en-US

# 2) install official skills for your AI tool
$CLI skills install \
  --cwd "$TMP_DIR" \
  --surface codex

# 3) validate baseline
$CLI doctor \
  --cwd "$TMP_DIR" \
  --project demo \
  --sprint sprint-001 \
  --strict

# 4) create a requirement and generate sprint plan
cat > "$TMP_DIR/request.md" <<'EOF'
# Requirement
Build a repository governance demo flow.
EOF

$CLI plan \
  --cwd "$TMP_DIR" \
  --project demo \
  --sprint sprint-001 \
  --input "$TMP_DIR/request.md" \
  --title "Repository governance demo flow"
```

Generated outputs include:

1. `.repo-ai-governor/governor.yaml`
2. `AGENTS.md`
3. `.repo-ai-governor/context/current-context.md`
4. `docs/<project>/<sprint>/plan.md`
5. `docs/<project>/<sprint>/tasks/*`
6. `docs/<project>/<sprint>/code-review/*`

## Use With AI Tools

Install skills by surface:

1. `codex` -> `.codex/skills/`
2. `github-copilot` -> `.github/skills/`
3. `claude-code` -> `.claude/skills/`

After installation, ask your AI assistant to:

1. read `AGENTS.md` and `.repo-ai-governor/context/current-context.md`
2. execute with installed skills (for example `$governor-plan-runner`, `$governor-task-implementer`, `$governor-delivery-finisher`)

## Core Commands

1. `init`: bootstrap governance config and sprint structure.
2. `skills`: list/install/validate official skills.
3. `doctor`: validate environment, config, and layout.
4. `plan`: generate plan and task artifacts from a requirement.
5. `check`: run governance checks on sprint artifacts.
6. `run`: orchestrate multi-stage automation with preflight + stage routing.
7. `review`: generate code review records.
8. `review-verify`: append re-check results and advance CR status.
9. `report`: render governance output into summary/markdown/json.
10. `upgrade`: upgrade generated config/templates safely.

## Customize Standards And Project Rules

`governor.yaml` supports both standards and slot-based customization:

```yaml
standards:
  preset: official/base
  overrides:
    quality:
      tests: required
slots:
  enabled:
    - security-review
```

Project-specific slot files live under `.repo-ai-governor/slots/*.yaml`.

If your team already has a `code_standards.md`, you can turn it into an executable gate by defining a `## Verification Commands` section and running:

```bash
npm run check:code-standards
```

Recommended flow for adding a new code standard:

1. Add a numbered rule under `## Non-negotiable Rules` (for example `- [CS-005] ...`).
2. Add one or more executable commands under `## Verification Commands` so the rule is machine-checkable.
3. Run `npm run check:code-standards` locally and verify the gate passes.

Example now enforced in this repository: relative import/export specifiers must use explicit extensions in native Node.js ESM (`./foo.js`).

In this repository, `npm run check` is wired to that standards gate.

## Documentation

1. [Quick Start](./docs/quick-start.md)
2. [Getting Started Example](./docs/getting-started-example.md)
3. [Codex Adapter Example](./examples/adapters/codex/README.md)
4. [GitHub Copilot Adapter Example](./examples/adapters/github-copilot/README.md)
5. [Claude Code Adapter Example](./examples/adapters/claude-code/README.md)
6. [Official Example Slots](./examples/slot-packages/official/README.md)
7. [CHANGELOG](./CHANGELOG.md)
