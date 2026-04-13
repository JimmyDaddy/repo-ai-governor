# sprint-002-verification-profiles-trigger-matrix-and-closeout 计划

- Status: active
- Date: 2026-04-14
- Sprint Goal: 补齐 focused compatibility verification profile、trigger matrix 与 rollout closeout guidance。
- Project: `project-106-cli-exec-compatibility-and-stability-rollout`
- Upstream:
  - `.repo-ai-governor/context/dev/project-106-cli-exec-compatibility-and-stability-rollout/sprint-001-compatibility-taxonomy-and-regression-harness/plan.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/native-cli-exec-compatibility-and-stability-productization.md`
  - `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`

## 1. Scope

1. 将 `cli_exec_compatibility_full / runtime_foundation / adapter_slice` profile 拆成真实 rollout-owned verification route。
2. 固定 trigger matrix，明确 shared runtime、cross-adapter parser 与 single-adapter slice 的执行边界。
3. 产出兼容性基线 evidence pack 与 closeout guidance，供后续 runtime windows 复用。

## 2. 任务拆解矩阵（WBS）

| task_id | title | depends_on | status |
| --- | --- | --- | --- |
| TK-864 | wire focused compatibility verification profiles and trigger-matrix routing without promoting them to governance gates | TK-863 | in_progress |
| TK-865 | capture compatibility baseline evidence pack and closeout guidance for future runtime windows | TK-864 | planned |
| TK-866 | finalize project-106 closeout and delivery evidence handoff | TK-864、TK-865、activation-time local CR-001 | planned |

## 3. Exit Criteria

1. focused compatibility verification usage 已成为真实 rollout scope，而非留在 ADR 文字层。
2. compatibility baseline evidence pack 与 closeout guidance 已具备独立实施窗口的 handoff 边界。
3. 激活该 sprint 时有清晰的本地 `CR-001` 入口与 project-final closeout 边界。

## 4. Sprint Notes

1. 激活后先预留本地 `CR-001`，再开始 implementation 与 reviewer loop。
2. 当前 sprint 不得把 compatibility profile 变成新的 `governance.execution-gates` contract truth。
3. `TK-866` 负责 project-106 final closeout，但只有在 sprint-002 local `CR-001` clean 后才允许完成。
4. 2026-04-14：sprint-001 clean closeout 后，当前 sprint 已被激活为新的 primary execution surface，`TK-864` 进入执行前准备状态。
