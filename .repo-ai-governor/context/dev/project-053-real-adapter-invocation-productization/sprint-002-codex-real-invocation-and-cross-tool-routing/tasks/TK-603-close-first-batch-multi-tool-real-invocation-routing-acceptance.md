# TK-603 close first-batch multi-tool real invocation routing acceptance

- Status: completed
- Date: 2026-04-06
- Task ID: `TK-603`
- Owner: `AI-Agent`
- Priority: `P1`
- Sprint: `sprint-002-codex-real-invocation-and-cross-tool-routing`
- Project: `project-053-real-adapter-invocation-productization`

## 1. 任务目标

收口第一批 multi-tool 真实调用 routing acceptance。

## 2. Depends On

1. `TK-601`
2. `TK-602`

## 3. Expected Outputs

1. routing acceptance
2. multi-tool evidence
3. sprint-002 closeout truth

## 4. Execution Notes

1. 2026-04-06：任务创建，等待 `TK-601 / TK-602` 完成。
2. 2026-04-07：真实执行 `node ./dist/bin/repo-ai-governor.js --output json --adapters verify > .tmp/project-053-sprint-002-verify-adapters.json`；结果为 `warn` 且 `required_role_failures=0`，当前 first-batch route truth 为 `codex` 承担 `planner` / `architect` / `coder` / `reviewer` / `verifier`，`github-copilot` 承担 `tester`。
3. 2026-04-07：真实执行 `node ./dist/bin/repo-ai-governor.js --output json --adapters --dry-run --trace run > .tmp/project-053-sprint-002-run-dry-run-trace.json`；结果为 `pass`，baseline `prepare -> execute -> report` 三阶段全部成功，`stage-task-execute` 在默认 `codex` primary route 下已完成真实 dry-run acceptance。
4. 2026-04-07：已同步刷新 `docs/support-matrix*.md` 与 `docs/local-adoption-playbook*.md`，将 `codex` 正式口径提升为 `Real-path available (environment-gated)` 并回链 sprint-002 的 verify / dry-run evidence。
