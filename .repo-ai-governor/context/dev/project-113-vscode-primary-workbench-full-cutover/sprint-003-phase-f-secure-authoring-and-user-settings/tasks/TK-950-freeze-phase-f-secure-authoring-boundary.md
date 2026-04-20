# TK-950 freeze phase-f secure authoring boundary

- Status: completed
- Date: 2026-04-17
- Owner: AI-Agent
- Priority: P1
- Project: `project-113-vscode-primary-workbench-full-cutover`
- Sprint: `sprint-003-phase-f-secure-authoring-and-user-settings`

## 1. 任务目标

冻结 secure authoring、user settings、secret readiness 与 trust-sensitive interaction boundary。

## 2. Depends On

1. prepare sprint-002 exit acceptance and phase-f handoff

## 3. 预期产物

1. secure authoring contract artifact for TK-950
2. task card update for TK-950
3. aligned checklist/tasks.csv ledger views

## 4. Required Inputs

1. .repo-ai-governor/context/dev/project-091-session-shell-secure-secret-input-promotion-and-decomposition/sprint-001-review-promotion-and-followup-decomposition/tasks/DA-804-session-shell-secure-secret-input-promotion-and-rollout-decomposition-handoff.md
2. .repo-ai-governor/context/dev/project-088-local-user-config-and-secret-command-promotion-and-decomposition/sprint-001-promotion-and-followup-decomposition/tasks/DA-786-local-user-config-promotion-and-rollout-decomposition-handoff.md
3. .repo-ai-governor/context/current-context.md
4. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-003-phase-f-secure-authoring-and-user-settings/plan.md

## 5. Traceback References

1. .repo-ai-governor/context/dev/project-111-vscode-workbench-solution-promotion-and-decomposition/sprint-001-promotion-and-rollout-handoff/tasks/DA-934-vscode-workbench-promotion-and-rollout-decomposition-handoff.md
2. .repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/vscode-governance-workbench-surface-contract.md
3. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/plan.md
4. .repo-ai-governor/normative_knowledge_sources/governance/task-card-template.md

## 6. 实施计划

1. 确认本任务边界、依赖与预期产物。
2. 按标准模板推进实现或治理动作。
3. 完成 ledger sync 与必要验证后更新产出。

## 7. Development Verification

1. pnpm run build
2. pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-host.activation.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts
2. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-003-phase-f-secure-authoring-and-user-settings/tasks" --task-id TK-950

## 8. Delivery Verification

1. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-003-phase-f-secure-authoring-and-user-settings/tasks" --task-id TK-950
2. node ./scripts/governance/check-task-required-inputs.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-003-phase-f-secure-authoring-and-user-settings/tasks" --task-id TK-950
3. node ./scripts/governance/check-task-ledger-sync.js
4. node ./scripts/governance/check-sprint-plan-status-sync.js

## 9. 执行记录

1. 2026-04-17：任务创建，状态初始化为 `planned`。
2. 2026-04-17：随着 sprint-002 在 `CR-003` clean round 后完成 closeout，当前任务已切换为 `in_progress`，开始从 clean baseline 冻结 secure authoring、user settings、secret readiness 与 trust-sensitive interaction boundary。
3. 2026-04-17：已将 Phase F boundary 冻结为“VS Code 只通过 embedded CLI `config|secret status/list/set` JSON contract 投影和写入 secure authoring truth；`user-config.yaml` 与 secret backend 仍保持 CLI/runtime canonical ownership，不在扩展内复制第二份 config/secret state”。
4. 2026-04-17：`repoAiGovernor.openUserConfig`、`repoAiGovernor.configureUserDefault` 与 `repoAiGovernor.setManagedSecret` 已纳入 trust-gated command surface；同窗口 `pnpm run build` 与 5 个 VS Code extension 定向 vitest 已通过，当前任务切换为 `completed`。

## 10. 产出

1. Phase F secure authoring boundary 已固定为：扩展 host 只负责 editor-native UX、service-backed projection 与 stdin-only mutation handoff；canonical user config 与 managed secret backend 真值继续由 embedded CLI/runtime 持有。
2. `apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts`、`vscode-extension-service-runtime.ts`、`vscode-extension-presentation-builder.ts` 与 `apps/vscode-extension/package.json` 已对齐同一 Phase F contract，不把 secure authoring 真值散落到 extension-local state。
