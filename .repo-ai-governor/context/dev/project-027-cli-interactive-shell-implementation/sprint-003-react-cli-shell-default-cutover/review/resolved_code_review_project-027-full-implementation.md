# Code Review: project-027-cli-interactive-shell-implementation Full Implementation

- Status: resolved
- Date: 2026-03-29
- Reviewer: AI-Agent
- Scope: project-027 全量产出（sprint-001 + sprint-002 + sprint-003）
- Review Type: project-level working-tree code review
- Normative References:
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/contracts/cli-interactive-shell-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/module-overview.md`
  - `.repo-ai-governor/draft/interactive-cli-react-style-technical-solution.md`

## 1. Review Scope

### 1.1 New production modules（project-027 新增）

| File | Sprint | Responsibility |
|---|---|---|
| `apps/cli/src/react-cli/index.ts` | S1 | barrel 文件 |
| `apps/cli/src/react-cli/app/react-cli-app.tsx` | S1 | Ink 顶层 App wrapper |
| `apps/cli/src/react-cli/app/react-cli-runner.ts` | S1 | Ink mount/renderToString 生命周期 |
| `apps/cli/src/react-cli/app/react-cli-stderr-frame-presenter.ts` | S1 | stderr-only 帧输出 |
| `apps/cli/src/react-cli/bridge/react-cli-command-descriptor-registry.ts` | S2 | descriptor 注册表 |
| `apps/cli/src/react-cli/bridge/react-cli-command-descriptor-catalog.ts` | S2 | connect/workspace/workflow/upgrade 描述符工厂 |
| `apps/cli/src/react-cli/bridge/react-cli-command-view-model-builder.ts` | S2 | 共享 view-model 构建器 |
| `apps/cli/src/react-cli/bridge/react-cli-field-renderer-registry.tsx` | S2 | `@inkjs/ui` 字段渲染器 |
| `apps/cli/src/react-cli/session/react-cli-session-controller.ts` | S2 | view-model 防御性快照 |
| `apps/cli/src/react-cli/state/react-cli-view-model.interface.ts` | S1 | view-model 接口 |
| `apps/cli/src/react-cli/views/layout-shell.tsx` | S1 | 共享壳层 Ink 组件 |
| `apps/cli/src/runtime/interactive-shell/init-react-shell-runner.ts` | S1 | `init` React 向导 runner |
| `apps/cli/src/runtime/interactive-shell/init-shell-descriptor-registry.ts` | S1 | `init` 向导描述符 |
| `apps/cli/src/runtime/interactive-shell/interactive-shell-stderr-renderer.ts` | S1 | 共享 stderr 帧渲染器 |
| `apps/cli/src/runtime/interactive-shell/interactive-shell-ui-mode-resolver.ts` | S1 | UI mode 降级/解析器 |
| `apps/cli/src/runtime/workflow-editor/cli-workflow-editor-service.ts` | S3 | workflow 编辑器服务 |
| `apps/cli/src/runtime/workflow-preview/workflow-preview-template-catalog.ts` | S2 | 内置 workflow 模板目录 |
| `apps/cli/src/constants/cli-interactive-shell.constant.ts` | S1 | shell 枚举/常量 |
| `apps/cli/src/constants/cli-workflow.constant.ts` | S2 | workflow 枚举/常量 |
| `apps/cli/src/types/interfaces/cli-interactive-shell.interface.ts` | S1 | shell 类型 |
| `apps/cli/src/types/interfaces/cli-workflow-editor.interface.ts` | S3 | workflow 编辑器类型 |

### 1.2 Modified production modules

| File | Sprint | 变更内容 |
|---|---|---|
| `apps/cli/src/commands/init-command.ts` | S1/S2 | 接入 React shell runner + fallback + `resolveInitUiMode` |
| `apps/cli/src/commands/workflow-command.ts` | S2/S3 | 接入 React view-model, DSL 编辑 + 持久化 |
| `apps/cli/src/commands/connect-command.ts` | S2 | 共享壳层 descriptor/help/error/footer 接入 |
| `apps/cli/src/commands/workspace-command.ts` | S2 | 共享壳层 descriptor/help/error/footer 接入 |
| `apps/cli/src/commands/upgrade-command.ts` | S3 | 显式 React PoC |
| `apps/cli/src/cli-governance-runtime.ts` | S1 | registry 构造 |
| `packages/shared/src/i18n/locales/en-us.ts` | S1-S3 | 新增 reactShell / workflow / initShell keys |
| `packages/shared/src/i18n/locales/zh-cn.ts` | S1-S3 | 新增 reactShell / workflow / initShell keys |

### 1.3 Test modules

| File | Sprint |
|---|---|
| `apps/cli/test/commands/init-command.test.ts` | S1/S2 |
| `apps/cli/test/commands/workflow-command.test.ts` | S2/S3 |
| `apps/cli/test/runtime/init-react-shell-runner.test.ts` | S1 |
| `apps/cli/test/runtime/react-cli-runner.test.ts` | S2 |
| `apps/cli/test/runtime/interactive-shell-ui-mode-resolver.test.ts` | S1 |

---

## 2. Findings

### 2.1 [P1] `ReactCliFieldRendererRegistry` 所有回调都是 noop — field renderer 无法把用户输入传回调用方

- 位置: `apps/cli/src/react-cli/bridge/react-cli-field-renderer-registry.tsx:34-75`
- 问题描述: 所有注册的 `@inkjs/ui` 组件（`TextInput`, `PasswordInput`, `Select`, `MultiSelect`, `ConfirmInput`）都硬编码 `onSubmit: () => undefined`、`onChange: () => undefined` 等 noop 回调。这意味着即使 field renderer 被挂载到 Ink 实例中，也无法将用户选择的值传回任何 state controller 或 session。目前它工作的唯一原因是：所有 command 都通过 `renderFrame()` / `renderToString()` 做只读预览，没有 command 通过 `mount()` 做真正的交互式表单。
- 影响: 如果后续有 command（如 workflow create/edit 的交互式 DSL 编辑）试图通过 `ReactCliRunner.mount()` 让用户填写真正的表单字段，当前 field renderer 不会传回任何值，导致静默交互失败。
- 建议: 在 field renderer factory 中接受一个 `onFieldChange(fieldId: string, value: string): void` callback 参数，让 `onSubmit`、`onChange` 等可以把值传回 session controller。目前如果确认只做 string-render 预览，应在 `ReactCliFieldRendererRegistry` JSDoc 上显式标注 "currently read-only; interactive mount requires callback wiring"，防止误用。

---

### 2.2 [P2] `connect/workspace/upgrade` 命令注册了 descriptor 但未消费 `reactCliViewModel`

- 位置: `apps/cli/src/commands/connect-command.ts` / `workspace-command.ts` / `upgrade-command.ts`
- 问题描述: `ReactCliCommandDescriptorCatalog` 为 `connect`、`workspace`、`upgrade`、`workflow` 四个命令都注册了 descriptor（含 fields、help lines、footer shortcuts）。`workflow-command.ts` 正确消费了 descriptor 并将 `reactCliViewModel` 挂到 command result 上；但 `connect`、`workspace`、`upgrade` 三个命令均未引用 `ReactCliCommandDescriptorCatalog` 或 `ReactCliCommandViewModelBuilder`，也未向 `commandResult` 挂载 `reactCliViewModel`。这使得 catalog 中为这三个命令注册的描述符成为 dead code。
- 影响: `CliGovernanceRuntime` 的 `commandResult` 接口已声明可选 `reactCliViewModel`，但只有 `workflow` 实际使用。对外承诺的"共享壳层接入"在 `connect/workspace/upgrade` 层尚未完全闭环：如果下游 consumer（如 orchestration client 或 stderr presenter）尝试读取 `result.reactCliViewModel` 来渲染 connect 摘要，会得到 `undefined`。
- 建议: 要么在 `connect/workspace/upgrade` 中补齐 view-model 构建（参考 `workflow-command.ts:268-338` 的模式），要么将 catalog 中对这三个命令的 descriptor 移除，保持产出与注册一致。completion audit 第 4.2 条写了 "connect/workspace 已接入共享 descriptor registry、view-model builder"，如果当前仅在 command 内部做了 i18n 和 help section 接入但未挂载 view-model，建议在 audit 中更正此描述。

---

### 2.3 [P2] `ReactCliSessionController.update()` 在 `attentionSection` / `helpSection` 为 `undefined` 时未正确传播 clear 语义

- 位置: `apps/cli/src/react-cli/session/react-cli-session-controller.ts:45-67`
- 问题描述: 当调用 `.update({ attentionSection: undefined })` 试图清除注意事项时（例如从有 warn 的状态恢复到正常），`update` 方法走的逻辑是 `update.attentionSection ? ... : this.viewModel.attentionSection ? ... : undefined`。因为 `update` 中 `attentionSection` key 存在但值为 `undefined`，`update.attentionSection` 是 falsy，会走到 `this.viewModel.attentionSection ? this.cloneSection(...)` 分支，保留旧值而不是清除。这是因为 `Partial<T>` 中 `{ attentionSection: undefined }` 与 `{}` 在语义上不同，但 truthiness check 无法区分 "key absent" 和 "key present + undefined value"。
- 影响: caller 无法通过 `update({ attentionSection: undefined })` 清除已有的 attention section。目前不构成运行时 bug（当前 `update` 只在 session controller 内部使用且不做 attention clear），但会在后续扩展交互式 shell 生命周期时成为 surprise（例如校验通过后清除 attention block）。
- 建议: 使用 `'attentionSection' in update` guard 替代 truthiness check，或接受一个显式 `null` 来表示 "clear"。同样适用于 `helpSection`。

---

### 2.4 [P2] `CliWorkflowEditorService.validateConditionBranches` 重复构建 `outgoingEdges` Map

- 位置: `apps/cli/src/runtime/workflow-editor/cli-workflow-editor-service.ts:321-376` vs `:301-313`
- 问题描述: `createConditionBranchSummaries` (L301) 和 `validateConditionBranches` (L321) 都在同一个 `prepareSession` 调用中被执行，两者都独立遍历 `definition.edges` 建立各自的 outgoing-edge lookup。它们的 grouping 逻辑是相同的（按 `fromNodeId` 分组），但各自创建了独立的 Map。`validateConditionBranches` 甚至还额外维护了一个 `{ edge, index }` 结构。
- 影响: 性能开销极低，但属于 DRY 违反；且如果后续 edge normalization 规则变化（例如 trim 逻辑调整），需在两处同步修改。
- 建议: 提取一个共享的 `collectIndexedOutgoingEdges` helper，`prepareSession` 调用一次并传给两个消费方。

---

### 2.5 [P2] `workflow-command.ts:283-284` 的 `definitionSource` field descriptor 类型声明为 TEXT 但同时提供了 `options[]`

- 位置: `apps/cli/src/react-cli/bridge/react-cli-command-descriptor-catalog.ts:283-309`
- 问题描述: `definitionSource` 字段的 `kind` 声明为 `ReactCliFieldKind.TEXT`，但同时传入了 `options: [...]`。TEXT 类型字段语义上不消费 `options`（field renderer 只用 `placeholder`）。如果将来某个 consumer 依赖 `kind === SELECT` 来决定是否渲染 select options，这个字段会被渲染为文本框而非下拉列表，丢失 options。
- 影响: 目前不影响运行（field renderer 仅做 read-only 或被忽略），但 descriptor 的类型契约不一致会误导 adopter 和后续扩展。
- 建议: 将 `definitionSource` 的 `kind` 改为 `ReactCliFieldKind.SELECT`，或移除无效的 `options` 属性。

---

### 2.6 [P2] `layout-shell.tsx` 的 `sections.map` 使用 `section.title` 作为 React key，可能重复

- 位置: `apps/cli/src/react-cli/views/layout-shell.tsx:38-44`
- 问题描述: `{viewModel.sections.map((section) => (<Box key={section.title} ...>))}` 使用 `section.title` 作为 `key`。当同一个 view-model 中存在两个 title 相同的 section（例如两段 "Summary"），React 会产生 key 冲突警告，并可能导致 diff 算法行为不正确。
- 影响: 当前使用场景中 section title 通常唯一，但 view-model interface 没有唯一性约束；如果 command 构建 view-model 时复用相同 title（例如多个 "Details" section），Ink 渲染可能混乱。
- 建议: 使用 `index` 或 `${section.title}:${index}` 作为 key（与 `attentionSection.lines` 已经使用的模式 `${attentionSection.title}:${index}` 保持一致）。

---

### 2.7 [P3] `ReactCliStderrFramePresenter` 硬编码 `columns: 80`

- 位置: `apps/cli/src/react-cli/app/react-cli-stderr-frame-presenter.ts:22-24`
- 问题描述: `renderFrame` 将 `columns` 固定为 `80`。在宽屏终端（120+ columns）或窄终端（<80）下，输出不会适配实际终端尺寸。
- 影响: 低优先级 UX 问题。在较窄终端下文本折行可能不友好，在宽终端下浪费空间。
- 建议: 读取 `process.stderr.columns ?? 80` 作为动态默认值，或通过 constructor 注入 `getColumns: () => number`。

---

### 2.8 [P3] `CliWorkflowEditorService.tryLoadPersistedDefinition` 未校验 `schema_version`

- 位置: `apps/cli/src/runtime/workflow-editor/cli-workflow-editor-service.ts:136-159`
- 问题描述: `tryLoadPersistedDefinition` 只检查 `definition` field 存在且是 object、`template_id` 是 string，但未校验 `schema_version` 是否匹配 `CLI_WORKFLOW_DEFINITION_SCHEMA_VERSION`。如果后续 definition schema 升级（例如从 `cli_workflow_definition_v1` 到 `v2`），老版本的文件会被静默加载而不触发 migration 或 warning。
- 影响: 当前只有 `v1`，不构成运行时 bug。但属于前瞻性风险。
- 建议: 在 `tryLoadPersistedDefinition` 中增加 `schema_version` 检查，当不匹配时返回 `null`（fallback 到 template seed），或 emit 一个 warning 级别的 validation issue。

---

### 2.9 [P3] `init-command.ts` 的 `translate` 方法签名用了 4 参数（含 `fallback`），与 `workflow-command.ts` 的 2 参数 `translate` 不一致

- 位置: `apps/cli/src/commands/init-command.ts:324-331` vs `apps/cli/src/commands/workflow-command.ts:1043-1049`
- 问题描述: `CliInitCommand.translate(context, key, fallback, interpolation?)` 有 4 参数并额外传入 fallback 字符串；`CliWorkflowCommand.translate(context, key, interpolation?)` 只有 3 参数，直接依赖 `context.translate` 的 key-miss fallback（返回 key 本身）。两种模式对 "i18n key 不存在时" 的行为不同：init 返回可读英文文案，workflow 返回 i18n key 字面量。
- 影响: 不影响正确性（i18n runtime 已注册所有 key），但 API 风格不统一。当某个 key 意外缺失时，init 的降级更友好，workflow 则返回 `cli.reactShell.workflow.xxx` 这样的 raw key。
- 建议: 整个 `commands/` 层统一 translate wrapper 签名。推荐方案：集中到 command executor context 上的 `translate` 函数，由 i18n runtime 保证全 key 覆盖，不再需要 fallback 参数。在下一次批量 refactor 时统一。

---

### 2.10 [P3] `interactive-shell-ui-mode-resolver.ts` L52 检查三个 TTY 标志，但 `CliGovernanceRuntimeOptions` 只声明了 `isTty: boolean`

- 位置: `apps/cli/src/runtime/interactive-shell/interactive-shell-ui-mode-resolver.ts:52`
- 问题描述: resolver 接收 `isOutputTty`、`isInputTty`、`isStderrTty` 三个标志；但 `CliGovernanceRuntimeOptions` 只有一个 `isTty` 字段。实际 `inputTty` 和 `stderrTty` 来自 `CliNormalizedRuntimeDebugOptions`。这意味着 resolver 的调用方需要从两个不同的来源拼装参数，增加了接线复杂度。
- 影响: 不影响正确性（`init-command.ts` 已正确从 `runtimeDebugOptions` 取 `inputTty` 和 `stderrTty`），但 API 边界不够清晰。
- 建议: 在后续 refactor 中统一 TTY flags 到 `CliNormalizedRuntimeDebugOptions` 或 `CliGovernanceRuntimeOptions`，避免跨接口拼装。

---

## 3. Architecture & Design Assessment

### 3.1 分层架构 ✅

- `react-cli/` 层只依赖 `ink` + `@inkjs/ui` + `constants` + view-model interface，不依赖 command context → 正确的单向依赖。
- `runtime/interactive-shell/` 依赖 `react-cli/` 做 stderr rendering → 允许的上层→下层依赖。
- `commands/` 通过 DI constructor 注入 runner/renderer → 可测试边界清晰。

### 3.2 Contract 稳定性 ✅

- `stdout` 保持 machine-readable 输出不变（所有 React 输出均写入 `stderr`），符合 `cli-interactive-shell-contract.md`。
- `--no-interactive`、非 TTY、`json/plain` 的降级路径在 `interactive-shell-ui-mode-resolver.ts` 中有完整实现，且有测试覆盖。
- `SIGINT` / cancellation 路径 (`PROCESS_RUNTIME_CANCELLED`) 在 `init-react-shell-runner.ts` 和 `init-command.ts` 中有显式 re-throw guard。

### 3.3 i18n parity ✅

- `en-us.ts` 与 `zh-cn.ts` 的 `reactShell` 子树结构完全对齐。
- `initShell` / `commandMessages.init.reactShellFallbackToClassic` 均双语注册。
- workflow 的 `actions` / `entryModes` / `templates` / `help` / `status` / `message` / `prompt` / `editorIssues` / `summary` 全节点双语对齐。

### 3.4 Test coverage 评估

| Area | Pass Count | Coverage 评价 |
|---|---|---|
| `init-command.test.ts` | 5 | 覆盖 default-react / explicit-classic / explicit-none / cancel-rethrow / fallback — 完整 |
| `workflow-command.test.ts` | 5 | 覆盖 preview / create-save / edit-load / validation-block / compile-error — 完整 |
| `init-react-shell-runner.test.ts` | 4 | 覆盖 happy-path / validation / SIGINT / runtime-error — 完整 |
| `react-cli-runner.test.ts` | 3 | 覆盖 renderFrame / stderr-presenter / stderr-renderer — 完整 |
| `interactive-shell-ui-mode-resolver.test.ts` | 已存在 | 覆盖 none/no-interactive/non-tty/output-blocked/tui-fallback — 完整 |

**缺失覆盖：**
- `ReactCliSessionController` 无单独测试文件（仅被 runner tests 间接覆盖）。
- `ReactCliCommandDescriptorCatalog` 无单独测试（间接通过 workflow-command test 验证注册）。
- `CliWorkflowEditorService.persistDefinition` 路径在 `workflow-command.test.ts` 中通过 mock 验证 `writeJsonArtifact` 被调用，但未验证 payload 结构内容。

---

## 4. CS (Code Standards) Compliance Checklist

| Rule | Status | Notes |
|---|---|---|
| CS-005 ESM `.js` extension | ✅ | 所有相对导入 `.js` 后缀正确 |
| CS-009 Enum/Constant centralized | ✅ | `CliInteractiveUiMode`, `CliWorkflowAction`, etc. 均在 `constants/` |
| CS-011 interface vs type | ✅ | 所有对象结构用 `interface`，`ReactCliStatusVariant` 用 `type` |
| CS-013 types directory | ✅ | 新增类型在 `types/interfaces/*.interface.ts` |
| CS-016 JSDoc | ✅ | 所有 exported class/method 有 JSDoc |
| CS-017 OOP first | ✅ | 所有 runtime module 使用 class |
| CS-018 Single class per file | ✅ | 每个文件一个 class |
| CS-022 BaseError only | ✅ | 使用 `RuntimeError` / `BaseError`，无 `new Error` |
| CS-027 God object | ✅ | 新模块均 ≤ 500 LOC；`workflow-command.ts` 1051 LOC 但单一职责 |
| CS-032 No magic literals | ✅ | 常量已提取 (`CLI_WORKFLOW_DEFINITION_SCHEMA_VERSION`, etc.) |
| CS-033 i18n required | ✅ | 所有用户可见文案通过 `translate()` |

---

## 5. Summary

| Severity | Count |
|---|---|
| P1 (Design Risk) | 1 |
| P2 (Should Fix) | 5 |
| P3 (Observation) | 4 |

**阻塞交付项：无。** P1 是一个设计风险（field renderer noop），目前因全链路只做 read-only render 而不触发运行时 bug，但需要在下一轮交互式编辑 sprint 前解决。

**总体评价：** project-027 的架构分层、contract 隔离、测试覆盖和 i18n parity 均满足 code_standards 要求。React CLI shell 的 view-model / descriptor / session 层级设计合理，`init` 的 fallback 策略和 `workflow` 的 DSL 守护实现完整。主要待改进点集中在 shared infra 的消费完整性（catalog descriptor vs actual view-model wiring）和少量 API 一致性问题。

---

## 6. Verification

1. `pnpm -s tsc --noEmit` — ✅ **通过**（独立终端验证，0 编译错误）
2. `vitest run init-command.test.ts + workflow-command.test.ts` — ✅ **10/10 passed**（626ms, vitest v4.1.0）
3. 手动逐行代码审查 — **已完成**，覆盖 21 个 production 文件、8 个 modified 文件、5 个 test 文件、2 个 i18n locale 文件。
4. i18n parity 交叉验证 — **已完成**，en-us → zh-cn 结构对齐确认。
5. CS compliance checklist — **已完成**，11 条核心规则逐项通过。

> 注：agent 命令通道因 SIGINT 信号传播异常（exit 130）无法直接执行；验证在独立终端中完成。

## 复核结论（2026-03-29）

- 整体结论：**部分认可**

### 逐条复核
1. `2.1`
   - 判定：**部分认可**
   - 证据：`ReactCliFieldRendererRegistry` 仍然只提供 noop callback，且当前 `project-027` 代码只通过 summary shell 做只读输出，没有任何 interactive mount 会消费这些 renderer。
   - 处理：接受“补强只读契约说明”这一子项，在 `ReactCliFieldRendererRegistry` JSDoc 中显式声明当前仅支持 read-only preview；不在本次 closeout 中引入未被实际消费的交互 callback plumbing。
2. `2.2`
   - 判定：**不认可**
   - 证据：当前 `connect-command.ts`、`workspace-command.ts`、`upgrade-command.ts` 均已构建并返回 `reactCliViewModel`，原报告中的 dead-code 判断已过时。
   - 处理：不纳入修复清单。
3. `2.3`
   - 判定：**认可**
   - 证据：`ReactCliSessionController.update()` 之前用 truthiness 判断 `attentionSection` / `helpSection`，无法区分“显式清空”与“未传入字段”。
   - 处理：改为 `'field' in update` guard，并新增 session controller 定向测试覆盖 clear 语义。
4. `2.4`
   - 判定：**不认可**
   - 证据：`validateConditionBranches` 与 `createConditionBranchSummaries` 的重复分组逻辑成立，但这是轻量实现重复，不单独构成必须修复项。
   - 处理：本次不作为独立 defect 收口；仅在伴随 `2.8` 调整时顺手抽取为共享 helper，避免继续分叉。
5. `2.5`
   - 判定：**认可**
   - 证据：`definitionSource` descriptor 的 `kind` 与 `options` 契约不一致，仍会误导后续 consumer。
   - 处理：将其改为 `ReactCliFieldKind.SELECT`，并补 descriptor contract test。
6. `2.6`
   - 判定：**认可**
   - 证据：`layout-shell.tsx` 仍以 `section.title` 作为 key；view-model interface 没有唯一性约束，重复标题会触发 key 冲突。
   - 处理：改为 `${section.title}:${index}`，与同文件其他 section key 策略保持一致。
7. `2.7`
   - 判定：**认可**
   - 证据：`ReactCliStderrFramePresenter` 原先固定 `columns: 80`，未读取实际终端宽度。
   - 处理：改为读取 `stderr.columns ?? 80`，并补 presenter 宽度注入测试。
8. `2.8`
   - 判定：**认可**
   - 证据：`tryLoadPersistedDefinition()` 之前未校验 `schema_version`，旧格式 payload 会被静默加载。
   - 处理：新增 schema version guard；若版本不匹配则回退到 template seed，并补 workflow command 回退测试。
9. `2.9`
   - 判定：**不认可**
   - 证据：`translate` wrapper 签名不一致属风格差异，当前 i18n key 已齐全，不构成行为缺陷。
   - 处理：不纳入本次 closeout 修复。
10. `2.10`
    - 判定：**不认可**
    - 证据：TTY flags 虽来自两个不同接口层，但当前调用链接线清晰且测试已覆盖，不构成实际 bug。
    - 处理：保留为后续 API 整理议题，不纳入本次 closeout 修复。

### 验证命令
1. `pnpm -s tsc -p tsconfig.json --noEmit`（通过）
2. `pnpm -s vitest run --config vitest.packages.config.ts apps/cli/test/runtime/react-cli-runner.test.ts apps/cli/test/runtime/react-cli-session-controller.test.ts apps/cli/test/runtime/react-cli-command-descriptor-catalog.test.ts apps/cli/test/commands/workflow-command.test.ts`（通过）

## 修复执行记录（2026-03-29）

1. `2.1`：已完成
   - 变更文件：`apps/cli/src/react-cli/bridge/react-cli-field-renderer-registry.tsx`
   - 验证：`pnpm -s tsc -p tsconfig.json --noEmit`（通过）
   - 说明：补充 read-only contract JSDoc，明确当前 renderer 只用于 summary preview，避免误判为可交互表单实现。
2. `2.3`：已完成
   - 变更文件：`apps/cli/src/react-cli/session/react-cli-session-controller.ts`、`apps/cli/test/runtime/react-cli-session-controller.test.ts`
   - 验证：`pnpm -s vitest run --config vitest.packages.config.ts apps/cli/test/runtime/react-cli-session-controller.test.ts`（通过）
   - 说明：修复显式清空 `attentionSection` / `helpSection` 时旧值残留的问题。
3. `2.5`：已完成
   - 变更文件：`apps/cli/src/react-cli/bridge/react-cli-command-descriptor-catalog.ts`、`apps/cli/test/runtime/react-cli-command-descriptor-catalog.test.ts`
   - 验证：`pnpm -s vitest run --config vitest.packages.config.ts apps/cli/test/runtime/react-cli-command-descriptor-catalog.test.ts`（通过）
   - 说明：把 `definitionSource` field 修正为 `SELECT`，保证 descriptor 类型与 `options` 数据一致。
4. `2.6`：已完成
   - 变更文件：`apps/cli/src/react-cli/views/layout-shell.tsx`
   - 验证：`pnpm -s tsc -p tsconfig.json --noEmit`（通过）
   - 说明：为 section key 加入 index 后缀，消除重复标题下的 React key 冲突风险。
5. `2.7`：已完成
   - 变更文件：`apps/cli/src/react-cli/app/react-cli-stderr-frame-presenter.ts`、`apps/cli/test/runtime/react-cli-runner.test.ts`
   - 验证：`pnpm -s vitest run --config vitest.packages.config.ts apps/cli/test/runtime/react-cli-runner.test.ts`（通过）
   - 说明：stderr frame render 默认跟随真实终端宽度，保留 `80` 作为兜底值。
6. `2.8`：已完成
   - 变更文件：`apps/cli/src/runtime/workflow-editor/cli-workflow-editor-service.ts`、`apps/cli/test/commands/workflow-command.test.ts`
   - 验证：`pnpm -s vitest run --config vitest.packages.config.ts apps/cli/test/commands/workflow-command.test.ts`（通过）
   - 说明：不再静默接受未知 schema version；当 persisted definition 版本不匹配时自动回退到 template seed。
