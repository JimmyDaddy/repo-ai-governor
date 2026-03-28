# TK-311 `workflow preview` 只读摘要与 M2 回归 gate

- Status: planned
- Date: 2026-03-28
- Owner: AI-Agent
- Priority: P0
- Project: `project-027-cli-interactive-shell-implementation`
- Sprint: `sprint-002-react-cli-shell-surface-expansion`

## 1. 任务目标

提供 `workflow preview` 的只读模板/流程摘要/compiled IR 预览，并把它与 M2 回归 gate 一起收口，确保共享壳层扩展不破坏 M1 contract。

## 2. Depends On

1. `TK-309`
2. `TK-310`

## 3. 预期产物

1. `workflow preview` 只读 React shell
2. 流程摘要与 compiled IR 预览
3. M2 regression suite / gate

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/plan.md`
2. `.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/sprint-002-react-cli-shell-surface-expansion/plan.md`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/contracts/cli-interactive-shell-contract.md`
4. `.repo-ai-governor/draft/interactive-cli-react-style-technical-solution.md`
5. `.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/sprint-002-react-cli-shell-surface-expansion/tasks/TK-309-connect-workspace-shared-shell-and-help-error-footer-unification.md`
6. `.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/sprint-002-react-cli-shell-surface-expansion/tasks/TK-310-init-default-react-routing-and-classic-fallback-ux-policy.md`

## 5. Traceback References

1. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/module-overview.md`
2. `.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/sprint-001-react-cli-shell-foundation/tasks/TK-307-m1-regression-testing-fallback-and-non-interactive-contract-gate.md`
3. `.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/sprint-001-react-cli-shell-foundation/review/resolved_code_review_working-tree-20260328-1829.md`

## 6. 实施计划

1. 以显式入口提供基于 `Ink` 的 `workflow preview` 只读壳层，展示模板选择、流程摘要与 compiled IR 预览。
2. 保证 `workflow preview` 不写文件，并在 contract 错误场景下保留可回退的只读摘要。
3. 将 `stderr-only`、fallback、non-interactive、`pretty/plain/json` 与 stdout 污染检查收敛为 M2 gate。

## 7. Development Verification

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. 补齐并运行 `workflow preview`、stdio spawn 校验与 M2 定向 vitest / integration 覆盖。

## 8. Delivery Verification

1. `pnpm run check`
2. `workflow preview` 必须证明“不写文件、可回退、可预览 compiled IR”，且 M2 扩展不会退回到破坏 M1 contract 的状态。

## 9. 执行记录

1. 2026-03-28：任务创建，状态初始化为 `planned`。
2. 2026-03-28：依据技术方案 draft 的 M2 清单，改为收口 `workflow preview` 与 M2 regression gate。

## 10. 产出

1. 待执行：`workflow preview` 只读摘要与 compiled IR 预览。
2. 待执行：M2 regression suite / gate 与 fallback checklist。
3. 待执行：定向验证结果与交付证据。
