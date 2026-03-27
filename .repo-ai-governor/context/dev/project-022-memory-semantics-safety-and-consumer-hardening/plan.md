# project-022-memory-semantics-safety-and-consumer-hardening 计划

- Status: active
- Date: 2026-03-27
- Stage Mapping: Post-Stage-9 runtime semantics governance hardening follow-up
- Phase Mapping: Runtime Memory Semantics / Contract Alignment / Safety Hardening / Adopter Output

## 1. 目标

1. 将 `runtime.memory-semantics` 文档 contract 与当前实现边界重新对齐，避免 `workspace/user` 预留层继续表现得像已交付能力。
2. 将 `sensitivity / visibility` 从记录型提示升级为 context assembly 的显式治理约束，降低敏感内容透传风险。
3. 将 promotion output 从当前 `execution_report` 内部 reporting consumer 继续扩到至少一个 adopter-facing consumer，而不是停在内部诊断面。
4. 保持 canonical source ownership 外置，不把这些 follow-up 重新变成 provider/store 或 source-truth rewrite。

## 2. Sprint 细化

## 2.1 sprint-001-contract-alignment-safety-and-adopter-output-baseline

- Status: completed
- Sprint Goal: 收敛 `workspace/user` 预留层 contract truth、assembly sensitivity enforcement 与 adopter-facing promotion output baseline。
- Task Package: `TK-255`、`TK-256`、`TK-257`、`TK-258`、`TK-259`。
- Exit Criteria:
  1. `project-022` skeleton 已建立，`current-context.md` 已切换到新的 active primary stream，并将 `project-021 / sprint-003` 迁入 completed history。
  2. `runtime-memory-semantics` 模块文档与实现对 `workspace/user` 层的承诺保持一致，不再制造“预留位已落地”的假象。
  3. context assembly 已具备最小可执行的 sensitivity / visibility enforcement，而不只是 `safetyNotes` 提示。
  4. 至少一个 adopter-facing consumer 已通过 contract-safe promotion output 或 replay diagnostics 消费 `runtime.memory-semantics` 输出。
  5. project/task/artifact/delivery/master-plan truth 已同步，且后续扩张输入已冻结。

## 2.2 sprint-002-policy-tuning-and-surface-expansion

- Status: planned
- Sprint Goal: 仅在需要扩展更多 consumer surface、policy tuning 或进一步实现 `workspace/user` seam 时激活。
- Task Package: 待激活后拆解。
- Input Constraints:
  1. 不得把 follow-up 误扩成 canonical-source rewrite 或 provider loading 责任回流。
  2. 若 `workspace/user` 仍保持 reserved capability，则新增 consumer 必须继续基于已实现层工作。
  3. 若 adopter-facing consumer 已能满足近期产品目标，则允许 project-022 直接收口，不强制激活本 sprint。

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
|---|---|---|---|---|---|
| TK-255 | sprint-001 | project-022 激活与 project-021 closeout handoff | bootstrap/governance | DA-254,project-021 completed | completed |
| TK-256 | sprint-001 | workspace-user layer contract 对齐与 future capability 降级 | docs/contract | TK-255,DA-255,.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-memory-semantics/module-overview.md | completed |
| TK-257 | sprint-001 | sensitivity visibility assembly enforcement baseline | runtime/safety | TK-255,DA-255,.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-memory-semantics/contracts/memory-context-assembly-contract.md | completed |
| TK-258 | sprint-001 | adopter-facing promotion output 与 replay diagnostics baseline | runtime/rollout | TK-255,DA-255,DA-252 | completed |
| TK-259 | sprint-001 | sprint-001 出口验收与 sprint-002 输入约束 | acceptance/baseline | TK-256,TK-257,TK-258 | completed |

## 4. 依赖产物策略

1. `project-022` 启动默认消费：
   - `DA-254`
   - `project-021-memory-semantics-runtime-implementation-completion-audit-summary.md`
   - `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-memory-semantics/module-overview.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-memory-semantics/contracts/memory-recall-policy-contract.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-memory-semantics/contracts/memory-context-assembly-contract.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-memory-semantics/adrs/working-memory-and-canonical-source-boundary.md`
2. `sprint-001` 先收敛 contract truth 与 assembly safety，不直接承诺 full `workspace/user` memory substrate 落地。
3. adopter-facing consumer 优先基于现有 `promotionSummary` / replay diagnostics，而不是重新回读 raw memory snapshot。
4. 若需要 future capability 扩张，必须通过新 sprint 明确激活，而不是在本 sprint 内隐式扩 scope。

## 5. DoD（project-022）

1. `runtime-memory-semantics` 的文档、contract、常量与实现边界保持一致。
2. context assembly 对敏感内容与缺失标签具备最小可执行的治理策略，而不是仅记录提示。
3. 至少一个 adopter-facing consumer 能稳定消费 promotion output / replay diagnostics，不回退到底层 snapshot。
4. task/review/artifact/delivery/master-plan truth 保持同步，`pnpm run check` 能阻断 follow-up drift。

## 6. 里程碑记录

1. 2026-03-27：创建 `project-022-memory-semantics-safety-and-consumer-hardening`，并通过 `TK-255 / DA-255` 将 active execution surface 从 `project-021` closeout 切到新的 follow-up 主线。
2. 2026-03-27：通过 `TK-256 / DA-256` 将 `workspace/user` 从默认 active recall baseline 中降级为 reserved capability，并完成 module docs / contract / constants / tests 对齐。
3. 2026-03-27：通过 `TK-257 / DA-257` 将缺失 sensitivity 标签与显式 visibility 不允许 runtime 消费的记录收敛为 assembly redaction，而不再仅依赖 `safetyNotes` 提示。
4. 2026-03-27：通过 `TK-258 / DA-258` 将 promotion output 扩展到 adopter-facing `run`/`replay` CLI message、replay explain lines 与 replay diagnostics artifact summary。
5. 2026-03-27：通过 `TK-259 / DA-259` 完成 sprint-001 验收，并将 `sprint-002-policy-tuning-and-surface-expansion` 冻结为 planned follow-up，而不提前激活。
