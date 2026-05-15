# Repo AI Governor

`repo-ai-governor` is a repository-local AI governance CLI. It lets one repository use tools like Codex, Claude Code, and GitHub Copilot inside the same `plan -> run -> review -> verify` workflow, with durable artifacts and explicit human gates where they matter.

Think of it as "install a governed AI delivery loop into a repo", not "another chat shell".

- Chinese guide: `README.zh-CN.md`
- Adopter runbook: `docs/local-adoption-playbook.md`
- Maintainer runbook: `docs/maintainer-validation-playbook.md`
- Formal support boundary: `docs/support-matrix.md`
- Runnable examples: `examples/`
- Changelog: `CHANGELOG.md`

## Start With The Default Path

Most teams should follow this order:

1. `init`
2. `doctor`
3. `adopt bootstrap`
4. `check`
5. `connect`
6. `connect apply --latest`
7. `adopt verify`
8. `run --dry-run --trace`

If you only remember one thing from this README, remember that sequence.

## When This Project Is A Good Fit

Use `repo-ai-governor` when you want:

- More than one AI tool working in the same repository.
- A repeatable workflow instead of ad-hoc agent runs.
- Explicit review and approval points for risky changes.
- Durable artifacts for review, verification, and audit.

## The Short Mental Model

You do not need to learn every command at once. These are the main job groups:

| If you want to... | Start with |
|---|---|
| Bootstrap a repo and inspect environment readiness | `init`, `doctor`, `check` |
| Install or refresh the managed repo setup | `adopt list`, `adopt bootstrap`, `adopt verify`, `adopt diff`, `adopt upgrade`, `adopt remove` |
| Connect tools to the repo workflow | `connect`, `doctor --adapters` |
| Run work through the governed loop | `plan`, `run`, `review`, `review-verify` |
| Keep personal defaults and secrets out of shared config | `config`, `secret` |
| Use a conversation-first shell | `repo-ai-governor`, `resume` |
| Move the workspace or apply controlled upgrades | `workspace`, `upgrade` |
| Generate lower-level host assets | `host export`, `host verify`, `host pack`, `repo-ai-governor/service-host` |

## Choose The Lightest Install Path

If you are new to the project, pick the smallest path that proves the behavior you care about.

| Mode | Use it when... | Main command |
|---|---|---|
| `dist-binary` | You want a no-install rehearsal, or the target repo is dirty or non-`pnpm` | `node <governor-repo>/dist/bin/repo-ai-governor.js <command>` |
| `path` | You want the normal install path in a `pnpm` repository | `pnpm add --save-exact <governor-repo>` |
| `link` | The target repo should intentionally follow your local source checkout | `pnpm add --save-exact link:<governor-repo>` |
| `tgz` | You want to rehearse the packaged CLI tarball in an online environment | `pnpm pack --json` then `pnpm add --save-exact <tarball>` |

Simple rule:

1. Use `dist-binary` for the lowest-risk rehearsal.
2. Use `path` for the normal real-repo install story.
3. Use `link` only when source-following is intentional.
4. Use `tgz` only when you explicitly need packaged-install rehearsal.

## Fastest Safe Rehearsal

Assume this repository is `<governor-repo>` and your target repository is `<target-repo>`.

```bash
cd <governor-repo>
pnpm run build

cd <target-repo>
node <governor-repo>/dist/bin/repo-ai-governor.js --help
node <governor-repo>/dist/bin/repo-ai-governor.js init --output pretty
node <governor-repo>/dist/bin/repo-ai-governor.js doctor --output json
node <governor-repo>/dist/bin/repo-ai-governor.js check --output json
```

This path is useful when you want to prove the CLI and runtime behavior before adding a dependency to the target repo.

## Recommended Install For A Real `pnpm` Repository

If the target repo already uses `pnpm`, this is the default starting point:

```bash
cd <target-repo>
pnpm add --save-exact <governor-repo>
pnpm exec repo-ai-governor init --output pretty
pnpm exec repo-ai-governor doctor --output json
pnpm exec repo-ai-governor adopt bootstrap --repo . --hosts codex,claude-code,github-copilot --output json
pnpm exec repo-ai-governor check --output json
```

What each step is doing:

1. `init` creates the baseline workspace/config path.
2. `doctor` tells you what the current machine and repo are missing.
3. `adopt bootstrap` installs the managed repo setup in one command.
4. `check` is the broader follow-up audit after installation.

If you intentionally need a repo-local self-host template (`self-host-complete + repo_local`), use the playbook instead of inventing your own path: `docs/local-adoption-playbook.md`.

For that self-host path, keep `adopt bootstrap -> connect -> connect apply --latest -> adopt verify -> doctor --adapters -> run --dry-run --trace` strictly serial. Do not overlap `connect`, `connect apply --latest`, or `adopt verify`, because `adopt verify` is the canonical readiness readback and concurrent runs can report the pre-apply summary instead of the active adapter-connected baseline.

## First Governed Workflow

Once the repository is bootstrapped, this is the shortest end-to-end governed flow:

```bash
pnpm exec repo-ai-governor connect --tools codex,claude-code --preset multi-tool-default --output json
pnpm exec repo-ai-governor connect apply --latest --output json
pnpm exec repo-ai-governor adopt verify --repo . --output json
pnpm exec repo-ai-governor doctor --adapters --fix --output json
pnpm exec repo-ai-governor doctor --adapters --output json
pnpm exec repo-ai-governor run --output json --dry-run --trace
pnpm exec repo-ai-governor review --output json
pnpm exec repo-ai-governor review-verify --output json
```

Why this order works:

1. `connect` prepares a reviewable repo config instead of mutating blindly.
2. `connect apply --latest` records the reviewed adapter baseline into the active `governor.yaml`.
3. `adopt verify` refreshes the canonical activation verdict after connect changes.
4. `doctor --adapters --fix` is limited to safe local repairs.
5. A second `doctor --adapters` is the read-only readiness recheck.
6. `run --dry-run --trace` is the lowest-risk proof before a real run.
7. `review` and `review-verify` close the loop with a formal review lifecycle.

For repo-local self-host templates, do not stop at `connect` alone. The real operator path is `adopt bootstrap -> connect -> connect apply --latest -> adopt verify -> doctor --adapters -> run --dry-run --trace`, and it must stay serial. The applied connect receipt plus the refreshed verify summary are what move the self-host readiness chain to an adapter-connected baseline.

`run --dry-run --trace` only proves that a diagnostic dry-run was allowed. A successful dry-run does not mean `execution_ready=completed`, and a template repo without real `project/sprint/task` authoring still only proves install/connect truth rather than a real delivery path.

If the first `run --dry-run --trace` still stops at a policy/HITL confirm such as `lockfile_delta`, treat that as an execution-policy checkpoint rather than a bootstrap failure. In the current runtime this can surface as `POLICY_GATE_HITL_FEEDBACK_INVALID` when no confirmation payload is provided.

## Keep Personal Defaults And Secrets Local

Shared repo config and personal machine config are intentionally separate.

Use `connect` for shared repository-facing setup. Use `config` and `secret` when the setting should stay user-local:

```bash
pnpm exec repo-ai-governor config set tools.codex.transport remote_api
pnpm exec repo-ai-governor config set tools.codex.remoteApi.model gpt-5
pnpm exec repo-ai-governor config set tools.codex.remoteApi.credentialRef secret://openai/api-key
printf '%s' "$OPENAI_API_KEY" | pnpm exec repo-ai-governor secret set openai/api-key --stdin
pnpm exec repo-ai-governor secret status
pnpm exec repo-ai-governor connect --tools codex --output pretty
```

This keeps plaintext secrets out of shared repo config while still letting the repo point at a stable selector such as `secret://openai/api-key`.

## Read Next

Use the docs in this order:

| Document | Use it for |
|---|---|
| `README.md` | Product overview and the shortest path to first success |
| `docs/local-adoption-playbook.md` | Real-world adopter setup, dry-runs, rollback, and troubleshooting |
| `docs/support-matrix.md` | Exact support boundary for install modes, adapters, and secondary surfaces |
| `docs/maintainer-validation-playbook.md` | Release and validation workflow for maintainers of this repo |
| `examples/` | Concrete runnable scenarios instead of generic setup steps |

## Important Boundaries

These are the limits that surprise new readers most often:

1. `dist-binary` proves CLI/runtime behavior. It does not prove packaged install behavior.
2. `tgz` is still an online packaged-install rehearsal. It is not an offline or self-contained installer.
3. `adopt bootstrap` is the default whole-repo installer path. `host export` and `host pack` are lower-level follow-up tools.
4. VS Code support is currently a built-source companion and local VSIX path, not Marketplace support. On those supported VS Code paths, `Connect Provider` / `Update API Key` / `Reconnect Provider` keep API-key capture inside the extension and persist only managed-secret-backed `credentialRef` plus non-secret provider defaults.
5. Desktop support is currently built-source foundation-only, not a standalone desktop installer or separate desktop product.
6. `local-model` is a constrained fallback path, not a full replacement for the primary remote adapters.
7. The formal support truth always lives in `docs/support-matrix.md`.

## Examples

The repository ships runnable scenarios for:

1. Single-role minimal flow
2. Multi-role collaboration flow
3. HITL escalation flow
4. Restricted-network degrade flow
5. Optional plugin-memory flow

Start with `examples/README.md` if you want a concrete scenario instead of a generic quick start.
