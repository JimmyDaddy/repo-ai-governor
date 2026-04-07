# DA-600 Claude Code real invocation baseline verify and docs evidence

- Status: completed
- Date: 2026-04-06
- Project: `project-053-real-adapter-invocation-productization`
- Sprint: `sprint-001-claude-code-real-invocation-baseline`
- Task: `TK-600`

## 1. Acceptance Summary

1. 真实 CLI `verify --adapters` 证据已记录：当前 workspace 结论为 `warn`，但 `required_role_failures=0`，并且 `tool_transport_matrix` 对 `claude-code` 正确投影出默认 `cli_exec`、`request_timeout_ms=30000` 与 `max_retries=2`。
2. 真实 CLI `run --dry-run --trace` 证据已记录：当前 dry-run 仍以默认 `codex` primary route 失败于 `stage-task-prepare`，但 `report / replay / diagnostics_trace` 已完整落盘，可作为 projected descriptor 与 stage-level attribution 的正式证据。
3. `docs/support-matrix*.md` 与 `docs/local-adoption-playbook*.md` 已更新为 truth-first 口径，明确区分 `claude-code` 的 real-path availability、环境前置条件 warning，以及 `tool_transport_matrix` / dry-run trace 的阅读方式。

## 2. Evidence Paths

1. `.tmp/project-053-sprint-001-verify-adapters.json`
2. `.tmp/project-053-sprint-001-run-dry-run-trace.json`
3. `/Users/jimmydaddy/.repo-ai-governor/workspaces/2cf23e5951f0/.repo-ai-governor/context/diagnostics/verify/verify-1775492686584.json`
4. `/Users/jimmydaddy/.repo-ai-governor/workspaces/2cf23e5951f0/.repo-ai-governor/context/diagnostics/trace/cli-run-1775492752931.trace.json`
5. `/Users/jimmydaddy/.repo-ai-governor/workspaces/2cf23e5951f0/.repo-ai-governor/context/reports/cli-run-1775492752931.report.json`
6. `/Users/jimmydaddy/.repo-ai-governor/workspaces/2cf23e5951f0/.repo-ai-governor/context/replay/cli-run-1775492752931.replay.json`

## 3. Documentation Surfaces Refreshed

1. `docs/support-matrix.md`
2. `docs/support-matrix.zh-CN.md`
3. `docs/local-adoption-playbook.md`
4. `docs/local-adoption-playbook.zh-CN.md`
