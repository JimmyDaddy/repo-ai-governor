# project-085 command-based remote_api configuration completion audit summary

- Status: completed
- Date: 2026-04-11
- Audit Scope: `project-085-command-based-remote-api-configuration`
- Completion Conclusion: `completed`

## 1. Completion conclusion

1. `project-085` is now `completed`.
2. `connect` can now author first-time `remote_api` candidates directly from command input, so users no longer need to hand-edit `governor.yaml` before enabling provider-backed routes.
3. The feature remains intentionally narrow: command input can author model, endpoint, and credential env-var references, but real API key values still stay outside the config file.

## 2. Closeout outcome

1. `connect` now accepts `--remote-api-model`, `--remote-api-credential-env-var`, and `--remote-api-endpoint`, and those bindings flow into runtime debug options and onboarding candidate synthesis.
2. The onboarding runtime now synthesizes first-time `remote_api` config for `codex` and `claude-code`, including surface-aware provider, vendor binding, and default credential env-var mapping.
3. CLI help, CLI README, and local adoption playbooks now document the command-based authoring path and explicitly state that actual API keys still come from external environment variables instead of command literals or persisted secrets.

## 3. Audit scope

1. `sprint-001-connect-command-remote-api-authoring`

## 4. Task completion statistics

1. Total implementation / closeout task cards currently materialized in project scope: `2`
2. Latest `TK` status `completed` count: `2 / 2`
3. Latest `CR` status `resolved` count: `0 / 0`
4. Remaining implementation or review gaps before project completion claim: `0`

## 5. Key evidence

1. `./plan.md`
2. `./sprint-001-connect-command-remote-api-authoring/plan.md`
3. `./sprint-001-connect-command-remote-api-authoring/tasks/TK-773-add-command-based-remote-api-authoring-to-connect-onboarding-flow.md`
4. `./sprint-001-connect-command-remote-api-authoring/tasks/TK-774-finalize-project-085-closeout-after-connect-remote-api-command-authoring.md`
5. `./sprint-001-connect-command-remote-api-authoring/tasks/checklist.md`
6. `./sprint-001-connect-command-remote-api-authoring/tasks/tasks.csv`
7. `../../../../apps/cli/src/main.ts`
8. `../../../../apps/cli/src/runtime/agent-onboarding-runtime.ts`
9. `../../../../apps/cli/test/runtime/agent-onboarding-runtime.test.ts`
10. `../../../../apps/cli/test/connect-phase2.integration.test.ts`
11. `../../../../apps/cli/test/cli-output-contract.integration.test.ts`
12. `../../../../apps/cli/README.md`
13. `../../../../docs/local-adoption-playbook.md`
14. `../../../../docs/local-adoption-playbook.zh-CN.md`
15. `../../../../.repo-ai-governor/context/current-context.md`
16. `../../../../.repo-ai-governor/context/completed-streams-history.md`

## 6. Delivered capability summary

1. Users can now bootstrap `codex` or `claude-code` `remote_api` routing through `connect` flags instead of writing `remoteApi` blocks by hand first.
2. The parser and runtime stay fail-closed: unsupported surfaces remain blocked, first-time authoring still requires `--remote-api-model`, and selected-tool scope mismatches still error out.
3. Help and adoption docs now expose the same product truth as the code: command-based authoring is supported, but secret values remain external.

## 7. Verification evidence

1. `pnpm exec vitest run apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/connect-phase2.integration.test.ts apps/cli/test/cli-output-contract.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `pnpm run build`（通过）
3. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
5. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
6. `node ./scripts/governance/check-worktree-review-target.js`（通过）

## 8. Residual risk and follow-up advice

1. This follow-up does not introduce a new secret store, so operators still need to provision the actual API key through shell env, `direnv`, CI secrets, or another external secret manager.
2. The command-based authoring path currently covers `codex` and `claude-code`; if future work expands provider-backed routes for other surfaces, extend the same surface-aware guardrails rather than adding raw secret-literal flags.
