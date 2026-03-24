# DA-109 多 IDE surface registry 与 wrapper 契约强化

- Status: active
- Date: 2026-03-24
- Owner: AI-Agent
- Artifact ID: `DA-109`
- Produced By: `TK-109`
- Scope: `project-010-local-model-and-ide-expansion`

## 1. 目的

将现有 IDE baseline wrapper 升级为可被 VS Code、JetBrains、Cursor、Claude Code 与 generic/web IDE 统一消费的多入口契约，避免 surface 能力声明、降级语义、保留环境变量和标准注入顺序继续漂移。

## 2. 关键实现

1. 新增 `apps/cli/src/runtime/ide-surface-registry-runtime.ts`，将 surface registry 收敛为 package-local 单一运行时：
   - 统一解析 `generic_ide / vscode / jetbrains / cursor / claude_code / web_ide`
   - 阻断 duplicate surface id
   - 强制 `generic_ide` fallback 存在
   - 强制 `fallback_to_generic_ide` 只能降级到 `generic_ide`
2. 升级 `apps/cli/src/constants/ide-command-wrapper.constant.ts`：
   - surface 枚举新增 `cursor`、`claude_code`
   - 引入 `IdeSurfaceCapability`、`IdeSurfaceDegradeMode`
   - 显式声明 `IDE_SURFACE_REGISTRY`
   - 将 IDE wrapper 支持命令收紧为 contract 承诺的子集：`init / doctor / check / run / review / review-verify / plan / upgrade`
3. 升级 `apps/cli/src/ide-command-wrapper.ts`：
   - wrapper 不再内嵌 surface 判断，而是消费 registry runtime
   - `metadata` 现在显式返回 `surfaceContract` 与 `nextAction`
   - `additionalEnv` 校验改为按 surface reserved keys + wrapper reserved keys 双重阻断
   - 标准化错误会补充 caller-facing `nextAction`
4. 将公共契约回锚到 CLI 包导出面：
   - `apps/cli/src/main.ts` 现在导出 `IDE_SURFACE_REGISTRY`
   - 同时导出 `IDE_WRAPPER_SUPPORTED_SURFACES`、`IDE_WRAPPER_SUPPORTED_COMMANDS`、`IDE_WRAPPER_DEFAULT_OUTPUT_MODE`
5. 同步机器契约与文档：
   - `integrations/ide/contracts/command-wrapper.contract.json` 升级到 `v2`
   - `integrations/ide/contracts/standards-injection.contract.json` 升级到 `v2`
   - `integrations/ide/README.md` 补齐多 surface registry、降级语义与 contract-first 更新顺序

## 3. 契约收敛结果

1. 多入口 wrapper 现在共享同一套 surface registry、能力声明、默认 output mode 与 reserved env policy。
2. contract test 会同时校验：
   - JSON contract 与 runtime registry 对齐
   - `supportedCommands` / `supportedSurfaces` / `defaultOutputMode` 对齐
   - standards injection default source order 对齐
3. wrapper 错误输出现在能为 unsupported command / unsupported surface / reserved env override 提供一致的 `nextAction`，不再要求各入口自行猜测恢复路径。

## 4. 关键产物

1. `DA-109` 本文档
2. `resolved_code_review_tk-109-multi-ide-surface-registry-and-wrapper-contract-hardening.md`
3. `apps/cli/test/ide-command-wrapper.contract.test.ts`

## 5. 验证证据

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm -s vitest run apps/cli/test/ide-command-wrapper.unit.test.ts apps/cli/test/ide-command-wrapper.contract.test.ts --maxWorkers=1 --maxConcurrency=1`
3. `pnpm run test:packages -- @repo-ai-governor/cli --maxWorkers=1 --maxConcurrency=1`
4. `pnpm run test:packages -- apps/cli/test --maxWorkers=1 --maxConcurrency=1`
5. `node ./scripts/governance/check-task-ledger-sync.js`
6. `node ./scripts/governance/check-sprint-plan-status-sync.js`
7. `node ./scripts/governance/check-code-review-status-sync.js`
8. `node ./scripts/governance/check-artifact-registry-lifecycle.js`
9. `pnpm run check`

## 6. 结论

1. `TK-109` 已将 IDE wrapper 从单 surface baseline 升级为多入口可复用契约。
2. `TK-110` 与 `TK-111` 后续只需要消费已固定的 registry/contract，不再直接在 wrapper 内追加 surface-specific 分叉逻辑。
