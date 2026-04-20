# TK-951 implement secure authoring seams and redaction baseline

- Status: completed
- Date: 2026-04-17
- Owner: AI-Agent
- Priority: P1
- Project: `project-113-vscode-primary-workbench-full-cutover`
- Sprint: `sprint-003-phase-f-secure-authoring-and-user-settings`

## 1. 任务目标

补齐 secret mutation request、redaction baseline 与 secure authoring service seam。

## 2. Depends On

1. freeze phase-f secure authoring boundary

## 3. 预期产物

1. secure authoring seam artifact for TK-951
2. task card update for TK-951
3. aligned checklist/tasks.csv ledger views

## 4. Required Inputs

1. .repo-ai-governor/context/dev/project-091-session-shell-secure-secret-input-promotion-and-decomposition/sprint-001-review-promotion-and-followup-decomposition/tasks/DA-804-session-shell-secure-secret-input-promotion-and-rollout-decomposition-handoff.md
2. .repo-ai-governor/context/dev/project-088-local-user-config-and-secret-command-promotion-and-decomposition/sprint-001-promotion-and-followup-decomposition/tasks/DA-786-local-user-config-promotion-and-rollout-decomposition-handoff.md
3. .repo-ai-governor/context/current-context.md
4. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-003-phase-f-secure-authoring-and-user-settings/plan.md

## 5. Traceback References

1. .repo-ai-governor/context/dev/project-101-cli-exec-followup-solution-review-and-promotion/sprint-001-launch-authoring-contract-tests/tasks/DA-846-cli-exec-launch-authoring-contract-tests-promotion-cutover.md
2. .repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/module-overview.md
3. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/plan.md
4. .repo-ai-governor/normative_knowledge_sources/governance/task-card-template.md

## 6. 实施计划

1. 确认本任务边界、依赖与预期产物。
2. 按标准模板推进实现或治理动作。
3. 完成 ledger sync 与必要验证后更新产出。

## 7. Development Verification

1. pnpm run build
2. pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-host.activation.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts
2. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-003-phase-f-secure-authoring-and-user-settings/tasks" --task-id TK-951

## 8. Delivery Verification

1. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-003-phase-f-secure-authoring-and-user-settings/tasks" --task-id TK-951
2. node ./scripts/governance/check-task-required-inputs.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-003-phase-f-secure-authoring-and-user-settings/tasks" --task-id TK-951
3. node ./scripts/governance/check-task-ledger-sync.js
4. node ./scripts/governance/check-sprint-plan-status-sync.js

## 9. 执行记录

1. 2026-04-17：任务创建，状态初始化为 `planned`。
2. 2026-04-17：当前任务切换为 `in_progress`，开始把 secure authoring readiness、redaction baseline 与 managed secret mutation 全部收口到 embedded CLI seam，而不是在 VS Code 扩展内重写 config/secret 规则。
3. 2026-04-17：`VsCodeExtensionServiceRuntime` 已补齐 secure authoring snapshot cache、`config/secret status/list` 解析、`setUserConfigValue()`、`setManagedSecret()` 与 degraded snapshot fallback；managed secret 写入固定使用 `stdin`，不把 raw secret 放到 argv、preview 或 UI message 中。
4. 2026-04-17：`apps/vscode-extension/test/vscode-extension-service-runtime.test.ts` 已补齐 embedded CLI contract/caching 覆盖，`pnpm run build` 与 5 个 VS Code extension 定向 vitest 已通过，当前任务切换为 `completed`。

## 10. 产出

1. `apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts` 已冻结 Phase F secure authoring seam：config/secret diagnostics 通过 embedded CLI JSON payload 投影为 additive snapshot；失败时回到 `degradedReason`，不会阻断 workbench 渲染。
2. `apps/vscode-extension/test/vscode-extension-service-runtime.test.ts` 已锁定 stdin-only managed secret mutation contract、selector unresolved 诊断与 per-repository secure authoring cache 行为。
