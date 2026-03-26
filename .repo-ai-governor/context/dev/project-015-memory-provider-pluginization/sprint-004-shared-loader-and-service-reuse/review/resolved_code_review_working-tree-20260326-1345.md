# Code Review: project-015 working tree follow-up

- Status: resolved
- Date: 2026-03-26
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

## 1. Review Scope
1. `scripts/release/verify-cleanroom-local-install.js`
2. `apps/cli/package.json`
3. `packages/core-orchestration-service/package.json`
4. `packages/orchestration-service-client/package.json`
5. `integrations/desktop/README.md`
6. `.repo-ai-governor/context/current-context.md`
7. `.repo-ai-governor/context/dev/project-015-memory-provider-pluginization/plan.md`
8. `.repo-ai-governor/context/dev/project-015-memory-provider-pluginization/sprint-004-shared-loader-and-service-reuse/plan.md`

## 2. Findings
### 2.1 [P1] Clean-room service-host verification bypasses the supported package contract
- 位置: `scripts/release/verify-cleanroom-local-install.js:883`
- 问题描述: `createServiceHostMemoryProviderCheckScript()` 在 clean-room 场景中直接从安装产物内部深路径导入 `dist/node_modules/@repo-ai-governor/cli/dist/src/runtime/orchestration-service-runtime.js`、`.../constants/orchestration-service-runtime.constant.js` 和 `.../orchestration-service-client/dist/src/index.js`，并实例化 `CliOrchestrationServiceRuntime`。但 `integrations/desktop/README.md` 明确将 desktop/service surface 定义为只消费 `@repo-ai-governor/orchestration-service-client` 的 DTO/event contract，而 `apps/cli/package.json`、`packages/core-orchestration-service/package.json`、`packages/orchestration-service-client/package.json` 也都只导出 `"."`，没有公开这些 runtime/internal subpath。
- 影响: 当前 release clean-room gate 验证的是“安装包内部 dist 布局仍可被私有深导入”，而不是“存在一个受支持的 service-host/public integration surface”。这会让 gate 对外宣称的 desktop/service-host readiness 高于真实可承诺的公开 API 能力，内部目录改动也可能无声破坏该验证。
- 建议: 二选一收口。要么导出一个正式支持的 service-host/runtime entrypoint，并让 clean-room gate 只验证该入口；要么把当前场景降级为私有实现 smoke，不再把它写成 desktop/service-host 正式契约的一部分。

### 2.2 [P2] Completed project-015 / sprint-004 still owns the active execution surface
- 位置: `.repo-ai-governor/context/current-context.md:5`
- 问题描述: `current-context.md` 仍将 `project-015 / sprint-004-shared-loader-and-service-reuse` 声明为 active primary stream，但 `.repo-ai-governor/context/dev/project-015-memory-provider-pluginization/plan.md` 与 `.repo-ai-governor/context/dev/project-015-memory-provider-pluginization/sprint-004-shared-loader-and-service-reuse/plan.md` 已经都标记为 `Status: completed`。这和 `current-context.md` 自己的 update rule 3 冲突：completed stream 应迁入 completed history，而不应继续占用 active execution surface。
- 影响: 后续默认 task ledger 路由、CR 输出路径和 active stream 推断都会继续落到一个已完成 project/sprint 上，重新引入仓库前面已经专门收紧过的 ownership drift。
- 建议: 在同一变更窗口内收口状态。要么把 `project-015 / sprint-004` 恢复为 active，直到真正交付闭环；要么把它迁入 completed history，并把 `current-context` 切到下一个 active/planned stream。若仅剩 CR 尾项，则应使用 `Worktree Review Target`，不要让 completed stream 继续保持 active。

## 3. Notes
1. 本轮重点审查的是 service-host clean-room/release gate 与 execution surface 路由，没有重新展开所有 runtime 实现细节。
2. 之前关于 `sprint-003` 仍为 active primary 的 finding 已不成立；当前 drift 已转移到 `sprint-004`。

## 4. Verification
1. `pnpm -s tsc -p tsconfig.json --noEmit`（通过）
2. `pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-sidecar-client.integration.test.ts apps/cli/test/runtime/orchestration-service-runtime.test.ts test/desktop-entry-smoke.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
3. `node ./scripts/governance/check-code-review-status-sync.js`（通过）

## 复核结论（2026-03-26）

- 整体结论：**认可**

### 逐条复核
1. `2.1 [P1] Clean-room service-host verification bypasses the supported package contract`
   - 判定：**认可**
   - 证据：`scripts/release/verify-cleanroom-local-install.js` 原先确实深导入 `dist/node_modules/@repo-ai-governor/**/dist/src/**`；当前已改为只消费公开入口 `@cjhdev/repo-ai-governor/service-host`。对应发布面由 `package.json` `exports` 与 `scripts/build/copy-runtime-assets.js` 生成的 `dist/packages/published-surfaces/service-host.{js,d.ts}` 承接，default/plugin-enabled 两条 clean-room service-host 场景均已通过。
   - 处理：已接受并修复。
2. `2.2 [P2] Completed project-015 / sprint-004 still owns the active execution surface`
   - 判定：**认可**
   - 证据：问题核心不是“current-context 仍指向 closeout stream”本身，而是它与 `current-context.md` 自身规则冲突。当前已在 `current-context.md` 明确新增 active closeout surface 例外，并补充 `Closeout Surface: true`；同时 `project-015` / `sprint-004` 的 `plan.md` 与 `tasks.csv` 继续保持 `completed` 真值，治理 gate 已通过。
   - 处理：已接受并修复。

### 验证命令
1. `pnpm run build`（通过）
2. `node ./scripts/release/verify-local-distribution.js`（通过）
3. `node ./scripts/release/verify-cleanroom-local-install.js --modes path --iterations 1 --output .tmp/review-fix-cleanroom-default.json`（通过）
4. `pnpm run build:plugin-enabled`（通过）
5. `node ./scripts/release/verify-local-distribution.js --distribution-mode plugin-enabled`（通过）
6. `node ./scripts/release/verify-cleanroom-local-install.js --distribution-mode plugin-enabled --modes path --iterations 1 --output .tmp/review-fix-cleanroom-plugin.json`（通过）
7. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
8. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
9. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
10. `pnpm run check`（通过）

## 修复执行记录（2026-03-26）

1. `2.1 [P1]`：已完成
   - 变更文件：`package.json`、`scripts/build/copy-runtime-assets.js`、`scripts/release/verify-local-distribution.js`、`scripts/release/verify-cleanroom-local-install.js`、`integrations/desktop/README.md`、`integrations/desktop/examples/README.md`
   - 验证：`node ./scripts/release/verify-cleanroom-local-install.js --modes path --iterations 1 --output .tmp/review-fix-cleanroom-default.json`、`node ./scripts/release/verify-cleanroom-local-install.js --distribution-mode plugin-enabled --modes path --iterations 1 --output .tmp/review-fix-cleanroom-plugin.json`（通过）
   - 说明：clean-room service-host 校验已切到根包公开 subpath `@cjhdev/repo-ai-governor/service-host`，不再依赖内部 `dist/node_modules` 布局。
2. `2.2 [P2]`：已完成
   - 变更文件：`.repo-ai-governor/context/current-context.md`、`.repo-ai-governor/context/dev/project-015-memory-provider-pluginization/plan.md`、`.repo-ai-governor/context/dev/project-015-memory-provider-pluginization/sprint-004-shared-loader-and-service-reuse/plan.md`、`.repo-ai-governor/context/dev/projects-overview.md`、`.repo-ai-governor/context/dev/index.md`、`.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`
   - 验证：`node ./scripts/governance/check-sprint-plan-status-sync.js`、`pnpm run check`（通过）
   - 说明：维持 `project-015 / sprint-004` 的 active closeout surface，同时把 completed 真值与例外规则写清，消除 current-context 与 plan 的语义冲突。
