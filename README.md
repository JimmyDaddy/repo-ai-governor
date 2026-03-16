# Repo AI Governor

[English](./README.md) | [简体中文](./README.zh-CN.md)

Repository-local AI governance CLI for teams who want AI coding tools to follow the same workflow, quality gates, and delivery rules inside a repo.

`Repo AI Governor` helps a repository enforce:

1. planning before coding
2. task decomposition with sprint artifacts
3. check / review / review-verify workflow
4. standards and slot-based rule injection
5. consistent behavior across `Codex`, `GitHub Copilot`, and `Claude Code`

## Current Status

The MVP core is implemented.

What is already available:

1. `init`, `doctor`, `plan`, `check`, `review`, `review-verify`, `report`, `upgrade`
2. repository bootstrap and governance config
3. standards package, workflow engine, slot runtime, and reporting
4. CI invocation scripts and acceptance kit
5. adapter examples for `Codex`, `GitHub Copilot`, and `Claude Code`

What is not fully shipped yet:

1. automation mode `v1`
2. second-wave adapter implementations such as `Cursor` and `Cline`
3. broader multi-language governance templates beyond the current MVP baseline

## Install

### `npx`

```bash
npx @cjhdev/repo-ai-governor --help
```

### `npm`

```bash
npm install --save-dev @cjhdev/repo-ai-governor
npx repo-ai-governor --help
```

### `pnpm`

```bash
pnpm add -D @cjhdev/repo-ai-governor
pnpm exec repo-ai-governor --help
```

Node.js `>=18` is required.

Package name and CLI name are different:

1. npm package: `@cjhdev/repo-ai-governor`
2. executable command: `repo-ai-governor`

## Quick Start

The shortest path is:

1. initialize governance
2. install official skills for your AI tool
3. verify repository health
4. generate a plan
5. run governance checks
6. review code changes
7. render a report

Example:

```bash
TMP_DIR="$(mktemp -d /tmp/repo-ai-governor-demo.XXXXXX)"
CLI="npx @cjhdev/repo-ai-governor"

$CLI init \
  --cwd "$TMP_DIR" \
  --project demo \
  --sprint sprint-001 \
  --adapter codex \
  --format json

$CLI skills install \
  --cwd "$TMP_DIR" \
  --surface codex \
  --format json

$CLI doctor \
  --cwd "$TMP_DIR" \
  --project demo \
  --sprint sprint-001 \
  --strict \
  --format json
```

If you are using another AI surface, replace `codex` with:

1. `github-copilot`
2. `claude-code`

The native install targets are:

1. `Codex`: `.codex/skills/`
2. `GitHub Copilot`: `.github/skills/`
3. `Claude Code`: `.claude/skills/`

## Skills Quick Path

After `skills install`, the repository contains first-party governance skills such as:

1. `governor-context-loader`
2. `governor-plan-runner`
3. `governor-task-implementer`
4. `governor-delivery-finisher`

The shortest way to combine them with AI is:

1. point your AI tool at the repository
2. let it read `AGENTS.md` and `.repo-ai-governor/context/current-context.md`
3. trigger an installed skill directly, for example:
   - `$governor-plan-runner`
   - `$governor-task-implementer`
   - `$governor-delivery-finisher`

`Codex`, `GitHub Copilot`, and `Claude Code` can all consume the same official skill set. Adapter-specific bundle, instructions, or prompt files remain useful as supplementary context, but they do not replace the installed skills.

Then prepare a requirement file and generate sprint artifacts:

```bash
cat > "$TMP_DIR/request.md" <<'EOF'
# Requirement

Build a repository governance MVP validation flow.
EOF

$CLI plan \
  --cwd "$TMP_DIR" \
  --project demo \
  --sprint sprint-001 \
  --input "$TMP_DIR/request.md" \
  --title "Repository governance MVP validation" \
  --format json
```

Run checks, review, and reporting:

```bash
$CLI check \
  --cwd "$TMP_DIR" \
  --project demo \
  --sprint sprint-001 \
  --format json

$CLI review \
  --cwd "$TMP_DIR" \
  --project demo \
  --sprint sprint-001 \
  --path src \
  --format json

$CLI report \
  --cwd "$TMP_DIR" \
  --source .repo-ai-governor/reports/latest.json \
  --format markdown \
  --dry-run
```

For a fuller step-by-step path, see:

1. [Quick Start](/Users/jimmydaddy/study/repo-ai-governor/docs/quick-start.md)
2. [Getting Started Example](/Users/jimmydaddy/study/repo-ai-governor/docs/getting-started-example.md)
3. [Ten-Minute Getting Started](/Users/jimmydaddy/study/repo-ai-governor/docs/release-ga/sprint-001/ten-minute-getting-started.md)
4. [Skills V1 Sprint 001](/Users/jimmydaddy/study/repo-ai-governor/docs/skills-v1/sprint-001/index.md)

## Commands

### `init`

Bootstrap governance config, `AGENTS.md`, context file, adapter config, and sprint artifacts.

### `doctor`

Validate environment, config, and repository layout. Supports `--strict` and `--fix`.

### `plan`

Generate `plan.md`, `tasks/checklist.md`, `tasks/tasks.csv`, and `TK-xxx.md` task cards.

### `check`

Run governance checks against plan and artifact quality. Can write unified reports.

### `review`

Run repository-aware code review checks and emit status-prefixed CR files.

### `review-verify`

Re-check a review record and advance it through the CR lifecycle.

### `report`

Render summary, markdown, or JSON reports from governance payloads or CR files.

### `upgrade`

Preview and apply config / template upgrades with backup support.

## Examples

Adapter examples:

1. [Codex](/Users/jimmydaddy/study/repo-ai-governor/examples/adapters/codex/README.md)
2. [GitHub Copilot](/Users/jimmydaddy/study/repo-ai-governor/examples/adapters/github-copilot/README.md)
3. [Claude Code](/Users/jimmydaddy/study/repo-ai-governor/examples/adapters/claude-code/README.md)

Acceptance assets:

1. [MVP Acceptance Kit](/Users/jimmydaddy/study/repo-ai-governor/examples/mvp-acceptance/README.md)
2. [Official Example Slots](/Users/jimmydaddy/study/repo-ai-governor/examples/slot-packages/official/README.md)
3. [CI Example](/Users/jimmydaddy/study/repo-ai-governor/examples/ci/github-actions-governance.yml)

## Repository Docs

Planning and execution records for the MVP are kept under:

1. [mvp](/Users/jimmydaddy/study/repo-ai-governor/docs/mvp)
2. [post-mvp project recommendation](/Users/jimmydaddy/study/repo-ai-governor/docs/post-mvp-project-recommendation.md)
3. [release-ga sprint-001](/Users/jimmydaddy/study/repo-ai-governor/docs/release-ga/sprint-001/index.md)

## Release Readiness

Current release gate commands:

```bash
npm run check
npm run release:dry-run
npm run release
npm run release:check
npm run release:verify-local
npm run release:ga-check
```

Release policy and GA criteria are documented in:

1. [GA Release Flow](/Users/jimmydaddy/study/repo-ai-governor/docs/release-ga/sprint-001/ga-release-flow.md)
2. [CHANGELOG.md](/Users/jimmydaddy/study/repo-ai-governor/CHANGELOG.md)
3. [CHANGELOG.zh-CN.md](/Users/jimmydaddy/study/repo-ai-governor/CHANGELOG.zh-CN.md)
4. [Remote Release Automation](/Users/jimmydaddy/study/repo-ai-governor/docs/release-ga/sprint-001/remote-release-automation.md)
5. [Release Ops Sprint 001](/Users/jimmydaddy/study/repo-ai-governor/docs/release-ops/sprint-001/index.md)

Current recommended publish path:

1. Run `npm run release:dry-run` to preview the next release.
2. Run `npm run release` to let `release-it` bump, tag, and create the GitHub Release.
3. Let [.github/workflows/publish-npm.yml](/Users/jimmydaddy/study/repo-ai-governor/.github/workflows/publish-npm.yml) publish the package to npm when the GitHub Release is published.
