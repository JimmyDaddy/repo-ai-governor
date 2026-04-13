# TK-821 establish shared native cli_exec process runtime and adapter-authored resolved launch plan seam

- Status: planned
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
