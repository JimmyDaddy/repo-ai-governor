# TK-953 prepare sprint-003 exit acceptance and phase-g handoff

- Status: completed
- Date: 2026-04-17
- Owner: AI-Agent
- Priority: P1
- Project: `project-113-vscode-primary-workbench-full-cutover`
- Sprint: `sprint-003-phase-f-secure-authoring-and-user-settings`

## 1. 任务目标

写回 Phase F exit evidence、handoff boundary 与 Phase G activation-ready inputs。

## 2. Depends On

1. land user settings and secret readiness ux

## 3. 预期产物

1. governance handoff artifact for TK-953
2. task card update for TK-953
3. aligned checklist/tasks.csv ledger views

## 4. Required Inputs

1. .repo-ai-governor/context/dev/project-112-vscode-governance-workbench-rollout/project-112-vscode-governance-workbench-rollout-completion-audit-summary.md
2. docs/local-adoption-playbook.zh-CN.md
3. .repo-ai-governor/context/current-context.md
4. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-003-phase-f-secure-authoring-and-user-settings/plan.md

## 5. Traceback References

1. .repo-ai-governor/context/dev/project-091-session-shell-secure-secret-input-promotion-and-decomposition/sprint-001-review-promotion-and-followup-decomposition/tasks/DA-804-session-shell-secure-secret-input-promotion-and-rollout-decomposition-handoff.md
2. docs/maintainer-validation-playbook.zh-CN.md
3. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/plan.md
4. .repo-ai-governor/normative_knowledge_sources/governance/task-card-template.md

## 6. 实施计划

1. 确认本任务边界、依赖与预期产物。
2. 按标准模板推进实现或治理动作。
3. 完成 ledger sync 与必要验证后更新产出。

## 7. Development Verification

1. pnpm run build
2. pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-host.activation.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts
2. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-003-phase-f-secure-authoring-and-user-settings/tasks" --task-id TK-953

## 8. Delivery Verification

1. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-003-phase-f-secure-authoring-and-user-settings/tasks" --task-id TK-953
2. node ./scripts/governance/check-task-required-inputs.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-003-phase-f-secure-authoring-and-user-settings/tasks" --task-id TK-953
3. node ./scripts/governance/check-task-ledger-sync.js
4. node ./scripts/governance/check-sprint-plan-status-sync.js

## 9. 执行记录

1. 2026-04-17：任务创建，状态初始化为 `planned`。
2. 2026-04-17：当前任务切换为 `in_progress`，开始整理 Phase F exit evidence，并把 secure authoring / user settings / secret readiness 的 activation-ready truth 写回 sprint surface。
3. 2026-04-17：当前 sprint-003 exit acceptance 已固定为“embedded CLI dependency 被纳入 VS Code extension manifest；secure authoring diagnostics 可投影到 workbench overview / workflow studio；user-local defaults 与 managed secrets 通过 trust-gated editor-native UX 写入 canonical seam，raw secret 不会进入 argv 或 UI 回显”。
4. 2026-04-17：Phase G handoff 已固定为“从当前 secure authoring baseline 继续实现 workflow authoring、run-control 与 continuity UX，同时保持 Phase E degraded fallback contract 不回退，也不在 sprint-004 提前混入 Phase H distribution/readme promotion 事项”；同窗口 `pnpm run build` 与 5 个 VS Code extension 定向 vitest 已通过，当前任务切换为 `completed`。
5. 2026-04-17：`CR-002` 已在同窗口完成 accepted finding 修复与复验，当前 sprint-003 已完成 closeout，`current-context.md`、project plan 与 sprint plan 已切到 sprint-004 / `TK-954` activation truth。

## 10. 产出

1. sprint-003 exit acceptance 已具备进入实际 delegated reviewer lifecycle（由 `CR-002` 收口）的代码证据：Phase F secure authoring seam、trust-gated UX、manifest contribution 与测试覆盖已在同一窗口完成并通过 build + targeted vitest。
2. Phase G handoff 已固定为：后续 workflow authoring / governed run-control 只在当前 secure authoring baseline 之上增量实现，不重新分叉 config/secret truth，也不回退 Phase E degraded fallback 行为。
3. sprint-003 closeout 已完成：`stream-project-113-sprint-003` 已移入 completed history，primary execution surface 已切换到 sprint-004-phase-g-workflow-authoring-and-run-control。
