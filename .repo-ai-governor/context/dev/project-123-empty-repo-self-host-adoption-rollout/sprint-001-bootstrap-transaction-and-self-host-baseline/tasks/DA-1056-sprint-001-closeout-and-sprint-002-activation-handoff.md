# DA-1056 sprint-001 closeout and sprint-002 activation handoff

- Status: active
- Date: 2026-05-14
- Owner: AI-Agent
- Task: `TK-1056`
- Project: `project-123-empty-repo-self-host-adoption-rollout`
- Sprint: `sprint-001-bootstrap-transaction-and-self-host-baseline`

## 1. Summary

1. `sprint-001-bootstrap-transaction-and-self-host-baseline` 已完成 empty-repo self-host bootstrap/apply transaction 修复、minimum adapters/storage baseline 对齐，以及 delegated CR loop clean 收口。
2. `CR-003` 作为 fresh clean recheck 未发现新的 actionable findings；当前只保留“尚未补入 first-run `run --dry-run --trace` 显式回归”与“optional workspace root serialization 尚未扩展到 renderer”这两项非阻断 residual notes。
3. `project-123` primary execution surface 已切换到 `sprint-002-ownership-and-generated-artifact-policy`；该 sprint 现作为新的 primary stream 登记在 `current-context.md`，但在 `TK-1057` 真正开工前仍允许 plan 与 task aggregate 保持 `planned` 真值。
4. `sprint-003-activation-and-readiness-ux` 与 `sprint-004-clean-room-evidence-and-docs-truthfulness` 继续保留为 planned follow-up，不与当前 sprint-002 execution window 交错执行；public docs truth 仍保持 evidence-gated，不提前 uplift。

## 2. Handoff Boundary

1. `sprint-002` 必须直接消费 sprint-001 已冻结的 canonical self-host bootstrap baseline，不得重新引入 `.repo-ai-governor/governor.yaml` seed/apply 双写或把 empty-repo first-run path 退回到 fail-closed workaround。
2. ownership taxonomy 的固定执行顺序保持为 `TK-1057 -> TK-1058 -> TK-1059`；只有在 `managed_locked / starter_editable / canonical_runtime_writable / generated_ephemeral` 全量落入 receipt、diff、upgrade/remove 与 source-catalog truth 后，才允许进入 activation/readiness owner split。
3. generated diagnostics、reports、replay、sqlite sidecar 与 root `.gitignore` recommendation 只能走 opt-in、non-destructive policy；`sprint-002` 不得通过静默覆写 adopter root config 来制造“clean diff”假象。
4. closeout write-back 本身只修改 governance docs、ledger 与 execution context truth，因此 `TK-1056` 不单独新增代码层 build claim；但本 sprint 的代码边界已在 clean CR 收口前完成 targeted vitest、extra confidence tests 与 `pnpm run build`，且本地 boundary commit 仍需通过 `pnpm run check`。

## 3. Outputs

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/context/completed-streams-history.md`
3. `.repo-ai-governor/context/dev/project-123-empty-repo-self-host-adoption-rollout/plan.md`
4. `.repo-ai-governor/context/dev/project-123-empty-repo-self-host-adoption-rollout/sprint-001-bootstrap-transaction-and-self-host-baseline/plan.md`
5. `.repo-ai-governor/context/dev/project-123-empty-repo-self-host-adoption-rollout/sprint-001-bootstrap-transaction-and-self-host-baseline/review/resolved_code_review_working-tree-20260514-0216.md`
6. `.repo-ai-governor/context/dev/project-123-empty-repo-self-host-adoption-rollout/sprint-002-ownership-and-generated-artifact-policy/plan.md`
