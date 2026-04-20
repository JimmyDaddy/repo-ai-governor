# TK-961 prepare project-final closeout and next-stream recommendation

- Status: completed
- Date: 2026-04-17
- Owner: AI-Agent
- Priority: P1
- Project: `project-113-vscode-primary-workbench-full-cutover`
- Sprint: `sprint-005-phase-h-support-promotion-and-distribution-readiness`

## 1. 任务目标

写回 project-final recommendation、completion-audit inputs 与 next-stream closeout boundary。

## 2. Depends On

1. refresh support-truth docs and claim-promotion package

## 3. 预期产物

1. project closeout handoff artifact for TK-961
2. task card update for TK-961
3. aligned checklist/tasks.csv ledger views

## 4. Required Inputs

1. .repo-ai-governor/context/dev/project-112-vscode-governance-workbench-rollout/project-112-vscode-governance-workbench-rollout-completion-audit-summary.md
2. docs/support-matrix.zh-CN.md
3. .repo-ai-governor/context/current-context.md
4. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-005-phase-h-support-promotion-and-distribution-readiness/plan.md

## 5. Traceback References

1. docs/maintainer-validation-playbook.zh-CN.md
2. .repo-ai-governor/context/dev/project-101-cli-exec-followup-solution-review-and-promotion/sprint-002-additive-diagnostics-consumer/tasks/DA-849-cli-exec-additive-diagnostics-consumer-promotion-cutover.md
3. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/plan.md
4. .repo-ai-governor/normative_knowledge_sources/governance/task-card-template.md

## 6. 实施计划

1. 确认本任务边界、依赖与预期产物。
2. 按标准模板推进实现或治理动作。
3. 完成 ledger sync 与必要验证后更新产出。

## 7. Development Verification

1. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-005-phase-h-support-promotion-and-distribution-readiness/tasks" --task-id TK-961
2. node ./scripts/governance/check-task-required-inputs.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-005-phase-h-support-promotion-and-distribution-readiness/tasks" --task-id TK-961

## 8. Delivery Verification

1. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-005-phase-h-support-promotion-and-distribution-readiness/tasks" --task-id TK-961
2. node ./scripts/governance/check-task-required-inputs.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-005-phase-h-support-promotion-and-distribution-readiness/tasks" --task-id TK-961
3. node ./scripts/governance/check-task-ledger-sync.js
4. node ./scripts/governance/check-sprint-plan-status-sync.js
5. node ./scripts/governance/check-code-review-status-sync.js

## 9. 执行记录

1. 2026-04-17：任务创建，状态初始化为 `planned`。
2. 2026-04-17：project-final closeout 输入已准备完毕：sprint-005 的 implementation / evidence / docs truth 已全部完成，下一步固定进入 sprint-005 `CR-001` fresh reviewer round；若该轮 clean，则先做 sprint-005 boundary commit，再进入 whole-project final reviewer round、completion audit summary 与 `current-context.md -> idle` 收口。
3. 2026-04-17：project plan、sprint plan 与 `current-context.md` 已同步写回“implementation complete, review pending”真值；当前任务切换为 `completed`。

## 10. 产出

1. sprint-005 与 project-113 已具备进入 fresh reviewer round 的 closeout-prep truth，且后续顺序已固定为 `sprint-005 CR -> sprint-005 commit -> project-final CR -> completion audit -> final commit`。
2. 当前 active stream 仍保持 sprint-005，直到 sprint/project 两级 review lifecycle 全部 clean 收口后再回到 `idle`。
