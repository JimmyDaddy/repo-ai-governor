# Code Review: project-020 working tree

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
1. `apps/cli/src/commands/workspace-command.ts`
2. `apps/cli/src/main.ts`
3. `apps/cli/test/commands/workspace-command.test.ts`
4. `apps/cli/test/cli-output-contract.integration.test.ts`
5. `.repo-ai-governor/context/dev/project-020-adoption-productization-and-upgrade-ux/plan.md`
6. `.repo-ai-governor/context/current-context.md`

## 2. Findings
### 2.1 [P1] `workspace execute` does not actually cut future CLI runs over to the migrated workspace
- 位置: `apps/cli/src/commands/workspace-command.ts:63`
- 问题描述: `workspace execute` 现在只会基于当前 `context.options.workspace.configPath` 读取现有配置、生成 migration plan，并调用 `WorkspaceMigrationService.execute(plan)` 将 source workspace 复制/切换到 target root，同时把 plan/execution artifacts 继续写回当前 source workspace (`context.options.workspace.workspaceRoot`)。整个流程没有更新任何用于后续启动解析的配置入口。与此同时，CLI 启动仍在 `apps/cli/src/main.ts:484` 优先查找仓库内 `.repo-ai-governor/governor.yaml`，只要 repo-local config 还在，就会继续把 repo-local workspace 解析成下一次运行的有效工作区。
- 影响: 这条命令对 adopter 暴露为正式 `execute` 用户路径，但执行后并不会改变下一次 CLI 的真实 workspace 归属。用户会看到“migration executed successfully”，实际后续命令仍沿用旧 workspace surface，导致 cutover 语义失真，`rollback` 也退化成对一条从未成为 active surface 的副本进行清理。
- 建议: 在 `execute` 成功后补上真正的 cutover 持久化。至少需要让后续 `resolveRuntimeContext()` 不再优先落回旧 repo-local config：例如显式更新当前 config 的 workspace mode/root、或引入稳定的 migration marker/switch record 并纳入启动解析优先级。现有测试只覆盖“目标目录存在”和 artifact 生成，不足以证明下一次 CLI 运行已经切到新 workspace。

### 2.2 [P1] `workspace rollback` can recreate the just-removed target surface via its own artifact write
- 位置: `apps/cli/src/commands/workspace-command.ts:362`
- 问题描述: rollback artifact 现在固定写到 `context.options.workspace.workspaceRoot/context/workspace/...`。一旦 `workspace execute` 真正把下一次运行切到了 target workspace，后续显式 `rollback` 的 runtime context 会把 `workspaceRoot` 解析成 target root。`WorkspaceMigrationService.rollback(plan)` 刚删除 target root，命令随后又会为了写 `rollback.json` 在同一路径下重新创建目录。
- 影响: 用户会看到 rollback 成功，但 target root 会被 artifact 写回副作用重新创建，直接破坏“target surface 已移除”的恢复语义，也会让 follow-up health check 得到错误事实。
- 建议: rollback artifact 必须写到稳定的 source-side location，不能绑定当前 active workspace root。

### 2.3 [P2] explicit rollback is incorrectly blocked by the current config path precondition
- 位置: `apps/cli/src/commands/workspace-command.ts:66`
- 问题描述: `execute()` 在分支到 rollback 之前就检查 `context.options.workspace.configPath` 是否存在。这会把 `workspace --workspace-action rollback --workspace-plan ...` 错误地绑定到“当前 runtime 还能解析出有效 config”的前提上。
- 影响: 一旦 cutover 后 target config 丢失、路径漂移，或者用户明确想用 persisted plan 做恢复，命令会在真正读取 plan artifact 之前就被错误拦截。
- 建议: rollback 分支应只依赖 `--workspace-plan` 和 plan artifact，可在进入 rollback 分支后跳过当前 config 存在性检查。

## 3. Notes
1. 之前针对“completed sprint 仍挂在 active primary stream”的旧 finding 不直接适用于当前 working tree。`current-context.md` 现在显式允许最近完成但仍承担 closeout/CR 尾项的 stream 暂时保留为 active closeout surface。
2. 本轮最关键的问题是用户可感知语义漂移：`workspace execute` 的命令文案与真正的 runtime cutover 结果不一致。

## 4. Verification
1. `pnpm -s tsc -p tsconfig.json --noEmit`（通过）
2. `pnpm exec vitest run apps/cli/test/commands/workspace-command.test.ts apps/cli/test/cli-governance-runtime.integration.test.ts apps/cli/test/cli-output-contract.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
3. `node ./scripts/governance/check-code-review-status-sync.js`（通过）

## 复核结论（2026-03-26）
1. 复核确认 `workspace-command` 这条路径一共有 3 个有效问题，且都直接影响 adopter-facing cutover/rollback 语义。
2. `2.1`、`2.2`、`2.3` 已接受并在同一变更集中修复，没有保留待后续处理的已接受问题。
3. 修复后重新验证通过：
   - `pnpm -s tsc -p tsconfig.json --noEmit`
   - `pnpm exec vitest run apps/cli/test/commands/workspace-command.test.ts apps/cli/test/commands/cli-command-registry.test.ts apps/cli/test/cli-governance-runtime.integration.test.ts apps/cli/test/cli-output-contract.integration.test.ts apps/cli/test/cli-skeleton.integration.test.ts --maxWorkers=1 --maxConcurrency=1`
   - `pnpm run check`

## 修复执行记录（2026-03-26）
1. 在 `apps/cli/src/commands/workspace-command.ts` 中补上了 cutover config 持久化：`workspace execute` 成功后会把 target workspace contract 写回 target config，并同步写 repo-local selector config，确保后续 CLI 运行真正切到 target workspace。
2. 显式 `rollback` 改为只依赖 persisted plan artifact；当前 runtime config 缺失时不再提前失败。
3. rollback artifact 改为写回 plan 的 source workspace root，避免在真实 cutover 后把刚移除的 target root 重新创建出来。
4. 在 `apps/cli/test/commands/workspace-command.test.ts` 增补了回归覆盖：校验 execute 后的 selector/config 持久化、target-context 下 rollback 的恢复路径，以及“当前 config 缺失仍可 rollback”的场景。
