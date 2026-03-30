# TK-417 main.ts session-shell entrypoint decomposition remediation

- Status: completed
- Date: 2026-03-30
- Owner: AI-Agent
- Priority: P1
- Project: `project-029-cli-session-first-agent-shell`
- Sprint: `sprint-004-polish-and-session-productization`

## 1. 任务目标

按 stricter CR recheck 修复 `main.ts` 中 session-shell wiring 触发的 `CS-027` actionable finding，并把 session-shell entrypoint responsibilities 从 legacy main file 中拆出。

## 2. Depends On

1. `TK-413`
2. `TK-414`
3. `TK-416`

## 3. 预期产物

1. 独立的 session-shell entrypoint runtime
2. 更新后的 `resolved` CR 复核/修复记录
3. 入口层目标测试

## 4. 实施计划

1. 提取 session-shell startup query / default entry routing / nested handoff summary / run option assembly。
2. 保持 `main.ts` 仅承担 Commander 注册与薄调用，不再继续吸收 session-shell 专属职责。
3. 用 build 与 session-shell entrypoint 目标测试验证拆分后行为不变。

## 5. 验证

1. `pnpm run build`
2. `pnpm exec vitest run apps/cli/test/runtime/session-shell-entrypoint-runtime.test.ts apps/cli/test/cli-output-contract.integration.test.ts apps/cli/test/runtime/session-shell-runner.test.ts`

## 6. 执行记录

1. 2026-03-30：任务创建，状态初始化为 `planned`。
2. 2026-03-30：已完成 `session-shell-entrypoint-runtime.ts` 抽离，`main.ts` 改为委托独立 runtime 处理 interactive eligibility、startup query、default shell routing 与 nested CLI handoff summary。
3. 2026-03-30：已补充 entrypoint runtime 单测，并把 stricter recheck 与 repair record 追加回 `resolved_code_review_session-shell-full-20260330-0736.md`。
