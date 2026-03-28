# TK-309 `connect/workspace` 共享壳层接入与 help/error/footer 统一

- Status: completed
- Date: 2026-03-28
- Owner: AI-Agent
- Priority: P0
- Project: `project-027-cli-interactive-shell-implementation`
- Sprint: `sprint-002-react-cli-shell-surface-expansion`

## 1. 任务目标

把 `connect` 与 `workspace` 接到共享 descriptor/shell 基线上，并统一帮助区、错误摘要和 footer shortcuts。

## 2. Depends On

1. `TK-308`

## 3. 预期产物

1. `connect` descriptor 与 bridge 接入
2. `workspace` descriptor 与 bridge 接入
3. 统一 help/error/footer 组件

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/plan.md`
2. `.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/sprint-002-react-cli-shell-surface-expansion/plan.md`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/contracts/cli-interactive-shell-contract.md`
4. `.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/sprint-002-react-cli-shell-surface-expansion/tasks/TK-308-shared-descriptor-registry-field-renderers-and-step-engine-baseline.md`
5. `.repo-ai-governor/draft/interactive-cli-react-style-technical-solution.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/sprint-001-react-cli-shell-foundation/tasks/TK-306-init-react-shell-minimal-wizard-and-descriptor-state-baseline.md`
2. `.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/sprint-001-react-cli-shell-foundation/tasks/TK-307-m1-regression-testing-fallback-and-non-interactive-contract-gate.md`
3. `.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/sprint-001-react-cli-shell-foundation/review/resolved_code_review_working-tree-20260328-1829.md`

## 6. 实施计划

1. 把 `connect/workspace` 的字段、默认值、桥接与步骤流迁移到基于 `Ink` 的共享 descriptor/shell 基线。
2. 抽出统一帮助区、错误摘要与 footer shortcuts；表单控件优先复用 `@inkjs/ui`，避免命令级重复实现。
3. 保持 `classic/none` fallback、machine output 与帮助面语义稳定。

## 7. Development Verification

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. 补齐并运行 `connect/workspace` 共享壳层、帮助区与错误摘要的定向 vitest / integration 覆盖。

## 8. Delivery Verification

1. `pnpm run check`
2. `connect/workspace` 必须共享同一套 shell / descriptor / help-error-footer 逻辑，不得绕开 machine output 与 fallback 语义。

## 9. 执行记录

1. 2026-03-28：任务创建，状态初始化为 `planned`。
2. 2026-03-28：依据技术方案 draft 的 M2 清单，改为收口 `connect/workspace` 共享壳层接入与统一帮助面。
3. 2026-03-28：完成 `connect/workspace` 共享 descriptor/shell 接入，统一 help/error/footer 与 i18n runtime 接线。
4. 2026-03-28：将 `CLI_PROGRAM_NAME`、`CliWorkspaceAction` 与 `ReactCliFieldKind` 常量/枚举化，减少命名与文案分散定义。
5. 2026-03-28：通过 `pnpm -s tsc -p tsconfig.json --noEmit` 与定向 vitest 验证。

## 10. 产出

1. `apps/cli/src/commands/connect-command.ts`
2. `apps/cli/src/commands/workspace-command.ts`
3. `apps/cli/src/react-cli/bridge/react-cli-command-descriptor-catalog.ts`
4. `packages/shared/src/i18n/locales/en-us.ts`
5. `packages/shared/src/i18n/locales/zh-cn.ts`
6. `apps/cli/test/commands/connect-command.test.ts`
7. `apps/cli/test/commands/workspace-command.test.ts`
