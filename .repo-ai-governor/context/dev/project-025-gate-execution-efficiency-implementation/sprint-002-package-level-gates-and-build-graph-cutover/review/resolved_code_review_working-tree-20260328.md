# Code Review: sprint-001 + sprint-002 WIP — Turbo graph cutover & gate profile split

- Status: resolved
- Date: 2026-03-28
- Reviewer: AI-Agent
- Task: `TK-281 / TK-282 / TK-283 / TK-284`
- Review Type: working tree review
- Normative References:
  - `governance/code_standards.md` (ESM 显式扩展名、标准化错误、接口规范)
  - `CLAUDE.md` (架构分层、测试拓扑、构建约定)

## 1. Review Scope

1. `biome.json`
2. `package.json`
3. `turbo.json`
4. `scripts/build/copy-runtime-assets.js`
5. `scripts/ci/run-gate-check.js`
6. `scripts/ci/gate-fast-complete.js`（新增）
7. `scripts/ci/run-repo-global-gates.js`（新增）
8. `test/gate-runner-output.integration.test.ts`（新增）
9. `packages/core-memory-semantics/package.json`
10. `packages/core-memory/package.json`
11. `packages/memory-store-adapter/package.json`
12. `packages/shared/package.json`
13. `packages/core-memory-semantics/tsconfig.build.json`（新增）
14. `packages/core-memory-semantics/tsconfig.json`（新增）
15. `packages/core-memory/tsconfig.build.json`（新增）
16. `packages/core-memory/tsconfig.json`（新增）
17. `packages/memory-store-adapter/tsconfig.build.json`（新增）
18. `packages/memory-store-adapter/tsconfig.json`（新增）
19. `packages/shared/tsconfig.build.json`（新增）
20. `packages/shared/tsconfig.json`（新增）
21. `apps/cli/test/cli-output-contract.integration.test.ts`
22. 上下文 / 任务文档（sprint-001 checklist / tasks.csv / TK-281 / TK-282 / plan.md / current-context.md / completed-streams-history.md / technical-solution-delivery-registry.yaml）

## 2. Findings

### 2.1 [P1] `turbo.json` — `test` 任务依赖 `build` 而非 `^build`，将产生多余串行依赖

- 位置: `turbo.json` — `"test"` task 定义
- 问题描述: 当前 `test` 任务声明 `"dependsOn": ["build", "^build"]`。`build` 不带 `^` 意为"同包的 build 必须先完成"，`^build` 意为"所有上游依赖包的 build 先完成"。对于 vitest 集成测试（通过根配置指定文件路径，`--root ../..`），测试进程运行在根目录而非 package 目录，这里加 `build` 的语义是 **当前 workspace package 的 build**，在实际上层 Turbo filter 调用（如 `pnpm turbo run test --filter=@repo-ai-governor/core-memory-semantics`）中等价于"先 build 自己再 test 自己"，这是期望行为。但若有仓库级别的 `test:*` 任务（非 package-scoped）也命中了这条规则，会导致根级任务先 build 所有包才能运行测试。
- 影响: 低—仅影响 Turbo task-graph 调度效率，不影响正确性。但可能导致 `pnpm turbo run test` 在根级误触发全量 build，与"fast baseline"目标不符。
- 建议: 评估是否将全量测试入口（`//#gate:test:packages` 等）中的依赖单独声明，而让 package-level `test` 只依赖 `^build`（上游 build，不强依赖自身 build）；或保持当前设计但在注释中明确"package-scoped test 期望行为"。若期望 package 自身 build 前置，则当前定义正确，可在文档中澄清。

### 2.2 [P1] `copy-runtime-assets.js` — `--package` 过滤器的错误判断逻辑存在缺陷

- 位置: `scripts/build/copy-runtime-assets.js:resolveTargetDistributionPackages`
- 问题描述: 当前判断"unknown package"的逻辑是：

  ```js
  const knownPackageNames = new Set(
    targetDistributionPackages.map(distributionPackage => distributionPackage.packageName),
  );
  const unknownPackageNames = Array.from(selectedPackageNames).filter(
    packageName => !knownPackageNames.has(packageName),
  );
  ```

  `targetDistributionPackages` 是 `DISTRIBUTION_PACKAGES.filter(p => selectedPackageNames.has(p.packageName))` 的结果，即**已匹配**的包列表。因此 `knownPackageNames` 里只有已匹配的名字，再用它来计算 `unknownPackageNames` 是正确的。但检测条件是 `targetDistributionPackages.length !== selectedPackageNames.size`，当 `DISTRIBUTION_PACKAGES` 中存在**两个 `packageName` 相同的项**时，`targetDistributionPackages.length` 可能 > `selectedPackageNames.size`，导致 false positive。当前 `DISTRIBUTION_PACKAGES` 内没有重复名，但属于隐性假设。
- 影响: 低—当前数据正常时无副作用；若未来引入同名但不同 distribution 包时，可能产生误报错误并中断 partial build。
- 建议: 将判断条件改为 `!selectedPackageNames.every(name => knownPackageNames.has(name))` 或直接基于 Set 差集，使逻辑更健壮：
  ```js
  const resolvedNames = new Set(targetDistributionPackages.map(p => p.packageName));
  const unknownPackageNames = [...selectedPackageNames].filter(n => !resolvedNames.has(n));
  if (unknownPackageNames.length > 0) { ... }
  ```

### 2.3 [P2] `turbo.json` — `gate:check` 现依赖 `gate:fast`，但 `gate:fast` 包含 `format` + `lint`，可能导致 CI 中 `gate:check` 的 format/lint 输出被 Turbo cache 跳过

- 位置: `turbo.json` — `"//#gate:check".dependsOn` / `"//#gate:fast".dependsOn`
- 问题描述: `gate:format` 和 `gate:lint` 的 `cache: false`，但 `gate:fast`（`cache: false`）将它们包含在内；`gate:check` 又依赖 `gate:fast`。Turbo 对 `cache: false` 任务的处理是**每次都执行**，所以 format/lint 不会被错误 cache。然而 `gate:check` 自身也是 `cache: false` 且仅 `dependsOn: ["gate:fast", ...]`——如果 `gate:fast` 已经在本次 turbo pipeline 内执行过（同一命令），Turbo 会跳过重复执行吗？Turbo 文档说明同一 pipeline 内的任务只执行一次，因此 `gate:fast` 作为 `gate:check` 的依赖不会重复执行，这本身正确。但需要确认：`gate:check` 所新增的 gate 中哪些设置了 `cache: true`（如 `normative-loading-manifest`），而它又出现在 `gate:fast` 里，会导致 `gate:check` 从 fast 路径复用 cache，可能在 CI 跨 hash 边界时产生 stale cache 命中问题。
- 影响: 中—stale cache 可能导致 CI 绿通，实际内容已变更。
- 建议: 确认每个 `cache: true` gate 的 `inputs` 配置是否精准（Turbo 默认用 git hash 全局 hash；若 gate 脚本依赖的文件范围可枚举，建议在 `inputs` 字段中明确声明），防止非相关变更也触发 cache bust。当前 gate 均未声明 `inputs`，属于已知 risk，建议在 TK-284 / sprint-002 验收中记录并追踪。

### 2.4 [P2] `run-repo-global-gates.js` — `stdout` 输出 gate 进程的 `stderr` 被截断到 500 字节

- 位置: `scripts/ci/run-repo-global-gates.js:runGate` — `stderrChunks.join("").slice(0, 500)`
- 问题描述: 在 JSON 输出模式下，每个失败 gate 的 `error` 字段最多保留 500 字节 stderr 内容。这对机器消费者来说可能不足以判断根因，特别是 governance 脚本失败时通常会打印多行 diff/错误信息。
- 影响: 低—只影响诊断体验，不影响 pass/fail 判定。
- 建议: 将截断字节数提升到至少 2000，或提供完整 `--verbose` flag 以在 JSON 模式中输出完整 stderr；或在结构化输出中用 `error_lines` 数组代替截断字符串。

### 2.5 [P2] `cli-output-contract.integration.test.ts` — `createDeterministicCliEnvironment` 过滤了所有 `REPO_AI_GOVERNOR_*` 环境变量，但某些测试用例随后又注入了它们

- 位置: `apps/cli/test/cli-output-contract.integration.test.ts:createDeterministicCliEnvironment`
- 问题描述: 新函数过滤掉 `process.env` 中所有 `REPO_AI_GOVERNOR_*` 前缀的变量，然后在特定测试中通过 `overrides` 重新注入，例如：
  ```ts
  createBufferedIo(false, process.cwd(), {
    REPO_AI_GOVERNOR_ENTRY_SURFACE: "vscode",
    ...
  });
  ```
  这个机制是正确的——先清除环境噪声，再按需注入特定值。但如果本地开发者在 shell 中设置了 `REPO_AI_GOVERNOR_*` 变量（如临时调试），原先的 `...process.env` 行为会将其透传给测试，产生不确定性。此次修复了该问题，行为更确定性。
- 影响: 无负面影响，属于正向改进；记录为 Note。

### 2.6 [P3] `tasks.csv` — 同一 task 存在多条 execution record，状态从 `in_progress` 到 `completed` 跨行重复

- 位置: `sprint-001/tasks/tasks.csv`
- 问题描述: TK-281 和 TK-282 各自有 3 条 exec record（`506`→`508`→`510`，`507`→`509`→`511`），这是执行流水线的正常追加记录。但 `504/505` 行（planned 状态的初始记录）与后续 `506+` 行在 task 维度上有重复初始状态，CSV 消费者若按最后一行 `status` 字段识别当前状态则无误，但若按 task_id 做 GROUP BY 取最新时需注意 `exec_id` 排序。
- 影响: 极低—CSV 当前由脚本顺序追加，模式一致。
- 建议: 无需立即修复；在 sprint-002 验收时若新增 tasks.csv 规范化要求，考虑明确"以最新 exec_id 记录为准"的约定。

## 3. Notes

1. `gate:fast` 仅包含 format/lint + Category A（无需 build）gate，语义清晰，与 `gate:check`（完整 full gate）的边界划分正确。
2. `copy-runtime-assets.js` 对 `PROJECT_ROOT` 的修复（从 `process.cwd()` 改为 `fileURLToPath(new URL("../..", import.meta.url))`）是正确的——使脚本在 package-local build 场景下（`cwd` 不是根目录）仍能正确解析 root 路径。
3. Package-level tsconfig（`tsconfig.json` / `tsconfig.build.json`）均使用 `rootDir: "../.."` + `outDir: "../../dist"`，与根配置对齐，结构合理。
4. `cli-output-contract.integration.test.ts` 中引入 `CliClaudeCodeExecFixtureEnvironmentKey` / `CliClaudeCodeExecFixtureMode` 的新依赖，扩展了测试确定性覆盖到 Claude Code adapter，是正确的扩展方向。
5. `run-repo-global-gates.js` 使用 top-level `await`（`await Promise.all(...)` 在模块顶层），要求 Node.js >= 14.8 的 ESM 环境，与仓库 ESM 约定兼容，无问题。
6. 上下文文档（current-context.md / completed-streams-history.md / plan.md / tasks.csv）的状态流转逻辑完整：sprint-001 → completed，sprint-002 → active，primary stream 指针已切换，delivery registry 引用已同步更新。
7. `technical-solution-delivery-registry.yaml` 中 `handoff_artifact_path` 仍指向 sprint-001 的 `DA-280` 文件（`sprint-001-repo-global-parallelization-and-fast-check-baseline/tasks/DA-280-*.md`）—— sprint-002 尚未完成，该字段不需要更新，属正常。

## 4. Verification

1. `node ./scripts/ci/run-repo-global-gates.js --output json`（需运行验证）
2. `node ./scripts/ci/run-gate-check.js --profile affected`（应返回 exit code 2 + deferred 提示）
3. `pnpm run check:fast`（需运行验证）
4. `pnpm vitest run --config vitest.integration.config.ts test/gate-runner-output.integration.test.ts`（需运行验证）
5. `node ./scripts/build/copy-runtime-assets.js --package shared`（需在完整 build 后验证）

## 复核结论（2026-03-28）

- 整体结论：**部分认可**

### 逐条复核

1. `2.1`
   - 判定：**不认可**
   - 证据：当前 sprint 的 package-level test 真实消费路径是 `pnpm turbo run typecheck test build --filter=@repo-ai-governor/core-memory-semantics...`；`packages/*/package.json` 中的 `test` 入口服务于 package-local pilot，保留自身 `build` 前置是为了让 package-local `dist` mirroring 与 cutover 语义保持一致。当前默认 gate 入口也未切换到根级 `turbo run test`，因此报告中的“误触发全量 build”在现行执行面未复现。
   - 处理：保持 `turbo.json` 现状，不作为当前阻塞项。
2. `2.2`
   - 判定：**认可**
   - 证据：`resolveTargetDistributionPackages` 之前依赖 `targetDistributionPackages.length !== selectedPackageNames.size` 判断未知包，隐含了 `DISTRIBUTION_PACKAGES.packageName` 全局唯一的前提；该逻辑在未来出现重复 `packageName` 时会产生误判。
   - 处理：已改为基于 `resolvedPackageNames` Set 差集判定未知 `--package` 目标，消除长度比较隐式前提。
3. `2.3`
   - 判定：**不认可**
   - 证据：`//#gate:fast` 与 `//#gate:check` 本身均为 `cache: false` 的根级任务；同一 pipeline 内依赖任务只执行一次属于 Turbo 预期行为。当前报告未提供可复现的 stale-cache 命中案例，现有 concern 更接近后续 `inputs` 精准化优化而非当前 defect。
   - 处理：不在本次 CR 修复窗口扩展为全量 cache `inputs` 重构，必要时另立优化项。
4. `2.4`
   - 判定：**认可**
   - 证据：`run-repo-global-gates.js` 在 JSON 模式下将失败 gate 的 `stderr` 预览截断到 500 字节，无法稳定容纳多行 governance / gate 诊断。
   - 处理：已将 JSON `stderr` 预览上限提升到 2000 字节，并补充回归测试覆盖失败输出。
5. `2.5`
   - 判定：**不认可**
   - 证据：`createDeterministicCliEnvironment` 先清理再按用例注入 `REPO_AI_GOVERNOR_*` 变量，目标正是去除本地 shell 噪音；当前行为是确定性增强而非 defect。
   - 处理：保留当前实现。
6. `2.6`
   - 判定：**不认可**
   - 证据：`tasks.csv` 采用 append-only execution ledger，重复 `task_id` + 新 `execution_id` 属于当前工作区约定；消费语义以最新执行记录为准，符合现行台账模型。
   - 处理：保留当前记录方式，不作为本次修复项。

### 验证命令

1. `pnpm exec biome check scripts/build/copy-runtime-assets.js scripts/ci/run-repo-global-gates.js test/gate-runner-output.integration.test.ts`（通过）
2. `pnpm vitest run --config vitest.integration.config.ts test/gate-runner-output.integration.test.ts`（通过）

## 修复执行记录（2026-03-28）

1. `2.2`：已完成
   - 变更文件：`scripts/build/copy-runtime-assets.js`
   - 验证：`pnpm exec biome check scripts/build/copy-runtime-assets.js scripts/ci/run-repo-global-gates.js test/gate-runner-output.integration.test.ts`（通过）
   - 说明：改用 resolved-name Set 差集判断未知 `--package` 目标，去除长度比较的隐式唯一性假设。
2. `2.4`：已完成
   - 变更文件：`scripts/ci/run-repo-global-gates.js`、`test/gate-runner-output.integration.test.ts`
   - 验证：`pnpm exec biome check scripts/build/copy-runtime-assets.js scripts/ci/run-repo-global-gates.js test/gate-runner-output.integration.test.ts`；`pnpm vitest run --config vitest.integration.config.ts test/gate-runner-output.integration.test.ts`（通过）
   - 说明：将 JSON 模式失败 `stderr` 预览上限提升到 2000 字节，并新增回归测试确保长错误上下文保留。
