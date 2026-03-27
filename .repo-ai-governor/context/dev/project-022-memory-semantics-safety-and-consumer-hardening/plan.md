# project-022-memory-semantics-safety-and-consumer-hardening 计划

- Status: completed
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

- Status: completed
- Sprint Goal: 继续细化 `sensitivity / visibility` policy、扩展 adopter-facing consumer surface，并明确 `workspace/user` seam 是否进入最小实现窗口。
- Task Package: `TK-260`、`TK-261`、`TK-262`、`TK-263`、`TK-264`。
- Input Constraints:
  1. 不得把 follow-up 误扩成 canonical-source rewrite 或 provider loading 责任回流。
  2. 若 `workspace/user` 仍保持 reserved capability，则新增 consumer 必须继续基于已实现层工作。
  3. 若 adopter-facing consumer 已能满足近期产品目标，则允许 project-022 直接收口，不强制激活本 sprint。
- Exit Criteria:
  1. `sensitivity / visibility` 至少形成分层 policy（如 warn/redact/block 的明确边界），而不只剩单一 redaction baseline。
  2. adopter-facing consumer 至少再扩一条真实 surface，且不回退到 raw memory snapshot。
  3. `workspace/user` seam 是否进入实现窗口已有明确决策与证据，而不是继续悬空。
  4. project / sprint / task / artifact / delivery / master-plan 真值保持同步。

## 2.3 sprint-003-seam-follow-through-or-project-closeout

- Status: completed
- Sprint Goal: 在不伪造 `workspace/user` 实现的前提下，基于真实 adopter demand 决定继续推进 adopter-facing surface follow-through，或直接完成 `project-022` closeout。
- Task Package: `TK-265`、`TK-266`、`TK-267`、`TK-268`、`TK-269`。
- Input Constraints:
  1. 若 `workspace/user` seam 继续保持 reserved capability，则不得为了维持 active surface 而伪造实现任务。
  2. 若 adopter-facing surface 已满足近期目标，可直接在 project closeout surface 上收口，而不强制激活本 sprint。
  3. 只有当 substrate、ownership seam 与用户价值同时成立时，才允许进入 `workspace/user` 最小实现窗口。
- Exit Criteria:
  1. 已给出 adopter-facing surface 的“继续 follow-through / 直接 closeout”明确结论，而不是继续悬空。
  2. `workspace/user` seam 已重新完成 gate revalidation；若仍不满足条件，则明确保持 reserved capability，而不是制造伪实现。
  3. `project-022` completion audit、delivery closeout 与 project/sprint/task/artifact/master-plan 真值已同步，或已明确记录 blocker。
  4. 当前 sprint 的 task ledger、review 生命周期与后续输入冻结保持一致。

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
|---|---|---|---|---|---|
| TK-255 | sprint-001 | project-022 激活与 project-021 closeout handoff | bootstrap/governance | DA-254,project-021 completed | completed |
| TK-256 | sprint-001 | workspace-user layer contract 对齐与 future capability 降级 | docs/contract | TK-255,DA-255,.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-memory-semantics/module-overview.md | completed |
| TK-257 | sprint-001 | sensitivity visibility assembly enforcement baseline | runtime/safety | TK-255,DA-255,.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-memory-semantics/contracts/memory-context-assembly-contract.md | completed |
| TK-258 | sprint-001 | adopter-facing promotion output 与 replay diagnostics baseline | runtime/rollout | TK-255,DA-255,DA-252 | completed |
| TK-259 | sprint-001 | sprint-001 出口验收与 sprint-002 输入约束 | acceptance/baseline | TK-256,TK-257,TK-258 | completed |
| TK-260 | sprint-002 | sprint-002 激活与 sprint-001 closeout handoff | bootstrap/governance | DA-259,sprint-001 completed | completed |
| TK-261 | sprint-002 | sensitivity visibility policy stratification 与 runtime-safe decision baseline | runtime/policy | TK-260,DA-257,DA-259 | completed |
| TK-262 | sprint-002 | adopter-facing promotion output surface expansion 与 replay UX polish | runtime/rollout | TK-260,DA-258,DA-259 | completed |
| TK-263 | sprint-002 | workspace-user seam readiness assessment 与 implementation decision baseline | governance/decision | TK-260,DA-256,DA-259 | completed |
| TK-264 | sprint-002 | sprint-002 出口验收与 sprint-003 输入约束 | acceptance/baseline | TK-261,TK-262,TK-263 | completed |
| TK-265 | sprint-003 | sprint-003 激活与 sprint-002 closeout handoff | bootstrap/governance | DA-264,sprint-002 completed | completed |
| TK-266 | sprint-003 | adopter-facing surface follow-through 与 project closeout recommendation baseline | runtime/rollout | TK-265,DA-262,DA-264 | completed |
| TK-267 | sprint-003 | workspace-user seam follow-through gate 与 implementation-window revalidation | governance/decision | TK-265,DA-263,DA-264 | completed |
| TK-268 | sprint-003 | project-022 completion audit 与 delivery closeout baseline | acceptance/closeout | TK-266,TK-267,.repo-ai-governor/context/technical-solution-delivery-registry.yaml | completed |
| TK-269 | sprint-003 | sprint-003 出口验收与 project-022 完成态收口 | acceptance/baseline | TK-266,TK-267,TK-268 | completed |

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
5. `sprint-002` 默认消费 `DA-259`、`DA-257` 与 `DA-258`，不再回头重做 `sprint-001` 已完成的 baseline。
6. `sprint-003` 默认消费 `DA-262`、`DA-263` 与 `DA-264`，优先判断 adopter-facing surface 是否还需要继续扩张，否则直接收敛到 project closeout。

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
6. 2026-03-27：通过 `TK-260 / DA-260` 正式激活 `sprint-002-policy-tuning-and-surface-expansion`，并将 `sprint-001` 迁入 completed history。
7. 2026-03-27：通过 `TK-261 / DA-261` 建立 `allow / warn / redact / block` policy stratification，并切断 raw selected records 向执行链路的透传。
8. 2026-03-27：通过 `TK-262 / DA-262` 扩展 adopter-facing `memory_policy / memory_promotion` surface，并改善 replay explain / diagnostics UX。
9. 2026-03-27：通过 `TK-263 / DA-263` 完成 `workspace/user` seam readiness assessment，并决定继续保持 reserved capability。
10. 2026-03-27：通过 `TK-264 / DA-264` 完成 sprint-002 验收，并将 `sprint-003-seam-follow-through-or-project-closeout` 冻结为 planned follow-up，而不提前激活。
11. 2026-03-27：通过 `TK-265 / DA-265` 正式激活 `sprint-003-seam-follow-through-or-project-closeout`，将 active execution surface 从 `sprint-002` 切换到 seam follow-through / project closeout 窗口，并将 `sprint-002` 迁入 completed history。
12. 2026-03-27：通过 `TK-266 / DA-266` 判定当前 adopter-facing `memory_policy / memory_promotion` surface 已满足本轮项目目标，不再继续扩张，直接进入 closeout recommendation。
13. 2026-03-27：通过 `TK-267 / DA-267` 复核 `workspace/user` seam gate，结论仍为保持 reserved capability，暂不进入最小实现窗口。
14. 2026-03-27：通过 `TK-268 / DA-268` 产出 [project-022 completion audit summary](./project-022-memory-semantics-safety-and-consumer-hardening-completion-audit-summary.md)，并同步 delivery closeout baseline。
15. 2026-03-27：通过 `TK-269 / DA-269` 完成 sprint-003 验收与 `project-022` completed closeout；`current-context` 暂保留本 sprint 作为 active closeout surface，等待下一条主执行流显式激活。
