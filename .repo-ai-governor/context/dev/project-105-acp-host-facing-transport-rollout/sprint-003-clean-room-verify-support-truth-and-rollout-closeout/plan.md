# sprint-003-clean-room-verify-support-truth-and-rollout-closeout 计划

- Status: completed
- Date: 2026-04-14
- Sprint Goal: 执行 clean-room verify、support/docs truth uplift，并完成 rollout closeout。
- Project: `project-105-acp-host-facing-transport-rollout`
- Upstream:
  - `.repo-ai-governor/context/dev/project-105-acp-host-facing-transport-rollout/sprint-002-distribution-and-runtime-service-enablement/plan.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/acp-host-facing-transport-formalization-and-distribution-boundary.md`
  - `.repo-ai-governor/context/dev/project-104-cli-exec-onboarding-adoption-readiness-rollout/plan.md`

## 1. Scope

1. 执行 ACP clean-room verify，并收集 distribution/runtime evidence。
2. 只对 evidence-backed surfaces uplift ACP adopter-facing support/docs truth，同时保持与 `cli_exec` 分离。
3. 在 sprint final clean 后完成 `project-105` closeout 与 delivery evidence handoff。

## 2. 任务拆解矩阵（WBS）

| task_id | title | depends_on | status |
| --- | --- | --- | --- |
| TK-888 | execute clean-room ACP verification and distribution runtime evidence capture | TK-887 | completed |
| TK-889 | uplift ACP adopter-facing support docs truth only for evidence-backed surfaces while preserving cli_exec separation | TK-888 | completed |
| TK-890 | finalize project-105 closeout and delivery evidence handoff | TK-888、TK-889、latest project-final clean round (`CR-012`) | completed |

## 3. Exit Criteria

1. clean-room ACP verify 与 distribution/runtime evidence 已成为真实 rollout boundary。
2. ACP support/docs truth 只在 evidence-backed surfaces 上 uplift，并继续与 `cli_exec` 严格分离。
3. 激活该 sprint 时有清晰的本地 `CR-001` 入口与 project-final closeout 边界。

## 4. Sprint Notes

1. 激活后先预留本地 `CR-001`，再开始 implementation 与 reviewer loop。
2. 当前 sprint 才允许处理 adopter-facing support/docs truth uplift；前置 sprint 不得提前宣称完成。
3. `TK-890` 负责 `project-105` final closeout，但只有在 sprint-level latest fresh clean round 与 latest project-final clean round 都完成后才允许完成。
4. 2026-04-15：`sprint-002` clean closeout 已完成，当前 sprint 已切换为 active primary surface；`TK-888` 进入 `in_progress`，下一步先本地预留 `CR-001`，再开始 clean-room ACP verify 与 evidence capture implementation。
5. 2026-04-15：`TK-888` 与 `TK-889` implementation boundary 已完成；clean-room ACP report、aggregated ACP evidence summary、support-matrix/playbook truth uplift 已写回，随后 `CR-001` fresh reviewer round 返回 1 条被认可的 P2 finding。
6. 2026-04-15：`CR-001` 已在 stricter clean-room scope gate 与 regression coverage 修复后收口为 `resolved`；当前已激活 fresh `CR-002` clean recheck，只有最新 reviewer round clean 后才允许进入 sprint closeout。
7. 2026-04-15：`CR-002` 第二轮 accepted finding 已修复并收口为 `resolved`；但因为该 round 本身仍消耗了新的代码改动，当前必须继续发起 fresh sprint clean recheck，不能直接把 `CR-002` 当作 clean boundary。
8. 2026-04-15：并发流程曾提前写入 project-final `CR-003`、`TK-890` 与 idle closeout；用户随后明确选择继续 active CR loop 作为 canonical truth，因此这些 closeout 结论仅保留为历史痕迹，当前 sprint 已重新打开为 `active`。
9. 2026-04-15：`CR-004` 返回 1 条被认可的 P1 finding，指出 ACP clean-room summary 之前引用会被清理的 temp receipt path；当前已将 receipt 持久化到 workspace-owned durable 路径，并要求 runtime 只在 receipt 真实可读且内容仍为 `pass` summary 时才投影 clean-room verified uplift。`CR-004` 已收口为 `resolved`，当前已激活 fresh `CR-005` clean recheck。
10. 2026-04-15：`CR-005` 返回 1 条被认可的 P2 finding，指出 repaired ACP gating 的负向 tests 之前没有真正带起 runtime-service branch；当前已把 helper target 对齐到真实 runtime target，并显式断言 `runtime_service_ready + packaged_distribution_ready` 仍不会 uplift 为 clean-room verified。`CR-005` 已收口为 `resolved`，当前已激活 fresh `CR-006` clean recheck。
11. 2026-04-15：`CR-006` clean recheck 未发现新的 actionable finding；当前 sprint-level latest fresh clean round 已取得 clean 依据，现已进入新的 project-final `CR-007`。
12. 2026-04-15：`CR-007`、`CR-008` 与 `CR-009` 的 project-final accepted findings 已全部修复并收口为 `resolved`；最新修复将 tracked ACP receipts 内部路径统一裁成 portable `.repo-ai-governor/...` strings。由于 `CR-009` 仍消耗了新的 script/evidence 变更，随后已激活 fresh `CR-010` 作为 project-final clean recheck。
13. 2026-04-15：`CR-010` 返回 1 条被认可的 provenance dead-path finding，指出 portable tracked receipt JSON 仍指向不会持久保存 clean-room fixture 的 repo-relative path；当前已将 clean-room source provenance 复制到 `.repo-ai-governor/generated/acp/acp-cleanroom-verification.provenance/**` 并收口 `CR-010`，随后激活 fresh `CR-011` 作为最新 project-final clean recheck。
14. 2026-04-15：`CR-011` 返回 2 条被认可的 P2 finding，分别补齐了 tracked receipt consumer 的 fail-closed 边界与 whitespace portability；当前已修复并收口 `CR-011`，随后激活 fresh `CR-012` 作为最新 project-final clean recheck。
15. 2026-04-15：`CR-012` latest fresh project-final clean recheck 未发现新的 actionable finding；`TK-890` 已完成 reopened closeout 写回，当前 sprint 收口为 `completed`。
