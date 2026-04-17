# TK-959 execute gui and distribution readiness evidence bundle

- Status: completed
- Date: 2026-04-17
- Owner: AI-Agent
- Priority: P1
- Project: `project-113-vscode-primary-workbench-full-cutover`
- Sprint: `sprint-005-phase-h-support-promotion-and-distribution-readiness`

## 1. 任务目标

补齐 GUI/manual smoke、packaged distribution 与 release-facing evidence bundle。

## 2. Depends On

1. freeze phase-h promotion and distribution-readiness boundary

## 3. 预期产物

1. evidence bundle artifact for TK-959
2. task card update for TK-959
3. aligned checklist/tasks.csv ledger views

## 4. Required Inputs

1. docs/maintainer-validation-playbook.zh-CN.md
2. apps/vscode-extension/README.md
3. .repo-ai-governor/context/current-context.md
4. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-005-phase-h-support-promotion-and-distribution-readiness/plan.md

## 5. Traceback References

1. .repo-ai-governor/context/dev/project-101-cli-exec-followup-solution-review-and-promotion/sprint-004-acp-host-facing-transport-formalization/tasks/DA-855-acp-host-facing-transport-formalization-promotion-cutover.md
2. .repo-ai-governor/context/dev/project-101-cli-exec-followup-solution-review-and-promotion/sprint-002-additive-diagnostics-consumer/tasks/DA-849-cli-exec-additive-diagnostics-consumer-promotion-cutover.md
3. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/plan.md
4. .repo-ai-governor/normative_knowledge_sources/governance/task-card-template.md

## 6. 实施计划

1. 确认本任务边界、依赖与预期产物。
2. 按标准模板推进实现或治理动作。
3. 完成 ledger sync 与必要验证后更新产出。

## 7. Development Verification

1. pnpm run release:verify-vscode-extension-distribution -- --output .tmp/project-113-sprint-005-vscode-distribution-report.json
2. pnpm pack --json --dry-run
3. pnpm run check:ide-entry-smoke
4. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-005-phase-h-support-promotion-and-distribution-readiness/tasks" --task-id TK-959

## 8. Delivery Verification

1. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-005-phase-h-support-promotion-and-distribution-readiness/tasks" --task-id TK-959
2. node ./scripts/governance/check-task-required-inputs.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-005-phase-h-support-promotion-and-distribution-readiness/tasks" --task-id TK-959
3. node ./scripts/governance/check-task-ledger-sync.js
4. node ./scripts/governance/check-sprint-plan-status-sync.js
5. node ./scripts/governance/check-code-review-status-sync.js

## 9. 执行记录

1. 2026-04-17：任务创建，状态初始化为 `planned`。
2. 2026-04-17：distribution-readiness evidence bundle 已在同窗口完成：`pnpm run release:verify-vscode-extension-distribution -- --output .tmp/project-113-sprint-005-vscode-distribution-report.json` 通过，报告确认 packaged root / extracted VSIX 的 `packageSymlinks=[]`、`extractedSymlinks=[]`，且两条 sidecar smoke 都返回 `serviceLifecycle=ready`。
3. 2026-04-17：`pnpm pack --json --dry-run`、`pnpm run check:ide-entry-smoke` 继续保持绿色，说明本地 VSIX / packaged root 证据与 IDE 官方模板入口 smoke 已具备 release-facing evidence bundle；当前任务切换为 `completed`。

## 10. 产出

1. `.tmp/project-113-sprint-005-vscode-distribution-report.json`
2. 已固定 packaged root / extracted VSIX 的 module smoke、sidecar smoke、pnpm metadata closure 与 symlink allowlist 证据，可直接作为 sprint-005 与 project-final review 的 distribution evidence 输入。
