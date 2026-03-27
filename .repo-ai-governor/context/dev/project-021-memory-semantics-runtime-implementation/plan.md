# project-021-memory-semantics-runtime-implementation 计划

- Status: completed
- Date: 2026-03-27
- Stage Mapping: Post-Stage-9 runtime semantics implementation follow-up
- Phase Mapping: Runtime Memory Semantics / Recall Context Assembly

## 1. 目标

1. 将 `runtime.memory-semantics` 的 formal module docs 转成真实运行时代码，而不是停留在 promotion 完成态。
2. 引入独立的 memory semantics bounded context，承接 working-state boundary、recall policy 与 context assembly，而不是继续把语义逻辑塞进 `runtime.memory-provider-loading` 或 CLI runtime。
3. 使用新的 technical solution delivery handoff 机制，将 `technical-solution.memory-module` 明确挂接到可执行 `project/sprint/task`，关闭“方案已正式化但没有执行流”的断点。
4. 在不伪造 canonical source ownership 的前提下，先以 `MemoryManager`/layered snapshot 为 substrate 建立 recall/context assembly baseline，再决定后续 promotion pipeline 与更多 runtime consumer 的 rollout 节奏。

## 2. Sprint 细化

## 2.1 sprint-001-recall-context-assembly-baseline

- Status: completed
- Sprint Goal: 建立 technical solution delivery handoff baseline，并实现 `runtime.memory-semantics` 的首个可用 recall/context assembly 运行时路径。
- Task Package: `TK-242`、`TK-243`、`TK-244`、`TK-245`、`TK-246`。
- Exit Criteria:
  1. `project-021` skeleton 已建立，`current-context.md` 已切换到新的 memory semantics implementation stream，并将 `project-018 / sprint-005` 迁入 completed history。
  2. `technical-solution-delivery-registry.yaml` 与 blocking gate 已正式落地，且 `technical-solution.memory-module` 已明确登记为 `followup_required -> project-021 / sprint-001`。
  3. delivery handoff 已扩展到 consumer surfaces、user impact 与 rollout ownership，不再只回答“有没有执行任务”。
  4. 已引入 `packages/core-memory-semantics` baseline，并形成 `MemoryRecallService` / `MemoryContextAssembler` 的首轮 contract-to-code 映射。
  5. CLI task-driven runtime 已消费 memory semantics baseline，且相关 package/integration tests 具备可执行验证面。

## 2.2 sprint-002-promotion-pipeline-and-runtime-consumer-rollout

- Status: completed
- Sprint Goal: 在不重写 canonical source ownership 的前提下，建立显式 memory promotion pipeline baseline，并将 `runtime.memory-semantics` 扩展到第二个 runtime consumer。
- Task Package: `TK-247`、`TK-248`、`TK-249`、`TK-250`。
- Exit Criteria:
  1. `sprint-002` skeleton 已建立，`current-context.md` 已切换到新的 active primary stream，并将 `sprint-001` 迁入 completed history。
  2. `runtime.memory-semantics` 已形成 audit-friendly 的显式 promotion pipeline baseline，且 machine-readable promotion summary 不回退到 raw snapshot shape。
  3. 至少一个第二 runtime consumer 已通过 `memoryContext` 或 contract-safe summary 消费 memory semantics，而不是重新暴露 `layeredSnapshot`。
  4. project/task/artifact truth 已同步，且 `sprint-003` 输入约束完成冻结。

## 2.3 sprint-003-promotion-output-rollout-and-project-closeout

- Status: completed
- Sprint Goal: 将 promotion output / session summary 投影扩展到至少一个 reporting-facing consumer，并完成 `project-021` 的 completion closeout 准备与判定。
- Task Package: `TK-251`、`TK-252`、`TK-253`、`TK-254`。
- Input Constraints:
  1. 不得把 canonical source ownership 挪进 `runtime.memory-semantics`。
  2. 新 consumer 仍只能消费 `memoryContext`、contract-safe summary 或 promotion summary，不允许回退到底层 `layeredSnapshot`。
  3. 不默认承诺 semantic/vector search、workspace/user 全量 memory rewrite 或 canonical-source rewrite。
  4. `project-021` 是否切为 `completed` 必须以 project completion audit、delivery registry 与 task ledger 真值同步为前置条件。
  5. 如 rollout 证据不足以支撑项目收口，必须冻结 blocker 与后续输入，而不是模糊保留 active closeout surface。
- Exit Criteria:
  1. 至少一个 runtime/reporting consumer 已通过 `promotionSummary` 或 session-summary projection 消费 `runtime.memory-semantics` 输出，而不是读取底层 snapshot。
  2. `technical-solution.memory-module` 的 delivery handoff、artifact ledger、project/sprint/task truth 与 current-context 保持同步，并形成 `project-021` completion audit 输入。
  3. 已明确给出 `project-021` 的 completed / blocked closeout 结论；若为 completed，必须产出 completion audit summary 并同步项目里程碑记录。

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
|---|---|---|---|---|---|
| TK-242 | sprint-001 | project-021 激活与 memory-module delivery handoff bootstrap | bootstrap/governance | DA-240,project-018 sprint-005 completion audit | completed |
| TK-243 | sprint-001 | technical-solution delivery registry 与 execution handoff gate baseline | governance/gate | TK-242,.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml | completed |
| TK-244 | sprint-001 | core-memory-semantics package 与 CLI task-driven runtime baseline | runtime/implementation | TK-243,DA-239,.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-memory-semantics/module-overview.md | completed |
| TK-245 | sprint-001 | sprint-001 出口验收与 sprint-002 输入约束 | acceptance/baseline | TK-242,TK-243,TK-244 | completed |
| TK-246 | sprint-001 | technical-solution consumer surfaces 与 rollout ownership 扩展 | governance/rollout | TK-243,.repo-ai-governor/context/technical-solution-delivery-registry.yaml | completed |
| TK-247 | sprint-002 | sprint-002 激活与 sprint-001 closeout handoff | bootstrap/governance | DA-245,sprint-001 completed | completed |
| TK-248 | sprint-002 | memory promotion pipeline 与 contract-safe summary baseline | runtime/implementation | TK-244,DA-245,.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-memory-semantics/contracts/memory-context-assembly-contract.md | completed |
| TK-249 | sprint-002 | second runtime consumer rollout 与 memory-context consumer cutover | runtime/rollout | TK-248,DA-244,.repo-ai-governor/context/technical-solution-delivery-registry.yaml | completed |
| TK-250 | sprint-002 | sprint-002 出口验收与 sprint-003 输入约束 | acceptance/baseline | TK-247,TK-248,TK-249 | completed |
| TK-251 | sprint-003 | sprint-003 激活与 sprint-002 closeout handoff | bootstrap/governance | DA-250,sprint-002 completed | completed |
| TK-252 | sprint-003 | promotion output reporting consumer 与 session-summary projection baseline | runtime/rollout | TK-251,DA-248,DA-249,DA-250 | completed |
| TK-253 | sprint-003 | project-021 completion audit 与 delivery closeout baseline | governance/closeout | TK-252,.repo-ai-governor/context/technical-solution-delivery-registry.yaml | completed |
| TK-254 | sprint-003 | sprint-003 出口验收与 project-021 完成态收口 | acceptance/closeout | TK-252,TK-253 | completed |

## 4. 依赖产物策略

1. `project-021` 启动默认消费：
   - `DA-239`
   - `DA-240`
   - `DA-241`
   - `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-memory-semantics/module-overview.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-memory-semantics/contracts/memory-recall-policy-contract.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-memory-semantics/contracts/memory-context-assembly-contract.md`
2. `sprint-001` 先建立 recall/context assembly baseline，不直接承诺 memory canonical source rewrite。
3. `runtime.memory-provider-loading` 继续只承接 provider loading；新的语义服务只允许通过明确 contract 接口消费 provider substrate。
4. `sprint-002` 默认消费 `DA-245` 与 `DA-244`，优先收敛 promotion pipeline 与第二 consumer rollout，而不是继续扩大 formal docs/gate 面。
5. `sprint-003` 默认消费 `DA-250`、`DA-248` 与 `DA-249`，优先把 promotion output / session summary 投影接到 reporting-facing consumer，并准备项目 closeout。

## 5. DoD（project-021）

1. `technical-solution.memory-module` 不再只有 formal docs，而是拥有真实执行流与明确 handoff ownership。
2. `packages/core-memory-semantics` 已形成首轮 bounded context，实现 recall/context assembly 基线且不越界承接 canonical source。
3. CLI task-driven runtime 已通过新的 memory semantics service 消费 memory context，而不是继续直连底层 snapshot shape。
4. 第二 runtime consumer 已通过 `memoryContext` 或 contract-safe summary 接入 `runtime.memory-semantics`，并保持 canonical source ownership 不外溢。
5. task/review/artifact/delivery-handoff registries 保持同步，`pnpm run check` 能阻断“active solution 无执行流”的回归。

## 6. 里程碑记录

1. 2026-03-27：创建 `project-021-memory-semantics-runtime-implementation`，并通过 `TK-242/TK-243` 将 `technical-solution.memory-module` 从“仅 formal solution”接入新的 delivery handoff 与实现主执行流。
2. 2026-03-27：通过 `TK-246 / DA-246` 将 technical solution handoff 从“只接执行流”扩展为“执行流 + consumer surfaces + rollout ownership”治理基线。
3. 2026-03-27：通过 `TK-244 / DA-244` 建立 `core-memory-semantics` baseline，并将 CLI task-driven runtime 的 memory path 切到显式 recall/context assembly。
4. 2026-03-27：通过 `TK-245 / DA-245` 完成 sprint-001 出口验收，并冻结 `sprint-002-promotion-pipeline-and-runtime-consumer-rollout` 的输入约束。
5. 2026-03-27：通过 `TK-247 / DA-247` 激活 `sprint-002-promotion-pipeline-and-runtime-consumer-rollout`，并将 `sprint-001` 迁入 completed history。
6. 2026-03-27：通过 `TK-248 / DA-248` 建立 `MemoryPromotionService` 与 `contractSafeSummary` 基线，使 promotion pipeline 不再依赖 raw snapshot shape。
7. 2026-03-27：通过 `TK-249 / DA-249` 将 `CliGovernanceRuntime` assembly check 切到 `memoryContext.contractSafeSummary`，完成第二个 runtime consumer rollout。
8. 2026-03-27：通过 `TK-250 / DA-250` 完成 `sprint-002` 出口验收，并将 `sprint-003-promotion-output-rollout-and-project-closeout` 冻结为 planned follow-up，而不提前激活。
9. 2026-03-27：通过 `TK-251 / DA-251` 正式激活 `sprint-003-promotion-output-rollout-and-project-closeout`，并将 `sprint-002` 迁入 completed history。
10. 2026-03-27：通过 `TK-252 / DA-252` 将 task-driven `execution_report` 扩展为 reporting-facing promotion output consumer，并把 session-summary projection 回写到 report contract。
11. 2026-03-27：通过 `TK-253 / DA-253` 完成 `project-021` completion audit、delivery closeout 真值同步，并产出 [project-021 completion audit summary](./project-021-memory-semantics-runtime-implementation-completion-audit-summary.md)。
12. 2026-03-27：通过 `TK-254 / DA-254` 完成 `sprint-003` 出口验收与 `project-021` 完成态收口；`current-context` 暂保留 `sprint-003` 作为 active closeout surface，等待下一条主执行流显式激活。
