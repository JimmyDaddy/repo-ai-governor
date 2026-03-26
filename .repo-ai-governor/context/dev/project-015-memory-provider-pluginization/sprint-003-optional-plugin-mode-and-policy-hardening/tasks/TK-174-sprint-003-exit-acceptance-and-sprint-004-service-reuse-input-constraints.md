# TK-174 sprint-003 出口验收与 sprint-004 service reuse 输入约束

- Status: completed
- Date: 2026-03-26
- Owner: AI-Agent
- Priority: P0
- Project: `project-015-memory-provider-pluginization`
- Sprint: `sprint-003-optional-plugin-mode-and-policy-hardening`

## 1. 任务目标

汇总 sprint-003 的 optional plugin mode 结果，并冻结 sprint-004 service reuse 的输入约束，明确 CLI / desktop / service-backed runtime 共享 loader 的进入条件。

## 2. Depends On

1. `TK-171`
2. `TK-172`
3. `TK-173`
4. `DA-170`

## 3. 预期产物

1. sprint-003 exit acceptance baseline。
2. sprint-004 service reuse 输入约束。

## 4. Required Inputs

1. `TK-171`
2. `TK-172`
3. `TK-173`
4. `DA-170`

## 5. Traceback References

1. `.repo-ai-governor/draft/memory-provider-pluginization-technical-solution.md`

## 6. 实施计划

1. 汇总 optional plugin mode、plugin-enabled distribution 与 release gate 的证据链。
2. 判断 sprint-003 是否达到 `accept`。
3. 冻结 sprint-004 service reuse 的共享 loader / host surface / packaging 输入约束。

## 7. Development Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 8. Delivery Verification

1. `pnpm run check`

## 9. 执行记录

1. 2026-03-26：任务创建，状态初始化为 `planned`。
2. 2026-03-26：状态切换为 `in_progress`，开始汇总 optional plugin mode、plugin-enabled distribution 与 sprint-004 service reuse 输入约束。
3. 2026-03-26：任务完成，sprint-003 已形成 `accept` 口径，并冻结 sprint-004 的 shared loader / host surface / packaging 输入约束。

## 10. 产出

1. [DA-174](/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-015-memory-provider-pluginization/sprint-003-optional-plugin-mode-and-policy-hardening/tasks/DA-174-sprint-003-exit-acceptance-and-sprint-004-service-reuse-input-constraints.md)
