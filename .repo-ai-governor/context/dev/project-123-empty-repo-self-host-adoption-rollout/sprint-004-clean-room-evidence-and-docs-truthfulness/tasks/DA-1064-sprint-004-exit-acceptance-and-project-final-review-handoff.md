# DA-1064 sprint-004 exit acceptance and project-final review handoff

- Status: completed
- Date: 2026-05-14
- Owner: AI-Agent
- Artifact ID: `DA-1064`
- Produced By: `TK-1064`
- Scope: `project-123-empty-repo-self-host-adoption-rollout`

## 1. 出口结论

`accept`

`project-123 / sprint-004-clean-room-evidence-and-docs-truthfulness` 的实现边界已满足当前 sprint 的退出条件。`TK-1063` 已完成 clean-room rehearsal 与 regression repair，`TK-1064` 也已把 README、local-adoption playbook 与 support matrix 的 public truth 对齐到真实 self-host operator path，因此 sprint-004 已具备进入 fresh reviewer boundary 的 closeout-ready truth packet。

但由于本项目仍要求额外执行一次 `project-final` fresh reviewer scoped CR loop，当前 sprint 仍需继续保留为 active review surface。换言之，sprint-level exit acceptance 将先成立，project-level final closeout 仍待下一轮 clean reviewer round 之后再执行。

本次 sprint closeout 窗口包含 `apps/**` 与 `test/**` 下的代码改动，因此 build evidence 是必需项；当前 closeout packet 已复用同窗口通过的 targeted vitest 与 `pnpm run build` 结果，并将在 boundary gate 中补 `pnpm run check`。

## 2. 验收范围

1. clean-room rollout evidence：
   - `/Users/jimmydaddy/study/deepseekian` 已完成 fresh `self-host-complete + repo_local` rehearsal。
   - canonical evidence packet 已固定 `bootstrap -> connect -> connect apply --latest -> adopt verify -> doctor --adapters -> run --dry-run --trace` 的真实 operator path。
2. runtime regression repair：
   - fresh self-host bootstrap 现在会把 starter `tasks.csv` 同步播种到 canonical `.repo-ai-governor/context/dev/sqlite/task-ledger.sqlite`。
   - integration regression coverage 已证明 `task_ledger_sources` 与 starter `TK-001` row 会在 first-run baseline 中落盘。
3. public docs truth sync：
   - `README.md`、`README.zh-CN.md`、`docs/local-adoption-playbook*.md` 与 `docs/support-matrix*.md` 现在都已补齐 `connect apply --latest` 与 connect 后续 `adopt verify`。
   - `lockfile_delta` / `POLICY_GATE_HITL_FEEDBACK_INVALID` 已被明确界定为 execution-policy checkpoint，而非 bootstrap/connect failure。
4. sprint-level handoff：
   - 当前 sprint 继续保留在 `current-context.md` 的 active surface，用于 sprint-004 / project-final scoped CR loop。
   - project-level completion audit summary、delivery-registry completed write-back 与 `current-context` idle 恢复必须等待 project-final clean 后再执行。

## 3. 出口判定

1. Exit Criteria 1：通过
   - fresh empty-repo clean-room rehearsal 与 canonical evidence packet 已齐备。
2. Exit Criteria 2：通过
   - adopter-facing docs truth 已与真实 self-host operator path 对齐，不再把 `connect` 单独误写成可直接进入 dry-run 的完成态。
3. Exit Criteria 3：通过
   - `DA-1063`、sprint plan、task cards 与 docs truth packet 已同步到 sprint-level closeout-ready state。
4. Review Closure：通过
   - `CR-001` 已完成 accepted finding repair closure，latest fresh reviewer round `CR-002` clean recheck 未发现新的 actionable finding；当前 sprint boundary 已达到进入 project-final review 的门槛。

## 4. project-final review handoff 约束

1. 下一边界必须是 `project-123-empty-repo-self-host-adoption-rollout` 的 project-final scoped CR loop，review surface 需要覆盖 `apps/cli` runtime/test fix、sprint-004 governance packet、public docs truth 与 delivery-registry closeout-ready truth，而不只限于单个 `TK-1063` 代码切片。
2. 在 project-final latest fresh reviewer round clean 之前，不得把 `project-123` project plan、`sprint-004` sprint plan、delivery registry 或 `current-context.md` promote 为最终 `completed` / `idle` truth。
3. project-final closeout 必须把 `technical-solution.empty-repo-self-host-adoption-follow-up` delivery entry 切换为 `execution_status=completed`、`rollout_status=completed`，并将 final closeout artifact 改为 `DA-1065`。

## 5. 关键产物

1. `.repo-ai-governor/context/dev/project-123-empty-repo-self-host-adoption-rollout/plan.md`
2. `.repo-ai-governor/context/dev/project-123-empty-repo-self-host-adoption-rollout/sprint-004-clean-room-evidence-and-docs-truthfulness/plan.md`
3. `.repo-ai-governor/context/dev/project-123-empty-repo-self-host-adoption-rollout/sprint-004-clean-room-evidence-and-docs-truthfulness/tasks/DA-1063-empty-repo-self-host-clean-room-evidence-and-operator-path-truth.md`
4. `.repo-ai-governor/context/dev/project-123-empty-repo-self-host-adoption-rollout/sprint-004-clean-room-evidence-and-docs-truthfulness/tasks/TK-1063-run-empty-repo-self-host-clean-room-rehearsal-and-capture-rollout-evidence.md`
5. `.repo-ai-governor/context/dev/project-123-empty-repo-self-host-adoption-rollout/sprint-004-clean-room-evidence-and-docs-truthfulness/tasks/TK-1064-refresh-self-host-docs-truth-and-finalize-rollout-closeout.md`
6. `README.md`
7. `README.zh-CN.md`
8. `docs/local-adoption-playbook.md`
9. `docs/local-adoption-playbook.zh-CN.md`
10. `docs/support-matrix.md`
11. `docs/support-matrix.zh-CN.md`
12. `.repo-ai-governor/context/current-context.md`
13. `.repo-ai-governor/context/dev/project-123-empty-repo-self-host-adoption-rollout/sprint-004-clean-room-evidence-and-docs-truthfulness/review/resolved_code_review_working-tree-20260514-1015.md`
14. `.repo-ai-governor/context/dev/project-123-empty-repo-self-host-adoption-rollout/sprint-004-clean-room-evidence-and-docs-truthfulness/review/resolved_code_review_working-tree-20260514-1103.md`

## 6. 验证

1. `pnpm exec vitest run apps/cli/test/adopt-command.integration.test.ts --maxWorkers=1 --maxConcurrency=1`
2. `pnpm run build`
3. `node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-123-empty-repo-self-host-adoption-rollout/sprint-004-clean-room-evidence-and-docs-truthfulness/tasks" --task-id TK-1063`
4. `node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-123-empty-repo-self-host-adoption-rollout/sprint-004-clean-room-evidence-and-docs-truthfulness/tasks" --task-id TK-1064`
5. `node ./scripts/governance/check-task-required-inputs.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-123-empty-repo-self-host-adoption-rollout/sprint-004-clean-room-evidence-and-docs-truthfulness/tasks" --task-id TK-1063`
6. `node ./scripts/governance/check-task-required-inputs.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-123-empty-repo-self-host-adoption-rollout/sprint-004-clean-room-evidence-and-docs-truthfulness/tasks" --task-id TK-1064`
7. `node ./scripts/governance/check-task-ledger-sync.js`
8. `node ./scripts/governance/check-sprint-plan-status-sync.js`
9. `node ./scripts/governance/check-code-review-status-sync.js`
10. `node ./scripts/governance/check-technical-solution-delivery-registry.js`
11. `pnpm run check`
12. `CR-001` accepted fix closure + latest fresh reviewer clean recheck `CR-002`

## 7. Boundary Commit Note

1. sprint-004 code-affecting boundary 已在 latest fresh reviewer clean 之前完成 targeted vitest 与同窗口 `pnpm run build` 通过证据；当前 handoff artifact 落盘后，进入本地 sprint boundary commit 与 project-final delegated CR loop。
