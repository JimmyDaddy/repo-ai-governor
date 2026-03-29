# TK-314 workflow 保存、compiled IR 验收与 `upgrade` 显式 React PoC

- Status: completed
- Date: 2026-03-29
- Owner: AI-Agent
- Priority: P0
- Project: `project-027-cli-interactive-shell-implementation`
- Sprint: `sprint-003-react-cli-shell-default-cutover`

## 1. 任务目标

让 `workflow edit` 的结果可保存到 workspace 配置并通过编译器验收，同时给 `upgrade` 提供显式启用的 React shell PoC。

## 2. Depends On

1. `TK-312`
2. `TK-313`

## 3. 预期产物

1. workflow 保存路径与 workspace 持久化配置
2. compiled IR 接受性测试与预览证据
3. `upgrade` 显式 React shell PoC

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/plan.md`
2. `.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/sprint-003-react-cli-shell-default-cutover/plan.md`
3. `.repo-ai-governor/draft/interactive-cli-react-style-technical-solution.md`
4. `.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/sprint-003-react-cli-shell-default-cutover/tasks/TK-312-workflow-command-family-registration-and-create-edit-entry-flow.md`
5. `.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/sprint-003-react-cli-shell-default-cutover/tasks/TK-313-dsl-node-edge-condition-mapping-and-loop-guardrail-editing.md`

## 5. Traceback References

1. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/module-overview.md`
2. `.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/sprint-002-react-cli-shell-surface-expansion/tasks/TK-311-workflow-preview-readonly-summary-and-m2-regression-gate.md`

## 6. 实施计划

1. 实现 workflow 保存与 workspace 内持久化配置写回，确保编辑结果可落盘。
2. 补流程保存后的编译器接受性测试，验证 compiled IR 可生成且能回到 preview 摘要。
3. 给 `upgrade` 加上显式 React shell PoC，验证确认层、失败提示与回滚参考保持 opt-in。

## 7. Development Verification

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. 补齐并运行 workflow 保存 / 编译 / `upgrade` PoC 的定向 vitest / integration 覆盖。

## 8. Delivery Verification

1. `pnpm run check`
2. 保存后的 workflow 定义必须通过编译器接受性验证，且 `upgrade` React shell 仍保持显式启用与可诊断回退。

## 9. 执行记录

1. 2026-03-28：任务创建，状态初始化为 `planned`。
2. 2026-03-28：依据技术方案 draft 的 M3 清单，改为收口 workflow 保存/compiled IR 验收与 `upgrade` 显式 React PoC。
3. 2026-03-29：实现完成，`workflow create/edit` 已把活动 workflow definition 保存到 workspace，并同步写入 compiled IR snapshot；`upgrade --ui react` 已接入共享 React shell PoC。

## 10. 产出

1. 已完成：workflow 保存路径与 workspace 持久化配置，落在 `context/workflow/active-workflow.definition.json`。
2. 已完成：compiled IR 接受性测试与预览证据，successful create/edit 会写入 `context/compiled-ir/<execution_id>.json`。
3. 已完成：`upgrade` 显式 React shell PoC 与 stdout/stderr contract 验证。
