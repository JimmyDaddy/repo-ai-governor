# project-107-built-in-adoption-pack-parity-and-self-host-readiness-rollout 计划

- Status: completed
- Date: 2026-04-15
- Stage Mapping: built-in adoption pack parity and self-host readiness rollout
- Phase Mapping: sprint-001 parity inventory and source-catalog foundation / sprint-002 generated projection and placeholder-boundary implementation / sprint-003 readiness integration and consumer truthfulness follow-through
- Upstream:
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/module-overview.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/governance-adoption-pack-install-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/built-in-adoption-pack-parity-and-self-host-readiness-sync.md`
  - `.repo-ai-governor/draft/approved_solution_review_built-in-adoption-pack-parity-and-self-host-readiness-sync.md`

## 1. 目标

1. 将 built-in adoption pack 的 drift inventory、parity class 与 source catalog foundation 收敛为可实现的 rollout execution surface。
2. 将 follow-up 实现拆成 `packages/standards` parity work、`apps/cli` readiness integration 与 consumer docs truthfulness 三条清晰 ownership 线，而不误伤默认 `adopter-complete` 路径。
3. 为后续 parity tests、docs truthfulness refresh 与 clean-room evidence 更新保留单一 follow-up stream，并提前冻结后续 sprint queue。

## 2. Sprint 细化

## 2.1 sprint-001-parity-catalog-and-readiness-foundation

- Status: completed
- Sprint Goal: 冻结 built-in adoption pack parity inventory、source catalog shape、self-host readiness applicability 与 first-wave verification strategy。
- Task Package: `TK-891`、`TK-892`、`TK-893`、`TK-909`

## 2.2 sprint-002-generated-projection-and-placeholder-boundaries

- Status: completed
- Sprint Goal: 将 `packages/standards` built-in pack source catalog、projection assembly 与 adopter-owned placeholder/template boundary materialize 为首批实现面。
- Task Package: `TK-894`、`TK-895`、`TK-896`、`TK-910`

## 2.3 sprint-003-self-host-readiness-integration-and-consumer-truthfulness

- Status: completed
- Sprint Goal: 将 self-host-only readiness interlock 接入 runtime / diagnostics / verify / execution preflight，并完成首批 consumer docs truthfulness 与 evidence follow-through。
- Task Package: `TK-897`、`TK-898`、`TK-899`

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
| --- | --- | --- | --- | --- | --- |
| TK-891 | sprint-001 | establish built-in pack parity catalog and source model foundation | parity/foundation | formal module docs | completed |
| TK-892 | sprint-001 | formalize self-host placeholder readiness applicability and diagnostics integration | readiness/policy | TK-891 | completed |
| TK-893 | sprint-001 | add first-wave parity tests and docs truthfulness follow-up plan | verification/docs | TK-892 | completed |
| TK-909 | sprint-001 | finalize sprint-001 closeout and activate sprint-002 | closeout/handoff | CR-001 | completed |
| TK-894 | sprint-002 | build built-in pack source catalog and generated assembly baseline | source-catalog/assembly | TK-891 | completed |
| TK-895 | sprint-002 | implement structured template projection and adopter-owned placeholder boundaries | projection/placeholder | TK-894、TK-892 | completed |
| TK-896 | sprint-002 | close sprint-002 standards parity coverage and sprint-003 handoff readiness | closeout/handoff | TK-894、TK-895、TK-893 | completed |
| TK-910 | sprint-002 | finalize sprint-002 closeout and activate sprint-003 | closeout/activation | CR-001 | completed |
| TK-897 | sprint-003 | integrate self-host readiness signals into diagnostics verify and execution preflight | readiness/runtime | TK-896 | completed |
| TK-898 | sprint-003 | add readiness applicability tests and refresh consumer docs truthfulness evidence | verification/docs | TK-897 | completed |
| TK-899 | sprint-003 | finalize project-107 rollout closeout and completion audit | closeout/final-audit | TK-897、TK-898 | completed |

## 4. 依赖产物策略

1. `TK-891` 必须先冻结 drift inventory、parity class 与 source catalog shape，避免后续 readiness / tests 建立在漂移的 source model 上。
2. `TK-892` 只在 `TK-891` 收敛后推进，确保 self-host applicability 与 placeholder policy 绑定到稳定的 surface classification。
3. `TK-893` 负责 first-wave verification、docs truthfulness follow-up 与 activation recommendation，不在前两步未稳定前抢跑 consumer copy。
4. `sprint-002` 与 `sprint-003` 只在 `sprint-001` 冻结 source model、readiness sink 与 docs evidence 入口后再继续细化任务卡，避免提前拆出错误 ownership 边界。
5. `sprint-002` 先在 `packages/standards` 落 source catalog、projection 与 placeholder boundary，再通过 `TK-896` 把 runtime-facing handoff 压缩成 `sprint-003` 的首跳输入。
6. `sprint-003` 是 project-final execution surface；只有在 readiness integration、tests 与 consumer docs truthfulness 证据闭环后，才允许进入 completion audit。
7. `TK-909` 只在 `CR-001` clean `resolved` 后推进，用于把 sprint-001 的完成态、completed history 与 `sprint-002` 激活一次性写回。

## 5. DoD（project-107-built-in-adoption-pack-parity-and-self-host-readiness-rollout）

1. built-in pack parity inventory、source catalog shape 与 self-host applicability boundary 已 materialize 为可执行 rollout scope，并由 active sprint 承接当前实现窗口。
2. active/planned task ledger、project/sprint plan 与 `current-context` 保持同步：`sprint-001` 已完成并进入 completed history，`sprint-002` 已在 `TK-894` 开工后切换为 active primary stream；`sprint-003` 与 `project-108 / sprint-001` 仍保持 planned follow-up。
3. 后续 implementation window 可以直接沿用冻结的 formal direction 与分 sprint ownership，而不需要在切换窗口时重新解释范围。
4. `sprint-002` 已 clean closeout 并移入 completed history；`sprint-003` 已完成 project-final CR loop 与 `TK-899` final closeout write-back；当前默认 primary stream 已清空为 `idle`，`project-108 / sprint-001` 继续保留为 planned follow-up。

## 6. 里程碑记录

1. 2026-04-15：基于 `technical-solution.built-in-adoption-pack-parity-and-self-host-readiness-sync` promotion cutover 创建 `project-107` planned rollout skeleton。
2. 2026-04-15：`sprint-001-parity-catalog-and-readiness-foundation` 已登记到 `current-context.md -> Planned Follow-Up Streams`，不占用当前 idle primary stream。
3. 2026-04-15：project-level sprint queue 已扩展到 `sprint-002` / `sprint-003`，并已补齐对应 task scaffold 与 planned ledger。
4. 2026-04-15：`sprint-002` / `sprint-003` 虽已补齐 planned scaffold，但仍未登记到 `current-context` 的默认 planned follow-up stream，且未切换为 active execution surface。
5. 2026-04-15：`sprint-001-parity-catalog-and-readiness-foundation` 已切换为 active primary stream，后续严格按 `sprint-001 -> sprint-002 -> sprint-003 -> project-final CR` 顺序推进。
6. 2026-04-15：`CR-001` clean `resolved` 后，`TK-909` 已完成 sprint-001 closeout write-back；`current-context` 已切换到 `sprint-002` 作为下一条 primary stream，`sprint-003` 与 `project-108 / sprint-001` 继续保留为 planned follow-up。
7. 2026-04-15：`TK-894` 已开工，`sprint-002` 现进入 active implementation 状态，并将 built-in pack source catalog / assembly baseline 作为当前唯一 in-scope execution surface。
8. 2026-04-15：`TK-910` 已完成 sprint-002 closeout write-back，`stream-project-107-sprint-002` 进入 completed history；`current-context` 已按顺序切换到 `sprint-003`，等待 `TK-897` 开工。
9. 2026-04-15：`TK-897` 已切换为 `in_progress`，`sprint-003` 正式进入 self-host readiness integration 与 consumer truthfulness execution 窗口。
10. 2026-04-15：`TK-897` / `TK-898` 已完成 runtime readiness integration、tests 与 consumer docs truthfulness refresh；`sprint-003` 下一步进入 delegated CR round，再决定 `TK-899` closeout 窗口。
11. 2026-04-15：`sprint-003` sprint-level delegated CR rounds `CR-001` / `CR-002` 已 clean `resolved`；当前 boundary 已具备进入 project-final CR loop 的条件，`TK-899` 继续保留为最终 closeout/audit 承接点。
12. 2026-04-15：project-final delegated rounds `CR-003` / `CR-004` 已完成 accepted finding 修复并 `resolved`，`CR-005` 作为 fresh clean recheck 已确认 project-final boundary 无新的 actionable finding。
13. 2026-04-15：`TK-899 / DA-899` 已完成 final closeout write-back；`project-107` 正式进入 `completed`，并在此里程碑回链 [project-107 completion audit summary](./project-107-built-in-adoption-pack-parity-and-self-host-readiness-rollout-completion-audit-summary.md)。

## 7. 里程碑记录入口

1. [project-107-built-in-adoption-pack-parity-and-self-host-readiness-rollout-completion-audit-summary.md](./project-107-built-in-adoption-pack-parity-and-self-host-readiness-rollout-completion-audit-summary.md)
