# project-057-standards-native-review-engine-productization 计划

- Status: planned
- Date: 2026-04-06
- Stage Mapping: standards-native review engine productization
- Phase Mapping: review rule registry / provenance-aware findings / standards-guided reviewer handoff / coverage reporting and rollout adoption
- Upstream:
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/adrs/standards-native-review-engine-and-provenance-aware-cr.md`
  - `.repo-ai-governor/draft/standards-native-code-review-engine-follow-up-technical-solution.md`
  - `.repo-ai-governor/context/dev/project-057-standards-native-review-engine-productization/sprint-001-review-rule-registry-and-provenance-baseline/tasks/DA-621-standards-native-review-engine-promotion-and-rollout-handoff.md`

## 1. 目标

1. 把当前 `standards-aware CR` 的能力正式推进为 `standards-native review engine` 产品路径。
2. 收口 review-rule registry、finding provenance 与 delegated reviewer handoff 的正式边界。
3. 为后续 `review / review-verify` 与 delegated CR loop 共用同一套 review truth、coverage metrics 与 closure semantics 建立实现基线。
4. 把方案中的 Phase A-D 转换成可顺序激活的 sprint 与任务包，而不是继续停留在单 sprint 粗骨架。

## 2. Sprint 细化

## 2.1 sprint-001-review-rule-registry-and-provenance-baseline

- Status: planned
- Sprint Goal: 冻结 review rule registry、有限值枚举管理、first-phase projected rule subset 与 Phase A 集成验收边界。
- Task Package: `TK-621`、`TK-622`、`TK-623`。

## 2.2 sprint-002-provenance-aware-findings-and-hybrid-review-baseline

- Status: planned
- Sprint Goal: 把 provenance-aware governed findings、artifact rendering 分层与 hybrid review generation baseline 落到正式实现路径。
- Task Package: `TK-627`、`TK-628`、`TK-629`。

## 2.3 sprint-003-standards-guided-reviewer-handoff-and-source-aware-closure

- Status: planned
- Sprint Goal: 收口 standards-guided reviewer handoff、adapter-neutral projection 与 `review-verify` source-aware closure 语义。
- Task Package: `TK-630`、`TK-631`、`TK-632`。

## 2.4 sprint-004-coverage-reporting-and-rollout-adoption

- Status: planned
- Sprint Goal: 建立 review coverage metrics、delegated review activation policy 与 project-057 closeout/handoff 基线。
- Task Package: `TK-633`、`TK-634`、`TK-635`。

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
|---|---|---|---|---|---|
| TK-621 | sprint-001 | 冻结 standards-native review rule registry 与 finite-set finding taxonomy contract | contract/registry | technical solution promotion accepted | planned |
| TK-622 | sprint-001 | 冻结 first-phase projected rule subset 与 standards source mapping | contract/projection | TK-621 | planned |
| TK-623 | sprint-001 | 收口 Phase A integration seam inventory 与 acceptance baseline | planning/acceptance | TK-621、TK-622 | planned |
| TK-627 | sprint-002 | 实现 provenance-aware finding contract 与 durable projection baseline | runtime/model | TK-621、TK-622 | planned |
| TK-628 | sprint-002 | 更新 deterministic finding rule projection 与 review artifact rendering sections | runtime/rendering | TK-627 | planned |
| TK-629 | sprint-002 | 接入 hybrid deterministic-plus-delegated review generation 与 dedupe merge baseline | runtime/orchestration | TK-627、TK-628 | planned |
| TK-630 | sprint-003 | 定义 standards-guided reviewer handoff contract 与 adapter-neutral projection seam | contract/agent-projection | TK-621、TK-629 | planned |
| TK-631 | sprint-003 | 实现 review-verify source-aware closure semantics 与 rationale persistence | runtime/review-verify | TK-627、TK-628、TK-630 | planned |
| TK-632 | sprint-003 | 集成 delegated CR loop projected rule loading 与 normalized finding ingestion | runtime/integration | TK-629、TK-630、TK-631 | planned |
| TK-633 | sprint-004 | 增加 review rule coverage metrics 与 provenance-aware reporting surface | reporting/metrics | TK-629、TK-631 | planned |
| TK-634 | sprint-004 | 定义 deterministic coverage incomplete 的 delegated review activation policy | policy/rollout | TK-633 | planned |
| TK-635 | sprint-004 | 完成 project-057 rollout handoff、adoption evidence 与 closeout baseline | closeout/handoff | TK-633、TK-634 | planned |

## 4. 依赖产物策略

1. Sprint 001 先冻结 rule registry、execution mode、source type、severity/applicability 等闭集业务值，满足 `CS-009` 与 `CS-032` 的 enum/constants 管理要求。
2. Sprint 002 再把 provenance-aware finding model、artifact rendering 与 hybrid generation merge seam 接入到现有 `review` 路径，避免 delegated reviewer 先行导致 finding contract 再次漂移。
3. Sprint 003 只在前两步稳定后再接 reviewer handoff 和 `review-verify` source-aware closure，保证 same-round verify 与 fresh recheck 仍落在同一条 canonical lifecycle。
4. Sprint 004 负责 coverage reporting、activation policy 与 closeout evidence，避免在 contract 尚未稳定前过早承诺覆盖率或强制策略。

## 5. DoD（project-057）

1. review-rule registry 的最小投影模型与 first-phase projected rule subset 已正式落地。
2. `review / review-verify` 可以区分 deterministic、standards-guided 与 residual risk findings，并在 artifact 中显式保留 provenance。
3. delegated reviewer handoff 不再依赖 raw markdown-only prompt truth，而是消费结构化 projected rule bundle。
4. 至少有一条 rollout/handoff 产物能说明 coverage metrics、activation policy 与 adopter-facing adoption 路径。

## 6. 里程碑记录

1. 2026-04-06：`technical-solution.standards-native-code-review-engine-follow-up` 已提升为 active formal direction。
2. 2026-04-06：已创建 `project-057` planned stream，承接 review-rule registry、provenance-aware finding 与 reviewer handoff follow-up。
3. 2026-04-06：本次拆解将 `project-057` 从单 sprint 粗骨架扩展为 Phase A-D 对齐的 4 个顺序 sprint 与 12 个可执行任务。
