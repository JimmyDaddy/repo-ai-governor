# sprint-001-secure-local-capture-and-redacted-secret-mutation 计划

- Status: completed
- Date: 2026-04-12
- Project: `project-092-session-shell-secure-secret-input-rollout`
- Sprint Goal: 完成 explicit `/secret set <keyName>` secure route、secure local capture 与 redacted mutation handoff 的 Phase A 实现闭环。
- Upstream:
  - `.repo-ai-governor/context/dev/project-091-session-shell-secure-secret-input-promotion-and-decomposition/sprint-001-review-promotion-and-followup-decomposition/tasks/DA-804-session-shell-secure-secret-input-promotion-and-rollout-decomposition-handoff.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/contracts/cli-session-shell-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/local-user-config-and-secret-command-contract.md`

## 1. Scope

1. 补齐 `/secret set <keyName>` secure route parsing 与 pre-commit suffix rejection。
2. 增加 `secure_local_capture` 前台状态与 redacted presenter semantics。
3. 打通本地 secret mutation seam，同时覆盖取消 / 失败 / fallback guidance 的 redaction baseline。

## 2. Task Package

1. `TK-806` implement secure route parsing and pre-commit extra-token rejection for `/secret set` (`completed`)
2. `TK-807` add secure local capture mode and redacted presenter semantics (`completed`)
3. `TK-808` wire secure secret mutation seam and fallback/error guidance (`completed`)
4. `TK-809` sprint-001 exit acceptance and project completion assessment (`completed`)
5. `TK-810` finalize project-092 closeout and clear the active primary stream (`completed`)

## 3. Execution Lanes

1. `TK-806`
   目标：冻结 secure route detection、typed/pasted suffix pre-commit rejection 与 secure-route-first runner branching。
   主要代码面：`apps/cli/src/runtime/interactive-shell/session-slash-command-registry.ts`、`apps/cli/src/runtime/interactive-shell/session-shell-ink-controller.ts`、`apps/cli/src/runtime/interactive-shell/session-shell-runner.ts`
   主要验证面：`apps/cli/test/runtime/session-slash-command-registry.test.ts`、`apps/cli/test/runtime/session-shell-ink-controller.test.ts`、`apps/cli/test/runtime/session-shell-runner.test.ts`
2. `TK-807`
   目标：补齐 `secure_local_capture` mode/input/focus/buffer lifecycle 与 presenter redaction baseline。
   主要代码面：`apps/cli/src/constants/cli-session-shell.constant.ts`、`apps/cli/src/types/interfaces/cli-session-shell.interface.ts`、`apps/cli/src/runtime/interactive-shell/session-shell-ink-controller.ts`、`apps/cli/src/runtime/interactive-shell/session-shell-runner.ts`
   主要验证面：`apps/cli/test/runtime/session-shell-ink-controller.test.ts`、`apps/cli/test/runtime/session-shell-runner.test.ts`、`apps/cli/test/runtime/session-shell-live-app.test.ts`、`apps/cli/test/runtime/react-cli-runner.test.ts`
3. `TK-808`
   目标：将 secure capture 与共享 secret mutation core 接通，并确保 fallback/failure/cancel guidance 保持 redacted。
   主要代码面：`apps/cli/src/runtime/interactive-shell/session-shell-entrypoint-runtime.ts`、`apps/cli/src/commands/secret-command.ts`、`apps/cli/src/runtime/secrets/cli-secret-service.ts`
   主要验证面：`apps/cli/test/runtime/session-shell-entrypoint-runtime.test.ts`、`apps/cli/test/runtime/session-shell-runner.test.ts`、`apps/cli/test/commands/secret-command.test.ts`、`apps/cli/test/runtime/cli-secret-service.test.ts`
4. `TK-809`
   目标：完成 sprint-001 exit acceptance、project-final review activation handoff，并确认 `project-092` 已具备在同一 sprint surface 内完成最终 closeout 的前置条件。
   主要证据面：task ledger、review artifacts、same-window build/test evidence reuse、`DA-809` closeout handoff、delivery registry `in_progress` 中间态
5. `TK-810`
   目标：在 latest project-final CR clean 后完成最终 project closeout、completion audit summary、delivery registry completed write-back 与 active primary stream clearance。
   主要证据面：project-final resolved review artifact、project completion audit summary、current-context/completed history、delivery registry final truth

## 4. Exit Criteria

1. secure route 能在 presenter commit 之前丢弃额外 suffix。
2. secure capture 成功 / 失败 / 取消路径都不泄漏 raw secret。
3. 本 sprint 不引入 Phase B/C 范围漂移。
4. final sprint 在 latest project-final `CR` `resolved` 前继续保留同一 active surface，不得过早写回 `completed` / `idle` 真值。

## 5. Sprint Notes

1. 本 sprint 进入 active 之前，`session.main` secure-input outcome 仍视为 out of scope。
2. 所有用户可见 copy 必须保持 redacted，不得出现 secret 前后缀或长度泄漏。
3. 当前主执行顺序固定为先清零 presenter leakage risk，再补 foreground secure capture，最后接入 mutation seam 与 closeout evidence，避免实现倒序导致返工。
4. `TK-809` 已完成 sprint closeout handoff，但 `project-092 / sprint-001` 继续作为 project-final review 与最终 closeout 的默认 `tasks/` / `review/` surface。
5. `CR-007` clean `resolved` 后，`TK-810 / DA-810` 已完成最终 closeout write-back；当前 sprint 已恢复为最终 `completed` 真值，并迁出 active execution surface。
