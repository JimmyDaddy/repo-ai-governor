# TK-960 refresh support-truth docs and claim-promotion package

- Status: completed
- Date: 2026-04-17
- Owner: AI-Agent
- Priority: P1
- Project: `project-113-vscode-primary-workbench-full-cutover`
- Sprint: `sprint-005-phase-h-support-promotion-and-distribution-readiness`

## 1. 任务目标

刷新 support-truth docs、adoption/maintainer guidance 与 claim-promotion package。

## 2. Depends On

1. execute gui and distribution readiness evidence bundle

## 3. 预期产物

1. support truth package artifact for TK-960
2. task card update for TK-960
3. aligned checklist/tasks.csv ledger views

## 4. Required Inputs

1. docs/support-matrix.zh-CN.md
2. docs/local-adoption-playbook.zh-CN.md
3. .repo-ai-governor/context/current-context.md
4. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-005-phase-h-support-promotion-and-distribution-readiness/plan.md

## 5. Traceback References

1. docs/maintainer-validation-playbook.zh-CN.md
2. .repo-ai-governor/context/dev/project-111-vscode-workbench-solution-promotion-and-decomposition/sprint-001-promotion-and-rollout-handoff/tasks/DA-934-vscode-workbench-promotion-and-rollout-decomposition-handoff.md
3. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/plan.md
4. .repo-ai-governor/normative_knowledge_sources/governance/task-card-template.md

## 6. 实施计划

1. 确认本任务边界、依赖与预期产物。
2. 按标准模板推进实现或治理动作。
3. 完成 ledger sync 与必要验证后更新产出。

## 7. Development Verification

1. pnpm run check:ide-docs-parity
2. pnpm run release:verify-vscode-extension-distribution -- --output .tmp/project-113-sprint-005-vscode-distribution-report.json
3. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-005-phase-h-support-promotion-and-distribution-readiness/tasks" --task-id TK-960

## 8. Delivery Verification

1. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-005-phase-h-support-promotion-and-distribution-readiness/tasks" --task-id TK-960
2. node ./scripts/governance/check-task-required-inputs.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-005-phase-h-support-promotion-and-distribution-readiness/tasks" --task-id TK-960
3. node ./scripts/governance/check-task-ledger-sync.js
4. node ./scripts/governance/check-sprint-plan-status-sync.js
5. node ./scripts/governance/check-code-review-status-sync.js

## 9. 执行记录

1. 2026-04-17：任务创建，状态初始化为 `planned`。
2. 2026-04-17：support-truth docs 与 claim-promotion package 已在同窗口刷新：`apps/vscode-extension/README.md`、`docs/support-matrix.md`、`docs/support-matrix.zh-CN.md`、`docs/local-adoption-playbook.md`、`docs/local-adoption-playbook.zh-CN.md`、`docs/maintainer-validation-playbook.md`、`docs/maintainer-validation-playbook.zh-CN.md` 现统一声明 built-source checkout 与本地 VSIX / packaged extension root 的 `primary_workbench_claim`。
3. 2026-04-17：`pnpm run check:ide-docs-parity` 与 distribution evidence 在同窗口均保持通过，且文档继续明确排除 Marketplace 与已发布 npm/tgz 安装面的支持承诺；当前任务切换为 `completed`。

## 10. 产出

1. 中英文 support docs 已对齐 Phase H 的 `primary_workbench_claim`、Desktop `foundation_only_secondary_surface` 与 packaged-boundary 非目标约束。
2. `apps/vscode-extension/README.md` 与 support/playbook 文档已把 packaged root / extracted VSIX 证据链、CLI 入口保留边界与文档 truth-sync 一并收口。
