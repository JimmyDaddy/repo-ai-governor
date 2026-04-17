# TK-943 implement onboarding aggregation facade and diagnostics seams

- Status: completed
- Date: 2026-04-17
- Owner: AI-Agent
- Priority: P1
- Project: `project-113-vscode-primary-workbench-full-cutover`
- Sprint: `sprint-001-phase-d-onboarding-cutover`

## 1. 任务目标

补齐 onboarding/readiness aggregation facade、diagnostics seam 与 receipt/backlink baseline。

## 2. Depends On

1. freeze phase-d onboarding contract

## 3. 预期产物

1. onboarding service seam artifact for TK-943
2. task card update for TK-943
3. aligned checklist/tasks.csv ledger views

## 4. Required Inputs

1. .repo-ai-governor/context/dev/project-108-adopter-quickstart-bootstrap-rollout/sprint-001-quickstart-contract-and-bootstrap-runtime-baseline/tasks/DA-900-adopter-quickstart-bootstrap-promotion-and-rollout-handoff.md
2. .repo-ai-governor/context/dev/project-101-cli-exec-followup-solution-review-and-promotion/sprint-003-onboarding-adoption-readiness/tasks/DA-852-cli-exec-onboarding-and-adoption-readiness-promotion-cutover.md
3. .repo-ai-governor/context/current-context.md
4. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-001-phase-d-onboarding-cutover/plan.md

## 5. Traceback References

1. .repo-ai-governor/context/dev/project-111-vscode-workbench-solution-promotion-and-decomposition/sprint-001-promotion-and-rollout-handoff/tasks/DA-934-vscode-workbench-promotion-and-rollout-decomposition-handoff.md
2. .repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/module-overview.md
3. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/plan.md
4. .repo-ai-governor/normative_knowledge_sources/governance/task-card-template.md

## 6. 实施计划

1. 确认本任务边界、依赖与预期产物。
2. 按标准模板推进实现或治理动作。
3. 完成 ledger sync 与必要验证后更新产出。

## 7. Development Verification

1. pnpm run build
2. pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-host.activation.test.ts
3. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-001-phase-d-onboarding-cutover/tasks" --task-id TK-943

## 8. Delivery Verification

1. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-001-phase-d-onboarding-cutover/tasks" --task-id TK-943
2. node ./scripts/governance/check-task-required-inputs.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-001-phase-d-onboarding-cutover/tasks" --task-id TK-943
3. node ./scripts/governance/check-task-ledger-sync.js
4. node ./scripts/governance/check-sprint-plan-status-sync.js

## 9. 执行记录

1. 2026-04-17：任务创建，状态初始化为 `planned`。
2. 2026-04-17：当前任务切换为 `in_progress`，开始把 chat-dependent activation 流程拆成 capability probe 与 optional participant seam，避免 chat API 缺失时整条 host wiring 失败。
3. 2026-04-17：`VsCodeExtensionHost` 已补齐 `createOptionalChatParticipant()` 与 `hasChatParticipantSupport()`，chat participant runtime 仅在 `vscode.chat.createChatParticipant` 可用时注册；core command/controller/provider wiring 保持原位注册，不再与 chat capability 强耦合。
4. 2026-04-17：已完成 `pnpm run build` 与 VS Code extension 的 3 个定向 vitest，确认 optional participant seam 与现有 service runtime / controller-provider contract 同窗口通过；当前任务切换为 `completed`。

## 10. 产出

1. `apps/vscode-extension/src/runtime/vscode-extension-host.ts` 已引入 optional chat participant seam，使 host activation 在缺失 chat API 时仍可注册 core Governor workbench surface。
2. Phase D implementation boundary 已显式保留 `VsCodeExtensionChatParticipantRuntime` 作为可选增强能力，而不是删除对话能力。
