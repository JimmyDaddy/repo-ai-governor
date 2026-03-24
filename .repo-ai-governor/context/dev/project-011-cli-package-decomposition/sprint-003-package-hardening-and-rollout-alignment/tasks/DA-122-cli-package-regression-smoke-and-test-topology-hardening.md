# DA-122 CLI package 回归、smoke 与 test topology 加固

- Status: active
- Date: 2026-03-24
- Owner: AI-Agent
- Artifact ID: `DA-122`
- Produced By: `TK-124`
- Scope: `project-011-cli-package-decomposition`

## 1. 目的

固化 `apps/cli` 在 package-local 拆分后的测试拓扑、public entry smoke 与根层消费证据，确保当前重构结果不仅停留在文件拆分层面。

## 2. 当前测试拓扑基线

1. package-scoped tests 位于 `apps/cli/test/**`
   - 当前覆盖包含：
   - `cli-governance-runtime.integration.test.ts`
   - `cli-output-contract.integration.test.ts`
   - `cli-output-presenter.unit.test.ts`
   - `cli-skeleton.integration.test.ts`
   - `commands/cli-command-registry.test.ts`
   - `ide-command-wrapper.unit.test.ts`
   - `runtime/*.test.ts`
2. cross-package/public-entry 验证位于根层 `test/**`
   - `test/memory-store-config-and-cli-composition.integration.test.ts` 通过 `@repo-ai-governor/cli` 消费 `runCli`，可作为 CLI package 对外入口 smoke。
3. 当前拓扑与 `CS-024` 一致
   - package 所有权测试保留在 `apps/cli/test`
   - 根层仅保留跨包集成/消费场景

## 3. 第一轮验证证据

1. `pnpm run test:packages -- @repo-ai-governor/cli --maxWorkers=1 --maxConcurrency=1`
   - 结果：`50` 个文件、`204` 个测试全部通过
2. `pnpm -s vitest run apps/cli/test/cli-output-contract.integration.test.ts apps/cli/test/cli-skeleton.integration.test.ts test/memory-store-config-and-cli-composition.integration.test.ts --maxWorkers=1 --maxConcurrency=1`
   - 结果：`3` 个文件、`14` 个测试全部通过
3. 现有 smoke 已覆盖的关键面
   - CLI 输出契约
   - CLI skeleton/help/init 基线
   - 根层经 `@repo-ai-governor/cli` 的 public entry 消费

## 4. 收口观察

1. `apps/cli/package.json` 仍只暴露根导出 `"."`
   - 现有根层集成测试能证明当前 public surface 仍可消费，不需要为了测试补 subpath exports。
2. `apps/cli/test/runtime/*` 已直接命中新拆分的 package-local runtime 模块
   - 这说明 package-local 边界已有直接回归抓手，不需要再把内部模块抬升到 shared 或 public API。
3. 高复杂度命令链已存在稳定 package-scoped integration 覆盖
   - `apps/cli/test/cli-governance-runtime.integration.test.ts` 已覆盖 `RUN`、`REVIEW`、`REVIEW_VERIFY`、replay diagnostics、restricted-network fallback 与 review queue drain。
   - 因此本轮无需为了“看起来更细”再额外引入一层重复 smoke。

## 5. 后续加固方向

1. 后续若新增 CLI public surface，应优先复用现有 package-scoped integration 与 root public-entry smoke，再决定是否增加新测试层级。
2. 保持根层 `test/**` 只覆盖 public entry 与跨包组合，不把 package 内部实现细节泄露到 root integration。
3. 若后续新增跨包消费点，必须同步更新此拓扑结论与对应 smoke。

## 6. 最终结论

1. 当前状态：`accepted`
2. 结论：`apps/cli` 的 package-scoped tests、root integration smoke 与高复杂度命令链覆盖已经形成稳定可消费基线，并与 `CS-024` 分层测试拓扑一致。
3. 验证证据：
   - `pnpm run test:packages -- @repo-ai-governor/cli --maxWorkers=1 --maxConcurrency=1`
   - `pnpm -s vitest run apps/cli/test/cli-output-contract.integration.test.ts apps/cli/test/cli-skeleton.integration.test.ts test/memory-store-config-and-cli-composition.integration.test.ts --maxWorkers=1 --maxConcurrency=1`
   - `pnpm -s vitest run apps/cli/test/commands/cli-command-registry.test.ts apps/cli/test/cli-governance-runtime.integration.test.ts --maxWorkers=1 --maxConcurrency=1`
