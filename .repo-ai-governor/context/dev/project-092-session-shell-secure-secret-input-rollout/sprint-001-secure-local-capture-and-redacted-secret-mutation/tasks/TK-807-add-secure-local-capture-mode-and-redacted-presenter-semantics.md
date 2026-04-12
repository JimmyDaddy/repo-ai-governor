# TK-807 add secure local capture mode and redacted presenter semantics

- Status: planned
- Date: 2026-04-12
- Owner: AI-Agent
- Priority: P0
- Project: `project-092-session-shell-secure-secret-input-rollout`
- Sprint: `sprint-001-secure-local-capture-and-redacted-secret-mutation`

## 1. 任务目标

为 session shell 增加 `secure_local_capture` 前台 mode，并确保 secret 输入只存在于本地隐藏输入 buffer 中。

## 2. Depends On

1. `TK-806`
2. `apps/cli/src/constants/cli-session-shell.constant.ts`
3. `apps/cli/src/types/interfaces/cli-session-shell.interface.ts`
4. `apps/cli/src/runtime/interactive-shell/session-shell-ink-controller.ts`
5. `apps/cli/src/runtime/interactive-shell/session-shell-runner.ts`
6. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/adrs/secure-local-secret-capture-and-redacted-command-handoff.md`

## 3. 预期产物

1. secure local capture mode / focus / input state
2. redacted success / failure / cancel presenter behavior
3. focused tests
4. ephemeral secure capture buffer lifecycle，不落入 transcript / preview / command recap

## 4. Required Inputs

1. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/module-overview.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/contracts/cli-session-shell-contract.md`
3. `.repo-ai-governor/draft/session-shell-secure-secret-input-and-redacted-command-handoff-technical-solution.md`
4. `apps/cli/test/runtime/session-shell-live-app.test.ts`
5. `apps/cli/test/runtime/react-cli-runner.test.ts`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-091-session-shell-secure-secret-input-promotion-and-decomposition/sprint-001-review-promotion-and-followup-decomposition/tasks/DA-804-session-shell-secure-secret-input-promotion-and-rollout-decomposition-handoff.md`

## 6. 实施计划

1. 在 `cli-session-shell.constant.ts` 与 `cli-session-shell.interface.ts` 中补齐 `secure_local_capture` / `secure_local` / `secure_capture` 等 presenter contract 枚举与 view-model 最小字段。
2. 在 runner/controller 中增加 secure capture buffer lifecycle，确保 secure route 提交后普通 composer/slash state 被同一状态迁移清空，后续 secret 输入不再回流普通 presenter。
3. 为成功 / 失败 / 取消路径设计 redacted notice/summary 输出，不暴露 secret 原文、前后缀或长度。
4. 补齐 shell runner、Ink controller、live app 与 React runner 的 focused regression tests。

## 7. Development Verification

1. `pnpm exec vitest run apps/cli/test/runtime/session-shell-ink-controller.test.ts apps/cli/test/runtime/session-shell-runner.test.ts apps/cli/test/runtime/session-shell-live-app.test.ts apps/cli/test/runtime/react-cli-runner.test.ts --maxWorkers=1 --maxConcurrency=1`

## 8. Delivery Verification

1. `pnpm exec vitest run apps/cli/test/runtime/session-shell-ink-controller.test.ts apps/cli/test/runtime/session-shell-runner.test.ts apps/cli/test/runtime/session-shell-live-app.test.ts apps/cli/test/runtime/react-cli-runner.test.ts --maxWorkers=1 --maxConcurrency=1`
2. `pnpm run build`
3. `node ./scripts/governance/sync-task-ledger.js --task-id TK-807 --tasks-dir ".repo-ai-governor/context/dev/project-092-session-shell-secure-secret-input-rollout/sprint-001-secure-local-capture-and-redacted-secret-mutation/tasks"`
4. `node ./scripts/governance/check-task-ledger-sync.js`
5. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-12：任务创建，状态初始化为 `planned`。
2. 2026-04-12：拆解细化后，执行面已冻结到 shell contract enums/types、controller/runner buffer lifecycle 与 presenter redaction tests；待 `TK-806` 收口后进入实现。

## 10. 产出

1. 待执行：secure local capture mode and redacted presenter implementation
