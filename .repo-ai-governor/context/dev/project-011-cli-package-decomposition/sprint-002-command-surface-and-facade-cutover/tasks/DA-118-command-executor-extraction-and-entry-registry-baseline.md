# DA-118 command executor 与 entry registry 抽离基线产物

- Status: active
- Date: 2026-03-24
- Owner: AI-Agent
- Artifact ID: `DA-118`
- Produced By: `TK-120`
- Scope: `project-011-cli-package-decomposition`

## 1. 目的

固化 `TK-120` 对 CLI command surface 的第二轮 cutover 结果，明确 `init/connect/doctor/check/verify/plan/upgrade` 已从 `CliGovernanceRuntime` 中迁出到 `commands/*` 与统一 entry registry，并为后续 `TK-121` 的 `run/review` 高复杂度 cutover 提供稳定入口边界。

## 2. 本轮交付

1. 新增 `apps/cli/src/commands/cli-command-registry.ts`
   - 提供 extracted command executor 的稳定查找表，成为 facade 的唯一低复杂度命令分发表。
   - 对重复 `commandName` 注册执行 fail-fast，避免静默覆盖 command surface。
2. 新增 `apps/cli/src/commands/init-command.ts`、`connect-command.ts`、`doctor-command.ts`、`check-command.ts`、`verify-command.ts`、`plan-command.ts`、`upgrade-command.ts`
   - 将非 `run/review` 命令的执行语义迁出 `CliGovernanceRuntime`，每个命令单独承接 bounded context 内的执行责任。
3. 新增 `apps/cli/src/types/interfaces/cli-governance-runtime.interface.ts`
   - 固化 facade 与 command executors 之间的共享上下文契约，统一 artifact writer、adapter diagnostics、experience builder、runtime debug options 与 common helper 接口。
4. 更新 `apps/cli/src/cli-governance-runtime.ts`
   - 通过 `CliCommandRegistry` 统一调度 extracted executors。
   - 不再直接持有 `init/connect/doctor/check/verify/plan/upgrade` 的命令实现。
   - 当前文件长度降至 `1635` 行，相比 `TK-119` 收口后的 `2502` 行再减少 `867` 行。

## 3. 测试与验证覆盖

1. 新增 `apps/cli/test/commands/cli-command-registry.test.ts`
   - 直接覆盖 extracted commands 全量注册契约与 duplicate registration guard。
2. 既有 `apps/cli/test/cli-governance-runtime.integration.test.ts` 保持通过
   - 确认 facade 仍可正确分发 CLI commands，并保持现有命令输出契约稳定。
   - 额外补齐 `runtime.execute()` 对 `init/check/plan/upgrade` 的 dispatch smoke，锁定 registry lookup + facade dispatch + shared context 链路。
3. `pnpm run test:packages -- @repo-ai-governor/cli --maxWorkers=1 --maxConcurrency=1` 通过
   - 证明 CLI package 在 command surface cutover 后没有破坏现有 unit/integration 基线。

## 4. 边界结论

1. `commands/*` 当前仍属于 CLI package-local command surface，不上提 shared。
2. facade 当前主要保留 workspace bootstrap、`run/review/review-verify` 高复杂度命令、runtime helper 与统一错误出口。
3. `TK-121` 应直接消费 `DA-118`，继续迁出 `run/review` 命令，而不是让新的自动主链逻辑重新回填到 `CliGovernanceRuntime`。

## 5. 对 TK-121 / TK-122 的输入约束

1. `TK-121` 必须复用 `CliCommandRegistry` 与 `CliCommandExecutorContext`，保持 single-dispatch contract，不得重新引入平行的命令分发路径。
2. `run/review` 抽离时允许通过 command context 继续消费 package-local runtime/presentation/artifact 模块，但不得把这些责任回流到 facade。
3. `TK-122` 的 sprint-002 出口验收应显式验证 facade 是否只剩 command dispatch、依赖装配和统一错误出口三类职责。
