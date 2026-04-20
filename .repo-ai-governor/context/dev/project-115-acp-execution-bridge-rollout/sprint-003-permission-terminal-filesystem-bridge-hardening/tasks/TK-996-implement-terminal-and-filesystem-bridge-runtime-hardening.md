# TK-996 implement terminal and filesystem bridge runtime hardening

- Status: planned
- Date: 2026-04-20
- Owner: AI-Agent
- Priority: P1
- Project: `project-115-acp-execution-bridge-rollout`
- Sprint: `sprint-003-permission-terminal-filesystem-bridge-hardening`

## 1. 任务目标

完成 terminal/* fs/* capability-gated bridge、cleanup 与 fail-closed 语义

## 2. Depends On

1. TK-995

## 3. 预期产物

1. host operation bridge artifact for TK-996
2. task card update for TK-996
3. aligned checklist/tasks.csv ledger views

## 4. Required Inputs

1. .repo-ai-governor/context/current-context.md
2. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-115-acp-execution-bridge-rollout/sprint-003-permission-terminal-filesystem-bridge-hardening/plan.md

## 5. Traceback References

1. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-115-acp-execution-bridge-rollout/plan.md
2. .repo-ai-governor/normative_knowledge_sources/governance/task-card-template.md

## 6. 实施计划

1. 确认本任务边界、依赖与预期产物。
2. 按标准模板推进实现或治理动作。
3. 完成 ledger sync 与必要验证后更新产出。

## 7. Development Verification

1. 待执行：按任务范围补充 fast/targeted verification。
2. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-115-acp-execution-bridge-rollout/sprint-003-permission-terminal-filesystem-bridge-hardening/tasks" --task-id TK-996

## 8. Delivery Verification

1. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-115-acp-execution-bridge-rollout/sprint-003-permission-terminal-filesystem-bridge-hardening/tasks" --task-id TK-996
2. node ./scripts/governance/check-task-required-inputs.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-115-acp-execution-bridge-rollout/sprint-003-permission-terminal-filesystem-bridge-hardening/tasks" --task-id TK-996
3. node ./scripts/governance/check-task-ledger-sync.js
4. node ./scripts/governance/check-sprint-plan-status-sync.js

## 9. 执行记录

1. 2026-04-20：任务创建，状态初始化为 `planned`。

## 10. 产出

1. 待执行后补齐
2. 待执行后补齐
