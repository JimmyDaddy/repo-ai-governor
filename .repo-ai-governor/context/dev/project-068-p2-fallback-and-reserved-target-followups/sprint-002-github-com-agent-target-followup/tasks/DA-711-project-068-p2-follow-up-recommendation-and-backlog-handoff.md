# DA-711 project-068 P2 follow-up recommendation and backlog handoff

- Status: completed
- Date: 2026-04-08
- Project: `project-068-p2-fallback-and-reserved-target-followups`
- Sprint: `sprint-002-github-com-agent-target-followup`
- Task: `TK-686`

## 1. 结论摘要

`accept`

`project-068` 已把当前 `P2 deferred` follow-up 所需的两条保守边界全部收口为可追踪真值：

1. `local-model` 保持 restricted-network / operator-selected local fallback only 的 capability ceiling、promoted use case 与 explicit non-goal guardrails。
2. `github-com-agent` 保持 reserved target contract：schema-safe staged export 可以存在，但 `supportedModes=[]`、`staged_export only`、`supportsApplyToRepo=false`、`supportsBundlePackaging=false`、`isMvpTarget=false` 继续冻结，且 fail-closed evidence 已通过 `.tmp/project-068-sprint-002-github-com-agent-reserved-target-report.json` 重放。

本次 handoff 明确建议：`project-068` 到此为止只保留 backlog recommendation、unlock dependency 与 residual-risk truth，不继续扩张为新的主线产品化实现。

## 2. 已冻结的 P2 结论

1. `local-model`
   - 推荐使用场景固定为 restricted-network / operator-selected local fallback only。
   - `tool_calling`、`structured_output`、`confirmation_gate` 继续保持 unsupported；`parallel_task`、`streaming`、`cancellation` 继续保持 degraded。
2. `github-com-agent`
   - target id 与 renderer path 继续存在，只用于 schema-safe staged export 与 target-aware contract。
   - `host export` 对该 reserved target 仍会留下 staged manifest / verification summary，但命令本身继续以 blocking result 失败退出。
   - `--apply-to-repo` 与 bundle packaging 继续被拒绝，`host verify` 继续 fail-closed。

## 3. 后续解锁前置条件

1. `github-com-agent` 至少要声明一个正式 supported mode。
2. 必须存在 discoverable 或 installed 的真实 adopter consumer path，而不是只有 staged export。
3. 必须补齐 pass 级 target-specific export/verify evidence。
4. 必须证明 GitHub.com consumption 仍回接 canonical governor runtime，而不是在宿主侧分叉实现治理逻辑。
5. 只有当上述条件与产品优先级重新对齐后，才建议从 backlog 中重新激活这一 target。

## 4. 明确保留的非目标

1. 不把 `project-068` 扩张为新的 host-native productization stream。
2. 不新增 GitHub.com coding-agent 的 adopter-facing support claim。
3. 不新增 packaged secondary-surface buildout、独立 installer、或 bundle shipping narrative。
4. 不因为 staged export artifact 的存在而把 reserved target 误读成已支持消费面。

## 5. Backlog Handoff Recommendation

1. 未来若重新激活，应继续挂在 `technical-solution.adopter-productization-priority-roadmap` follow-up 下面，而不是脱离既有 solution ownership 单独推进。
2. 优先级建议保持在当前主 adoption path 之后，仅在以下条件出现时再考虑提级：
   - 主线 adopter CLI / packaged / supported secondary surfaces 不再阻塞；
   - 有明确的 GitHub.com consumer requirement；
   - 可以提供真实 target-specific acceptance evidence。
3. 重新开工时，首个 implementation boundary 应先更新 support truth 与 unlock criteria，再决定是否值得扩张到 apply/verify/productization。

## 6. 推荐回链产物

1. `.repo-ai-governor/context/dev/project-068-p2-fallback-and-reserved-target-followups/sprint-001-local-model-capability-ceiling-and-promoted-use-case/tasks/TK-682-freeze-local-model-capability-ceiling-and-promoted-use-case-contract.md`
2. `.repo-ai-governor/context/dev/project-068-p2-fallback-and-reserved-target-followups/sprint-001-local-model-capability-ceiling-and-promoted-use-case/tasks/TK-683-implement-constrained-local-model-capability-followup-or-explicit-non-goal-guardrails.md`
3. `.repo-ai-governor/context/dev/project-068-p2-fallback-and-reserved-target-followups/sprint-002-github-com-agent-target-followup/tasks/TK-684-freeze-github-com-agent-target-contract-and-blocked-mode-exit-criteria.md`
4. `.repo-ai-governor/context/dev/project-068-p2-fallback-and-reserved-target-followups/sprint-002-github-com-agent-target-followup/tasks/TK-685-implement-github-com-agent-export-verify-followup-or-reserved-boundary-reinforcement.md`
5. `.tmp/project-068-sprint-002-github-com-agent-reserved-target-report.json`

## 7. 验证

1. `pnpm run release:verify-github-com-agent-reserved-target -- --output .tmp/project-068-sprint-002-github-com-agent-reserved-target-report.json`
2. `node ./scripts/governance/check-task-ledger-sync.js`
3. `node ./scripts/governance/check-sprint-plan-status-sync.js`
4. `node ./scripts/governance/check-code-review-status-sync.js`

