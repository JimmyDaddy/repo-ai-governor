# TK-1030 remediate standardized error usage in local orchestration sidecar entry

- Status: completed
- Date: 2026-04-21
- Owner: AI-Agent
- Priority: P1
- Project: `project-119-standardized-error-gate-remediation`
- Sprint: `sprint-001-sidecar-entry-standardized-error-fix`

## 1. 任务目标

修复 `packages/core-orchestration-service/src/local-orchestration-service-sidecar-entry.ts` 中当前阻塞 gate 的 standardized-error 使用违规。

## 2. Depends On

1. `project-118` remediation closeout

## 3. 预期产物

1. `packages/core-orchestration-service/src/local-orchestration-service-sidecar-entry.ts`

## 4. Required Inputs

1. .repo-ai-governor/context/current-context.md
2. .repo-ai-governor/normative_knowledge_sources/governance/code_standards.md
3. packages/core-orchestration-service/src/local-orchestration-service-sidecar-entry.ts
4. packages/core-orchestration-service/src/local-orchestration-service-sidecar-host.ts

## 5. Traceback References

1. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-118-working-tree-format-drift-remediation/project-118-working-tree-format-drift-remediation-completion-audit-summary.md
2. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-119-standardized-error-gate-remediation/plan.md

## 6. 实施计划

1. 复用同包现有 `standardizeError(error)` 模式，替换当前 `instanceof Error` 逻辑。
2. 复查 diff，确认没有意外扩面。
3. 将结果交给验证与 review 任务继续收口。

## 7. Development Verification

1. node ./scripts/governance/check-standardized-error-usage.js
2. git diff -- packages/core-orchestration-service/src/local-orchestration-service-sidecar-entry.ts

## 8. Delivery Verification

1. `TK-1031` 承接

## 9. 执行记录

1. 2026-04-21：任务创建，状态初始化为 `planned`。
2. 2026-04-21：`project-119 / sprint-001` 已创建并激活；当前任务切换为 `in_progress`，用于执行 targeted standardized-error remediation。
3. 2026-04-21：已在 `packages/core-orchestration-service/src/local-orchestration-service-sidecar-entry.ts` 中引入 `standardizeError`，并将 `Failed to initialize session.main supervisor runtime` 的 `stderr` 写法切换为 `standardizeError(error).message`，从而移除当前 gate blocker。

## 10. 产出

1. `packages/core-orchestration-service/src/local-orchestration-service-sidecar-entry.ts`
