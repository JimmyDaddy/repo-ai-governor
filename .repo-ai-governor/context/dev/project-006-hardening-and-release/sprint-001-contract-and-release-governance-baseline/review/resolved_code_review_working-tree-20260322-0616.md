# Code Review: working tree contract and release governance baseline

- Status: resolved
- Date: 2026-03-22
- Reviewer: AI-Agent
- Task: `n/a`
- Review Type: working tree review
- Normative References:
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`

## 1. Review Scope

1. `.release-it.json`
2. `package.json`
3. `tsconfig.json`
4. `tsconfig.build.json`
5. `turbo.json`
6. `vitest.contract.config.ts`
7. `vitest.e2e.config.ts`
8. `vitest.integration.config.ts`
9. `scripts/ci/check-coverage-thresholds.js`
10. `scripts/ci/coverage-thresholds.json`
11. `scripts/release/check-release-ready.js`
12. `scripts/release/check-runtime-js-whitelist.js`
13. `scripts/release/render-release-notes.js`
14. `scripts/release/verify-local-distribution.js`
15. `scripts/release/release-governance-policy.json`
16. `scripts/release/runtime-js-whitelist.json`
17. `test/contract/contract-test-matrix.contract.test.ts`
18. `test/contract/contract-test-matrix.manifest.json`
19. `test/e2e/cli-help.e2e.test.ts`
20. `.repo-ai-governor/normative_knowledge_sources/governance/release-governance-spec.md`
21. Sprint ledger and review artifact updates under `.repo-ai-governor/context/dev/project-006-hardening-and-release/sprint-001-contract-and-release-governance-baseline/`

## 2. Findings

### 2.1 [P1] Release candidate and GA checks depend on pre-existing `dist/` artifacts

- 位置: `package.json:78-82`; `scripts/release/check-runtime-js-whitelist.js:95-97`; `scripts/release/verify-local-distribution.js:160-163`
- 问题描述: `release:candidate` 目前只串联 `ci:quality -> release:check -> release:verify-local`，但这条链路里没有任何一步执行 `pnpm run build`。与此同时，`check-runtime-js-whitelist.js` 与 `verify-local-distribution.js` 都把 `dist/` 产物当作硬前置条件。我在一个临时 clean 目录中仅链接仓库配置和脚本、不提供 `dist/` 后执行 `pnpm run release:check`，稳定复现了 `No runtime JS files matched dist/{bin,apps,packages}/**/*.{js,mjs,cjs}. Run build first.`。
- 影响: 发布链路只会在本机已经残留构建产物时通过；一旦进入 fresh clone、全新 CI runner 或 release-it 的干净执行环境，`canary/rc/ga` 检查会在真正开始前直接失败。
- 建议: 在 `release:check` 或 `release:candidate` 前显式加入 `pnpm run build`，或者让依赖 `dist/` 的 release 脚本自己负责构建前置步骤校验与补齐。

### 2.2 [P2] `test:integration` 仍然会重复执行 contract 和 e2e 套件

- 位置: `vitest.integration.config.ts:11`
- 问题描述: 当前 `include: ["test/**/*.test.{js,ts}"]` 会同时匹配 `test/contract/contract-test-matrix.contract.test.ts` 和 `test/e2e/cli-help.e2e.test.ts`，因为这两个文件同样以 `.test.ts` 结尾。我用 `pnpm exec vitest list --config vitest.integration.config.ts` 验证后，输出中确实同时出现了 contract/e2e 用例。这样一来，新增的 `test:contract -> test:integration -> test:e2e` 分层并没有真正隔离。
- 影响: `gate:test:integration` 会重复跑本应独立归属的 contract/e2e 用例，导致测试分层边界失真、执行时间膨胀，且失败归因会混淆为 integration 回归，和 `CS-024` 的分层测试目标不一致。
- 建议: 收紧 integration 的 include 范围，或显式排除 `test/contract/**` 与 `test/e2e/**`。

## 3. Notes

1. 本次主要聚焦会影响行为与门禁可信度的改动，尤其是 release pipeline、Vitest 分层和对应治理文档的一致性。
2. 现有 sprint review 目录里同时存在 `verified_review_*` 风格文件；由于仓库规则中对 review 文件前缀存在并行写法，本次未将其单独判定为阻断问题。
3. 除上述两项外，本次检查中未发现新的高优先级阻断问题。

## 4. Verification

1. `git status --short`（通过）
2. `git diff --name-only --diff-filter=ACMR`（通过）
3. `pnpm exec vitest list --config vitest.integration.config.ts`（通过，确认 integration 套件误包含 contract/e2e 用例）
4. `tmpdir=$(mktemp -d) && mkdir -p "$tmpdir/repo" && ln -s <repo>/package.json "$tmpdir/repo/package.json" && ln -s <repo>/.release-it.json "$tmpdir/repo/.release-it.json" && ln -s <repo>/scripts "$tmpdir/repo/scripts" && ln -s <repo>/.repo-ai-governor "$tmpdir/repo/.repo-ai-governor" && cd "$tmpdir/repo" && pnpm run release:check`（失败，复现 clean checkout 下缺少 build 前置步骤的问题）

## 复核结论（2026-03-22）

- 整体结论：**认可**

### 逐条复核

1. `2.1 [P1] Release candidate and GA checks depend on pre-existing dist/ artifacts`
   - 判定：**认可**
   - 证据：`package.json` 中 `release:check` 已改为 `pnpm run build && node ./scripts/release/check-release-ready.js && pnpm run check:runtime-js-whitelist`，且 `pnpm run release:check` 输出确认先执行了 build。
   - 处理：已纳入修复并通过验证。
2. `2.2 [P2] test:integration 仍然会重复执行 contract 和 e2e 套件`
   - 判定：**认可**
   - 证据：`vitest.integration.config.ts` 已新增 `exclude: ["test/contract/**", "test/e2e/**"]`；`pnpm exec vitest list --config vitest.integration.config.ts` 输出仅包含 integration 套件文件。
   - 处理：已纳入修复并通过验证。

### 验证命令

1. `pnpm run release:check`（通过）
2. `pnpm exec vitest list --config vitest.integration.config.ts`（通过）

## 修复执行记录（2026-03-22）

1. `2.1 [P1] Release candidate and GA checks depend on pre-existing dist/ artifacts`：已完成
   - 变更文件：`package.json`
   - 验证：`pnpm run release:check`（通过）
   - 说明：在 `release:check` 前显式执行 `build`，消除对预先存在 `dist/` 产物的隐性依赖。
2. `2.2 [P2] test:integration 仍然会重复执行 contract 和 e2e 套件`：已完成
   - 变更文件：`vitest.integration.config.ts`
   - 验证：`pnpm exec vitest list --config vitest.integration.config.ts`（通过）
   - 说明：integration 配置显式排除 `test/contract/**` 与 `test/e2e/**`，恢复分层测试边界。
