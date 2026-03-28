# Code Review: project-027 sprint-001 CLI Interactive Shell Foundation Working Tree

- Status: resolved
- Date: 2026-03-28
- Reviewer: AI-Agent
- Task: `n/a`
- Review Type: working tree review
- Normative References:
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.codex/skills/workspace-code-review-workflow/SKILL.md`
  - `AGENTS.md`

## 1. Review Scope

1. `apps/cli/src/constants/cli-interactive-shell.constant.ts` [NEW]
2. `apps/cli/src/runtime/interactive-shell/init-react-shell-runner.ts` [NEW]
3. `apps/cli/src/runtime/interactive-shell/init-shell-descriptor-registry.ts` [NEW]
4. `apps/cli/src/runtime/interactive-shell/interactive-shell-stderr-renderer.ts` [NEW]
5. `apps/cli/src/runtime/interactive-shell/interactive-shell-ui-mode-resolver.ts` [NEW]
6. `apps/cli/src/types/interfaces/cli-interactive-shell.interface.ts` [NEW]
7. `apps/cli/test/runtime/init-react-shell-runner.test.ts` [NEW]
8. `apps/cli/test/runtime/interactive-shell-ui-mode-resolver.test.ts` [NEW]
9. `GEMINI.md` [NEW]
10. `apps/cli/src/cli-governance-runtime.ts` [MODIFIED]
11. `apps/cli/src/commands/init-command.ts` [MODIFIED]
12. `apps/cli/src/main.ts` [MODIFIED]
13. `apps/cli/src/constants/cli-output.constant.ts` [MODIFIED]
14. `apps/cli/src/types/index.ts` [MODIFIED]
15. `apps/cli/src/types/interfaces/index.ts` [MODIFIED]
16. `apps/cli/src/types/interfaces/cli-governance-runtime.interface.ts` [MODIFIED]
17. `apps/cli/src/types/interfaces/cli-runtime-debug.interface.ts` [MODIFIED]
18. `apps/cli/test/cli-output-contract.integration.test.ts` [MODIFIED]
19. `packages/shared/src/i18n/locales/en-us.ts` [MODIFIED]
20. `packages/shared/src/i18n/locales/zh-cn.ts` [MODIFIED]
21. `AGENTS.md` [MODIFIED]
22. `CLAUDE.md` [MODIFIED]
23. `README.md` [MODIFIED]
24. `README.zh-CN.md` [MODIFIED]
25. `apps/cli/README.md` [MODIFIED]
26. `.repo-ai-governor/context/current-context.md` [MODIFIED]
27. `.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/plan.md` [MODIFIED]
28. `.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/sprint-001-react-cli-shell-foundation/plan.md` [MODIFIED]
29. `.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/sprint-001-react-cli-shell-foundation/tasks/TK-304*.md` [MODIFIED]
30. `.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/sprint-001-react-cli-shell-foundation/tasks/TK-305*.md` [MODIFIED]
31. `.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/sprint-001-react-cli-shell-foundation/tasks/TK-306*.md` [MODIFIED]

## 2. Findings

未发现需要修复的点。

以下为建议性观察，不阻塞交付：

### 2.1 [P3] `init-react-shell-runner.ts` SIGINT handler 注册使用 `process.once` 但 finally 中使用 `process.removeListener`

- 位置: `apps/cli/src/runtime/interactive-shell/init-react-shell-runner.ts:66,177`
- 问题描述: `process.once('SIGINT', sigintHandler)` 注册的监听器在触发一次后自动移除，而 `finally` 块中 `process.removeListener('SIGINT', sigintHandler)` 在已触发场景下是空操作。这不是 bug，但在非触发场景（正常退出、BaseError 抛出等）中 `removeListener` 是正确的清理路径。语义上一致，行为正确。
- 影响: 无。纯粹的代码意图清晰度建议。
- 建议: 可考虑加一行注释说明 `once` + `removeListener` 的 cleanup 双保险设计意图。

### 2.2 [P3] `init-react-shell-runner.ts` 中 `promptAdapter.close()` 在 finally 块和 SIGINT handler 中各调用一次

- 位置: `apps/cli/src/runtime/interactive-shell/init-react-shell-runner.ts:63,178`
- 问题描述: SIGINT handler 内调用 `promptAdapter.close()` 以中断阻塞的 `question()` 调用；`finally` 块中再次调用 `close()` 确保 cleanup。`readline.Interface.close()` 是幂等的，所以不会产生错误，但双调用的意图值得注释。
- 影响: 无。
- 建议: 可添加 inline 注释说明 `close()` 在 SIGINT handler 中用于中断阻塞 `question()`，在 `finally` 中用于 cleanup 双保险。

### 2.3 [P3] `CliInteractiveShellUiModeResolver` 的 `PLAIN` output mode 降级后不区分 `PLAIN` 和 `JSON`

- 位置: `apps/cli/src/runtime/interactive-shell/interactive-shell-ui-mode-resolver.ts:44-49`
- 问题描述: 当 output mode 不是 `PRETTY` 时统一降级到 `NONE` 并记录 `OUTPUT_MODE_BLOCKED`。`PLAIN` 和 `JSON` 模式的降级原因相同，这在当前设计中是正确的，因为只有 `PRETTY` 才可安全使用 stderr 交互。
- 影响: 无。
- 建议: 如未来需要区分 `PLAIN` 与 `JSON` 的降级理由，可在 `CliInteractiveShellFallbackBehavior` 中拆分为两个值。

### 2.4 [P3] 测试覆盖率观察：`init-react-shell-runner.test.ts` 缺少 restart loop（用户拒绝确认后重填）场景

- 位置: `apps/cli/test/runtime/init-react-shell-runner.test.ts`
- 问题描述: 当前测试覆盖了 happy path（直接确认）和 validation feedback（无效输入后修正），但未测试 confirmation restart 路径（用户在 confirmation 步骤输入 `n` 后重新从 step 1 开始）。
- 影响: restart loop 是 `init-react-shell-runner.ts:138-145` 的重要分支。
- 建议: 考虑补充一个测试用例：`createPromptAdapter(['1', '1', 'n', '2', '2', 'y'])` 验证 restart 后重新收集并最终提交。

## 3. Notes

1. **架构合规性：** 4 个新模块均位于 `apps/cli/src/runtime/interactive-shell/`，单一职责边界清晰（descriptor registry、stderr renderer、UI mode resolver、shell runner），符合 CS-017（OOP 优先）和 CS-018（单文件单类）规范。
2. **常量治理：** `CliInteractiveUiMode`、`CliInteractiveShellRunState`、`CliInteractiveShellStderrRenderingMode`、`CliInteractiveShellFallbackBehavior` 均为 enum 集中管理，符合 CS-009。
3. **类型治理：** 所有 interface 位于 `src/types/interfaces/cli-interactive-shell.interface.ts`，barrel export 路径完整（`interfaces/index.ts` → `types/index.ts`），符合 CS-013。
4. **i18n 对称性：** `en-us.ts` 和 `zh-cn.ts` 均新增 `cli.options.ui` key，key 结构对称。
5. **错误模型：** 所有 throw 路径均使用 `RuntimeError` / `BaseError`，未使用原生 `Error`，符合 CS-022。
6. **测试拓扑：** 新增测试位于 `apps/cli/test/runtime/`（package-scoped unit tests），集成测试位于 `apps/cli/test/cli-output-contract.integration.test.ts`，符合 CS-024。
7. **`GEMINI.md` [NEW]：** 作为 Gemini 薄入口指向 `AGENTS.md`，内容简洁，符合 AGENTS.md 中的引用约束。
8. **`--ui` 选项已注册到 `CLI_OPTIONS_REQUIRING_VALUE` Set 中（`cli-output.constant.ts:88`），确保 option parser 不会误吞后续 token。**
9. **`cli-governance-runtime.ts` 对 `CliInteractiveUiMode` 的 import 仅用于将 resolved `uiMode` 透传到 `resolveRuntimeDebugOptions()`，未引入新的强耦合。**

## 4. Verification

1. `git status --short`（通过 — 用户手动提供）
2. 代码阅读审查（通过 — 所有 31 个变更文件已逐文件审查）
3. i18n parity 检查：`en-us.ts` 与 `zh-cn.ts` key 结构对称（通过）
4. CS-009/CS-013/CS-017/CS-018/CS-022/CS-024 合规校验（通过）

## 补充复核结论（2026-03-28）

- 整体结论：**部分认可**
- 说明：对该已收口 CR 做补充复核后，发现 1 处真实可修复问题；已在同一工作流中完成修复并重新验证，因此文件状态继续保持 `resolved`。

### 逐条复核

1. `CR-R2-01`
   - 判定：**认可**
   - 证据：`[main.ts](/Users/jimmydaddy/study/ai-governor/apps/cli/src/main.ts#L910)` 在解析 `--ui` 时使用了 `io.isStdoutTty()` 作为 stdout TTY 真值，但 `isInputTty` / `isStderrTty` 直接读取 `process.stdin.isTTY` 与 `process.stderr.isTTY`；同时 `[init-command.ts](/Users/jimmydaddy/study/ai-governor/apps/cli/src/commands/init-command.ts#L73)` 又直接依赖真实 `stdin/stderr`。这会导致 `runCli(..., io)` 的嵌入式/测试场景里，UI mode 解析和 `init` 实际进入 React shell 的判定不一致。
   - 处理：已接受并修复，统一把 `stdin/stderr` 的 TTY 真值纳入 `CliIoAdapters` 与 `runtimeDebugOptions`，再由 `init` 消费规范化后的同一组布尔值。

### 验证命令

1. `pnpm -s tsc -p tsconfig.json --noEmit`（通过）
2. `pnpm vitest run --config vitest.packages.config.ts apps/cli/test/commands/init-command.test.ts apps/cli/test/commands/workspace-command.test.ts apps/cli/test/commands/review-verify-command.test.ts apps/cli/test/runtime/interactive-shell-ui-mode-resolver.test.ts apps/cli/test/runtime/init-react-shell-runner.test.ts apps/cli/test/cli-output-contract.integration.test.ts`（通过）
3. `node ./scripts/governance/check-standardized-error-usage.js`（通过）

## 修复执行记录（2026-03-28）

1. `CR-R2-01`：已完成
   - 变更文件：`apps/cli/src/main.ts`、`apps/cli/src/cli-governance-runtime.ts`、`apps/cli/src/commands/init-command.ts`、`apps/cli/src/types/interfaces/cli-runtime-debug.interface.ts`、`apps/cli/src/types/interfaces/cli-governance-runtime.interface.ts`、`apps/cli/test/commands/init-command.test.ts`、`apps/cli/test/commands/workspace-command.test.ts`、`apps/cli/test/commands/review-verify-command.test.ts`、`apps/cli/test/cli-output-contract.integration.test.ts`
   - 验证：`pnpm -s tsc -p tsconfig.json --noEmit`（通过）；`pnpm vitest run --config vitest.packages.config.ts apps/cli/test/commands/init-command.test.ts apps/cli/test/commands/workspace-command.test.ts apps/cli/test/commands/review-verify-command.test.ts apps/cli/test/runtime/interactive-shell-ui-mode-resolver.test.ts apps/cli/test/runtime/init-react-shell-runner.test.ts apps/cli/test/cli-output-contract.integration.test.ts`（通过）；`node ./scripts/governance/check-standardized-error-usage.js`（通过）
   - 说明：新增 `inputTty/stderrTty` 真值透传与 `CliInitCommand` 命令级回归测试，确保 `--ui react` 的模式解析和 `init` 实际执行路径使用同一套 TTY 判定。

## 补充复核结论（2026-03-28，strict-bar）

- 整体结论：**认可**
- 说明：根据用户要求提高 review 标准后，原先两条“建议性观察”被提升为应立即收口的 maintainability / branch-coverage 项，并已在同一变更窗口完成。

### 逐条复核

1. `CR-R3-01`
   - 判定：**认可**
   - 证据：`[init-react-shell-runner.ts](/Users/jimmydaddy/study/ai-governor/apps/cli/src/runtime/interactive-shell/init-react-shell-runner.ts#L58)` 与 `[init-react-shell-runner.ts](/Users/jimmydaddy/study/ai-governor/apps/cli/src/runtime/interactive-shell/init-react-shell-runner.ts#L176)` 的 `once/removeListener` 与双 `close()` 组合虽然行为正确，但位于 SIGINT / teardown 敏感路径；在 stricter bar 下需要显式表达设计意图。
   - 处理：已接受并修复，补充了两处简短注释说明“SIGINT 中断阻塞 question”和“finally 兜底 teardown”的双保险设计。
2. `CR-R3-02`
   - 判定：**认可**
   - 证据：`[init-react-shell-runner.ts](/Users/jimmydaddy/study/ai-governor/apps/cli/src/runtime/interactive-shell/init-react-shell-runner.ts#L126)` 存在 confirmation reject 后 restart loop 分支，而之前测试只覆盖了 happy path 和 validation feedback，没有覆盖 `n -> restart -> resubmit`。
   - 处理：已接受并修复，新增 restart-loop 单测验证用户拒绝确认后会重新回到 step 1 并以新输入提交。

### 验证命令

1. `pnpm -s tsc -p tsconfig.json --noEmit`（通过）
2. `pnpm vitest run --config vitest.packages.config.ts apps/cli/test/commands/init-command.test.ts apps/cli/test/runtime/init-react-shell-runner.test.ts apps/cli/test/runtime/interactive-shell-ui-mode-resolver.test.ts apps/cli/test/cli-output-contract.integration.test.ts`（通过）
3. `node ./scripts/governance/check-standardized-error-usage.js`（通过）

## 修复执行记录（2026-03-28，strict-bar）

1. `CR-R3-01`：已完成
   - 变更文件：`apps/cli/src/runtime/interactive-shell/init-react-shell-runner.ts`
   - 验证：`pnpm -s tsc -p tsconfig.json --noEmit`（通过）
   - 说明：为 SIGINT cleanup 双保险路径补充意图注释，降低后续复核误判空间。
2. `CR-R3-02`：已完成
   - 变更文件：`apps/cli/test/runtime/init-react-shell-runner.test.ts`
   - 验证：`pnpm vitest run --config vitest.packages.config.ts apps/cli/test/commands/init-command.test.ts apps/cli/test/runtime/init-react-shell-runner.test.ts apps/cli/test/runtime/interactive-shell-ui-mode-resolver.test.ts apps/cli/test/cli-output-contract.integration.test.ts`（通过）
   - 说明：新增 restart-loop 覆盖，确保 reject-confirmation 分支不再依赖人工阅读推断。
