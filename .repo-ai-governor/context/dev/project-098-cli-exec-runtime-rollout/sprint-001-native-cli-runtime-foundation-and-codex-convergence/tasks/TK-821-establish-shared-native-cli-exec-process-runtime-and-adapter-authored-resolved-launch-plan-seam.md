# TK-821 establish shared native cli_exec process runtime and adapter-authored resolved launch plan seam

- Status: completed
- Date: 2026-04-13
- Owner: AI-Agent
- Priority: P0
- Project: `project-098-cli-exec-runtime-rollout`
- Sprint: `sprint-001-native-cli-runtime-foundation-and-codex-convergence`

## 1. 任务目标

建立 shared native `cli_exec` process runtime，并把 adapter-authored `resolved launch plan` 固定为唯一 launch authoring seam。

## 2. Depends On

1. `DA-819`

## 3. 预期产物

1. shared process runtime baseline
2. adapter-authored launch-plan seam
3. native `cli_exec` owner convergence

## 4. Required Inputs

1. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/module-overview.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/native-cli-exec-runtime-hardening-and-explicit-acp-extension-seam.md`
3. `packages/adapter-sdk/src/agent-cli-exec-operations-runtime.ts`

## 5. 实施计划

1. 抽 shared native runtime，不让 adapter 重复维护 `spawn / timeout / terminate` 热路径。
2. 保持 `resolved_entrypoint / shell_strategy / process_tree_policy / request_cancellation_mode` 由 adapter authoring。
3. 明确 shared runtime 只消费 launch plan，不反向拥有 command resolution。

## 6. Development Verification

1. `pnpm run build`
2. targeted runtime / adapter regression verification

## 7. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`

## 8. 执行记录

1. 2026-04-13：任务通过 `DA-819` 创建，当前保持 `planned`，等待 `project-098 / sprint-001` 激活后执行。
2. 2026-04-13：任务状态切换为 `active`；`project-098 / sprint-001` 已激活，并在 `packages/adapter-sdk` 新增 shared `NativeCliExecProcessRuntime`、launch-plan contract 与 focused runtime unit coverage，shared runtime owner 从 helper 演进为真正的 native process lifecycle owner。
3. 2026-04-13：已完成 `pnpm run build`、`pnpm exec vitest run packages/adapter-sdk/test/native-cli-exec-process-runtime.unit.test.ts packages/adapter-sdk/test/agent-cli-exec-operations-runtime.unit.test.ts packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts`；当前等待 sprint-001 fresh reviewer 对 shared runtime foundation 做 clean recheck。
4. 2026-04-13：fresh reviewer 返回 shared runtime 非零退出成功化与缺少 failing-exit regression 两条 actionable findings；主 agent 已全部认可并修复 `NativeCliExecProcessRuntime` 的 close-path 失败语义、补充 `exitCode=7` regression case，并通过 `pnpm run build`、focused Codex/runtime suite、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1` 与 `pnpm run check`，任务收口为 `completed`。
