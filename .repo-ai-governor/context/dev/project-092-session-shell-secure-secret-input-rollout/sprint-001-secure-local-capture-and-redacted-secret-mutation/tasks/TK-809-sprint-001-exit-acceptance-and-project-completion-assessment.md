# TK-809 sprint-001 exit acceptance and project completion assessment

- Status: planned
- Date: 2026-04-12
- Owner: AI-Agent
- Priority: P1
- Project: `project-092-session-shell-secure-secret-input-rollout`
- Sprint: `sprint-001-secure-local-capture-and-redacted-secret-mutation`

## 1. 任务目标

在 `TK-806 ~ TK-808` 全部收口后，完成 sprint-001 exit acceptance，并判断 `project-092` 是否可以在一轮内完成或需要后续扩展。

## 2. Depends On

1. `TK-806`
2. `TK-807`
3. `TK-808`
4. `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`

## 3. 预期产物

1. sprint closeout handoff
2. project completion assessment
3. verification evidence package
4. completion audit / next-step recommendation（如仍有 follow-up）

## 4. Required Inputs

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/context/dev/project-092-session-shell-secure-secret-input-rollout/plan.md`
3. `.repo-ai-governor/context/dev/project-092-session-shell-secure-secret-input-rollout/sprint-001-secure-local-capture-and-redacted-secret-mutation/plan.md`
4. `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
5. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/contracts/cli-session-shell-contract.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-091-session-shell-secure-secret-input-promotion-and-decomposition/sprint-001-review-promotion-and-followup-decomposition/tasks/DA-804-session-shell-secure-secret-input-promotion-and-rollout-decomposition-handoff.md`

## 6. 实施计划

1. 聚合实现、review、build/test、task-ledger 与 delivery evidence，确认 Phase A 真实交付是否与 active solution 对齐。
2. 判断 `project-092` 是否可在 `sprint-001` 一轮完成，或是否仍需新增 sprint / follow-up stream 继续承接非阻断残项。
3. 产出 closeout handoff、project completion assessment 与 completion audit summary，并恢复 `current-context.md` 到正确的后续状态。

## 7. Development Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `node ./scripts/governance/check-code-review-status-sync.js`
4. `node ./scripts/governance/check-technical-solution-delivery-registry.js`

## 8. Delivery Verification

1. `pnpm run build`
2. `pnpm exec vitest run apps/cli/test/runtime/session-slash-command-registry.test.ts apps/cli/test/runtime/session-shell-ink-controller.test.ts apps/cli/test/runtime/session-shell-runner.test.ts apps/cli/test/runtime/session-shell-live-app.test.ts apps/cli/test/runtime/react-cli-runner.test.ts apps/cli/test/runtime/session-shell-entrypoint-runtime.test.ts apps/cli/test/commands/secret-command.test.ts apps/cli/test/runtime/cli-secret-service.test.ts --maxWorkers=1 --maxConcurrency=1`
3. `node ./scripts/governance/sync-task-ledger.js --task-id TK-809 --tasks-dir ".repo-ai-governor/context/dev/project-092-session-shell-secure-secret-input-rollout/sprint-001-secure-local-capture-and-redacted-secret-mutation/tasks"`
4. `node ./scripts/governance/check-task-ledger-sync.js`
5. `node ./scripts/governance/check-sprint-plan-status-sync.js`
6. `node ./scripts/governance/check-code-review-status-sync.js`
7. `node ./scripts/governance/check-technical-solution-delivery-registry.js`

## 9. 执行记录

1. 2026-04-12：任务创建，状态初始化为 `planned`。
2. 2026-04-12：closeout task 的 evidence matrix 已细化，默认将以 Phase A build + targeted regression suite + ledger/delivery gates 作为退出判断基线。

## 10. 产出

1. 待执行：sprint exit acceptance and project completion assessment
