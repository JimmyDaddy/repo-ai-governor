# TK-101 Cursor/Claude Code 接入模板与文档一致性

- Status: planned
- Date: 2026-03-23
- Owner: TBD
- Priority: P1
- Project: `project-010-local-model-and-ide-expansion`
- Sprint: `sprint-002-ide-integration-productionization`

## 1. 任务目标

为 Cursor/Claude Code 形成官方接入模板与文档链路，确保 contracts/examples/docs 三者一致可回链。

## 2. Depends On

1. `TK-099`
2. `TK-100`

## 3. 预期产物

1. `DA-105` Cursor/Claude Code 接入模板与文档一致性产物文档。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/plan.md`
2. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-002-ide-integration-productionization/plan.md`
3. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-002-ide-integration-productionization/tasks/TK-099-multi-ide-surface-registry-and-wrapper-contract-hardening.md`
4. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-002-ide-integration-productionization/tasks/TK-100-vscode-jetbrains-official-templates-and-smoke-gate.md`
5. `.repo-ai-governor/normative_knowledge_sources/product-requirements.md`

## 5. 实施计划

1. 提供 Cursor 与 Claude Code 的命令包装模板与环境变量约定。
2. 补齐接入文档、常见错误与 `nextAction` 处理说明。
3. 增加 contracts/examples/docs 一致性检查脚本，防止文档与契约漂移。
4. 将一致性检查纳入门禁链路。
5. 回写台账并登记 `DA-105`。

## 6. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `pnpm run check`
4. `pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`

## 7. 执行记录

1. 2026-03-23：任务创建，状态初始化为 `planned`。

## 8. 产出

1. `DA-105` `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-002-ide-integration-productionization/tasks/DA-105-cursor-claude-code-integration-templates-and-docs-parity.md`
2. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-002-ide-integration-productionization/tasks/checklist.md`
3. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-002-ide-integration-productionization/tasks/tasks.csv`
