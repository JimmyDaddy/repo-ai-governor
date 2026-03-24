# DA-111 Cursor/Claude Code 接入模板与文档一致性

- Status: active
- Date: 2026-03-24
- Owner: AI-Agent
- Artifact ID: `DA-111`
- Produced By: `TK-111`
- Scope: `project-010-local-model-and-ide-expansion`

## 1. 目的

为 Cursor 与 Claude Code 提供可直接复用的官方接入模板，并把 contracts、examples、README 与分发校验收敛进同一条 parity/smoke gate，避免多 IDE surface 演进时出现文档与模板漂移。

## 2. 关键实现

1. 官方模板已扩展到 `integrations/ide/examples/`：
   - `cursor-task.sample.json`
   - `claude-code-commands.sample.json`
2. Cursor 模板保持与 VS Code task 同构：
   - `init / doctor / check`
   - `node ./dist/bin/repo-ai-governor.js`
   - `--output json --locale en-US`
   - `REPO_AI_GOVERNOR_ENTRY_SURFACE=cursor`
3. Claude Code 模板提供 command manifest 与 `commonErrors`：
   - `ENTRYPOINT_COMMAND_WRAPPER_INVALID`
   - `CONFIG_SCHEMA_VALIDATION_FAILED`
   - `nextActionOnFailure` 与 `command-wrapper.contract.json -> surfaceRegistry` 对齐
4. `scripts/examples/check-ide-entry-smoke.js` 已扩展为四入口统一 smoke：
   - VS Code
   - JetBrains
   - Cursor
   - Claude Code
5. 新增 `scripts/examples/check-ide-docs-parity.js` 与 `pnpm run check:ide-docs-parity`：
   - 校验 Cursor / Claude Code surface 已在 contract registry 中声明
   - 校验模板 env 基线与 `standards-injection.contract.json` 默认顺序一致
   - 校验 `integrations/ide/README.md` 与 `integrations/ide/examples/README.md` 中的文件名、surface 文案和 `nextAction` 不漂移
   - 校验 Claude Code `commonErrors` 与示例 README 恢复建议对齐
6. `package.json` 与 `turbo.json` 已将 `gate:ide-docs-parity` 纳入 `pnpm run check`。
7. `test/ide-entry-smoke.integration.test.ts` 已扩展为四入口 integration smoke，直接通过 `runCli()` 验证 `init -> doctor -> check`。
8. `scripts/release/verify-local-distribution.js` 已将 Cursor / Claude Code 官方模板纳入本地分发校验。

## 3. 关键产物

1. `DA-111` 本文档
2. `resolved_code_review_tk-111-cursor-claude-code-integration-templates-and-docs-parity.md`
3. `integrations/ide/examples/cursor-task.sample.json`
4. `integrations/ide/examples/claude-code-commands.sample.json`
5. `scripts/examples/check-ide-docs-parity.js`

## 4. 验证证据

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `node ./scripts/examples/check-ide-entry-smoke.js`
3. `node ./scripts/examples/check-ide-docs-parity.js`
4. `pnpm run test:integration -- test/ide-entry-smoke.integration.test.ts --maxWorkers=1 --maxConcurrency=1`
5. `pnpm run release:verify-local`
6. `node ./scripts/governance/check-task-ledger-sync.js`
7. `node ./scripts/governance/check-sprint-plan-status-sync.js`
8. `node ./scripts/governance/check-code-review-status-sync.js`
9. `node ./scripts/governance/check-artifact-registry-lifecycle.js`
10. `pnpm run check`

## 5. 结论

1. `TK-111` 已将 Cursor / Claude Code 从“registry 中声明的 surface”升级为“带官方模板、文档与 gate 的正式交付面”。
2. `TK-112` 可以直接在 `DA-107` ~ `DA-111` 基础上做 project-010 出口验收，而无需再单独补 IDE multi-surface 的证据链。
