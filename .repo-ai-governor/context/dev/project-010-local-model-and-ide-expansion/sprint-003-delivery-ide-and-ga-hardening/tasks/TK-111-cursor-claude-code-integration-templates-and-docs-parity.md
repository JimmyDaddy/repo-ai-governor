# TK-111 Cursor/Claude Code 接入模板与文档一致性

- Status: completed
- Date: 2026-03-24
- Owner: AI-Agent
- Priority: P1
- Project: `project-010-local-model-and-ide-expansion`
- Sprint: `sprint-003-delivery-ide-and-ga-hardening`

## 1. 任务目标

为 Cursor/Claude Code 形成官方接入模板与文档链路，确保 contracts/examples/docs 三者一致可回链。

## 2. Depends On

1. `TK-109`
2. `TK-110`

## 3. 预期产物

1. `DA-111` Cursor/Claude Code 接入模板与文档一致性产物文档。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/plan.md`
2. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-003-delivery-ide-and-ga-hardening/plan.md`
3. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-003-delivery-ide-and-ga-hardening/tasks/TK-109-multi-ide-surface-registry-and-wrapper-contract-hardening.md`
4. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-003-delivery-ide-and-ga-hardening/tasks/TK-110-vscode-jetbrains-official-templates-and-smoke-gate.md`
5. `.repo-ai-governor/normative_knowledge_sources/product-requirements.md`

## 5. 实施计划

1. 提供 Cursor 与 Claude Code 的命令包装模板与环境变量约定。
2. 补齐接入文档、常见错误与 `nextAction` 处理说明。
3. 增加 contracts/examples/docs 一致性检查脚本，防止文档与契约漂移。
4. 将一致性检查纳入门禁链路。
5. 回写台账并登记 `DA-111`。

## 6. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `pnpm run check`
4. `pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`

## 7. 执行记录

1. 2026-03-24：任务创建，状态初始化为 `planned`。
2. 2026-03-24：任务启动，已确认当前 `cursor/claude_code` 只存在于 contract surface registry 中，examples/docs 尚未落官方模板，也缺少 contracts/examples/docs 的专门 parity gate；下一步将补齐双入口模板与一致性检查。
3. 2026-03-24：已完成 Cursor/Claude Code 官方模板、`check:ide-docs-parity`、四入口 `check:ide-entry-smoke` 扩展、integration coverage 与本地分发校验，并生成 `DA-111` 与 resolved review；当前任务状态更新为 `completed`。
4. 2026-03-24：复核并修复 follow-up CR，已让 Cursor/Claude Code 官方模板的 env baseline 经由 `test/ide-entry-smoke.integration.test.ts` 真实注入 `runCli()`，不再只是静态模板解析或 surface 字符串断言。

## 8. 产出

1. `DA-111` `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-003-delivery-ide-and-ga-hardening/tasks/DA-111-cursor-claude-code-integration-templates-and-docs-parity.md`
2. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-003-delivery-ide-and-ga-hardening/tasks/checklist.md`
3. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-003-delivery-ide-and-ga-hardening/tasks/tasks.csv`
