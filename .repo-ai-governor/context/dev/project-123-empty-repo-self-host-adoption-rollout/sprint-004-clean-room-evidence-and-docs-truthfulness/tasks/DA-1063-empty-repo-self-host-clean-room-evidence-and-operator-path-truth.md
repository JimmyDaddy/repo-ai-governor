# DA-1063 empty-repo self-host clean-room evidence and operator path truth

- Status: completed
- Date: 2026-05-14
- Owner: AI-Agent
- Task: `TK-1063`
- Project: `project-123-empty-repo-self-host-adoption-rollout`
- Sprint: `sprint-004-clean-room-evidence-and-docs-truthfulness`

## 1. Summary

1. 已在 `/Users/jimmydaddy/study/deepseekian` 上执行 fresh `self-host-complete + repo_local` clean-room rehearsal，并严格按约束只清理 adoption-managed surfaces 与 runtime-generated artifacts，保留 `.git/`、`package.json`、`pnpm-lock.yaml` 与 `node_modules/`。
2. 真实 rehearsal 先暴露出一条 P0 回归：fresh self-host bootstrap 只播种了 starter `tasks.csv`，但 canonical `task-ledger.sqlite` 为空，导致 `doctor --adapters` 报出 `task_ledger_canonical_truth=fail`。
3. 当前 working tree 已修复该回归：`adoption-pack-runtime` 现在会把 starter `tasks.csv` 同步播种进 `.repo-ai-governor/context/dev/sqlite/task-ledger.sqlite`，并由 `apps/cli/test/adopt-command.integration.test.ts` 补齐 regression coverage。修复后重演同一 clean-room 路径，`doctor --adapters` 已回到 `task_ledger_canonical_truth=pass`，`run --dry-run --trace` 也已能够走到 policy gate。

## 2. Clean-Room Operator Path

1. clean-room reset：
   - 删除 `.repo-ai-governor/`
   - 删除 `.agents/`
   - 删除 `.claude/`
   - 删除 `.mcp.json`
   - 删除 `AGENTS.md`
2. self-host bootstrap：
   - `pnpm exec repo-ai-governor adopt bootstrap --adoption-profile self-host-complete --repo . --workspace-mode repo_local --hosts codex --output json`
3. adapter onboarding：
   - `pnpm exec repo-ai-governor connect --tools codex --preset single-tool-all-roles --output json`
   - `pnpm exec repo-ai-governor connect apply --latest --output json`
4. canonical readiness refresh：
   - `pnpm exec repo-ai-governor adopt verify --repo . --output json`
5. additive diagnostics：
   - `pnpm exec repo-ai-governor doctor --adapters --output json`
6. execution rehearsal：
   - `pnpm exec repo-ai-governor run --output json --dry-run --trace`

## 3. Evidence Packet

1. bootstrap summary：
   - `/Users/jimmydaddy/study/deepseekian/.repo-ai-governor/context/diagnostics/adoption-bootstrap/bootstrap-1778718192716.json`
2. bootstrap doctor：
   - `/Users/jimmydaddy/study/deepseekian/.repo-ai-governor/context/diagnostics/adoption-bootstrap/doctor/bootstrap-doctor-1778718192698.json`
3. connect diagnostics：
   - `/Users/jimmydaddy/study/deepseekian/.repo-ai-governor/context/diagnostics/connect/connect-1778718244767.json`
4. connect apply receipt：
   - `/Users/jimmydaddy/study/deepseekian/.repo-ai-governor/context/diagnostics/connect/apply/connect-apply-1778718315690.json`
5. connect rollback snapshot：
   - `/Users/jimmydaddy/study/deepseekian/.repo-ai-governor/context/diagnostics/connect/apply/connect-apply-1778718315690.rollback.governor.yaml`
6. adopt verification summary：
   - `/Users/jimmydaddy/study/deepseekian/.repo-ai-governor/adoption/installations/repo-ai-governor-adoption-pack/adoption-verification.summary.json`
7. doctor diagnostics：
   - `/Users/jimmydaddy/study/deepseekian/.repo-ai-governor/context/diagnostics/doctor/doctor-1778718331816.json`
8. run trace：
   - `/Users/jimmydaddy/study/deepseekian/.repo-ai-governor/context/diagnostics/trace/cli-run-1778718331876.trace.json`
9. run report：
   - `/Users/jimmydaddy/study/deepseekian/.repo-ai-governor/context/reports/cli-run-1778718331876.report.json`
10. run replay：
   - `/Users/jimmydaddy/study/deepseekian/.repo-ai-governor/context/replay/cli-run-1778718331876.replay.json`

## 4. Observed Results

1. install/bootstrap truth：
   - `adopt bootstrap` 成功完成 self-host template seed，且修复后会同步播种 canonical `task-ledger.sqlite`，不再留下“starter CSV 已存在但 sqlite 为空”的 broken baseline。
2. connect/apply truth：
   - `connect` 继续只写 candidate；必须执行 `connect apply --latest` 才会生成 applied config receipt，并把 adapter-connected 基线写入活动 `governor.yaml`。
3. adopt verify truth：
   - 当前 canonical verdict 为 `warn`
   - `authoring_started=in_progress`
   - `adapter_connected=completed`
   - `execution_ready=blocked`
   - 当前阻断原因仍是 self-host starter placeholders 未替换，而不是 bootstrap/connect 失败
4. doctor truth：
   - `task_ledger_canonical_truth=pass`
   - adapter readiness 为 pass 级基线
   - self-host placeholders 仍只以 additive diagnostics / next-actions 的方式暴露
5. run truth：
   - `run --dry-run --trace` 已能走到 policy gate
   - `riskReasons=["lockfile_delta"]`
   - `requiredActions=["confirm"]`
   - 若未提供确认 payload，当前 runtime 可表现为 `POLICY_GATE_HITL_FEEDBACK_INVALID`
   - 这属于执行策略/HITL 闸口，不是 bootstrap、connect 或 ledger baseline 失败

## 5. Implementation Delta Proven By This Rehearsal

1. 代码修复：
   - `/Users/jimmydaddy/study/ai-governor/apps/cli/src/runtime/adoption-pack-runtime.ts`
2. 回归测试：
   - `/Users/jimmydaddy/study/ai-governor/apps/cli/test/adopt-command.integration.test.ts`
3. targeted verification：
   - `pnpm exec vitest run apps/cli/test/adopt-command.integration.test.ts --maxWorkers=1 --maxConcurrency=1`
   - `pnpm run build`

## 6. Docs Truth Implications

1. self-host public operator path 不能再写成“`connect` 后直接 `run --dry-run --trace`”。
2. 对 self-host 正确的 happy path truth 应收敛为：
   - `adopt bootstrap`
   - `connect`
   - `connect apply --latest`
   - `adopt verify`
   - `doctor --adapters`
   - `run --dry-run --trace`
3. `adopt verify` 继续是 self-host activation/readiness 的 canonical producer；`doctor` 只补 additive diagnostics，`check` 只承担 broader governance audit。
