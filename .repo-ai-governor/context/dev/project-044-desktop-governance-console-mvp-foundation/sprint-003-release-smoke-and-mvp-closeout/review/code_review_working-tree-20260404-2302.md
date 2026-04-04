# Code Review: working-tree-20260404-2302

- Status: review_pending
- Date: 2026-04-04
- Reviewer: AI-Agent
- Task: `n/a`
- Review Type: working tree review
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`

## 1. Review Scope
1. `apps/cli/src/runtime/interactive-shell/session-shell-runner.ts`
2. `apps/cli/src/runtime/interactive-shell/session-shell-service-client.ts`
3. `apps/cli/src/runtime/interactive-shell/session-slash-command-registry.ts`
4. `apps/cli/src/runtime/orchestration-service-runtime.ts`
5. `apps/cli/src/types/interfaces/cli-session-shell.interface.ts`
6. `apps/cli/test/runtime/session-shell-runner.test.ts`
7. `apps/cli/test/runtime/session-slash-command-registry.test.ts`
8. `packages/core-orchestration-service/src/constants/local-orchestration-service-sidecar.constant.ts`
9. `packages/core-orchestration-service/src/local-orchestration-service-session-runtime.ts`
10. `packages/core-orchestration-service/src/local-orchestration-service-shell.ts`
11. `packages/core-orchestration-service/src/local-orchestration-service-sidecar-client.ts`
12. `packages/core-orchestration-service/src/local-orchestration-service-sidecar-host.ts`
13. `packages/core-orchestration-service/src/types/interfaces/local-orchestration-service-sidecar.interface.ts`
14. `packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`
15. `packages/core-session/src/constants/session-status.constant.ts`
16. `packages/core-session/src/shared-session-manager.ts`
17. `packages/core-session/src/types/interfaces/shared-session.interface.ts`
18. `packages/core-session/test/shared-session-manager.unit.test.ts`
19. `packages/orchestration-service-client/src/constants/orchestration-service.constant.ts`
20. `packages/orchestration-service-client/src/types/interfaces/orchestration-service-client.interface.ts`
21. `packages/shared/src/i18n/locales/en-us.ts`
22. `packages/shared/src/i18n/locales/zh-cn.ts`
23. `project-043` ledger/docs updates（仅做漂移核对，本次未记录单独代码发现）

## 2. Findings
### 2.1 [P1] `/archive` 在归档当前会话后如果 replacement session 启动失败，会把失败回执写回已归档会话
- 位置: `apps/cli/src/runtime/interactive-shell/session-shell-runner.ts:1255`
- 问题描述: 当前实现先对 `viewModel.sessionId` 指向的会话执行 `archiveSession()`，随后才调用 `startSession()` 建 replacement session。若 `startSession()` 或后续 `attachToSession()` 失败，catch 分支会调用 `appendServiceTranscriptItem()`。但此时 `viewModel.sessionId` 仍是刚刚被归档的旧会话，而 service 侧 `appendSessionMessage()` 最终会走 `SharedSessionManager.appendEvent()` 的 active-only 校验，导致“归档失败提示”本身再次抛错，无法作为 presenter-safe receipt 落地。
- 影响: `/archive` 对“当前 attached session”执行时，一旦 replacement bootstrap 失败，前台 shell 既拿不到新 attachment，也拿不到可恢复的错误提示，用户会直接卡在一个不可继续写入的 archived session 上。
- 建议: 自归档分支的失败提示改为 local-only notice，或在 catch 中优先重建并附着新的 active session 后再写回执；同时补一条“archive 成功但 startSession 失败”的回归测试。

### 2.2 [P2] `/sessions all` 会因为“先 limit 再过滤状态”漏掉真实存在的 active/archived sessions
- 位置: `apps/cli/src/runtime/interactive-shell/session-shell-runner.ts:1163`
- 问题描述: `requestedFilter === "all"` 时，这里调用的是 `listSessions({ limit: 10 })`，随后才在 CLI 侧把结果过滤成 `ACTIVE/ARCHIVED`。而 service 侧 `listSessions()` 会先对“所有状态”排序并应用 `limit`，只要最近 10 条里混入足够多 `completed/cancelled/failed`，更早但仍 relevant 的 active/archived sessions 就根本不会返回到 CLI。
- 影响: `/sessions all` 会出现“没有匹配 session”或漏列可恢复/可解档会话的假阴性，直接误导操作员做 resume/unarchive 判断。
- 建议: `all` 分支不要在状态过滤前使用固定 limit；或者扩展 service filter 支持多状态集合，让 `limit` 在 active+archived 过滤之后再生效。

### 2.3 [P2] archive / unarchive 生命周期切换不是原子操作，跨 surface 并发下会出现状态与 transcript 乱序
- 位置: `packages/core-orchestration-service/src/local-orchestration-service-session-runtime.ts:818`
- 问题描述: `archiveSession()` 先 `appendEvent()` 写入归档 notice，再在第二个独立调用里 `transitionSessionStatus(ARCHIVED)`；`unarchiveSession()` 则先切回 `ACTIVE`，再在第二个调用里补恢复 notice。`SharedSessionManager` 的 session 锁只覆盖单个 API 调用，因此 CLI / desktop / sidecar 的其他并发入口仍可在这两个步骤之间插入新的 `sendSessionTurn()` 或 `appendSessionMessage()`。当前测试只覆盖 happy path，没有证明该竞态是被接受或被收敛的。
- 影响: canonical session 可能在“已经写出 archived/restored receipt，但生命周期状态尚未真正切换或已经再次变化”的窗口继续接收 mutation，导致 session list、resume 语义和 transcript 证据相互打架。
- 建议: 下沉一个原子 lifecycle mutation API，或让 runtime 在同一把 session mutation lock 内完成 event + status 变更，并补充并发回归测试。

## 3. Notes
1. active review 路径仍解析到 `project-044` closeout surface；当前工作树的主体代码与台账改动实际属于 `project-043`，本次仅按仓库规则沿用 `project-044` 的默认 CR 输出目录。
2. 目录中已存在一个未跟踪的 `resolved_code_review_working-tree-20260404-2026.md`，其内容声明“工作树无改动”，与当前 dirty state 不一致；本次新建 pending 报告以避免覆盖历史痕迹。
3. 本轮定向测试通过，但现有用例只覆盖 `/archive` happy path 与 `archiveSession()` 自身失败，不覆盖“归档当前会话成功后 replacement session 启动失败”或跨 surface 并发归档/恢复竞态。

## 4. Verification
1. `git status --short`（通过）
2. `git diff --stat -- apps/cli/src/runtime/interactive-shell/session-shell-runner.ts packages/core-orchestration-service/src/local-orchestration-service-session-runtime.ts packages/core-session/src/shared-session-manager.ts apps/cli/test/runtime/session-shell-runner.test.ts packages/core-session/test/shared-session-manager.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`（通过）
3. `pnpm vitest apps/cli/test/runtime/session-shell-runner.test.ts apps/cli/test/runtime/session-slash-command-registry.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts packages/core-session/test/shared-session-manager.unit.test.ts --maxWorkers=1`（通过，4 files / 73 tests）
