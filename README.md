# Repo AI Governor

`repo-ai-governor` is a repository-local AI governance CLI. It lets one repository connect tools like Codex, Claude Code, and GitHub Copilot to a shared workflow for planning, execution, review, verification, and audit.

This project is for teams that want more than "let the agent run." It is built for repositories that need repeatable AI workflows, clear review loops, explicit human gates, and durable workspace artifacts.

- Chinese guide: `README.zh-CN.md`
- Adopter runbook: `docs/local-adoption-playbook.md`
- Maintainer runbook: `docs/maintainer-validation-playbook.md`
- Formal support boundary: `docs/support-matrix.md`
- Runnable examples: `examples/`
- Changelog: `CHANGELOG.md`

## What This Project Helps You Do

With the current public CLI surface you can:

| Goal | Main commands |
|---|---|
| Bootstrap a repository and inspect environment readiness | `init`, `doctor`, `check` |
| Install and maintain a managed adoption baseline | `adopt list`, `adopt apply`, `adopt diff`, `adopt verify`, `adopt upgrade`, `adopt remove` |
| Connect multiple AI tools into one governed baseline | `connect`, `doctor` |
| Keep personal machine defaults and secrets out of shared config | `config`, `secret` |
| Run a governed delivery loop | `plan`, `run`, `review`, `review-verify` |
| Use a conversation-first shell instead of one-shot commands | `repo-ai-governor`, `resume` |
| Preview workflows and manage workspace or schema changes | `workflow`, `workspace`, `set-ui-theme`, `upgrade` |
| Generate lower-level host assets and service-host integrations | `host export`, `host verify`, `host pack`, `repo-ai-governor/service-host` |

If you only remember one thing: most adopters should start with `init`, `doctor`, and `adopt apply`, then move to `connect` and a traced `run --dry-run`.

## Start Here

Choose the path that matches your goal:

| If you want to... | Start with |
|---|---|
| Try the CLI without changing the target repo dependency graph | `dist-binary` rehearsal |
| Install the governor into a normal `pnpm` repository | `path` install |
| Keep a target repo following a local source checkout closely | `link` install |
| Rehearse the packaged CLI tarball | `tgz` install |

Assume this repository is `<governor-repo>` and your target repository is `<target-repo>`.

### Option A: Fastest safe rehearsal with `dist-binary`

Use this when the target repository is dirty, uses Yarn/npm, or you want to prove CLI/runtime behavior before adding a dependency.

```bash
cd <governor-repo>
pnpm run build

cd <target-repo>
node <governor-repo>/dist/bin/repo-ai-governor.js --help
node <governor-repo>/dist/bin/repo-ai-governor.js init --output pretty
node <governor-repo>/dist/bin/repo-ai-governor.js doctor --output json
node <governor-repo>/dist/bin/repo-ai-governor.js check --output json
```

### Option B: Recommended install for a normal `pnpm` repo

Use this when you want the cleanest local adoption story.

```bash
cd <target-repo>
pnpm add --save-exact <governor-repo>
pnpm exec repo-ai-governor --help
pnpm exec repo-ai-governor init --output pretty
pnpm exec repo-ai-governor doctor --output json
pnpm exec repo-ai-governor check --output json
```

### Option C: Managed installation for a real adopter baseline

Once bootstrap succeeds, apply the managed baseline instead of hand-copying host assets.

```bash
pnpm exec repo-ai-governor adopt list --output json
pnpm exec repo-ai-governor adopt apply adopter-complete --repo . --hosts codex,claude-code,github-copilot --output json
pnpm exec repo-ai-governor adopt verify --repo . --output json
```

What you should expect after this:

1. `init` completes a guided first-time setup.
2. `doctor` and `check` return readable or machine-readable facts instead of crashing.
3. `adopt apply` writes managed installation metadata under `.repo-ai-governor/adoption/installations/**`.
4. `adopt verify` becomes the supported way to prove the managed baseline is still healthy.

## First Successful Workflow

After the repository is bootstrapped, the shortest end-to-end governed path is:

```bash
pnpm exec repo-ai-governor connect --tools codex,claude-code --preset multi-tool-default --output json
pnpm exec repo-ai-governor doctor --adapters --fix --output json
pnpm exec repo-ai-governor doctor --adapters --output json
pnpm exec repo-ai-governor run --output json --dry-run --trace
pnpm exec repo-ai-governor review --output json
pnpm exec repo-ai-governor review-verify --output json
```

Why this order works:

1. `connect` creates a reviewable candidate config instead of mutating the active config blindly.
2. `doctor --adapters --fix` handles safe local repairs only.
3. A second `doctor --adapters` is the read-only readiness recheck before a real run.
4. `run --dry-run --trace` gives you routing and artifact evidence with the lowest risk.
5. `review` and `review-verify` close the loop with a governed review lifecycle.

## Personal Defaults And Secrets

One easy-to-miss part of the current product is that shared repo config and personal machine config are intentionally separate.

Use `connect` for shared repository-facing onboarding, and use `config` plus `secret` when a model choice, endpoint, or credential selector should stay user-local:

```bash
pnpm exec repo-ai-governor config set tools.codex.transport remote_api
pnpm exec repo-ai-governor config set tools.codex.remoteApi.model gpt-5
pnpm exec repo-ai-governor config set tools.codex.remoteApi.credentialRef secret://openai/api-key
printf '%s' "$OPENAI_API_KEY" | pnpm exec repo-ai-governor secret set openai/api-key --stdin
pnpm exec repo-ai-governor secret status
pnpm exec repo-ai-governor connect --tools codex --output pretty
```

This keeps plaintext secrets out of shared workspace config while still letting the repository consume a stable selector such as `secret://openai/api-key`.

## Common User Paths

Use these as a mental model for the product:

| Job to be done | Recommended commands |
|---|---|
| Install or refresh one governed repository baseline | `adopt apply`, `adopt verify`, `adopt diff`, `adopt upgrade`, `adopt remove` |
| Wire multiple tools into one repository | `connect`, `doctor --adapters --fix`, `doctor --adapters` |
| Run the first plan -> run -> review loop | `plan`, `run --dry-run --trace`, `review`, `review-verify` |
| Work in a conversation-first shell | `repo-ai-governor --output pretty`, `resume` |
| Move the workspace into or out of the target repo | `workspace dry-run`, `workspace execute`, `workspace rollback` |
| Preview or apply controlled schema/workspace upgrades | `upgrade`, `upgrade apply`, `upgrade rollback` |
| Generate host-native follow-up assets from a source checkout | `host export`, `host verify`, `host pack` |

The session shell theme selector currently exposes `governor`, `catppuccin`, `calm`, `tokyo-night`, `kanagawa`, and `flexoki`. Run `repo-ai-governor set-ui-theme --output pretty` or `repo-ai-governor workspace set-ui-theme --output pretty` to choose one interactively.

## Which Document To Read Next

Use the docs like this:

| Document | Use it for |
|---|---|
| `README.md` | Product overview, quick start, and the shortest path to first success |
| `docs/local-adoption-playbook.md` | Day-to-day adopter runbook with install, onboarding, dry-run, rollback, and troubleshooting steps |
| `docs/support-matrix.md` | Formal support truth for install modes, adapters, and secondary surfaces |
| `docs/maintainer-validation-playbook.md` | Release and validation runbook for maintainers of this repository |
| `examples/` | Runnable scenarios for adoption drills and command-contract examples |

## Support Boundaries Worth Knowing Early

These are the constraints that most often surprise new readers:

1. `dist-binary` proves CLI/runtime behavior, not packaged-install behavior.
2. `tgz` is an online packaged-install rehearsal that still depends on the npm registry, not an offline/self-contained installer.
3. Built-in `adopt apply` is the preferred whole-repository installation path; lower-level `host export` and `host pack` are follow-up surfaces, not the default installer story.
4. VS Code support is currently a built-source companion and local VSIX packaging path, not Marketplace support.
5. Desktop support is currently desktop foundation-only from a built source checkout, not a standalone desktop installer or standalone desktop product.
6. `local-model` is a constrained fallback surface, not a full substitute for primary remote adapters.

Built-in adoption packs can also project repository-local `.codex/skills/` assets when that governed baseline is part of the installation.

For the exact support contract, always check `docs/support-matrix.md`.

## Examples

The repository ships runnable example scenarios for:

1. Single-role minimal flow
2. Multi-role collaboration flow
3. HITL escalation flow
4. Restricted-network degrade flow
5. Optional plugin-memory flow

Start with `examples/README.md` when you want a concrete scenario instead of a generic quick start.
