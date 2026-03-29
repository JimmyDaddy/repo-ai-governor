# Code Review: project-027 Working Tree Full Scope Review

- Status: resolved
- Date: 2026-03-29
- Reviewer: AI-Agent
- Task: `project-027 / sprint-002 + sprint-003 full closeout`
- Review Type: working tree review
- Normative References:
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.codex/skills/workspace-code-review-workflow/SKILL.md`

## 1. Review Scope

### New source files (12)
1. `apps/cli/src/commands/workflow-command.ts`
2. `apps/cli/src/constants/cli-workflow.constant.ts`
3. `apps/cli/src/runtime/interactive-shell/init-react-shell-ink-prompt-adapter.tsx`
4. `apps/cli/src/runtime/interactive-shell/init-react-shell-live-prompt.tsx`
5. `apps/cli/src/runtime/workflow-editor/cli-workflow-editor-service.ts`
6. `apps/cli/src/runtime/workflow-preview/workflow-preview-template-catalog.ts`
7. `apps/cli/src/types/interfaces/cli-workflow-command.interface.ts`
8. `apps/cli/src/types/interfaces/cli-workflow-editor.interface.ts`
9. `apps/cli/test/commands/workflow-command.test.ts`
10. `apps/cli/test/runtime/react-cli-command-descriptor-catalog.test.ts`
11. `apps/cli/test/runtime/react-cli-session-controller.test.ts`
12. `scripts/acceptance/run-project-027-real-project-validation.sh`

### Modified source files (31, critical subset reviewed)
1. `apps/cli/src/main.ts`
2. `apps/cli/src/cli-governance-runtime.ts`
3. `apps/cli/src/commands/init-command.ts`
4. `apps/cli/src/react-cli/session/react-cli-session-controller.ts`
5. `apps/cli/src/react-cli/bridge/react-cli-command-descriptor-catalog.ts`
6. `apps/cli/src/react-cli/bridge/react-cli-field-renderer-registry.tsx`
7. `apps/cli/src/react-cli/views/layout-shell.tsx`
8. `apps/cli/src/runtime/interactive-shell/init-react-shell-runner.ts`
9. `apps/cli/src/runtime/interactive-shell/init-shell-descriptor-registry.ts`
10. `apps/cli/src/constants/cli-command.constant.ts`
11. `apps/cli/src/constants/cli-governance-runtime.constant.ts`
12. `apps/cli/src/constants/cli-interactive-shell.constant.ts`
13. `apps/cli/src/constants/cli-output.constant.ts`
14. `apps/cli/src/constants/cli-workspace.constant.ts`
15. `apps/cli/src/constants/cli-command-result-check.constant.ts`
16. `apps/cli/src/types/interfaces/cli-governance-runtime.interface.ts`
17. `apps/cli/src/types/interfaces/cli-interactive-shell.interface.ts`
18. `packages/shared/src/i18n/locales/en-us.ts`
19. `packages/shared/src/i18n/locales/zh-cn.ts`
20. `apps/cli/test/commands/init-command.test.ts`
21. `apps/cli/test/runtime/init-react-shell-runner.test.ts`
22. `apps/cli/test/runtime/interactive-shell-ui-mode-resolver.test.ts`
23. `apps/cli/test/runtime/react-cli-runner.test.ts`
24. `apps/cli/test/commands/cli-command-registry.test.ts`
25. `apps/cli/test/commands/workspace-command.test.ts`
26. `apps/cli/test/cli-output-contract.integration.test.ts`
27. `apps/cli/test/cli-skeleton.integration.test.ts`

### Modified governance / docs files (20+)
- Sprint plan/task/checklist/csv files for sprint-002 and sprint-003
- `AGENTS.md`, `README.md`, `README.zh-CN.md`
- `completed-streams-history.md`, `current-context.md`
- Technical solution delivery/lifecycle registries
- Project-027 completion audit summary
- Resolved CR files

## 2. Findings

未发现需要修复的点。

以下为详细审查结论：

### 2.1 correctness and regression risk

**结论：无 actionable issue**

- `CliWorkflowCommand` (1051 LOC) 实现完整：`preview/create/edit` 三种 action 均有独立路径，`preview` 正确阻止持久化，`create/edit` 仅在 `validationIssueTotals.errorCount === 0 && compiledIr.compileErrors.length === 0` 时才持久化和写 IR snapshot。
- `CliWorkflowEditorService.prepareSession()` 在 `edit` action 且无 `requestedTemplateId` 时尝试加载已持久化定义，回退逻辑和 schema_version 校验正确。
- `CliWorkflowPreviewTemplateCatalog` 三个模板定义正确：`parallel-review` 无 loop/condition 节点（不触发 guardrail 验证），`loop-guarded` 包含 loop 限制声明（`maxCycles=3, maxWallTimeSeconds=900`）和 condition 节点并配备 conditionKey edges，`condition-route` 包含 condition 节点和完整 conditionKey 路由。
- `validateConditionBranches()` 正确检测三种语义问题：无 outgoing edges、缺少 conditionKey、重复 conditionKey，均报 ERROR 级别。
- `init-command.ts` 的 React shell fallback 逻辑正确：SIGINT / `PROCESS_RUNTIME_CANCELLED` 直接 rethrow，其它异常降级到 classic 模式并 stderr 告知用户。
- `init-react-shell-runner.ts` SIGINT 处理正确：`process.on('SIGINT', sigintHandler)` 配对 `process.off('SIGINT', sigintHandler)` 在 finally 中；SIGINT handler 中调用 `promptAdapter.close()` 中断阻塞的 Ink prompt，finally 中再次 close 作为 teardown（注释已说明 double-close intent）。
- `init-react-shell-ink-prompt-adapter.tsx` 的 `mountPrompt()` 使用 `settled` flag 防止 double-resolve/reject；`close()` 正确处理 `activePrompt === null` guard。
- `main.ts` 中 `workflow` 命令注册使用单独的 commander subcommand tree（`workflowCommand.command(CliWorkflowAction.CREATE/EDIT/PREVIEW)`），且 `CLI_COMMAND_DEFINITIONS` 的 generic loop 通过 `continue` 跳过 `WORKFLOW`，避免重复注册。
- `cli-governance-runtime.ts` 中 `CliWorkflowCommand` 已加入 `commandRegistry`，无需额外 bootstrap。

### 2.2 security, auth, and permission boundaries

**结论：无 actionable issue**

- Workflow 定义持久化使用 `artifactWriter` 写入 workspace-scoped 路径，不存在路径穿越风险。
- `tryLoadPersistedDefinition()` 使用 `safeReadJson`（已有 workspace 沙箱保护）并校验 `schema_version` 后才解析 payload。
- `init-react-shell-ink-prompt-adapter.tsx` 的 `renderOptions` 中 `exitOnCtrlC: false` 防止 Ink 直接退出进程。

### 2.3 contract and documentation drift

**结论：无 actionable issue**

- i18n 双语覆盖完整：en-us.ts 和 zh-cn.ts 均包含 `cli.commands.workflow.*`、`cli.commandMessages.workflow.*`、`cli.reactShell.workflow.*` 完整命名空间，包括 `title/fields/actions/templates/entryModes/definitionSources/status/progress/message/summary/prompt/help/editorIssues`。
- `cli-command.constant.ts` 的 `CLI_COMMAND_DEFINITIONS` 和 `CLI_COMMAND_NAMES` 已包含 `WORKFLOW`。
- `react-cli-command-descriptor-catalog.ts` 已注册 `workflow` descriptor，包含完整的 action/templateId/entryMode/definitionSource 字段元数据。
- Type interfaces（`cli-workflow-command.interface.ts`、`cli-workflow-editor.interface.ts`）使用 `interface` 定义对象结构契约，符合 CS-011/CS-012 规范。
- `README.md` 和 `README.zh-CN.md` 已同步更新（包含 `workflow` 命令文档）。
- `AGENTS.md` 更新与 current-context 保持一致。

### 2.4 data consistency, rollback, and failure recovery

**结论：无 actionable issue**

- `CliWorkflowEditorService.persistDefinition()` 是原子写入（通过 `artifactWriter.writeJsonArtifact`），不存在部分写入风险。
- `tryLoadPersistedDefinition()` 对无效/缺失持久化文件返回 `null` 并 fallback 到 template seed，不会中断流程。
- `ProcessCompiler.persistCompiledIrSnapshot()` 的错误由调用方的 try/catch 链兜底。

### 2.5 missing or weak tests

**结论：无 actionable issue**

- `workflow-command.test.ts` 覆盖 5 个关键场景：read-only preview、create with persist、edit from saved definition、schema version fallback、condition branch semantic blocking。
- `react-cli-command-descriptor-catalog.test.ts` 和 `react-cli-session-controller.test.ts` 为新增测试。
- `init-command.test.ts`、`init-react-shell-runner.test.ts`、`interactive-shell-ui-mode-resolver.test.ts`、`react-cli-runner.test.ts` 已更新以匹配新的 shell 适配器和 fallback 路径。

### 2.6 lifecycle and cleanup semantics

**结论：无 actionable issue**

- `init-react-shell-runner.ts` 的 finally 块正确执行：`process.off('SIGINT', sigintHandler)` → `promptAdapter.close()` → `renderer.renderUnmount(session)`。
- `init-react-shell-ink-prompt-adapter.tsx` 的 double-close 场景（SIGINT + finally）通过 `this.activePrompt = null` guard 和 `settled` flag 安全处理。
- `ReactCliSessionController.update()` 通过深拷贝 sections/attention/help 避免外部 mutation 泄漏到 session state。

### 2.7 code standards compliance

**结论：无 actionable issue**

- 新增文件使用 kebab-case 命名（CS-014）。
- 所有 import specifier 使用 `.js` 显式扩展名（CS-005）。
- 有限集值（CliWorkflowAction/CliWorkflowEntryMode/CliWorkflowDefinitionSource/CliWorkflowTemplateId/CliWorkflowCompileStatus 等）均使用 enum 集中管理于 `cli-workflow.constant.ts`（CS-009）。
- `interface` 用于对象结构，`type` 用于别名/联合（CS-011/CS-012）。
- 所有新增 exported 类/方法均有完整 JSDoc（CS-016）。
- 使用 `RuntimeError` / `GovernorErrorCode` 标准化错误（CS-022）。
- Domain module 采用 OOP 设计：`CliWorkflowCommand`、`CliWorkflowEditorService`、`CliWorkflowPreviewTemplateCatalog`、`CliInitReactShellRunner`、`CliInitReactShellInkPromptAdapter`、`ReactCliSessionController`（CS-017）。
- 用户面向文案通过 `context.translate(key, interpolation)` 走 i18n 路径（CS-033）。

## 3. Notes

1. `CliWorkflowCommand.calculateValidationIssueTotals()` 在 `execute()` 中被调用 2 次（line 107-109 和 line 111），又在 `resolveCompileStatus`/`resolveCompileProgressStatus`/`createChecks`/`resolveStatusMessage` 中各被调用 1 次。虽然 `validationIssues` 数组通常很短（仅 condition node 语义问题），但可以考虑在 `execute()` 入口一次性计算并传递结果。影响可忽略，列为 note。
2. `layout-shell.tsx:41-42` 中 inner `.map()` 的 `key` 使用 `section.title:${index}`，当外层 section 也有相同 title 时 React key 可能不唯一。由于 section titles 实际上由 i18n 分别产生（input/summary/attention 均不同），实际运行中不会碰撞，列为 note。
3. `workflow-command.ts` 总计 1051 LOC，虽未触及 CS-027 的 1200 LOC threshold，但已接近上限。如果后续迭代需扩展 workflow DSL editor 的交互能力，建议将 summary line builder 和 issue line builder 抽取为独立 helper。
4. `init-react-shell-ink-prompt-adapter.tsx` 的 `close()` 中 reject 使用固定英文 message `'interactive shell prompt closed'`，不影响用户可见输出（被上层 catch 转换为 i18n `cancelledBySigint`），列为 note。

## 4. Verification

1. `git status --short`（通过 — scope 确认无误）
2. 代码结构完整性审查（通过）
3. i18n en-us / zh-cn key parity 抽样检查（通过）
4. CS-005/CS-009/CS-011/CS-012/CS-016/CS-017/CS-022/CS-033 规范遵从性检查（通过）
5. SIGINT/cancel/fallback 生命周期路径审查（通过）
6. 测试覆盖面审查（通过 — 5 个 workflow-command 场景 + 新增单元测试文件）
