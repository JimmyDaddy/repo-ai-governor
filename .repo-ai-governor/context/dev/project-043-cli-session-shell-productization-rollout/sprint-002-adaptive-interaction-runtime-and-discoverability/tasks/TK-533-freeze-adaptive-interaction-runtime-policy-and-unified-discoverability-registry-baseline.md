# TK-533 freeze adaptive interaction runtime policy and unified discoverability registry baseline

- Status: planned
- Date: 2026-04-04
- Owner: AI-Agent
- Priority: P0
- Project: `project-043-cli-session-shell-productization-rollout`
- Sprint: `sprint-002-adaptive-interaction-runtime-and-discoverability`

## 1. 任务目标

冻结 adaptive interaction runtime policy 与 unified discoverability registry 的最小 contract，使后续实现不再在 session shell、builtin registry 与 skills/presets loader 层各自定义不同的输入语义。

## 2. Depends On

1. `.repo-ai-governor/draft/cli-borrowed-capabilities-productization-technical-solution.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/contracts/cli-session-shell-contract.md`
3. `apps/cli/src/runtime/interactive-shell/session-shell-runner.ts`
4. `apps/cli/src/runtime/interactive-shell/session-slash-command-registry.ts`

## 3. 预期产物

1. adaptive interaction runtime policy baseline
2. unified discoverability registry 最小字段集合
3. `TK-534 / TK-535` 的统一实现边界

## 4. Required Inputs

1. `.repo-ai-governor/draft/cli-borrowed-capabilities-productization-technical-solution.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/contracts/cli-session-shell-contract.md`
3. `apps/cli/src/runtime/interactive-shell/session-shell-runner.ts`
4. `apps/cli/src/runtime/interactive-shell/session-slash-command-registry.ts`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-043-cli-session-shell-productization-rollout/plan.md`
2. `.repo-ai-governor/context/dev/project-043-cli-session-shell-productization-rollout/sprint-002-adaptive-interaction-runtime-and-discoverability/plan.md`
3. `.repo-ai-governor/draft/interactive-cli-session-first-agent-shell-technical-solution.md`

## 6. 实施计划

1. 冻结 `screen_mode / overlay_mode / fallback_policy / terminal_density` 的最小政策集合。
2. 冻结 request-user-input seam 与 discoverability registry 最小字段集合。
3. 明确 service-owned metadata、repository-local skills 与 shell-local builtins 的组合边界。

## 7. Development Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. docs-only decomposition；当前阶段未修改 `apps/**`、`packages/**`、`bin/**`、`test/**`

## 8. Delivery Verification

1. 当前拆解窗口需通过 `node ./scripts/governance/check-task-ledger-sync.js`
2. 当前拆解窗口需通过 `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. 后续实现完成并宣告 `completed` 前，必须补 `pnpm run build` 与 adaptive runtime / discoverability regression evidence

## 9. 执行记录

1. 2026-04-04：任务创建，状态初始化为 `planned`；承接 interaction runtime policy 与 discoverability contract 冻结。

## 10. 产出

1. 待执行：adaptive interaction runtime policy baseline
2. 待执行：unified discoverability registry contract baseline
3. 待执行：`TK-534 / TK-535` 实施边界冻结记录
