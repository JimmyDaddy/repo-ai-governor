# sprint-001 exit acceptance summary

- Status: completed
- Date: 2026-04-03
- Project: `project-038-session-main-capability-explainer-productization`
- Sprint: `sprint-001-capability-catalog-and-turn-outcome-foundation`

## 1. Acceptance Conclusion

`sprint-001` 已达到 exit acceptance，可以收口为 `completed`。

本轮已经完成：

1. `runtime.orchestration` 单写源 capability catalog baseline
2. CLI help appendix / governed discoverability 对 single-source catalog 的 cutover
3. `session.main` capability explanation route 与 structured answer baseline
4. shared session truth / transcript affordance 的 capability metadata projection
5. capability availability overlay 与同轮 explain -> governed execution bridge baseline

## 2. Exit Criteria Check

1. capability descriptor seed/view contract 已冻结：满足
2. `help / connect / doctor / verify / review` 等 governed capability cards 已从单一 truth 渲染到 CLI help / discoverability：满足
3. `session.main` explanation route 已能输出结构化 capability answer，并写回 shared turn outcome：满足
4. CLI transcript 已能消费 `capabilityAnswerKind / referencedCapabilityIds / suggestedActions`，且 bridged command recap 可保留 explanation markdown：满足
5. availability overlay 与 explanation -> governed execution bridge 已能解释当前 readiness、setup requirement 与 preview/direct path continuity：满足

## 3. Scope Freeze For Next Sprint

以下内容在 `sprint-001` 结束时冻结为 follow-up，而不是继续扩张当前实现范围：

1. richer `comparison/examples` prose 扩展：延后
2. live dynamic availability refresh / push-based refresh：延后
3. 更多 locale 扩展：延后，当前继续以 `en-US` / `zh-CN` 为基线

## 4. Verification Evidence

已通过：

1. `PATH="/Users/jimmydaddy/Library/pnpm:/opt/homebrew/bin:$PATH" pnpm exec vitest run packages/core-orchestration-service/test apps/cli/test --maxWorkers=1 --maxConcurrency=1`
2. `PATH="/Users/jimmydaddy/Library/pnpm:/opt/homebrew/bin:$PATH" pnpm run build`
3. `/opt/homebrew/bin/node ./scripts/governance/check-task-ledger-sync.js`
4. `/opt/homebrew/bin/node ./scripts/governance/check-sprint-plan-status-sync.js`
5. `/opt/homebrew/bin/node ./scripts/governance/check-technical-solution-delivery-registry.js`
6. `PATH="/Users/jimmydaddy/Library/pnpm:/opt/homebrew/bin:$PATH" pnpm run check`

补充说明：

1. `PATH="/Users/jimmydaddy/Library/pnpm:/opt/homebrew/bin:$PATH" pnpm -s tsc -p tsconfig.json --noEmit` 仍会报出仓库内既有、与 `TK-499` 无关的 test/type drift；这不是本轮新引入的 blocker。

## 5. Next Input

下一条 implementation stream 应只在以下任一方向中择一推进：

1. capability explanation richer follow-up：comparison/examples richer prose 与 deeper suggested-action design
2. availability overlay productization：动态刷新、desktop parity 与更细粒度 projection truth
