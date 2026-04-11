# TK-793 normalize user-config authoring into enabled-tools and projection canonical truth

- Status: completed
- Date: 2026-04-11
- Owner: AI-Agent
- Priority: P0
- Project: `project-089-local-user-config-and-secret-command-rollout`
- Sprint: `sprint-002-runtime-resolution-and-doctor-diagnostics`

## 1. 任务目标

把 `tools.<surface>.remoteApi.*` 与 `workspace.mode_preference` 这类 authoring path 稳定归一到 `enabled_tools[] / configured_remote_api / AgentDescriptor.selected_*` canonical truth。

## 2. Depends On

1. `TK-792`

## 3. 预期产物

1. canonical normalization path
2. transport / provider / vendor binding materialization
3. projection truth alignment

## 4. Required Inputs

1. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-onboarding-contract.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-projection-contract.md`

## 5. 实施计划

1. 先把 authoring path 收敛到 onboarding canonical truth。
2. 再把 projection / replay truth 与 `selected_*` 对齐。
3. 保持 `workspace.mode_preference` 只补默认、不覆盖共享真值。

## 6. Development Verification

1. `pnpm run build`
2. targeted onboarding / projection tests

## 7. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`

## 8. 执行记录

1. 2026-04-11：任务通过 `DA-786` 创建，当前保持 `planned`，等待 `TK-792` 完成后执行。
2. 2026-04-12：已完成 `user-config.yaml` authoring 到 canonical onboarding / projection truth 的归一化补强，包括 supported remote-api default `credentialEnvVar` materialization、session-main / governance runtime projection 接线，以及 global theme merge 写回不再 clobber canonical user-config。

## 9. 产出

1. `/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-089-local-user-config-and-secret-command-rollout/sprint-002-runtime-resolution-and-doctor-diagnostics/plan.md`
