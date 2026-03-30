# Code Review: CLI Session-First Agent Shell — Full Project-029

- Status: resolved
- Date: 2026-03-30
- Reviewer: AI-Agent
- Task: `project-029 / sprint-001 – sprint-004 session-first shell implementation`
- Review Type: working tree full project review
- Normative References:
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`

## 1. Review Scope

### New source files (17)

| # | File | LOC | Purpose |
|---|------|-----|---------|
| 1 | `apps/cli/src/constants/cli-session-shell.constant.ts` | 67 | Enums: shell mode, input mode, handoff state, transcript role, exit reason, prompt constant |
| 2 | `apps/cli/src/types/interfaces/cli-session-shell.interface.ts` | 163 | Full session-shell DTO surface: view model, prompt adapter, command executor, service client, run options/result |
| 3 | `apps/cli/src/runtime/interactive-shell/session-shell-runner.ts` | 1152 | Core runner: readline loop, slash dispatch, command handoff, passthrough, theme/agent/resume/multiline/search/history |
| 4 | `apps/cli/src/runtime/interactive-shell/session-slash-command-registry.ts` | 206 | 18-command registry with prefix filtering, highlight segments, bridge argv, and alias resolution |
| 5 | `apps/cli/src/runtime/interactive-shell/session-shell-transcript-store.ts` | 245 | Presenter-side event→transcript mapper with cursor-aware incremental sync |
| 6 | `apps/cli/src/runtime/interactive-shell/session-shell-service-client.ts` | 105 | Thin CLI-facing session client delegating to `CliOrchestrationServiceRuntime` |
| 7 | `apps/cli/src/runtime/interactive-shell/session-shell-readline-prompt-adapter.ts` | 112 | Readline-backed prompt with SIGINT→`PROCESS_RUNTIME_CANCELLED` and multiline terminator |
| 8 | `apps/cli/src/runtime/interactive-shell/session-shell-stderr-renderer.ts` | 30 | Stderr-only frame renderer via `ReactCliRunner.renderSessionShellFrame()` |
| 9 | `apps/cli/src/react-cli/views/session-shell-app.tsx` | 72 | Session-shell Ink app: ThemeProvider + 4 sub-views (transcript, composer, palette, prompt bar) |
| 10 | `apps/cli/src/react-cli/views/transcript-pane.tsx` | 56 | Role-based color-mapped transcript renderer |
| 11 | `apps/cli/src/react-cli/views/composer-input.tsx` | 34 | Current input value / placeholder with input-mode indicator |
| 12 | `apps/cli/src/react-cli/views/prompt-bar.tsx` | 30 | Persistent runtime-status bar (session id, mode, shortcuts) |
| 13 | `apps/cli/src/react-cli/views/slash-command-palette.tsx` | 59 | Prefix-highlight slash-command suggestions with empty-state fallback |
| 14 | `packages/core-orchestration-service/src/local-orchestration-service-session-runtime.ts` | 652 | Service-backed session lifecycle: start, turn, append, subscribe, resume, list, cursor encoding |
| 15 | `apps/cli/test/runtime/session-shell-runner.test.ts` | 504 | 4 integration-level tests: full lifecycle, multiline + passthrough + search, EOF, SIGINT |
| 16 | `apps/cli/test/runtime/session-slash-command-registry.test.ts` | 72 | Prefix filter, exact resolve, alias normalization, bridge argv tests |
| 17 | `project-029 governance files` | — | plan, task cards TK-401→416, DA-401, checklists, tasks.csv, completion audit |

### Modified source files (critical subset: 30+)

- **CLI main.ts**: no-subcommand session entry routing, `resume` command, `CliSessionShellRunner`/`CliSessionShellServiceClient` wiring, `executeSessionShellCommand()` nested `runCli`, `summarizeSessionShellCommandResult()`, `shouldEnterDefaultSessionShell()`, `resolveSessionStartupQuery()`, `isInteractiveSessionShellAllowed()`
- **CLI constants**: `cli-command.constant.ts` (`RESUME` enum), `cli-governance-runtime.constant.ts`
- **ReactCliRunner**: new `renderSessionShellFrame()` for session-shell Ink rendering
- **React CLI barrel** (`index.ts`): exported session-shell views
- **Types barrel** (`types/interfaces/index.ts`): 12 new session-shell type re-exports
- **Orchestration service client**: `OrchestrationSessionEventType`/`OrchestrationSessionTranscriptRole`/`OrchestrationSessionRouteId` enums; full session request/response DTOs; `OrchestrationServiceClient` interface with 7 session methods
- **Core orchestration service**: `LocalOrchestrationServiceShell`, `LocalOrchestrationServiceSidecarClient`, `LocalOrchestrationServiceSidecarHost`, `LocalOrchestrationServiceSidecarLoader` — all extended with session dispatch table
- **i18n**: `en-us.ts`, `zh-cn.ts` (~140 lines each: full `cli.sessionShell.*` namespace)
- **Integration tests**: `cli-output-contract.integration.test.ts`, `react-cli-runner.test.ts`
- **Docs**: `README.md`, `README.zh-CN.md`, `local-adoption-playbook.md`, `local-adoption-playbook.zh-CN.md`

## 2. Findings

未发现需要修复的 actionable issue。

以下为逐维度详细审查结论：

### 2.1 Session-shell runner lifecycle correctness

**结论：无 actionable issue**

- **Entry routing**: `shouldEnterDefaultSessionShell()` (L1900-1918) 正确检查 `--help` / `-h` → false → `isInteractiveSessionShellAllowed` → false → `sessionStartupQuery` 为 positional text → true → 无显式命令 → true。保证只在 React-mode interactive TTY 下进入 session shell。
- **SIGINT handling**: `CliSessionShellReadlinePromptAdapter` 在 readline SIGINT 事件上抛出 `RuntimeError(PROCESS_RUNTIME_CANCELLED)` → runner 的 while-loop catchBlock 正确捕获并返回 `CliSessionShellExitReason.SIGINT`，不会导致 unhandled rejection。
- **EOF handling**: `readLine` 在 `close` 事件返回 `null` → runner 返回 `CliSessionShellExitReason.EOF`。
- **Prompt adapter cleanup**: `finally { promptAdapter.close() }` 确保 readline interface 在任何退出路径上被关闭。
- **Empty input**: trimmed empty line 正确 `continue`（L121-125），不会触发任何 service call。

### 2.2 Slash command registry correctness

**结论：无 actionable issue**

- 18 个 slash commands 定义（11 builtin + 7 bridge），全部有 `summaryKey` 映射到 i18n。
- `resolveCommandToken()` 先 normalize 再查 alias map（当前仅 `/routing` → `/agent`）。
- `resolveBridgeArgv()` 对 `/review verify` 特判映射到 `CliCommandName.REVIEW_VERIFY`（正确），其他 bridge 使用 `command.slice(1)` 映射。
- `suggest()` 使用 `commandBody.startsWith(normalizedPrefix)` 前缀匹配，highlight segments 正确拆分 slash / matched prefix / remaining。
- 测试覆盖：prefix filter、exact resolve、alias、bridge argv、review-verify handoff。

### 2.3 Transcript store correctness

**结论：无 actionable issue**

- `applyEvents()` 使用 `event.sequence <= this.latestSequence` 去重，保证幂等。
- `clearView()` 只清空 `this.transcriptItems` 而保留 `nextCursor` 和 `latestSequence`，确保 cursor 不会回退导致重复 hydration。
- `listItems()` 返回 deep-cloned items，防止外部 mutation。
- `mapEventToTranscriptItem()` 正确处理 6 种 event types：`SESSION_STARTED`, `SESSION_MESSAGE_APPENDED`, `SESSION_RESUMED`, `TURN_SUBMITTED`, `TURN_STREAM_DELTA`（skipped, 正确）, `TURN_COMPLETED`。

### 2.4 Command handoff lifecycle

**结论：无 actionable issue**

- **Preview**: bridge command → `runtimeState.pendingCommand` 赋值 → `shellMode = COMMAND_HANDOFF_PREVIEW` → `handoffState = PREVIEWING` → transcript 记录 preview hint 并提示 `/confirm` / `/cancel`。
- **Confirm**: `executePendingCommand()` 检查 `!runtimeState.pendingCommand` → 无 pending 直接报错 → 检查 `!options.commandExecutor` → 无 bridge 报错 → 执行 → `catch` 生成 error result → transcript 记录结果和 artifacts → `pendingCommand = null` → `resetPromptState()`。
- **Cancel**: `runtimeState.pendingCommand = null` + transcript cancel message。
- **Cancel without pending**: 友好提示 `cancelWithoutPendingCommand`。
- **Confirm without pending**: 友好提示 `confirmWithoutPendingCommand`。

### 2.5 Shell passthrough (`!command`)

**结论：无 actionable issue**

- `!` prefix 检测在 `/` 之前（L129 vs L141），优先级正确。
- 空 `!` 后跟空字符串：`commandLine.length === 0` → 提示 `passthroughRequiresCommand` → 不执行。
- `executePassthroughCommand()` 使用 `spawn(commandLine, { shell: true, stdio: ['ignore', 'pipe', 'pipe'] })`：stdin 忽略、stdout/stderr pipe 采集。
- stdout/stderr buffer 使用 `.join('').split(/\r?\n/u).filter(line => line.length > 0)` 正确处理跨 chunk 换行。
- Error/close handlers 正确覆盖：spawn error → reject with `PROCESS_RUNTIME_SPAWN_FAILED`，close → resolve with exit code。

### 2.6 Nested `executeSessionShellCommand` safety

**结论：无 actionable issue**

- `main.ts:395-431` 递归调用 `runCli()` 但构造了隔离的 io adapters：`stdout` / `stderr` 写入独立 buffer，`cwd` 从外层 io 获取，`isStdoutTty` / `isStdinTty` / `isStderrTty` 均 false（非交互），`--no-interactive` + `--output json` 强制 JSON 模式。
- `summarizeSessionShellCommandResult()` 优先 parse JSON stdout，fallback 到 stderr 文本，确保 nested command 的所有输出路径都有 transcript 条目。
- 递归 `runCli` 不会再次进入 session shell（因为 `--no-interactive` 导致 `isInteractiveSessionShellAllowed() = false`）。

### 2.7 Service-backed session runtime (`LocalOrchestrationServiceSessionRuntime`)

**结论：无 actionable issue**

- **Session lifecycle**: `startSession()` 正确区分已有 session（不重复 SESSION_STARTED event）和新建 session。
- **Turn pipeline**: `sendSessionTurn()` 生成三个 events（TURN_SUBMITTED, TURN_STREAM_DELTA, TURN_COMPLETED）然后 updateContext，保证 turn count 单调递增。
- **Append validation**: `appendSessionMessage()` 对空行 array 抛出 `MEMORY_SESSION_PAYLOAD_INVALID`，防止空 transcript 条目。
- **Route guard**: `assertSupportedRouteId()` 当前只允许 `session.main`，其他 route 抛错（与 frontend `/agent` 命令的 unsupported hint 一致）。
- **Role guard**: `assertSupportedTranscriptRole()` 验证 4 个合法 role 枚举值。
- **Cursor encoding**: Base64url-encoded JSON `{ sessionId, sequence, version }` — 版本化设计为未来 opaque cursor 迁移预留。
- **Resume**: 优先使用 explicit sessionId → fallback 到 `resolveLatestSession()` → 按 openedAt 降序取第一个。没找到则抛 `MEMORY_SESSION_NOT_FOUND`。
- **Filter**: `matchesSessionFilter()` 支持 status / executionId / processId / routeId 组合过滤。
- **Memory provider**: lazy initialization with `catch → reset promise → rethrow` anti-cache-poisoning pattern（与 orchestration shell 一致）。

### 2.8 Orchestration service contract completeness

**结论：无 actionable issue**

- `OrchestrationServiceClient` interface 新增 7 个 session methods（startSession, sendSessionTurn, appendSessionMessage, getSession, listSessions, subscribeSession, resumeSession）。
- `CliOrchestrationServiceOwner` 正确 extends `OrchestrationServiceClient` 并额外声明 session methods。
- `CliOrchestrationServiceRuntime` 新增 7 个 passthrough session methods（startSession, sendSessionTurn, appendSessionMessage, getSession, listSessions, subscribeSession, resumeSession）全部 delegate 到 `resolveServiceOwner()`。
- `LocalOrchestrationServiceSidecarDispatchTable` 同步了所有 7 个 session methods。
- Sidecar host/client/loader 在 sidecar interface 中完整声明了 session dispatch operations。

### 2.9 React CLI session-shell views

**结论：无 actionable issue**

- `ReactCliSessionShellApp` 正确使用 `ThemeProvider` + `defaultTheme` fallback，与 `ReactCliApp` pattern 一致。
- 所有 5 个 sub-views（transcript, composer, palette, prompt-bar, session metadata header）都通过 `shellPalette` prop 消费 theme tokens。
- `ReactCliTranscriptPane` 使用 `resolveTranscriptColor()` 按 role 映射到不同 palette tokens（system → attention, user → footer, slash → promptTitle, assistant → title）。
- `ReactCliSlashCommandPalette` 对空 suggestions 显示 `emptyState`（commandPreview fallback 到 slashPaletteEmptyState）。
- React keys 全部唯一：transcript 用 `item.id`，lines 用 `${item.id}:${index}`，suggestions 用 `suggestion.command`。
- `ReactCliRunner.renderSessionShellFrame()` 使用 `renderToString()` 生成 string frame。

### 2.10 i18n parity

**结论：无 actionable issue**

en-us.ts 和 zh-cn.ts 完整对齐以下 namespace：
- `cli.sessionShell.title` / `subtitle` / `fallbackToHelp` / `resumeRequiresInteractive`
- `cli.sessionShell.sections.*` (4 keys)
- `cli.sessionShell.composer.*` (1 key)
- `cli.sessionShell.palette.*` (1 key)
- `cli.sessionShell.resumeSelector.*` (1 key)
- `cli.sessionShell.transcript.*` (4 keys)
- `cli.sessionShell.promptBar.*` (5 keys)
- `cli.sessionShell.commands.*.summary` (11 builtin keys)
- `cli.sessionShell.responses.*` (37 keys)
- `cli.sessionShell.multilinePrompt`
- `cli.commands.resume.*` (2 keys)

### 2.11 Code standards compliance

**结论：无 actionable issue**

| CS Rule | Check | Result |
|---------|-------|--------|
| CS-005 | All import specifiers use `.js` extension | ✅ |
| CS-009 | Enums for finite sets | ✅ (6 session enums) |
| CS-011 | Interfaces for DTO shapes | ✅ (13 interfaces) |
| CS-014 | Files use kebab-case | ✅ |
| CS-016 | Exported members have JSDoc | ✅ |
| CS-017 | Domain modules use class OOP | ✅ (Runner, Registry, Store, ServiceClient, PromptAdapter, Renderer, SessionRuntime) |
| CS-022 | Errors use RuntimeError + GovernorErrorCode | ✅ |
| CS-027 | LOC threshold (1200) | ⚠️ `session-shell-runner.ts` = 1152 (within threshold) |
| CS-033 | User-facing text via i18n | ✅ |

### 2.12 Test coverage

**结论：无 actionable issue**

- `session-shell-runner.test.ts` (504 LOC, 4 tests): Full-path test with service stub, command executor mock, renderer recording. Covers:
  - Full lifecycle: plain text turn → partial slash match → bridge handoff preview → /confirm → /exit
  - Multiline capture + /history + /search + shell passthrough
  - Clean EOF (Ctrl+D)
  - Clean SIGINT (Ctrl+C)
- `session-slash-command-registry.test.ts` (72 LOC, 3 tests): Prefix filter, exact resolve, alias + review-verify bridge argv.
- `FakeSessionShellServiceClient` implements the full session contract with in-memory event store and cursor accounting — test fidelity is high.
- `integration tests` updated: `cli-output-contract.integration.test.ts` + `react-cli-runner.test.ts` adapted for new session runner dependency.

## 3. Notes

1. **session-shell-runner.ts = 1152 LOC**，已接近但未超过 CS-027 阈值。如果后续增加更多 slash commands 或 agent route handling，应计划拆分为独立的 `session-shell-slash-command-dispatcher.ts`。
2. **CLI_REACT_THEME_VALUES.includes() 类型 assertion**（L649, session-shell-runner.ts）使用 `as (typeof CLI_REACT_THEME_VALUES)[number]` 做 downcast — 这是在 runtime validation 之后的安全 narrowing，不影响正确性。
3. **Session cursor opaque contract**：`LocalOrchestrationServiceSessionRuntime` 使用 Base64url-encoded JSON cursor 而不是 plain text cursor number，这是有意设计决策——确保 cursor 在未来可变更底层 sequence scheme 而不破坏 CLI 端。test fixture 的 `FakeSessionShellServiceClient` 使用简单的 `cursor:sessionId:sequence` 格式，这不是 production 格式，但 test 只验证 runner 行为而不验证 cursor 编码，所以不影响覆盖完备性。
4. **递归 `runCli` 开销**：`executeSessionShellCommand()` 每次 handoff 都会重新走一遍 CLI bootstrap（config load, i18n init, memory provider load），这在单次 handoff 场景下不构成问题，但如果未来 session 内需要高频 handoff，应考虑 command executor 直接引用已初始化的 governance runtime 而非 re-bootstrap。
5. **`main.ts` 整体 LOC 已达 2157**，超过 CS-027 阈值。建议将 session-shell wiring (`createSessionShellRunOptions`, `executeSessionShellCommand`, `summarizeSessionShellCommandResult`, `shouldEnterDefaultSessionShell`, `resolveSessionStartupQuery`, `isInteractiveSessionShellAllowed`) 拆分到 `cli-session-shell-entrypoint.ts`。这是当前最大的 LOC 超标点。

## 4. Verification

1. Import path completeness（`.js` extensions, barrel re-exports）（通过）
2. Session-shell runner lifecycle 4-path review: /exit, EOF, SIGINT, non-interactive error（通过）
3. Slash command dispatch completeness: 11 builtin + 7 bridge（通过）
4. Command handoff state machine: IDLE → PREVIEWING → RUNNING → SUCCESS/FAILURE, with CANCEL path（通过）
5. Transcript store idempotent cursor tracking（通过）
6. Orchestration service contract surface 7 new session methods on 4 layers: client interface → sidecar dispatch → CLI runtime → service client（通过）
7. `LocalOrchestrationServiceSessionRuntime` turn/append/subscribe/resume correctness（通过）
8. React component key uniqueness（通过）
9. i18n en-us / zh-cn full namespace parity（通过）
10. CS-005/009/011/014/016/017/022/033 compliance（通过）
11. CS-027 LOC threshold: session-shell-runner.ts ≤ 1200 ✅, main.ts = 2157 > 1200 ⚠️（记录为 note）
12. Test coverage: 4 integration tests + 3 unit tests（通过）

## 5. 复核结论（2026-03-30）

- 整体结论：**认可**
- 说明：按 stricter recheck bar 复查后，原 `## 3. Notes` 第 5 条不应只作为 note 保留；它命中了 `CS-027` 对超大 legacy 文件新增职责的明确约束，应升级为 actionable architecture finding，并在同一修复窗口内完成代码拆分。

### 逐条复核

1. 新增 Finding 2026-03-30-01 `[P1] Session-shell wiring should not land in legacy main.ts`
   - 判定：**认可**
   - 证据：`apps/cli/src/main.ts` 在本次复核前已达到 `2157` LOC，且 session-shell entry routing、nested command handoff summary、run-options assembly 等新增职责继续落在 legacy main entrypoint 内；仓库规范 `CS-027` 要求超过 `1200` LOC 的 legacy 文件不得继续吸收新的无关职责，除非补充 `// god-object-exception: TK-xxx reason` 与 task-linked decomposition 计划。原实现两者均不存在。
   - 处理：已将 session-shell entrypoint routing 与 nested command wiring 提取到 `apps/cli/src/runtime/interactive-shell/session-shell-entrypoint-runtime.ts`，`main.ts` 改为只保留 Commander 注册和薄调用；提取后 `main.ts` 降至 `1950` LOC，且本次 project-029 新增的 session-shell 入口职责不再继续扩张 legacy main file。

### 验证命令

1. `pnpm run build`（通过）
2. `pnpm exec vitest run apps/cli/test/runtime/session-shell-entrypoint-runtime.test.ts apps/cli/test/cli-output-contract.integration.test.ts apps/cli/test/runtime/session-shell-runner.test.ts`（通过）

## 6. 修复执行记录（2026-03-30）

1. `Finding 2026-03-30-01`：已完成
   - 变更文件：`apps/cli/src/main.ts`
   - 验证：`pnpm run build`（通过）
   - 说明：移除 session-shell startup query/default-entry/bridge summary/run-options helper 的内联实现，改为委托独立 runtime。
2. `Finding 2026-03-30-01`：已完成
   - 变更文件：`apps/cli/src/runtime/interactive-shell/session-shell-entrypoint-runtime.ts`
   - 验证：`pnpm exec vitest run apps/cli/test/runtime/session-shell-entrypoint-runtime.test.ts apps/cli/test/cli-output-contract.integration.test.ts apps/cli/test/runtime/session-shell-runner.test.ts`（通过）
   - 说明：新增聚焦 entrypoint responsibilities 的 runtime，承接 interactive eligibility、startup query 解析、default shell routing 与 nested CLI handoff summary。
3. `Finding 2026-03-30-01`：已完成
   - 变更文件：`apps/cli/test/runtime/session-shell-entrypoint-runtime.test.ts`
   - 验证：`pnpm exec vitest run apps/cli/test/runtime/session-shell-entrypoint-runtime.test.ts apps/cli/test/cli-output-contract.integration.test.ts apps/cli/test/runtime/session-shell-runner.test.ts`（通过）
   - 说明：补充 entrypoint runtime 单测，固定 free-form startup query、default shell gating 与 nested handoff summary/fallback 语义，避免拆分后回归。
