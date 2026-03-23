# TK-099 多 IDE surface registry 与 wrapper 契约强化

- Status: planned
- Date: 2026-03-23
- Owner: TBD
- Priority: P1
- Project: `project-010-local-model-and-ide-expansion`
- Sprint: `sprint-002-ide-integration-productionization`

## 1. 任务目标

将现有 IDE baseline 契约升级为多入口生产化契约，确保 wrapper、标准注入、输出模式和错误语义跨入口一致。

## 2. Depends On

1. `TK-098`

## 3. 预期产物

1. `DA-103` 多 IDE surface registry 与 wrapper 契约强化产物文档。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/plan.md`
2. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-002-ide-integration-productionization/plan.md`
3. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-001-local-model-adapter-baseline/tasks/TK-098-sprint-001-exit-acceptance-and-sprint-002-input-constraints.md`
4. `integrations/ide/README.md`
5. `.repo-ai-governor/normative_knowledge_sources/product-requirements.md`

## 5. 实施计划

1. 扩展 surface registry，明确 VS Code/JetBrains/Cursor/Claude Code 的能力声明与降级语义。
2. 收敛 wrapper 输入输出契约，固定标准注入顺序与保留环境变量覆盖策略。
3. 补齐入口级错误映射与 `nextAction` 提示，避免入口静默失败。
4. 增加契约测试，确保多入口输出字段一致。
5. 回写台账并登记 `DA-103`。

## 6. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `pnpm run test:packages -- apps/cli/test --maxWorkers=1 --maxConcurrency=1`
4. `pnpm run check`

## 7. 执行记录

1. 2026-03-23：任务创建，状态初始化为 `planned`。

## 8. 产出

1. `DA-103` `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-002-ide-integration-productionization/tasks/DA-103-multi-ide-surface-registry-and-wrapper-contract-hardening.md`
2. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-002-ide-integration-productionization/tasks/checklist.md`
3. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-002-ide-integration-productionization/tasks/tasks.csv`
