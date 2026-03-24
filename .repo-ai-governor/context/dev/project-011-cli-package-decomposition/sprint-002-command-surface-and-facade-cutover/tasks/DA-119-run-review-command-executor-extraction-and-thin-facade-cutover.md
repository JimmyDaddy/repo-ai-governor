# DA-119 run/review command executor 抽离与 thin facade cutover

- Status: active
- Date: 2026-03-24
- Owner: AI-Agent
- Artifact ID: `DA-119`
- Produced By: `TK-121`
- Scope: `project-011-cli-package-decomposition`

## 1. 目的

固化 `run/review/review-verify` 命令链在 CLI package 中的最终 command-surface 收敛方式，并将 `CliGovernanceRuntime` 收敛为“workspace bootstrap + registry dispatch + governance runtime orchestration + error boundary”的薄 façade。

## 2. 当前收敛结果

1. `review` 与 `review-verify` 已迁入 `apps/cli/src/commands/*`。
2. `run` 已接入 `CliCommandRegistry`。
   - 新增 `CliRunCommand`
   - `CliGovernanceRuntime.execute()` 不再保留 `RUN` 的特殊分支判断，所有对外命令统一通过 registry 分发
3. `CliGovernanceRuntime` 保留的职责已经收敛为 runtime 编排层。
   - workspace bootstrap
   - command executor context 组装
   - `run` 主链 / replay 的治理编排
   - 统一错误出口

## 3. 为什么 `run` 编排逻辑仍保留在 runtime

1. `run` 的核心职责属于 `Governance Core Layer` 与 `Agent Runtime & Adapter Layer` 交界处的运行时编排，而不是单纯的 entry-layer 命令壳。
2. 本轮 cutover 的目标不是把编排逻辑机械搬走，而是避免 façade 继续承担“命令分发 + 命令表面 + 特殊命令旁路”的多重责任。
3. 因此本轮采用“command-surface 抽离 + orchestration 留在 runtime”的收敛方式，既保持边界清晰，也不把运行时编排拆碎。

## 4. 验证证据

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm -s vitest run apps/cli/test/commands/cli-command-registry.test.ts apps/cli/test/cli-governance-runtime.integration.test.ts --maxWorkers=1 --maxConcurrency=1`
3. `pnpm run test:packages -- @repo-ai-governor/cli --maxWorkers=1 --maxConcurrency=1`

## 5. 当前结论

1. 当前状态：`thin_facade_cutover_completed`
2. 结论：`CliGovernanceRuntime` 已不再保留命令级旁路分发，`run/review/review-verify` 的 command surface 已全部纳入 registry/commands 边界。
3. 对后续任务的约束：后续 CLI 能力扩展优先落在 `commands/*` 或 `runtime/*` 对应 bounded context 中，不得重新向 façade 回填命令壳职责。
