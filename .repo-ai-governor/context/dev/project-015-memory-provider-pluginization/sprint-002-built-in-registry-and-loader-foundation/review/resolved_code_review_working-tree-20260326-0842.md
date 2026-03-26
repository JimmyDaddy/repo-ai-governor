# Code Review: Working Tree Memory Provider Registry And Distribution Compatibility

- Status: resolved
- Date: 2026-03-26
- Reviewer: AI-Agent
- Task: `n/a`
- Review Type: working tree review
- Normative References:
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`

## 1. Review Scope
1. `apps/cli/src/main.ts`
2. `packages/memory-provider-registry/src/memory-provider-registry.ts`
3. `packages/memory-providers/sqlite-fs/package.json`
4. `scripts/build/copy-runtime-assets.js`
5. `scripts/release/verify-local-distribution.js`
6. `test/memory-store-config-and-cli-composition.integration.test.ts`
7. `.repo-ai-governor/context/dev/project-015-memory-provider-pluginization/plan.md`
8. `.repo-ai-governor/context/dev/project-015-memory-provider-pluginization/sprint-002-built-in-registry-and-loader-foundation/tasks/DA-168-cli-memory-provider-loader-cutover-and-legacy-config-compatibility.md`
9. `.repo-ai-governor/context/dev/project-015-memory-provider-pluginization/sprint-002-built-in-registry-and-loader-foundation/tasks/DA-170-sprint-002-exit-acceptance-and-sprint-003-optional-plugin-input-constraints.md`

## 2. Findings
### 2.1 [P1] Default distribution no longer provides a usable path for `sqlite_fs` configs
- 位置: `.repo-ai-governor/context/dev/project-015-memory-provider-pluginization/plan.md:33`, `.repo-ai-governor/context/dev/project-015-memory-provider-pluginization/sprint-002-built-in-registry-and-loader-foundation/tasks/DA-168-cli-memory-provider-loader-cutover-and-legacy-config-compatibility.md:10`, `.repo-ai-governor/context/dev/project-015-memory-provider-pluginization/sprint-002-built-in-registry-and-loader-foundation/tasks/DA-170-sprint-002-exit-acceptance-and-sprint-003-optional-plugin-input-constraints.md:15`, `packages/memory-provider-registry/src/memory-provider-registry.ts:96`, `scripts/build/copy-runtime-assets.js:108`, `scripts/build/copy-runtime-assets.js:199`, `scripts/release/verify-local-distribution.js:43`, `packages/memory-providers/sqlite-fs/package.json:4`
- 问题描述: 当前文档和 sprint-002 验收仍声明 legacy `storeEngine` 兼容成立，但实现已经把 `sqlite-fs` 从默认发行包中彻底移除。registry 仍会把 `storeEngine=sqlite_fs` 解析到 built-in sqlite descriptor 并尝试动态加载对应 provider 包；与此同时，build/release 脚本明确把 sqlite provider 标成 `optional` 并从默认 `dist` 与打包产物中剔除，`verify-local-distribution` 还会阻断任何默认包重新带回该 payload。更关键的是 `@repo-ai-governor/memory-provider-sqlite-fs` 目前仍是 `private: true`，没有独立安装路径。现有集成测试只在 monorepo 工作区内验证，因此掩盖了默认发行环境下的真实行为。
- 影响: 使用默认发布包的仓库，只要已有 `memory.storeEngine: sqlite_fs` 配置，就会在运行时进入 provider load failure，而且用户没有受支持的补救路径。这和“legacy compatibility 仍成立”的对外契约不一致，属于真实交付回归，不只是文案偏差。
- 建议: 二选一收口。要么给 `sqlite-fs` 提供正式的可安装/可验证路径，并补上 clean-room/default distribution 级别的回归验证；要么把 project plan、DA-168、DA-170 和相关验收口径收紧成“仅保留 config/parser 兼容，默认发行包对 sqlite provider fail-closed”，避免继续宣称运行时兼容。

## 3. Notes
1. 本次按用户显式要求，将报告写入 `project-015 / sprint-002` 的 `review/` 目录，而不是当前 `sprint-003` 的默认 review 路径。
2. 未把 `sprint-003` 路由切换本身保留为 finding；复核时对应 sprint 资产已经存在，这次显式 review target override 也足以解释报告归属。

## 4. Verification
1. `git status --short`（通过）
2. `git diff --stat`（通过）
3. `git diff --name-only --diff-filter=ACMR`（通过）
4. `git diff --cached --name-only --diff-filter=ACMR`（通过）
5. `pnpm -s tsc -p tsconfig.json --noEmit`（通过）
6. `pnpm exec vitest run packages/memory-provider-registry/test/memory-provider-registry.unit.test.ts test/memory-store-config-and-cli-composition.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）

## 5. Recheck Conclusion
1. 2026-03-26：finding `2.1` 已认可并修复。
2. `packages/memory-provider-registry/src/memory-provider-registry.ts` 现在会在 optional built-in provider 缺失时返回显式的 default-distribution fail-closed 说明，不再只给出泛化的 module load failure。
3. `packages/memory-provider-registry/test/memory-provider-registry.unit.test.ts` 新增了 optional built-in provider 缺失场景回归；`test/memory-store-config-and-cli-composition.integration.test.ts` 也把 sqlite 用例名称收紧为 workspace-composition 语义，避免继续暗示默认发行包可用。
4. `project-015` 计划、`sprint-002` 计划、`DA-168` 与 `DA-170` 已同步改为 “legacy storeEngine parser/selection compatibility + default distribution 对 sqlite optional built-in runtime fail-closed” 口径。

## 6. Fix Verification
1. `pnpm -s tsc -p tsconfig.json --noEmit`（通过）
2. `pnpm exec vitest run packages/memory-provider-registry/test/memory-provider-registry.unit.test.ts test/memory-store-config-and-cli-composition.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
3. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
5. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
6. `pnpm run check`（通过）
