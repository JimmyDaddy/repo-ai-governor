# project-107-built-in-adoption-pack-parity-and-self-host-readiness-rollout 计划

- Status: planned
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

- Status: planned
- Sprint Goal: 冻结 built-in adoption pack parity inventory、source catalog shape、self-host readiness applicability 与 first-wave verification strategy。
- Task Package: `TK-891`、`TK-892`、`TK-893`

## 2.2 sprint-002-generated-projection-and-placeholder-boundaries

- Status: planned
- Sprint Goal: 将 `packages/standards` built-in pack source catalog、projection assembly 与 adopter-owned placeholder/template boundary materialize 为首批实现面。
- Task Package: `TK-894`、`TK-895`、`TK-896`

## 2.3 sprint-003-self-host-readiness-integration-and-consumer-truthfulness

- Status: planned
- Sprint Goal: 将 self-host-only readiness interlock 接入 runtime / diagnostics / verify / execution preflight，并完成首批 consumer docs truthfulness 与 evidence follow-through。
- Task Package: `TK-897`、`TK-898`、`TK-899`

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
| --- | --- | --- | --- | --- | --- |
| TK-891 | sprint-001 | establish built-in pack parity catalog and source model foundation | parity/foundation | formal module docs | planned |
| TK-892 | sprint-001 | formalize self-host placeholder readiness applicability and diagnostics integration | readiness/policy | TK-891 | planned |
| TK-893 | sprint-001 | add first-wave parity tests and docs truthfulness follow-up plan | verification/docs | TK-892 | planned |
| TK-894 | sprint-002 | build built-in pack source catalog and generated assembly baseline | source-catalog/assembly | TK-891 | planned |
| TK-895 | sprint-002 | implement structured template projection and adopter-owned placeholder boundaries | projection/placeholder | TK-894、TK-892 | planned |
| TK-896 | sprint-002 | close sprint-002 standards parity coverage and sprint-003 handoff readiness | closeout/handoff | TK-894、TK-895、TK-893 | planned |
| TK-897 | sprint-003 | integrate self-host readiness signals into diagnostics verify and execution preflight | readiness/runtime | TK-896 | planned |
| TK-898 | sprint-003 | add readiness applicability tests and refresh consumer docs truthfulness evidence | verification/docs | TK-897 | planned |
| TK-899 | sprint-003 | finalize project-107 rollout closeout and completion audit | closeout/final-audit | TK-897、TK-898 | planned |

## 4. 依赖产物策略

1. `TK-891` 必须先冻结 drift inventory、parity class 与 source catalog shape，避免后续 readiness / tests 建立在漂移的 source model 上。
2. `TK-892` 只在 `TK-891` 收敛后推进，确保 self-host applicability 与 placeholder policy 绑定到稳定的 surface classification。
3. `TK-893` 负责 first-wave verification、docs truthfulness follow-up 与 activation recommendation，不在前两步未稳定前抢跑 consumer copy。
4. `sprint-002` 与 `sprint-003` 只在 `sprint-001` 冻结 source model、readiness sink 与 docs evidence 入口后再继续细化任务卡，避免提前拆出错误 ownership 边界。
5. `sprint-002` 先在 `packages/standards` 落 source catalog、projection 与 placeholder boundary，再通过 `TK-896` 把 runtime-facing handoff 压缩成 `sprint-003` 的首跳输入。
6. `sprint-003` 是 project-final execution surface；只有在 readiness integration、tests 与 consumer docs truthfulness 证据闭环后，才允许进入 completion audit。

## 5. DoD（project-107-built-in-adoption-pack-parity-and-self-host-readiness-rollout）

1. built-in pack parity inventory、source catalog shape 与 self-host applicability boundary 已 materialize 为可执行 follow-up scope。
2. planned task ledger、project/sprint plan 与 `current-context -> Planned Follow-Up Streams` 保持同步。
3. 后续 implementation window 可以直接基于该 planned stream 激活 execution，而不需要重新解释 formal direction。
4. `sprint-002` 与 `sprint-003` 的排队顺序已在 project-level plan 中冻结，且 `sprint-001 ~ sprint-003` 的 planned scaffold 已就位；当前 `current-context` 仍只登记 `sprint-001` 为默认 planned follow-up stream。

## 6. 里程碑记录

1. 2026-04-15：基于 `technical-solution.built-in-adoption-pack-parity-and-self-host-readiness-sync` promotion cutover 创建 `project-107` planned rollout skeleton。
2. 2026-04-15：`sprint-001-parity-catalog-and-readiness-foundation` 已登记到 `current-context.md -> Planned Follow-Up Streams`，不占用当前 idle primary stream。
3. 2026-04-15：project-level sprint queue 已扩展到 `sprint-002` / `sprint-003`，并已补齐对应 task scaffold 与 planned ledger。
4. 2026-04-15：`sprint-002` / `sprint-003` 虽已补齐 planned scaffold，但仍未登记到 `current-context` 的默认 planned follow-up stream，且未切换为 active execution surface。

## 7. 里程碑记录入口

1. 待 closeout 后补齐。
