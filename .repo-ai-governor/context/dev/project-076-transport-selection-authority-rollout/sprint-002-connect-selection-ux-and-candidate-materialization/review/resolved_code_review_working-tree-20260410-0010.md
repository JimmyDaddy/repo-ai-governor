# Code Review: sprint-002-connect-selection-ux-and-candidate-materialization

- Status: resolved
- Date: 2026-04-10
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

## 1. Review Scope

1. `apps/cli/src/main.ts`
2. `apps/cli/src/runtime/agent-onboarding-runtime.ts`
3. `apps/cli/src/runtime/agent-projection-runtime.ts`
4. `apps/cli/src/runtime/session-main-provider-continuation-runtime.ts`
5. `apps/cli/test/runtime/agent-onboarding-runtime.test.ts`
6. `apps/cli/test/runtime/agent-projection-runtime.test.ts`
7. `apps/cli/test/runtime/session-main-supervisor-runtime.test.ts`
8. `apps/cli/test/connect-phase2.integration.test.ts`

## 2. Findings

### 2.1 [P1] `--tool-transport` changed selected tool scope instead of only overriding transport

- 位置: `apps/cli/src/runtime/agent-onboarding-runtime.ts`
- 问题描述: `buildConnectCandidateConfig()` 把 override 的 `toolId` 并入 `requestedTools` 再交给 `resolveSelectedTools()`，导致 `--tool-transport codex=cli_exec` 在未显式传入 `--tools` 的情况下也会改变 candidate 的 tool set 与 role binding fallback。
- 影响: `connect` 生成的 candidate config 会偏离 multi-tool baseline，用户看到的是“单工具 transport override”，实际发生的是“工具集合被重写”。
- 建议: 把 selected-tool 解析与 transport override 解耦，并在 override 指向未选中工具时 fail-closed。

### 2.2 [P1] session.main continuation lane still projected `remote_api` truth from nested `remoteApi` config

- 位置: `apps/cli/src/runtime/session-main-provider-continuation-runtime.ts`
- 问题描述: continuation lane 仍然把 `remoteApi` 的存在视作 `remote_api` transport，即使当前 surface 已显式选成 `cli_exec`，从而继续沿用 remote_api lane 的 provider/model truth。
- 影响: 旧的 remote_api continuation handle 可能在显式 `cli_exec` 路径被错误复用，同时 CLI_EXEC 的 stream relay 会被误抑制。
- 建议: transport/provider/model 必须先跟 selected transport 走，只在 transport 未显式声明时才从 `remoteApi` 推断 `remote_api`。

### 2.3 [P2] new `--tool-transport` error paths bypassed i18n

- 位置: `apps/cli/src/main.ts`、`apps/cli/src/runtime/agent-onboarding-runtime.ts`
- 问题描述: parser 与 runtime validation 新增的错误信息直接返回英文字符串，没有经过 locale bridge。
- 影响: 违反 `CS-033`，并让 `zh-CN` CLI 输出在新路径上回退成单语英文。
- 建议: 新错误路径统一走 locale bridge，并为 `zh-CN` failure path 增加回归覆盖。

## 3. Notes

1. delegated reviewer 返回了 `2.1` 与 `2.3`；主 agent 在复核 explicit transport truth 时补充发现了 `2.2`。
2. 当前 round 的 accepted findings 已修复并复验通过，但按 scoped CR loop 规则，sprint-002 仍需再跑一轮 fresh reviewer recheck 才能进入 closeout。

## 4. Verification

1. `pnpm run build`（通过）
2. `pnpm exec vitest run packages/config/test/config.unit.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/agent-projection-runtime.test.ts apps/cli/test/runtime/session-main-supervisor-runtime.test.ts apps/cli/test/connect-phase2.integration.test.ts apps/cli/test/cli-output-contract.integration.test.ts apps/cli/test/commands/connect-command.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）

## 复核结论（2026-04-10）

- 整体结论：**认可**

### 逐条复核

1. `2.1`
   - 判定：**认可**
   - 证据：复核确认 `requestedTools=[]` + `toolTransportOverrides=[codex=cli_exec]` 会把 override surface 并入 selected tool set；修复后新增 unit/integration coverage 明确锁定 multi-tool baseline 不被 override 缩窄。
   - 处理：已接受并修复 selected-tool / transport-override 解耦与 fail-closed 校验。
2. `2.2`
   - 判定：**认可**
   - 证据：复核确认 continuation lane 会在 explicit `cli_exec` + nested `remoteApi` 场景继续沿用 remote_api handle truth；修复后新增 supervisor regression test，验证 stale handle 被 invalidated 且 CLI stream relay 仍会发布。
   - 处理：已接受并修复 selected transport -> continuation lane truth 的映射。
3. `2.3`
   - 判定：**认可**
   - 证据：复核确认 malformed / unsupported `--tool-transport` 错误会直接进入 CLI payload；修复后新增 `zh-CN` integration coverage，验证 parser/runtime failure path 都会走 locale bridge。
   - 处理：已接受并修复 parser/runtime 新错误路径的 i18n 输出。

### 验证命令

1. `pnpm run build`（通过）
2. `pnpm exec vitest run packages/config/test/config.unit.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/agent-projection-runtime.test.ts apps/cli/test/runtime/session-main-supervisor-runtime.test.ts apps/cli/test/connect-phase2.integration.test.ts apps/cli/test/cli-output-contract.integration.test.ts apps/cli/test/commands/connect-command.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）

## 修复执行记录（2026-04-10）

1. `2.1`：已完成
   - 变更文件：`apps/cli/src/runtime/agent-onboarding-runtime.ts`、`apps/cli/src/commands/connect-command.ts`、`apps/cli/test/runtime/agent-onboarding-runtime.test.ts`、`apps/cli/test/connect-phase2.integration.test.ts`
   - 验证：`pnpm run build`；`pnpm exec vitest run packages/config/test/config.unit.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/agent-projection-runtime.test.ts apps/cli/test/runtime/session-main-supervisor-runtime.test.ts apps/cli/test/connect-phase2.integration.test.ts apps/cli/test/cli-output-contract.integration.test.ts apps/cli/test/commands/connect-command.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
   - 说明：selected tools 不再被 transport override 隐式改写，未被选中的 override target 也会 fail-closed。
2. `2.2`：已完成
   - 变更文件：`apps/cli/src/runtime/session-main-provider-continuation-runtime.ts`、`apps/cli/test/runtime/session-main-supervisor-runtime.test.ts`
   - 验证：`pnpm run build`；`pnpm exec vitest run packages/config/test/config.unit.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/agent-projection-runtime.test.ts apps/cli/test/runtime/session-main-supervisor-runtime.test.ts apps/cli/test/connect-phase2.integration.test.ts apps/cli/test/cli-output-contract.integration.test.ts apps/cli/test/commands/connect-command.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
   - 说明：continuation lane 现在跟 selected transport 对齐，显式 `cli_exec` 不再沿用 nested `remoteApi` truth。
3. `2.3`：已完成
   - 变更文件：`apps/cli/src/main.ts`、`apps/cli/src/runtime/agent-onboarding-runtime.ts`、`apps/cli/src/commands/connect-command.ts`、`apps/cli/test/connect-phase2.integration.test.ts`
   - 验证：`pnpm run build`；`pnpm exec vitest run packages/config/test/config.unit.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/agent-projection-runtime.test.ts apps/cli/test/runtime/session-main-supervisor-runtime.test.ts apps/cli/test/connect-phase2.integration.test.ts apps/cli/test/cli-output-contract.integration.test.ts apps/cli/test/commands/connect-command.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
   - 说明：新增的 parser/runtime 错误已改走 locale bridge，并补了 `zh-CN` 失败路径回归。

## 处置结果与剩余风险

1. 本轮 accepted findings 已全部修复并通过 build + 定向回归。
2. sprint-002 仍需新的 fresh reviewer round；只有最新 round 报告无 actionable finding 后，当前边界才允许进入 sprint closeout。
