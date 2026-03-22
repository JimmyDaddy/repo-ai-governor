# TK-078 examples 资产与 example smoke 门禁基线

- Status: completed
- Date: 2026-03-22
- Owner: AI-Agent
- Priority: P0
- Project: `project-009-production-readiness`
- Sprint: `sprint-001-local-adoption-and-install-readiness`

## 1. 任务目标

提供可直接运行的根级 `examples/` 资产并接入门禁，防止示例与实现漂移。

## 2. Depends On

1. `TK-075`
2. `TK-077`

## 3. 预期产物

1. `DA-090` examples 与 example smoke 基线产物文档。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-009-production-readiness/plan.md`
2. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`
3. `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`

## 5. 实施计划

1. 建立根级 `examples/` 并纳入发布文件清单；禁止以“等价目录”替代 Stage 9A 硬门槛要求。
2. 补齐示例覆盖：单角色最小流程、多角色协作流程、HITL 触发流程、受限网络降级流程，并至少说明 `review-verify` 与台账回写在完整闭环中的位置。
3. 为每个示例编写输入、命令、预期输出与排障说明，并回链 README/本地采用手册；若示例涉及只读接入或 workspace 模式差异，必须注明行为边界。
4. 将 example smoke 接入门禁与台账；若根级 `examples/` 缺失、示例与主实现漂移，或与最新治理 gate、外部消费契约矩阵或支持矩阵口径不一致，则必须阻断通过。

## 6. 验证

1. `node ./scripts/examples/check-examples-smoke.js`
2. `node ./scripts/examples/check-examples-runtime.js`
3. `node ./scripts/governance/check-task-ledger-sync.js`
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`
5. `pnpm run check`

## 7. 执行记录

1. 2026-03-22：任务创建，状态初始化为 `planned`。
2. 2026-03-22：根据 `TK-088` 将 examples 目录收紧为强制要求，并补齐 example smoke 阻断语义，任务状态保持 `planned`。
3. 2026-03-22：根据 `TK-090` 补齐完整闭环、只读接入与 gate 口径说明，任务状态保持 `planned`。
4. 2026-03-22：根据 `TK-094` 将目录口径统一为根级 `examples/`，并补充与外部消费契约/支持矩阵的回链要求，任务状态保持 `planned`。
5. 2026-03-22：任务启动，状态切换为 `active`，建立根级 `examples/` 四类示例并落地 `example-smoke` 契约文件。
6. 2026-03-22：完成 `scripts/examples/check-examples-smoke.js` 阻断脚本与 `package.json/turbo` 门禁接线，产出 `DA-090` 并通过验证，状态切换为 `completed`。
7. 2026-03-22：二次增强 examples 资产结构，补齐每个场景的 `scenario.json + fixtures + expected`，并将 smoke 拆分为 `doc + runtime` 双门禁，状态保持 `completed`。

## 8. 产出

1. `DA-090` `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/DA-090-examples-assets-and-example-smoke-baseline.md`
2. 根级示例资产：`examples/README.md` 与四类示例目录
3. `example smoke` 阻断脚本：`scripts/examples/check-examples-smoke.js` 与 `scripts/examples/check-examples-runtime.js`
4. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/checklist.md`
5. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/tasks.csv`
