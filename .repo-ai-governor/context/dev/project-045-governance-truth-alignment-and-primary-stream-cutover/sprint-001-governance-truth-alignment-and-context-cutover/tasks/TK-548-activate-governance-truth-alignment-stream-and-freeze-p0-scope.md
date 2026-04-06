# TK-548 activate governance truth alignment stream and freeze p0 scope

- Status: completed
- Date: 2026-04-05
- Owner: AI-Agent
- Priority: P0
- Project: `project-045-governance-truth-alignment-and-primary-stream-cutover`
- Sprint: `sprint-001-governance-truth-alignment-and-context-cutover`

## 1. 任务目标

激活一条新的治理收口 primary stream，并冻结本轮 P0 真值对齐的边界，避免继续依附在 `project-044` 的 completed closeout surface 上执行后续治理修补。

## 2. Depends On

1. `.repo-ai-governor/draft/repo-ai-governor-current-priority-backlog.md`
2. `.repo-ai-governor/context/current-context.md`

## 3. 预期产物

1. `project-045` project/sprint plan
2. `project-045` task ledger
3. `current-context.md` 新 primary stream truth

## 4. Required Inputs

1. `current-context.md`
2. `completed-streams-history.md`
3. `repo-ai-governor-current-priority-backlog.md`

## 5. Traceback References

1. `.repo-ai-governor/draft/repo-ai-governor-current-priority-backlog.md`
2. `.repo-ai-governor/context/current-context.md`

## 6. 实施计划

1. 创建 `project-045 / sprint-001` 的最小治理收口执行面。
2. 将本轮 P0 范围限制在 `current-context`、completed history、delivery registry 与相关 project truth。
3. 为后续验证与 completion audit 准备 task/review 路径。

## 7. Development Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 8. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `node ./scripts/governance/run-normative-loading-manifest-gate.js`

## 9. 执行记录

1. 2026-04-05：任务创建，状态初始化为 `planned`；承接 P0 治理真值对齐与 primary stream cutover 范围冻结。
2. 2026-04-05：完成 `project-045` project/sprint/task/review surface 创建，并将 `current-context.md` primary 切换为本项目的 `sprint-001`。

## 10. 产出

1. 已完成：project/sprint governance execution surface -> `project-045-governance-truth-alignment-and-primary-stream-cutover/**`
2. 已完成：new primary stream truth -> `.repo-ai-governor/context/current-context.md`
