# DA-732 remote_api clean-room and verify evidence summary

- Status: completed
- Date: 2026-04-10
- Project: `project-076-transport-selection-authority-rollout`
- Sprint: `sprint-003-evidence-gated-docs-and-adopter-truth`
- Task: `TK-732`

## 1. Summary

1. `project-076` 现已形成一组可回放证据，证明 Codex / Claude Code 在显式选择 `remote_api` 时能够独立完成 probe / invoke，并在 clean-room 与 packaged distribution 场景下保持一致的 transport truth。
2. 本轮证据同时覆盖 fail-closed 语义：显式 `remote_api` 失败不会被同 surface 的 `cli_exec` 成功结果静默复用。
3. 证据 gate 结论为 `passed`，因此 `TK-733` 可以在不扩大公开承诺边界的前提下，升级 adopter-facing wording。

## 2. Evidence Packet

1. Targeted adapter verification
   - command: `pnpm exec vitest run packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts --reporter=json --outputFile .tmp/project-076-sprint-003-remote-api-vitest.json --maxWorkers=1 --maxConcurrency=1`
   - result: `65/65` tests passed
   - key assertions:
     - Codex `remote_api` probe / invoke through OpenAI-compatible fetch
     - Claude Code `remote_api` probe / invoke through Anthropic-compatible fetch
     - remote_api continuation, liveness, timeout, and partial-output handling
     - `keeps explicit remote_api failures fail-closed instead of silently reusing same-surface cli_exec truth`
2. Packaged distribution smoke
   - command: `node ./scripts/release/verify-local-distribution.js --output .tmp/project-076-sprint-003-local-distribution-report.json`
   - report type: `local_distribution_verification_v2`
   - result: `remoteApiDistSmoke.status=passed`, `distributionMode=default`, `packedFileCount=2297`
   - diagnostics truth:
     - `doctor` remained `warn`: `/private/var/folders/6_/_ffnz6q91dddz6wchgxcblsw0000gn/T/repo-ai-governor-dist-remote-api-ZMsreQ/target-repo/.repo-ai-governor/context/diagnostics/doctor/doctor-1775758776647.json`
     - `verify` remained `warn`: `/private/var/folders/6_/_ffnz6q91dddz6wchgxcblsw0000gn/T/repo-ai-governor-dist-remote-api-ZMsreQ/target-repo/.repo-ai-governor/context/diagnostics/verify/verify-1775758779997.json`
3. Clean-room install rehearsal
   - command: `node ./scripts/release/verify-cleanroom-local-install.js --modes path,link,tgz --iterations 1 --output .tmp/project-076-sprint-003-cleanroom-report.json`
   - report type: `cleanroom_local_install_verification_v2`
   - result: `status=passed`, `selectedModes=[path,link,tgz]`, `iterationsPerMode=1`
   - remote_api scenarios:
     - `path`: passed; `doctor` / `verify` remained `warn`
     - `link`: passed; `doctor` / `verify` remained `warn`
     - `tgz`: passed; `doctor` / `verify` remained `warn`

## 3. Gate Verdict

1. Evidence-backed claim allowed:
   - Codex / Claude Code 显式 `remote_api` 选择已具备 targeted + packaged + clean-room 证据，公开文案可以从“可选但未证明”提升为“evidence-backed but environment-gated”。
2. Boundary that must remain explicit:
   - `doctor` / `verify` 的 `warn` 仍是环境前置条件真值，不应被表述为“已经成功 fallback 到 `cli_exec`”。
3. Routing contract preserved:
   - selected transport truth 继续保持 fail-closed；显式 `remote_api` 失败时，系统应保留失败归因，而不是静默复用同 surface 的 `cli_exec` 成功真值。

## 4. Output Paths

1. `.tmp/project-076-sprint-003-remote-api-vitest.json`
2. `.tmp/project-076-sprint-003-local-distribution-report.json`
3. `.tmp/project-076-sprint-003-cleanroom-report.json`
4. `.repo-ai-governor/context/dev/project-076-transport-selection-authority-rollout/sprint-003-evidence-gated-docs-and-adopter-truth/tasks/DA-732-remote-api-clean-room-and-verify-evidence-summary.md`
