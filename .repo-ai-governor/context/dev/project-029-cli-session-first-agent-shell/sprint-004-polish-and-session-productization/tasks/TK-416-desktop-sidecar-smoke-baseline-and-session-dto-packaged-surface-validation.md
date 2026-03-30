# TK-416 desktop sidecar smoke baseline and session DTO packaged-surface validation

- Status: completed
- Date: 2026-03-30
- Owner: AI-Agent
- Priority: P1
- Project: `project-029-cli-session-first-agent-shell`
- Sprint: `sprint-004-polish-and-session-productization`

## 1. 任务目标

验证 future desktop presenter 的 sidecar smoke baseline 与 session DTO packaged-surface。

## 2. Depends On

1. `TK-414`
2. `TK-415`

## 3. 预期产物

1. desktop smoke checklist
2. session DTO packaged-surface validation
3. presenter parity notes

## 4. 实施计划

1. 验证 desktop 只需替换 presenter，而不是重做后端协议。
2. 保持 `sidecar + ipc` baseline 不被当前 CLI 实现卡死。

## 5. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 6. 执行记录

1. 2026-03-30：任务创建，状态初始化为 `planned`。
2. 2026-03-30：已完成 desktop sidecar smoke、session DTO packaged-surface 与 public export 校验，并把项目级 resolved review 与 completion audit 收口到 `sprint-004` closeout surface。
