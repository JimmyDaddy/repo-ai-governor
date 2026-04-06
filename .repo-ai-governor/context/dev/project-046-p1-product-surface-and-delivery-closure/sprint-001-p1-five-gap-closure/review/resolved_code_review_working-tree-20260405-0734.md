# Code Review: Working Tree Review 2026-04-05 07:34

- Status: resolved
- Date: 2026-04-05
- Reviewer: AI-Agent
- Task: `n/a`
- Review Type: working tree review
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
  - `.codex/skills/workspace-code-review-workflow/SKILL.md`

## 1. Review Scope
1. `apps/desktop/src/runtime/desktop-preload-bridge.ts`
2. `apps/desktop/src/runtime/desktop-governance-console-view-model-builder.ts`
3. `apps/desktop/src/types/interfaces/desktop-governance-console.interface.ts`
4. `apps/desktop/test/desktop-preload-bridge.test.ts`
5. `test/desktop-entry-smoke.integration.test.ts`
6. `packages/standards/src/standards-runtime-loader.ts`
7. `packages/standards/test/standards-runtime-loader.integration.test.ts`
8. `packages/standards/test/fixtures/runtime-loader/official-runtime-pack.fixture.ts`
9. `packages/standards/test/fixtures/runtime-loader/repository-runtime-pack.fixture.ts`
10. `packages/config/src/schema-validator.ts`
11. `packages/config/test/config.unit.test.ts`

## 2. Findings
### 2.1 [P1] Governance console snapshot now hides the latest session transcript behind `executionSessionId`
- 位置: `apps/desktop/src/runtime/desktop-preload-bridge.ts:170`
- 问题描述: `buildGovernanceConsoleSnapshot()` 当前无条件优先把 `latestExecution.executionSessionId` 传给 `queryArtifactPane()`，只有 execution 不存在时才回退到 `sessions[0]`。这和控制台自己的 `sessionLane` 构建逻辑不一致，后者明确使用 `sessions[0]` 作为“当前会话”来源。`test/desktop-entry-smoke.integration.test.ts` 里的真实 smoke 流程正好覆盖了这个错配：先启动 execution，再启动一个更新的 standalone session 并追加 `desktop baseline active`；直接调用 `queryArtifactPane({ executionId, sessionId })` 可以拿到 transcript，但 `buildGovernanceConsoleSnapshot()` 会重新切回旧的 execution session，导致 `consoleSnapshot.artifactPane.transcript.entries[0]` 为空，并使该集成测试失败。
- 影响: 桌面治理控制台会在“最新 execution 仍存在，但最新用户会话更新更晚”的常见场景下展示空白或陈旧 transcript，使 artifact pane 与 session lane 指向不同上下文，直接误导操作者。
- 建议: 让 artifact-pane transcript 与 `sessionLane` 使用同一会话选择规则，或把“execution/session 成对解析”的职责下沉到 service 端，避免 preload 层手工拼装出不一致的上下文组合。同时补一条“latest standalone session newer than latest execution session” 的回归测试。

### 2.2 [P2] Standards runtime-loader 的新增验证只覆盖 source-only fixture，未覆盖打包后的运行时消费路径
- 位置: `packages/standards/test/standards-runtime-loader.integration.test.ts:12`、`packages/standards/test/fixtures/runtime-loader/official-runtime-pack.fixture.ts:1`
- 问题描述: 新增的 integration test 通过 `./official-runtime-pack.fixture.ts` 和 `./repository-runtime-pack.fixture.ts` 喂给 `StandardsRuntimeLoader`，而这两个 fixture 又直接导入 `../../../src/index.js`。这在 source-based Vitest 里会通过，但它验证的其实是“源码工作树内的相对导入”，不是“构建产物对外承诺的 runtime contract”。我在同一变更窗口里先执行了 `pnpm run build`，然后直接用 `packages/standards/dist/src/standards-runtime-loader.js` 加载同一 fixture root，结果会抛出 `ERR_MODULE_NOT_FOUND`，因为 fixture 会追到打包后不存在的 `packages/standards/src/index.js`。
- 影响: 当前新增测试会给出“runtime loader 已产品化可用”的错误信心，但真正的 built/dist 消费路径仍然没有被覆盖；这会让发布校验和后续 adopter 验证都漏掉一类非常实际的运行时回归。
- 建议: 把 runtime-loader fixture 改成只依赖发布面可解析的模块，或新增一条 built-dist smoke（构建后的 loader + dist-safe fixture）。只要目标是验证 runtime consumption，就不要再让 fixture 反向依赖 `../../../src/index.js` 这类 source-only 路径。

## 3. Notes
1. 当前 `current-context.md` 处于 `idle`，且仓库内同时存在多条历史 `review_*/verified_*` 生命周期文件；根据 `Worktree Review Target` 单值约束，本报告继续按显式路径写入 `project-046` 的 `review/` 目录，而没有修改默认 CR 路由。
2. `pnpm run build` 和本次选取的 package tests 都通过；`pnpm run test:integration -- --runInBand test/desktop-entry-smoke.integration.test.ts test/task-ledger-gates.integration.test.ts` 失败，失败点与 `2.1` 完全一致。
3. 我额外验证了 `StandardsRuntimeLoader` 对 dist-safe runtime pack 是可工作的，因此 `2.2` 的核心问题是“新增 fixture / test 没有覆盖真实发布路径”，而不是 loader 主流程已经普遍不可用。

## 4. Verification
1. `pnpm run build`（通过）
2. `pnpm run test:packages -- --runInBand packages/standards/test/standards-runtime-loader.integration.test.ts packages/core-orchestration-service/test/local-orchestration-service-artifact-pane-query-runtime.unit.test.ts apps/desktop/test/desktop-preload-bridge.test.ts apps/desktop/test/desktop-governance-console-view-model-builder.test.ts apps/desktop/test/desktop-shell-bootstrap.test.ts packages/config/test/config.unit.test.ts`（通过；实际执行时跑出了 packages 配置下的全量 package tests）
3. `pnpm run test:integration -- --runInBand test/desktop-entry-smoke.integration.test.ts test/task-ledger-gates.integration.test.ts`（失败，`test/desktop-entry-smoke.integration.test.ts:169` 断言 `consoleSnapshot.artifactPane.transcript.entries[0]?.detailLines` 时拿到 `undefined`）
4. `node --input-type=module` 加载 `packages/standards/dist/src/standards-runtime-loader.js` 并指向 `packages/standards/test/fixtures/runtime-loader`（失败，`ERR_MODULE_NOT_FOUND`，因为 fixture 追到了 source-only 的 `packages/standards/src/index.js`）

## 复核结论（2026-04-05）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：`apps/desktop/src/runtime/desktop-preload-bridge.ts` 的 `buildGovernanceConsoleSnapshot()` 复核时仍然把 artifact-pane query 的 `sessionId` 优先锁定为 `latestExecution.executionSessionId`，而 `sessionLane` 继续使用 `sessions[0]`。这和 `test/desktop-entry-smoke.integration.test.ts` 的场景一致，会让控制台转录与最新会话脱节。
   - 处理：已改为优先使用 `sessions[0]?.sessionId`，仅在没有 standalone session 时才回退到 `executionSessionId`，并在 `apps/desktop/test/desktop-preload-bridge.test.ts` 补上“优先最新 standalone session / 无 standalone 时回退 execution session”两侧覆盖。
2. `2.2`
   - 判定：**认可**
   - 证据：`packages/standards/test/fixtures/runtime-loader/*.fixture.ts` 复核时仍然依赖 `../../../src/index.js`，这会让构建后的 `@repo-ai-governor/standards` dist loader 在真实 Node 消费路径上追到不存在的 source-only 入口。
   - 处理：已把 runtime-loader fixture 改成纯数据导出，不再反向依赖 source 入口；同时在 `scripts/release/verify-local-distribution.js` 新增 dist runtime-loader smoke，并把 `@repo-ai-governor/standards` 的打包产物路径纳入 release verify-local 校验。

### 验证命令
1. `pnpm exec vitest run --config vitest.packages.config.ts apps/desktop/test/desktop-preload-bridge.test.ts packages/standards/test/standards-runtime-loader.integration.test.ts`（通过）
2. `pnpm exec vitest run --config vitest.integration.config.ts test/desktop-entry-smoke.integration.test.ts`（通过）
3. `pnpm run build`（通过）
4. `node ./scripts/release/verify-local-distribution.js`（通过）

## 修复执行记录（2026-04-05）

1. `2.1`：已完成
   - 变更文件：`apps/desktop/src/runtime/desktop-preload-bridge.ts`、`apps/desktop/test/desktop-preload-bridge.test.ts`
   - 验证：`pnpm exec vitest run --config vitest.packages.config.ts apps/desktop/test/desktop-preload-bridge.test.ts packages/standards/test/standards-runtime-loader.integration.test.ts`、`pnpm exec vitest run --config vitest.integration.config.ts test/desktop-entry-smoke.integration.test.ts`、`pnpm run build`（通过）
   - 说明：artifact-pane transcript 现在优先与 sessionLane 对齐到最新 standalone session，同时保留无 standalone session 时的 execution-session fallback。
2. `2.2`：已完成
   - 变更文件：`packages/standards/test/fixtures/runtime-loader/official-runtime-pack.fixture.ts`、`packages/standards/test/fixtures/runtime-loader/repository-runtime-pack.fixture.ts`、`scripts/release/verify-local-distribution.js`
   - 验证：`pnpm exec vitest run --config vitest.packages.config.ts apps/desktop/test/desktop-preload-bridge.test.ts packages/standards/test/standards-runtime-loader.integration.test.ts`、`pnpm run build`、`node ./scripts/release/verify-local-distribution.js`（通过）
   - 说明：runtime-loader fixture 已变为 dist-safe，release verify-local 现在会真实加载 dist 版 `@repo-ai-governor/standards` runtime loader 验证打包消费路径。
