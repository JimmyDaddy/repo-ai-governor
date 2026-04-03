# invoke liveness budget regression and closeout baseline

- Status: active
- Date: 2026-04-03
- Scope: `project-037-agent-invoke-liveness-and-timeout-governance-rollout / sprint-003-graceful-interrupt-cutover-and-governance-closeout`
- Owner Task: `TK-491`

## 1. Baseline Summary

1. `cli_exec` direct-answer surfaces currently converge on one shared default invoke timeout baseline of `30000ms`.
2. `session.main.role.reviewer` repository-review paths on `Codex` / `Claude Code` / `GitHub Copilot` converge on one long-running baseline of `600000ms`.
3. `remote_api` surfaces on `Codex` / `Claude Code` converge on configured timeout truth first, then fall back to the adapter-level default timeout baseline of `30000ms`; retry baseline defaults to `2`.
4. `local-model / Ollama` keeps a `30000ms` default timeout baseline, but still resolves the effective timeout from `localModel.requestTimeoutMs -> agentInvocationTimeoutMs -> stageTimeoutMs -> flowTimeoutMs`.
5. Preflight surfaces (`connect` / `doctor` / `verify`) now expose transport/provider/vendor-binding/cancellation truth and effective budget defaults, but runtime stall/grace/hard-terminate interpretation remains owned by execution diagnostics and replay artifacts rather than preflight checks.

## 2. Timeout Budget Matrix

| route / role class | surfaces | transport | effective invoke timeout baseline | retry baseline | override path | evidence |
|---|---|---|---|---|---|---|
| `session.main` direct-answer | `codex`, `claude-code`, `github-copilot` | `cli_exec` | `30000ms` | `2` | adapter constructor `requestTimeoutMs`, then `agentInvocationTimeoutMs` at request-time | `packages/adapters/codex/src/codex-agent-adapter.ts`, `packages/adapters/claude-code/src/claude-code-agent-adapter.ts`, `packages/adapters/github-copilot/src/github-copilot-agent-adapter.ts` |
| `session.main.role.reviewer` with `reviewScope=uncommitted_changes` | `codex`, `claude-code`, `github-copilot` | `cli_exec` | `600000ms` | `2` | repository-review route default, still overridable by `agentInvocationTimeoutMs` | `packages/adapters/codex/src/codex-agent-adapter.ts`, `packages/adapters/claude-code/src/claude-code-agent-adapter.ts`, `packages/adapters/github-copilot/src/github-copilot-agent-adapter.ts` |
| `remote_api` invoke / probe | `codex`, `claude-code` | `remote_api` | `remoteApi.requestTimeoutMs ?? 30000ms` | `remoteApi.maxRetries ?? 2` | config-level `remoteApi` row | `packages/adapters/codex/src/codex-agent-adapter.ts`, `packages/adapters/claude-code/src/claude-code-agent-adapter.ts` |
| local-model direct-answer | `ollama` | `baseline` | `localModel.requestTimeoutMs ?? agentInvocationTimeoutMs ?? stageTimeoutMs ?? flowTimeoutMs ?? 30000ms` | `localModel.maxRetries ?? 0` | config + request-time override chain | `packages/adapters/local-model/src/local-model-agent-adapter.ts` |

## 3. Regression Matrix Baseline

| surface | contract focus | current regression evidence |
|---|---|---|
| `codex cli_exec` | watchdog, suspect stall, graceful interrupt, hard terminate, partial output | `packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts` |
| `claude-code cli_exec` | shared invoke-liveness alignment, graceful interrupt parity | `packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts` |
| `github-copilot cli_exec` | shared invoke-liveness alignment, graceful interrupt parity | `packages/adapters/github-copilot/test/github-copilot-agent-adapter.smoke.test.ts` |
| `remote_api codex/claude-code` | stream liveness, provider truth, credential boundary, delivery smoke | `packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts`, `packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts`, `scripts/release/verify-local-distribution.js`, `scripts/release/verify-cleanroom-local-install.js` |
| `local-model` | long-operation progress protection, timeout budget, partial output | `packages/adapters/local-model/test/local-model-agent-adapter.smoke.test.ts` |
| orchestration / session consumer | execution summary liveness, event relay, shell progress rendering | `packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`, `apps/cli/test/runtime/session-shell-turn-progress-dock.test.ts`, `apps/cli/test/runtime/session-main-supervisor-runtime.test.ts` |
| preflight diagnostics | doctor/verify matrix truth, cancellation mode, reason codes, effective budgets | `apps/cli/test/runtime/adapter-diagnostics-runtime.test.ts`, `apps/cli/test/runtime/agent-onboarding-runtime.test.ts`, `apps/cli/test/runtime/adapter-verification-runtime.test.ts` |

## 4. Cutover And Rollback Boundaries

1. Shared invoke-liveness contract is now the only truth surface for runtime stall / grace / hard-terminate semantics; consumer rollback must not reintroduce adapter-private status taxonomies.
2. `doctor/verify` may display configured/effective budget diagnostics, but must not claim runtime stall conclusions without execution evidence.
3. Presenter rollback is bounded:
   `interactive shell` / `doctor` / `verify` consumers can be reverted independently, as long as execution summary / event stream liveness truth remains intact.
4. Adapter rollback is bounded:
   one adapter may temporarily lose shared liveness parity, but only if its surface is explicitly downgraded and regression evidence is updated; silent divergence from stable reason codes is not acceptable.
5. Partial output preservation is part of the closeout contract:
   any rollback that drops `partial_output_preserved` or latest text preview from execution details is considered a regression, not a cosmetic change.

## 5. Remaining Closeout Inputs

1. Freeze one explicit invoke-liveness gate profile for sprint/project closeout:
   `pnpm run check` plus focused smoke coverage for `codex`, `claude-code`, `github-copilot`, `local-model`, orchestration, and CLI diagnostics.
2. Produce `TK-491` final delivery artifact(s) for project closeout:
   sprint exit recommendation / DA artifact, project completion audit summary, and milestone backlinks.
3. Sync final truth surfaces once closeout is complete:
   `project-037 plan.md`, `sprint-003 plan.md`, `current-context.md`, `completed-streams-history.md`, task ledger, and any remaining review lifecycle artifacts.
