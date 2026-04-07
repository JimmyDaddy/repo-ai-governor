# Code Review: project-056-standards-runtime-loader-and-pack-productization

- Status: resolved
- Date: 2026-04-07
- Reviewer: AI-Agent
- Task: `CR-001`
- Review Type: delegated sprint review
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/execution-gate-layering-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`

## 1. Review Scope
1. `packages/standards/src/standards-runtime-loader.ts`
2. `packages/standards/src/types/`
3. `packages/standards/test/`
4. `packages/config/test/config.unit.test.ts`
5. `packages/standards/README.md`
6. `packages/config/README.md`
7. `.repo-ai-governor/context/dev/project-056-standards-runtime-loader-and-pack-productization/plan.md`
8. `.repo-ai-governor/context/dev/project-056-standards-runtime-loader-and-pack-productization/sprint-001-standards-runtime-loader-product-path/plan.md`

## 2. Findings
### 2.1 [P2] Relative AGENTS projection targets are returned unresolved
- 位置: `packages/standards/src/standards-runtime-loader.ts`
- 问题描述: `projectAgents()` returned configured relative `projectionTargets[].targetFile` values unchanged, and the default fallback target also stayed as raw `AGENTS.md`. Under the documented caller-owned write pattern, that made the returned projection path depend on the caller's current working directory instead of the runtime `baseDirectory`.
- 影响: callers could silently write an AGENTS projection outside the intended repository/workspace root when invoking the runtime from another cwd, breaking the productized projection contract.
- 建议: resolve configured and default relative projection targets against `baseDirectory`, then lock the behavior with regression coverage and docs that explain `baseDirectory` as the resolution root.

## 3. Notes
1. 风险推断：本轮没有进一步验证 Node 18 下 repo-local `*.ts` pack path 的兼容性；当前修复仅收口 projection target resolution contract。
2. 风险推断：`renderConfiguredTargets()` / `projectAgents()` 的 `scope / locale / interpolation` forwarding 仍主要依赖间接覆盖，后续如继续扩面可再补专门回归。

## 4. Verification
1. `pnpm run build`（通过）
2. `pnpm exec vitest run --config vitest.packages.config.ts packages/standards/test/standards-runtime-loader.integration.test.ts packages/config/test/config.unit.test.ts`（通过）
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
4. `pnpm run check`（通过）

## 复核结论（2026-04-07）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：pre-fix `projectAgents()` 会把 configured/default relative projection target 原样返回，导致 caller-owned write 依赖 `process.cwd()` 而不是 `baseDirectory`；reviewer 提供的 `cwd != baseDirectory` dist repro 与当前 contract 目标一致指向同一问题。
   - 处理：接受该 finding，统一把 configured/default relative projection target 解析到 `baseDirectory`，并补回归测试与 README/baseDirectory 说明。

### 验证命令
1. `pnpm run build`（通过）
2. `pnpm exec vitest run --config vitest.packages.config.ts packages/standards/test/standards-runtime-loader.integration.test.ts packages/config/test/config.unit.test.ts`（通过）
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
4. `pnpm run check`（通过）

## 修复执行记录（2026-04-07）

1. `2.1`：已完成
   - 变更文件：`packages/standards/src/standards-runtime-loader.ts`、`packages/standards/test/standards-runtime-loader.integration.test.ts`、`packages/standards/README.md`、`packages/config/README.md`
   - 验证：`pnpm exec vitest run --config vitest.packages.config.ts packages/standards/test/standards-runtime-loader.integration.test.ts packages/config/test/config.unit.test.ts`、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`node --input-type=module -e "<dist repro>"`、`pnpm run check`（通过）
   - 说明：configured/default relative projection target 现在都会先解析到 `baseDirectory`，从而把 caller-owned write boundary 固定在 runtime root，而不再依赖调用时 `cwd`。

## 处置结果与剩余风险（2026-04-07）

1. 本轮 accepted finding 已完成修复，当前 sprint scope 未保留新的 actionable finding。
2. reviewer 提到的 Node 18 下 repo-local `*.ts` pack path 兼容性与 `scope / locale / interpolation` forwarding 深覆盖仍属于后续扩展关注项，不阻塞本轮 sprint closeout。
