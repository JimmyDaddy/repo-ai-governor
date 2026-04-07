# TK-691 refresh current app priority assessment draft against formal triad truth

- Status: completed
- Date: 2026-04-08
- Owner: `AI-Agent`
- Priority: `P1`
- Project: `project-071-draft-refresh-against-formal-triad`
- Sprint: `sprint-001-priority-and-decomposition-refresh`

## 1. 任务目标

用新的 formal PRD / brief / technical solution / architecture 真值，重写当前 priority assessment draft 中关于 host-native distribution、adopter truth 与整体优先级排序的判断。

## 2. Depends On

1. `project-070` formal triad sync
2. `.repo-ai-governor/draft/repo-ai-governor-current-app-feature-implementation-vs-baseline-priority-assessment.md`

## 3. 预期产物

1. 刷新后的当前应用优先级评估 draft
2. 新的 host-native lifecycle / support-truth 口径
3. 与 decomposition draft 一致的优先级排序

## 4. Required Inputs

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/normative_knowledge_sources/product-requirements.md`
3. `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
4. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
5. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`
6. `docs/support-matrix.md`
7. `README.md`
8. `.repo-ai-governor/draft/repo-ai-governor-current-app-feature-implementation-vs-baseline-priority-assessment.md`

## 5. 实施计划

1. 找出旧 draft 中仍沿用 pre-triad-sync 口径的段落。
2. 把 host-native assets 从“主体完成只剩 reserved target”改写成“baseline 完成，但 lifecycle / upgrade / support-truth / adopter consumption 已成为正式 follow-up”。
3. 重排 P1/P2 优先级，使其与 formal triad 的产品边界一致。

## 6. Delivery Verification

1. `node ./scripts/governance/sync-task-ledger.js --task-id TK-691`
2. docs/source cross-check：formal triad、support matrix、README、existing draft

## 7. 执行记录

1. 2026-04-08：任务创建，状态初始化为 `in_progress`；本轮目标是按新的 formal triad 真值刷新 priority assessment draft。
2. 2026-04-08：已把 Basis 扩展到 PRD / brief / total technical solution / architecture，并重写 host-native distribution 的判断，不再把剩余问题仅归结为 reserved target。
3. 2026-04-08：已把 P1 顺序调整为 packaged install -> host-native lifecycle/support-truth -> VS Code / desktop / standards，使其与 formal triad 的产品边界一致。
4. 2026-04-08：priority assessment draft 刷新完成，任务完成。
