# TK-632 集成 delegated CR loop projected rule loading 与 normalized finding ingestion

- Status: completed
- Date: 2026-04-06
- Owner: `AI-Agent`
- Priority: `P1`
- Project: `project-057-standards-native-review-engine-productization`
- Sprint: `sprint-003-standards-guided-reviewer-handoff-and-source-aware-closure`

## 1. 任务目标

把 `workspace-scoped-cr-loop` 与未来产品内 delegated CR loop 对接到 projected rule bundle、structured reviewer request 与 normalized finding ingestion，保证两条路径共享同一套 standards-native review semantics。

## 2. Depends On

1. `TK-629`
2. `TK-630`
3. `TK-631`

## 3. 预期产物

1. delegated CR loop rule loading 接入点
2. normalized finding ingestion baseline
3. native review 与 delegated loop 的共享语义说明

## 4. Required Inputs

1. `.codex/skills/workspace-scoped-cr-loop/SKILL.md`
2. `.repo-ai-governor/draft/scoped-delegated-cr-loop-productization-technical-solution.md`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/adrs/standards-native-review-engine-and-provenance-aware-cr.md`

## 5. Traceback References

1. `.repo-ai-governor/draft/standards-native-code-review-engine-follow-up-technical-solution.md`
2. `.repo-ai-governor/context/dev/project-057-standards-native-review-engine-productization/plan.md`

## 6. 实施计划

1. 让 delegated CR loop 在 handoff 前先消费 projected rule bundle 与 deterministic findings。
2. 收口 delegated reviewer 输出到 normalized finding ingestion 的映射规则。
3. 保证 delegated CR loop 只扩展 standards-guided surface，而不复制 deterministic findings。

## 7. Development Verification

1. 检查 delegated loop 接入后是否仍保持 canonical CR lifecycle 单一真值。
2. 检查 shared semantics 是否足以服务未来正式 `run --review-loop delegated` 路径。

## 8. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `pnpm run build`

## 9. 执行记录

1. 2026-04-06：任务创建，状态初始化为 `planned`。
2. 2026-04-07：已让 `workspace-scoped-cr-loop` 支持 projected-rules / deterministic-findings / uncovered-rule-ids 进入结构化 handoff contract，并新增 delegated reviewer findings normalizer 作为 normalized ingestion seam。

## 10. 产出

1. 已完成：delegated CR loop projected rule loading baseline
2. 已完成：normalized finding ingestion 规则
