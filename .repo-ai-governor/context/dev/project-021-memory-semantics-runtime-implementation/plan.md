# project-021-memory-semantics-runtime-implementation 计划

- Status: active
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

- Status: active
- Sprint Goal: 建立 technical solution delivery handoff baseline，并实现 `runtime.memory-semantics` 的首个可用 recall/context assembly 运行时路径。
- Task Package: `TK-242`、`TK-243`、`TK-244`、`TK-245`、`TK-246`。
- Exit Criteria:
  1. `project-021` skeleton 已建立，`current-context.md` 已切换到新的 memory semantics implementation stream，并将 `project-018 / sprint-005` 迁入 completed history。
  2. `technical-solution-delivery-registry.yaml` 与 blocking gate 已正式落地，且 `technical-solution.memory-module` 已明确登记为 `followup_required -> project-021 / sprint-001`。
  3. delivery handoff 已扩展到 consumer surfaces、user impact 与 rollout ownership，不再只回答“有没有执行任务”。
  4. 已引入 `packages/core-memory-semantics` baseline，并形成 `MemoryRecallService` / `MemoryContextAssembler` 的首轮 contract-to-code 映射。
  5. CLI task-driven runtime 已消费 memory semantics baseline，且相关 package/integration tests 具备可执行验证面。

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
|---|---|---|---|---|---|
| TK-242 | sprint-001 | project-021 激活与 memory-module delivery handoff bootstrap | bootstrap/governance | DA-240,project-018 sprint-005 completion audit | completed |
| TK-243 | sprint-001 | technical-solution delivery registry 与 execution handoff gate baseline | governance/gate | TK-242,.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml | completed |
| TK-244 | sprint-001 | core-memory-semantics package 与 CLI task-driven runtime baseline | runtime/implementation | TK-243,DA-239,.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-memory-semantics/module-overview.md | completed |
| TK-245 | sprint-001 | sprint-001 出口验收与 sprint-002 输入约束 | acceptance/baseline | TK-242,TK-243,TK-244 | planned |
| TK-246 | sprint-001 | technical-solution consumer surfaces 与 rollout ownership 扩展 | governance/rollout | TK-243,.repo-ai-governor/context/technical-solution-delivery-registry.yaml | completed |

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

## 5. DoD（project-021）

1. `technical-solution.memory-module` 不再只有 formal docs，而是拥有真实执行流与明确 handoff ownership。
2. `packages/core-memory-semantics` 已形成首轮 bounded context，实现 recall/context assembly 基线且不越界承接 canonical source。
3. CLI task-driven runtime 已通过新的 memory semantics service 消费 memory context，而不是继续直连底层 snapshot shape。
4. task/review/artifact/delivery-handoff registries 保持同步，`pnpm run check` 能阻断“active solution 无执行流”的回归。

## 6. 里程碑记录

1. 2026-03-27：创建 `project-021-memory-semantics-runtime-implementation`，并通过 `TK-242/TK-243` 将 `technical-solution.memory-module` 从“仅 formal solution”接入新的 delivery handoff 与实现主执行流。
2. 2026-03-27：通过 `TK-246 / DA-246` 将 technical solution handoff 从“只接执行流”扩展为“执行流 + consumer surfaces + rollout ownership”治理基线。
3. 2026-03-27：通过 `TK-244 / DA-244` 建立 `core-memory-semantics` baseline，并将 CLI task-driven runtime 的 memory path 切到显式 recall/context assembly。
