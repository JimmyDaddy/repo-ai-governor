# project-042-cli-command-thin-baseline-enhancement-rollout 计划

- Status: completed
- Date: 2026-04-04
- Stage Mapping: CLI thin-baseline command enhancement rollout
- Phase Mapping: Upgrade controlled apply / plan breakdown and ledger commit / review lifecycle closure
- Upstream:
  - `.repo-ai-governor/context/dev/project-038-session-main-capability-explainer-productization/sprint-002-cli-benchmark-and-borrowing-analysis/tasks/DA-519-cli-capability-maturity-analysis-promotion-cutover.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/adrs/cli-command-capability-maturity-and-baseline-enhancement-priority.md`
  - `.repo-ai-governor/draft/session-main-plan-generation-and-ledger-commit-contract.md`
  - `.repo-ai-governor/draft/session-main-review-generation-verification-and-ledger-backfill-contract.md`
  - `.repo-ai-governor/draft/upgrade-analysis-apply-and-rollback-contract.md`
  - `apps/cli/src/commands/plan-command.ts`
  - `apps/cli/src/commands/review-command.ts`
  - `apps/cli/src/commands/review-verify-command.ts`
  - `apps/cli/src/commands/upgrade-command.ts`

## 1. 目标

1. 将 active ADR `technical-solution.cli-capability-maturity-and-baseline-enhancement-priority` 从 planning lens 落成真实 implementation stream，而不是继续停留在 formal prioritization 结论。
2. 按 ADR 的双视角约束推进：先执行 ROI 第一的 `upgrade` controlled apply/rollback 补强，再补 `plan` 的真实 breakdown/commit，最后集中完成 `review / review-verify` 治理闭环。
3. 在整个 rollout 中保持 closed-set value 常量集中治理、用户可见文案 i18n 化，以及 lifecycle artifact / ledger / review truth 单写源边界。
4. 避免把 maturity ADR 误用成 runtime truth：所有实现边界仍以各自 companion contract 为准，project-042 只负责按排序把三条 follow-up program 真正落地。

## 2. Sprint 细化

## 2.1 sprint-001-upgrade-controlled-apply-and-rollback

- Status: completed
- Sprint Goal: 将 `upgrade` 从 analyze-only baseline 提升为 preview/confirm/apply/verify/rollback 的受控链路。
- Task Package: `TK-520`、`TK-521`、`TK-522`。

## 2.2 sprint-002-plan-breakdown-and-ledger-commit-productization

- Status: completed
- Sprint Goal: 将 `plan` 从 snapshot artifact 提升为结构化 task breakdown、preview/confirm 与 ledger commit 能力。
- Task Package: `TK-523`、`TK-524`、`TK-525`。

## 2.3 sprint-003-review-lifecycle-and-ledger-backfill

- Status: completed
- Sprint Goal: 将 `review / review-verify` 从 queue/backfill baseline 提升为真实 findings、verify decision 与 lifecycle artifact 闭环。
- Task Package: `TK-526`、`TK-527`、`TK-528`。

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
|---|---|---|---|---|---|
| TK-520 | sprint-001 | freeze upgrade controlled apply state machine and artifact contracts baseline | cli/upgrade-contract-alignment | active maturity ADR + `upgrade` companion contract | completed |
| TK-521 | sprint-001 | implement upgrade explicit confirm controlled apply and verify receipts | cli/upgrade-apply-runtime | TK-520 | completed |
| TK-522 | sprint-001 | add upgrade rollback execution path interactive shell presenter and regression acceptance | cli/upgrade-rollback-and-closeout | TK-520、TK-521 | completed |
| TK-523 | sprint-002 | implement structured plan breakdown generation and preview surface | session-main/plan-breakdown | active maturity ADR + `plan` companion contract | completed |
| TK-524 | sprint-002 | implement plan explicit commit and governed ledger projection | session-main/plan-commit | TK-523 | completed |
| TK-525 | sprint-002 | align plan cli explainability i18n and regression acceptance | cli/plan-presenter-and-closeout | TK-523、TK-524 | completed |
| TK-526 | sprint-003 | implement review finding generation and lifecycle artifact truth baseline | review/review-generation | active maturity ADR + `review` companion contract | completed |
| TK-527 | sprint-003 | implement review-verify decision artifact transition and ledger backfill | review/review-verify-lifecycle | TK-526 | completed |
| TK-528 | sprint-003 | add review lifecycle i18n rendering regression coverage and project closeout acceptance | review/closeout-and-rollout | TK-526、TK-527 | completed |

## 4. 依赖产物策略

1. `project-042` 只消费 maturity ADR 作为排序与 linked-input policy，不把该 ADR 误当成 command runtime contract。
2. `upgrade` sprint 先走，因为它在 ROI 上排第一，且现有 analyze/candidate/rollback snapshot 基础最完整。
3. `plan` sprint 第二阶段落地，因为其 session.main 路由和 artifact baseline 已存在，适合在 `upgrade` 之后承接。
4. `review / review-verify` 必须作为同一治理闭环 program 在第三阶段统一实施，而不是拆成两个彼此独立的散点命令。
5. 三条命令链都必须遵守 `CS-009 / CS-032 / CS-033`：closed-set value 集中管理、避免 magic literal、用户可见文案统一走 i18n。

## 5. DoD（project-042）

1. `upgrade` 已具备 preview/confirm/apply/verify/rollback 受控链路，而不再停留在 analyze-only。
2. `plan` 已具备结构化 breakdown、明确 preview/confirm 和 ledger commit 语义，而不再只是 snapshot artifact。
3. `review / review-verify` 已具备 findings、verify decision、artifact lifecycle 与受控 ledger backfill 真值闭环。
4. 三条命令链的 closed-set contract value 与用户可见文案治理已保持一致，不再回退到 inline literal 与未本地化字符串。
5. 项目收尾时必须具备对应命令链的 regression evidence；若修改 `apps/**`、`packages/**`、`bin/**` 或 `test/**`，同窗口必须附真实 `pnpm run build`。

## 6. 里程碑记录

1. 2026-04-04：`technical-solution.cli-capability-maturity-and-baseline-enhancement-priority` 已正式提升为 active ADR，并明确 `upgrade -> plan -> review/review-verify` 的 implementation sequencing。
2. 2026-04-04：用户要求“按照这份被提升的技术方案进行任务拆分”，因此创建 `project-042-cli-command-thin-baseline-enhancement-rollout` 作为新的 planned follow-up stream。
3. 2026-04-04：已在 `current-context.md` 中登记 `project-042 / sprint-001` 为 planned follow-up stream，同时保持 `project-038` 仍为临时 closeout primary surface。
4. 2026-04-04：已将 `technical-solution.cli-capability-maturity-and-baseline-enhancement-priority` 的 delivery handoff 从 `docs_only` 切换为 `followup_required -> project-042 / sprint-001`。
5. 2026-04-04：已将 `upgrade / plan / review` 三个命令链补齐为 `sprint-001 ~ sprint-003` 的实体计划与 `TK-520 ~ TK-528` 任务卡，后续可按 sprint 顺序直接激活执行。
6. 2026-04-04：根据用户指令开始执行 `project-042`，并将 `sprint-001-upgrade-controlled-apply-and-rollback` 切换为 active primary stream。
7. 2026-04-04：`sprint-001` 已完成 `upgrade` 受控 apply/verify/rollback 闭环、i18n 与 presenter 收口，并补齐 build + upgrade 定向回归证据；后续进入 `sprint-002 plan` 产品化阶段。
8. 2026-04-04：已将 `project-042` primary execution stream 从 `sprint-001` 切换到 `sprint-002`，并激活 `TK-523` 作为当前 in-flight 任务。
9. 2026-04-04：`sprint-002` 已完成 `plan` structured preview / explicit commit / governed ledger projection / presenter & i18n / runtime-output-e2e-example 验证闭环，并补齐 build + i18n parity + ledger gates 证据。
10. 2026-04-04：已将 `project-042` primary execution stream 从 `sprint-002` 切换到 `sprint-003`，并激活 `TK-526` 作为当前 in-flight 任务。
11. 2026-04-04：`sprint-003` 已完成 review finding generation、review-verify lifecycle transition、governed ledger backfill、service-backed summary/update 对齐与 review closeout artifact 收口。
12. 2026-04-04：`project-042` 已完成 `upgrade -> plan -> review/review-verify` 全链路实现，验证证据包含 `pnpm run build`、`pnpm run test:packages`、`pnpm run test:integration` 与相关治理门禁；项目完成态审计摘要见 `.repo-ai-governor/context/dev/project-042-cli-command-thin-baseline-enhancement-rollout/project-042-cli-command-thin-baseline-enhancement-rollout-completion-audit-summary.md`。
