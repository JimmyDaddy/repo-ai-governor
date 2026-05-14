# Code Review: sprint-001 post-fix recheck round 2

- Status: resolved
- Date: 2026-05-14
- Reviewer: AI-Agent
- Task: `CR-002`
- Review Type: working tree review
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/execution-gate-layering-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`

## 1. Review Scope
1. `packages/standards/package.json`
2. `packages/standards/src/self-host-governor-config.ts`
3. `packages/config/src/default-governor-config.ts`
4. `apps/cli/src/main.ts`
5. `apps/cli/src/cli-governance-runtime.ts`
6. `apps/cli/src/runtime/adoption-pack-bootstrap-runtime.ts`
7. `apps/cli/test/adopt-command.integration.test.ts`

## 2. Findings
### 2.1 [P2] `@repo-ai-governor/standards` introduced a direct `config` dependency without declaring it in the package manifest
- 位置: `packages/standards/src/self-host-governor-config.ts:1`
- 问题描述: round-1 drift fix made the standards package import `@repo-ai-governor/config`, but `packages/standards/package.json` still only declared `@repo-ai-governor/shared`.
- 影响: monorepo-root installs mask the issue locally, but package-boundary consumers of `@repo-ai-governor/standards` can hit module-resolution failures when this entrypoint is loaded outside the full workspace graph.
- 建议: declare the direct workspace dependency in `packages/standards/package.json` so package metadata matches the new import graph.

## 3. Notes
1. 除了 package manifest 漏项之外，本轮 scoped recheck 未再发现 `bootstrap -> connect -> adopt diff` 行为回归。
2. 该 finding 属于 package-boundary 风险推断，不是直接由仓库 rule checker 报出的阻断项，但确实会影响后续独立消费与打包可靠性。

## 4. Verification
1. `pnpm vitest run apps/cli/test/adopt-command.integration.test.ts`（通过）
2. `pnpm run build`（通过）
3. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
5. `node ./scripts/governance/check-code-review-status-sync.js`（通过）

## 复核结论（2026-05-14）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：`packages/standards/src/self-host-governor-config.ts` 已直接 import `@repo-ai-governor/config`，但 `packages/standards/package.json` 在本轮修复前未声明这条 workspace 依赖。
   - 处理：已接受并修复，补齐 `packages/standards/package.json` 依赖声明。

### 验证命令
1. `pnpm vitest run apps/cli/test/adopt-command.integration.test.ts`（通过）
2. `pnpm run build`（通过）
3. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
5. `node ./scripts/governance/check-code-review-status-sync.js`（通过）

## 修复执行记录（2026-05-14）

1. `2.1`：已完成
   - 变更文件：`packages/standards/package.json`
   - 验证：`pnpm run build`（通过）
   - 说明：补齐 `@repo-ai-governor/config` workspace 依赖，确保 standards package manifest 与实际 import graph 对齐。
