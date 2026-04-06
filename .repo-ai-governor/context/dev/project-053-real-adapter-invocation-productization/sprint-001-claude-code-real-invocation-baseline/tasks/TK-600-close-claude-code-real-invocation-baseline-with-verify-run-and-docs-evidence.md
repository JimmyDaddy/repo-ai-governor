# TK-600 close Claude Code real invocation baseline with verify run and docs evidence

- Status: completed
- Date: 2026-04-06
- Task ID: `TK-600`
- Owner: `AI-Agent`
- Priority: `P1`
- Sprint: `sprint-001-claude-code-real-invocation-baseline`
- Project: `project-053-real-adapter-invocation-productization`

## 1. 任务目标

以 verify run 与 docs evidence 收口 `Claude Code` 真实调用基线。

## 2. Depends On

1. `TK-598`
2. `TK-599`

## 3. Expected Outputs

1. `DA-600-claude-code-real-invocation-baseline-verify-and-docs-evidence.md`
2. real CLI `verify --adapters` evidence with transport-truth diagnostics
3. real CLI `run --dry-run --trace` evidence with report/replay/trace backlinks
4. support/playbook docs refreshed to distinguish `claude-code` real-path truth from environment warnings

## 4. Execution Notes

1. 2026-04-06：任务创建，等待 `TK-598 / TK-599` 完成。
2. 2026-04-06：运行 `node ./dist/bin/repo-ai-governor.js --output json --adapters verify`，结果为 `warn` 且 `required_role_failures=0`；verify diagnostics 已对 `claude-code` 投影出 effective `cli_exec`、`request_timeout_ms=30000` 与 `max_retries=2`。
3. 2026-04-06：运行 `node ./dist/bin/repo-ai-governor.js --output json --adapters --dry-run --trace run`，结果写出 report/replay/diagnostics trace，并将当前默认 `codex` 路由的 `stage-task-prepare` 失败保留为可回放证据，而不是静默吞掉。
4. 2026-04-06：完成 `DA-600`，并同步刷新 `docs/support-matrix*.md`、`docs/local-adoption-playbook*.md`，把 `claude-code` 正式口径更新为 `Real-path available (environment-gated)`。
