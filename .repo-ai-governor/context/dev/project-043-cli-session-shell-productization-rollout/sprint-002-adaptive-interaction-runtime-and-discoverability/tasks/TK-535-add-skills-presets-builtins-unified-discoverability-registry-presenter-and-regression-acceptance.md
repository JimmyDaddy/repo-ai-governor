# TK-535 add skills presets builtins unified discoverability registry presenter and regression acceptance

- Status: planned
- Date: 2026-04-04
- Owner: AI-Agent
- Priority: P1
- Project: `project-043-cli-session-shell-productization-rollout`
- Sprint: `sprint-002-adaptive-interaction-runtime-and-discoverability`

## 1. 任务目标

把 repository-local skills、workflow/doctor/delivery presets 与 shell-local builtins 投影到统一 discoverability registry presenter，并补齐 sprint-002 的回归验收闭环。

## 2. Depends On

1. `TK-533`
2. `TK-534`
3. `apps/cli/src/runtime/interactive-shell/session-slash-command-registry.ts`
4. `apps/cli/src/runtime/session-main-capability-discoverability-runtime.ts`

## 3. 预期产物

1. unified discoverability registry presenter integration
2. skills/presets/builtins source merge policy
3. sprint-002 regression acceptance evidence

## 4. Required Inputs

1. `TK-533`
2. `TK-534`
3. `apps/cli/src/runtime/interactive-shell/session-slash-command-registry.ts`
4. `apps/cli/src/runtime/session-main-capability-discoverability-runtime.ts`
5. `.repo-ai-governor/draft/cli-borrowed-capabilities-productization-technical-solution.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-043-cli-session-shell-productization-rollout/plan.md`
2. `.repo-ai-governor/context/dev/project-043-cli-session-shell-productization-rollout/sprint-002-adaptive-interaction-runtime-and-discoverability/plan.md`
3. `.repo-ai-governor/draft/cli-borrowing-analysis-against-claude-code-and-codex.md`

## 6. 实施计划

1. 将 governed capability metadata、skills/presets metadata 与 shell-local builtins 合并到统一 registry。
2. 接入 slash palette / discoverability presenter。
3. 补齐 unified discoverability regression acceptance，并验证不反向污染 service-owned truth。

## 7. Development Verification

1. 后续实现窗口需补 unified discoverability presenter tests
2. 后续实现窗口需补 skills/presets/builtins merge policy regression
3. `node ./scripts/governance/check-task-ledger-sync.js`

## 8. Delivery Verification

1. 后续实现完成并宣告 `completed` 前，必须补 `pnpm run build`
2. 后续实现完成并宣告 `completed` 前，必须补 unified discoverability regression evidence
3. 后续实现完成并宣告 `completed` 前，必须通过 `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-04：任务创建，状态初始化为 `planned`；承接 discoverability registry presenter 与 sprint-002 回归收口。

## 10. 产出

1. 待执行：unified discoverability registry presenter integration
2. 待执行：skills/presets/builtins merge policy implementation
3. 待执行：sprint-002 regression acceptance evidence
