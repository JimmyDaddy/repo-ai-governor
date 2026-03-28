# TK-310 `init` 默认 React 路由与 classic fallback 体验策略

- Status: completed
- Date: 2026-03-28
- Owner: AI-Agent
- Priority: P0
- Project: `project-027-cli-interactive-shell-implementation`
- Sprint: `sprint-002-react-cli-shell-surface-expansion`

## 1. 任务目标

让 `init` 在 `TTY + pretty + interactive` 下默认走 React，同时定义显式关闭入口、fallback reason 与用户可见错误提示策略。

## 2. Depends On

1. `TK-308`
2. `TK-309`

## 3. 预期产物

1. `init` 默认路由判定策略
2. classic fallback / error copy 约束
3. `init` 默认启用与回退测试

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/plan.md`
2. `.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/sprint-002-react-cli-shell-surface-expansion/plan.md`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/contracts/cli-interactive-shell-contract.md`
4. `.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/sprint-002-react-cli-shell-surface-expansion/tasks/TK-308-shared-descriptor-registry-field-renderers-and-step-engine-baseline.md`
5. `.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/sprint-002-react-cli-shell-surface-expansion/tasks/TK-309-connect-workspace-shared-shell-and-help-error-footer-unification.md`

## 5. Traceback References

1. `.repo-ai-governor/draft/interactive-cli-react-style-technical-solution.md`
2. `.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/sprint-001-react-cli-shell-foundation/tasks/TK-306-init-react-shell-minimal-wizard-and-descriptor-state-baseline.md`
3. `.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/sprint-001-react-cli-shell-foundation/tasks/TK-307-m1-regression-testing-fallback-and-non-interactive-contract-gate.md`

## 6. 实施计划

1. 定义 `init` 的默认 React 路由矩阵，明确 `TTY + pretty + interactive`、`--no-interactive`、`plain/json` 与显式关闭入口的优先级。
2. 补齐 classic fallback 的 reason、错误提示文案与诊断路径，保证用户能理解何时退回 classic。
3. 对默认路由与回退行为补齐回归测试，确保 `init` 默认体验可测试、可回退。

## 7. Development Verification

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. 补齐并运行 `init` 默认路由、fallback UX 与错误提示的定向 vitest / integration 覆盖。

## 8. Delivery Verification

1. `pnpm run check`
2. `init` 默认路由不得破坏 `--no-interactive`、非 TTY、`plain/json` 与 classic fallback contract。

## 9. 执行记录

1. 2026-03-28：任务创建，状态初始化为 `planned`。
2. 2026-03-28：依据技术方案 draft 的 M2 清单，改为收口 `init` 默认 React 路由与 classic fallback 体验策略。
3. 2026-03-28：任务切换为 `in_progress`，开始实现默认 React 路由、classic fallback 体验与对应测试。
4. 2026-03-28：实现完成并通过 `pnpm -s tsc -p tsconfig.json --noEmit`、定向 vitest 与 `pnpm run check` 验证。

## 10. 产出

1. 待执行：`init` 默认路由判定与显式关闭入口。
2. 待执行：classic fallback / error copy 约束。
3. 待执行：对应测试与 M2 gate evidence。
