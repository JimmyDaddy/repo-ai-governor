# TK-1033 remediate valid copilot review findings for pr-23

- Status: completed
- Date: 2026-04-21
- Owner: AI-Agent
- Priority: P1
- Project: `project-120-pr-23-copilot-review-remediation`
- Sprint: `sprint-001-unresolved-thread-fix-and-pr-recheck`

## 1. 任务目标

修复 PR #23 中经本地复核后成立的 copilot review feedback，并保持修改范围尽量小。

## 2. Depends On

1. `project-119` closeout

## 3. 预期产物

1. `apps/cli/src/runtime/session-main-supervisor-runtime.ts`
2. `apps/cli/src/runtime/cli-user-config-projection-service.ts`
3. `apps/cli/src/runtime/agent-onboarding-runtime.ts`
4. `apps/cli/test/connect-phase2.integration.test.ts`
5. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/module-overview.md`

## 4. Required Inputs

1. `.codex/skills/gh-pr-remediation/SKILL.md`
2. `.repo-ai-governor/context/current-context.md`
3. PR #23 latest unresolved thread snapshot
4. 目标源码与测试文件

## 5. Traceback References

1. `/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-120-pr-23-copilot-review-remediation/plan.md`

## 6. 实施计划

1. 逐条复核 unresolved copilot review thread，对成立项实施最小修复。
2. 对仅提示潜在风险的评论，优先采用仓库内一致的更小修复，而不是扩大协议面。
3. 将结果交给验证、push 与 thread resolve 任务继续收口。

## 7. Development Verification

1. 相关 targeted test / gate commands
2. git diff -- 目标文件

## 8. Delivery Verification

1. `TK-1034` 承接

## 9. 执行记录

1. 2026-04-21：任务创建，状态初始化为 `planned`。
2. 2026-04-21：`project-120 / sprint-001` 已创建并激活；当前任务切换为 `in_progress`，用于执行 PR #23 unresolved thread remediation。
3. 2026-04-21：已对成立的 review feedback 实施最小修复：`cli-user-config-projection-service` 与 `agent-onboarding-runtime` 改为按 `!== undefined` 保留 `credentialEnvVar/credentialRef`；`connect-phase2.integration.test` 同步隔离 `USERPROFILE` 与可推导的 `HOMEDRIVE/HOMEPATH`；`runtime-governance-clients/module-overview.md` 修正 `vendorBinding` typo。
4. 2026-04-21：为 session-main deferred relay 增加 `selectedSurface/selectedBy` metadata fallback，并补充回归测试覆盖“ACP primary fallback token 未显式携带 surface 元数据”场景。
5. 2026-04-21：当前任务切换为 `completed`，交由 `TK-1034` 承接本地验证、提交与推送。

## 10. 产出

1. 已完成：`apps/cli/src/runtime/session-main-supervisor-runtime.ts`
2. 已完成：`apps/cli/src/runtime/cli-user-config-projection-service.ts`
3. 已完成：`apps/cli/src/runtime/agent-onboarding-runtime.ts`
4. 已完成：`apps/cli/test/connect-phase2.integration.test.ts`
5. 已完成：`apps/cli/test/runtime/session-main-supervisor-runtime.test.ts`
6. 已完成：`.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/module-overview.md`
