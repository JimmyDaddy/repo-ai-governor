# TK-418 completion and closeout build evidence governance

- Status: completed
- Date: 2026-03-30
- Owner: AI-Agent
- Priority: P1
- Project: `project-029-cli-session-first-agent-shell`
- Sprint: `sprint-004-polish-and-session-productization`

## 1. 任务目标

将“代码变更下的完成/全绿默认必须包含同窗口真实 `pnpm run build`”固化到治理标准与 closeout / CR workflow 文档，避免后续执行依赖口头记忆。

## 2. Depends On

1. `TK-417`

## 3. 预期产物

1. 更新后的 `code_standards.md`
2. 更新后的 `long-term-maintenance-guide.md`
3. 更新后的 workspace CR workflow 文档

## 4. 实施计划

1. 在 repository-level code standards 中新增 build evidence 规则，并把 `pnpm run build` 纳入默认验证命令。
2. 在长期维护/closeout 协议中补充“完成/全绿/CR resolved”对 build evidence 的要求。
3. 在 workspace CR workflow 文档中补充 code-affecting review/repair 的 build 约束。

## 5. 验证

1. `pnpm run build`
2. `node ./scripts/governance/check-task-ledger-sync.js`
3. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 6. 执行记录

1. 2026-03-30：任务创建，状态初始化为 `planned`。
2. 2026-03-30：已在 `code_standards.md` 新增 completion/build evidence 规则，并将 `pnpm run build` 纳入默认验证命令。
3. 2026-03-30：已在 `long-term-maintenance-guide.md` 与 workspace CR workflow 文档中补充 closeout / resolved / 全绿口径下的 build evidence 要求。
