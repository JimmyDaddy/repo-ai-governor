# TK-170 sprint-002 出口验收与 sprint-003 optional plugin 输入约束

- Status: completed
- Date: 2026-03-26
- Owner: AI-Agent
- Priority: P0
- Project: `project-015-memory-provider-pluginization`
- Sprint: `sprint-002-built-in-registry-and-loader-foundation`

## 1. 任务目标

汇总 sprint-002 的 built-in registry / loader 基线结果，并冻结 sprint-003 optional plugin 模式的输入约束与安全边界。

## 2. Depends On

1. `TK-167`
2. `TK-168`
3. `TK-169`
4. `DA-159`

## 3. 预期产物

1. sprint-002 exit acceptance baseline。
2. sprint-003 optional plugin 输入约束。

## 4. Required Inputs

1. `TK-167`
2. `TK-168`
3. `TK-169`
4. `DA-159`

## 5. Traceback References

1. `.repo-ai-governor/draft/memory-provider-pluginization-technical-solution.md`

## 6. 实施计划

1. 汇总 built-in registry、CLI loader cutover、distribution/release hardening 的证据链。
2. 判断 sprint-002 是否达到 `accept`。
3. 冻结 sprint-003 optional plugin 模式的 allowlist / path / module policy 输入约束。

## 7. Development Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 8. Delivery Verification

1. `pnpm run check`
2. `node ./scripts/governance/check-code-review-status-sync.js`
3. `node ./scripts/governance/check-artifact-registry-lifecycle.js`

## 9. 执行记录

1. 2026-03-26：任务创建，状态初始化为 `planned`。
2. 2026-03-26：状态切换为 `in_progress`，开始汇总 `DA-167`、`DA-168`、`DA-169` 的证据链，并判定 sprint-002 是否达到 `accept`。
3. 2026-03-26：任务完成，已新增 `DA-170`，给出 sprint-002 `accept` 结论，并冻结 sprint-003 optional plugin mode 的 allowlist / prefix / path / module policy 输入约束。
4. 2026-03-26：根据 working-tree CR follow-up 收紧 sprint-002 truthfulness 口径，明确默认发行包对 `sqlite-fs` optional built-in provider 仅保留 parser/selection compatibility 与 fail-closed 语义，不宣称运行时可用。

## 10. 产出

1. [DA-170](/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-015-memory-provider-pluginization/sprint-002-built-in-registry-and-loader-foundation/tasks/DA-170-sprint-002-exit-acceptance-and-sprint-003-optional-plugin-input-constraints.md)
