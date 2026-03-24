# TK-107 受控 delivery rehearsal 与 audit/replay 集成

- Status: planned
- Date: 2026-03-24
- Owner: TBD
- Priority: P0
- Project: `project-010-local-model-and-ide-expansion`
- Sprint: `sprint-003-delivery-ide-and-ga-hardening`

## 1. 任务目标

将 `commit` 或 `PR draft` rehearsal 纳入策略门禁、审计回放与人工接管边界，形成 Stage 9 的受控交付演练基线。

## 2. Depends On

1. `TK-102`

## 3. 预期产物

1. `DA-107` 受控 delivery rehearsal 与 audit/replay 集成产物文档。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/plan.md`
2. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-003-delivery-ide-and-ga-hardening/plan.md`
3. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-002-autonomous-mainchain-foundation/tasks/TK-102-sprint-002-exit-acceptance-and-sprint-003-input-constraints.md`
4. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`
5. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
6. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`

## 5. 实施计划

1. 定义受控 `commit/PR draft` rehearsal 的最小执行契约、权限边界与回滚语义。
2. 将 rehearsal 接入 policy gate、audit recorder 与 replay/report builder。
3. 明确人工接管边界、高风险停点与失败后 `nextAction`。
4. 补齐集成测试与 `DA-107`。
5. 同步台账与 artifact registry。

## 6. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`
4. `pnpm run release:ga-check`
5. `pnpm run check`

## 7. 执行记录

1. 2026-03-24：任务创建，状态初始化为 `planned`。

## 8. 产出

1. `DA-107` `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-003-delivery-ide-and-ga-hardening/tasks/DA-107-controlled-delivery-rehearsal-and-audit-replay-integration.md`
2. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-003-delivery-ide-and-ga-hardening/tasks/checklist.md`
3. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-003-delivery-ide-and-ga-hardening/tasks/tasks.csv`
