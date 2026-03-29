# TK-313 DSL 节点/连线/条件映射与 Loop guardrail 编辑

- Status: completed
- Date: 2026-03-29
- Owner: AI-Agent
- Priority: P0
- Project: `project-027-cli-interactive-shell-implementation`
- Sprint: `sprint-003-react-cli-shell-default-cutover`

## 1. 任务目标

把 `Sequential / Parallel / Loop / Condition` 映射到可编辑的 `workflow` 表单流，并强制 Loop 节点填写 `maxCycles` 与 `maxWallTimeSeconds`。

## 2. Depends On

1. `TK-312`

## 3. 预期产物

1. `workflow` DSL 节点编辑映射
2. 连线 / 条件分支编辑能力
3. Loop guardrail 校验与编辑约束

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/plan.md`
2. `.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/sprint-003-react-cli-shell-default-cutover/plan.md`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/contracts/cli-interactive-shell-contract.md`
4. `.repo-ai-governor/draft/interactive-cli-react-style-technical-solution.md`
5. `.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/sprint-003-react-cli-shell-default-cutover/tasks/TK-312-workflow-command-family-registration-and-create-edit-entry-flow.md`

## 5. Traceback References

1. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/module-overview.md`
2. `.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/sprint-002-react-cli-shell-surface-expansion/tasks/TK-311-workflow-preview-readonly-summary-and-m2-regression-gate.md`

## 6. 实施计划

1. 把 `Sequential / Parallel / Loop / Condition` 映射到 create/edit 表单与节点编辑器。
2. 补齐连线与条件分支编辑语义，保持与现有 DSL / compiler 预期一致。
3. 对 Loop 节点强制要求 `maxCycles` 与 `maxWallTimeSeconds`，并补 guardrail 校验。

## 7. Development Verification

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. 补齐并运行 DSL 节点映射、分支编辑与 Loop guardrail 的定向测试。

## 8. Delivery Verification

1. `pnpm run check`
2. `workflow` 编辑器不得允许缺失 Loop guardrail 的定义通过，且节点 / 连线映射必须保持编译器可接受性。

## 9. 执行记录

1. 2026-03-28：任务创建，状态初始化为 `planned`。
2. 2026-03-28：依据技术方案 draft 的 M3 清单，改为收口 DSL 节点/连线/条件映射与 Loop guardrail 编辑。
3. 2026-03-29：任务切换为 `in_progress`，开始抽离独立 workflow editor runtime，补齐节点/连线/条件分支语义与 Loop guardrail 编辑守护。
4. 2026-03-29：实现完成，已落地 workflow editor runtime、condition branch 语义校验、node/edge summary 映射与 Loop guardrail 摘要/编译守护；定向验证通过 `pnpm -s tsc -p tsconfig.json --noEmit` 与 workflow/output 相关 vitest。

## 10. 产出

1. 已完成：`Sequential / Parallel / Loop / Condition` 节点摘要与 editor 映射已统一到 workflow editor runtime。
2. 已完成：连线 / 条件分支语义与 Loop guardrail 编译守护已接入 `workflow create/edit`。
3. 已完成：workflow command unit/integration 测试覆盖 condition branch 校验阻断路径与编译器兼容性证据。
