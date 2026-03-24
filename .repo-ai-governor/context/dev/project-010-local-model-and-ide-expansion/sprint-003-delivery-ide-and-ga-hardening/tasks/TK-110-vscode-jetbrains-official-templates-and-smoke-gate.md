# TK-110 VS Code/JetBrains 官方模板与 smoke 门禁

- Status: planned
- Date: 2026-03-24
- Owner: TBD
- Priority: P1
- Project: `project-010-local-model-and-ide-expansion`
- Sprint: `sprint-003-delivery-ide-and-ga-hardening`

## 1. 任务目标

提供 VS Code 与 JetBrains 的官方接入模板，并建立 IDE 入口 smoke 门禁，确保模板可执行且不漂移。

## 2. Depends On

1. `TK-109`

## 3. 预期产物

1. `DA-110` VS Code/JetBrains 官方模板与 smoke 门禁产物文档。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/plan.md`
2. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-003-delivery-ide-and-ga-hardening/plan.md`
3. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-003-delivery-ide-and-ga-hardening/tasks/TK-109-multi-ide-surface-registry-and-wrapper-contract-hardening.md`
4. `integrations/ide/contracts/command-wrapper.contract.json`
5. `integrations/ide/examples/vscode-task.sample.json`

## 5. 实施计划

1. 提供 VS Code 官方模板（tasks/launch/debug）并补齐参数说明。
2. 提供 JetBrains 官方 run configuration 模板与环境变量注入示例。
3. 新增 IDE 入口 smoke 检查脚本，覆盖 `init -> doctor -> check` 最小链路。
4. 将 IDE smoke 门禁纳入 `pnpm run check` 或等价 gate 入口。
5. 回写台账并登记 `DA-110`。

## 6. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `pnpm run check`
4. `pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`

## 7. 执行记录

1. 2026-03-24：任务创建，状态初始化为 `planned`。

## 8. 产出

1. `DA-110` `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-003-delivery-ide-and-ga-hardening/tasks/DA-110-vscode-jetbrains-official-templates-and-smoke-gate.md`
2. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-003-delivery-ide-and-ga-hardening/tasks/checklist.md`
3. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-003-delivery-ide-and-ga-hardening/tasks/tasks.csv`
