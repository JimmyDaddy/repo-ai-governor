# Code Review

- Status: resolved
- Date: 2026-03-24
- Reviewer: AI-Agent
- Tasks: `TK-110`, `TK-111`, `TK-135`

## Scope

- Working tree follow-up for `TK-110`, `TK-111`, and `TK-135`
- Focus: IDE official templates, smoke/parity gates, standards source ID runtime wiring

## Findings

### 1. [P1] Official IDE env baseline is still a no-op in the real CLI

- File: `apps/cli/src/main.ts:240-287`
- `runCli()` parses argv, locale, profile, and runtime debug flags, then constructs `CliGovernanceRuntime`.
- It never reads `REPO_AI_GOVERNOR_ENTRY_SURFACE`, `REPO_AI_GOVERNOR_STANDARDS_PROFILE_ID`, or `REPO_AI_GOVERNOR_STANDARDS_SOURCES` from `process.env`.
- That leaves the new official VS Code / JetBrains / Cursor / Claude Code templates with surface and standards-injection env that look normative in docs/contracts, but have no effect on actual command execution.
- I also reproduced this directly with:
  - `HOME=/tmp REPO_AI_GOVERNOR_ENTRY_SURFACE=not_a_surface REPO_AI_GOVERNOR_STANDARDS_PROFILE_ID=broken-profile REPO_AI_GOVERNOR_STANDARDS_SOURCES=totally_invalid node ./dist/bin/repo-ai-governor.js --output json --locale en-US doctor`
  - The command still exited `0` and returned a normal `doctor` success payload.

### 2. [P2] IDE integration smoke test never injects template env into `runCli()`

- File: `test/ide-entry-smoke.integration.test.ts:213-231`
- The test parses each official template into `{ argv, env }` and asserts only that the parsed `REPO_AI_GOVERNOR_ENTRY_SURFACE` string matches the expected surface.
- It then calls `runCli(definition?.argv ?? [], io)` without applying `definition.env` to `process.env` or any runtime adapter.
- So this integration suite only covers argv-level command execution; it does not exercise the new surface/standards env baseline at all.
- Because of that, the suite stays green even while Finding 1 is present.

## Validation

- `pnpm -s vitest run apps/cli/test/ide-command-wrapper.unit.test.ts apps/cli/test/ide-command-wrapper.contract.test.ts test/ide-entry-smoke.integration.test.ts --maxWorkers=1 --maxConcurrency=1`
- `HOME=/tmp node ./scripts/examples/check-ide-entry-smoke.js`
- `HOME=/tmp node ./scripts/examples/check-ide-docs-parity.js`
- `HOME=/tmp REPO_AI_GOVERNOR_ENTRY_SURFACE=not_a_surface REPO_AI_GOVERNOR_STANDARDS_PROFILE_ID=broken-profile REPO_AI_GOVERNOR_STANDARDS_SOURCES=totally_invalid node ./dist/bin/repo-ai-governor.js --output json --locale en-US doctor`

## Conclusion

- Result: changes are **not ready** to treat the new IDE env baseline as effective runtime behavior.

## 复核结论（2026-03-24）

- 整体结论：**认可**

### 逐条复核

1. `1. [P1] Official IDE env baseline is still a no-op in the real CLI`
   - 判定：**认可**
   - 证据：`runCli()` 原先只解析 argv 和 runtime debug flags，没有消费 `REPO_AI_GOVERNOR_ENTRY_SURFACE`、`REPO_AI_GOVERNOR_STANDARDS_PROFILE_ID`、`REPO_AI_GOVERNOR_STANDARDS_SOURCES`，因此官方模板注入的 env 对真实 CLI 执行路径没有约束或可观测结果。
   - 处理：在 `apps/cli/src/main.ts` 增加 IDE wrapper env fail-fast 解析与校验，接入 `IdeSurfaceRegistryRuntime` 和 `IdeStandardsSourceRuntime`；合法 env 会回写到 CLI `diagnostics`，非法 surface/source IDs 会直接以 `ENTRYPOINT_COMMAND_WRAPPER_INVALID` 失败。

2. `2. [P2] IDE integration smoke test never injects template env into runCli()`
   - 判定：**认可**
   - 证据：`test/ide-entry-smoke.integration.test.ts` 原先只解析模板 env 并断言字符串，但 `runCli()` 调用没有真正带上这些 env，因此 smoke suite 并未覆盖官方模板最关键的 runtime overlay。
   - 处理：为 test IO adapter 增加 `env()` 注入面，并让 IDE smoke integration 在 `runCli()` 执行前显式注入模板 env，同时断言成功输出中的 `diagnostics.entrySurface / standardsProfileId / standardsSourceIds`。

### 验证命令

1. `pnpm -s tsc -p tsconfig.json --noEmit`（通过）
2. `pnpm -s vitest run apps/cli/test/cli-output-contract.integration.test.ts test/ide-entry-smoke.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）

## 修复执行记录（2026-03-24）

1. `1. [P1] Official IDE env baseline is still a no-op in the real CLI`：已完成
   - 变更文件：`apps/cli/src/main.ts`、`apps/cli/src/types/interfaces/cli-output.interface.ts`、`apps/cli/test/cli-output-contract.integration.test.ts`
   - 验证：`pnpm -s tsc -p tsconfig.json --noEmit`、`pnpm -s vitest run apps/cli/test/cli-output-contract.integration.test.ts --maxWorkers=1 --maxConcurrency=1`
   - 说明：真实 CLI 入口现在会校验官方 IDE env，并将合法的 `entrySurface / standardsProfileId / standardsSourceIds` 暴露到稳定 JSON diagnostics。

2. `2. [P2] IDE integration smoke test never injects template env into runCli()`：已完成
   - 变更文件：`test/ide-entry-smoke.integration.test.ts`
   - 验证：`pnpm -s vitest run test/ide-entry-smoke.integration.test.ts --maxWorkers=1 --maxConcurrency=1`
   - 说明：四类官方模板现在都通过同一条 `env + argv` 组合链路执行 `runCli()`，不再只做静态模板解析。
