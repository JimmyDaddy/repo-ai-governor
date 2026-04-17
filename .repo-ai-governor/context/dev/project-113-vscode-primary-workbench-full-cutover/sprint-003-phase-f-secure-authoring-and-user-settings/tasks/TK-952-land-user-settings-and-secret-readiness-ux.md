# TK-952 land user settings and secret readiness ux

- Status: completed
- Date: 2026-04-17
- Owner: AI-Agent
- Priority: P1
- Project: `project-113-vscode-primary-workbench-full-cutover`
- Sprint: `sprint-003-phase-f-secure-authoring-and-user-settings`

## 1. 任务目标

在 VS Code primary workbench 内收口 user settings、secret readiness 与 trust-sensitive UX。

## 2. Depends On

1. implement secure authoring seams and redaction baseline

## 3. 预期产物

1. secure authoring ux artifact for TK-952
2. task card update for TK-952
3. aligned checklist/tasks.csv ledger views

## 4. Required Inputs

1. apps/vscode-extension/README.md
2. .repo-ai-governor/context/dev/project-088-local-user-config-and-secret-command-promotion-and-decomposition/sprint-001-promotion-and-followup-decomposition/tasks/DA-786-local-user-config-promotion-and-rollout-decomposition-handoff.md
3. .repo-ai-governor/context/current-context.md
4. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-003-phase-f-secure-authoring-and-user-settings/plan.md

## 5. Traceback References

1. .repo-ai-governor/context/dev/project-091-session-shell-secure-secret-input-promotion-and-decomposition/sprint-001-review-promotion-and-followup-decomposition/tasks/DA-804-session-shell-secure-secret-input-promotion-and-rollout-decomposition-handoff.md
2. docs/local-adoption-playbook.zh-CN.md
3. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/plan.md
4. .repo-ai-governor/normative_knowledge_sources/governance/task-card-template.md

## 6. 实施计划

1. 确认本任务边界、依赖与预期产物。
2. 按标准模板推进实现或治理动作。
3. 完成 ledger sync 与必要验证后更新产出。

## 7. Development Verification

1. pnpm run build
2. pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-host.activation.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts
2. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-003-phase-f-secure-authoring-and-user-settings/tasks" --task-id TK-952

## 8. Delivery Verification

1. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-003-phase-f-secure-authoring-and-user-settings/tasks" --task-id TK-952
2. node ./scripts/governance/check-task-required-inputs.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-003-phase-f-secure-authoring-and-user-settings/tasks" --task-id TK-952
3. node ./scripts/governance/check-task-ledger-sync.js
4. node ./scripts/governance/check-sprint-plan-status-sync.js

## 9. 执行记录

1. 2026-04-17：任务创建，状态初始化为 `planned`。
2. 2026-04-17：当前任务切换为 `in_progress`，开始把 user settings、secret readiness 与 trust-sensitive UX 从 scaffold 补成 editor-native quick pick / password prompt 行为。
3. 2026-04-17：`VsCodeExtensionCommandController` 已补齐 `openUserConfig / configureUserDefault / setManagedSecret` 三个 trust-gated command；workbench overview / workflow studio 现可投影 user-local defaults、selector readiness 与 backend availability，并允许从 secure-authoring 节点直接触发配置或 secret rotation。
4. 2026-04-17：`apps/vscode-extension/package.json`、`package.nls*.json` 与 host/contract/presentation tests 已同步新增命令贡献、激活事件、本地化标题与 embedded CLI 依赖，`pnpm run build` 与 5 个 VS Code extension 定向 vitest 已通过，当前任务切换为 `completed`。

## 10. 产出

1. `apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts`、`vscode-extension-presentation-builder.ts` 与 `apps/vscode-extension/package.json` 已完成 Phase F UX 收口：用户可以在 trusted workspace 中原生查看 canonical user-config、配置 user-local defaults，并通过 password input 写入 managed secret。
2. `apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts`、`vscode-extension-contract.test.ts`、`vscode-extension-host.activation.test.ts` 与 `vscode-extension-presentation-builder.test.ts` 已锁定 secure authoring 节点、命令贡献与 trust-gated UX 行为。
