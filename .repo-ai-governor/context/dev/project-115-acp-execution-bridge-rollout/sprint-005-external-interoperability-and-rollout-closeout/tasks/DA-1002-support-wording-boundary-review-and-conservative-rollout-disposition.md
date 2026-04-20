# DA-1002 support wording boundary review and conservative rollout disposition

- Status: active
- Date: 2026-04-20
- Owner: AI-Agent
- Task: `TK-1002`
- Project: `project-115-acp-execution-bridge-rollout`
- Sprint: `sprint-005-external-interoperability-and-rollout-closeout`

## 1. Summary

1. sprint-005 已复核当前 ACP support wording uplift 条件，结论是：现有 public/support truth 已经保持在正确的保守边界，本轮不需要再扩大 claim。
2. `docs/local-adoption-playbook.md`、`docs/local-adoption-playbook.zh-CN.md`、`docs/support-matrix.md` 与 `docs/support-matrix.zh-CN.md` 当前都把 ACP 约束在 evidence-backed readiness / bootstrap surface，而不是 external consumer execution rollout。
3. 由于 `DA-1001` 已确认本地没有可用 external ACP consumer，本轮不得把 ACP 描述升级为“已完成真实外部互操作验证”或“fully supported external ACP rollout”。

## 2. Reviewed Truth Surfaces

1. `DA-1000-sprint-004-clean-room-execution-evidence-and-sprint-005-activation-handoff.md`
2. `DA-1001-optional-external-acp-consumer-availability-and-rehearsal-disposition.md`
3. `docs/local-adoption-playbook.md`
4. `docs/local-adoption-playbook.zh-CN.md`
5. `docs/support-matrix.md`
6. `docs/support-matrix.zh-CN.md`
7. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/acp-execution-bridge-and-invoke-stream-confirm-cutover.md`

## 3. Review Conclusions

1. 当前允许继续保留的 support claim：
   - `acp_exec` 是显式独立 transport，不是 `cli_exec` alias
   - runtime-service readiness、packaged-distribution readiness 与 clean-room verified summary 已构成 evidence-backed ACP host/bootstrap boundary
   - invoke / stream / confirm 仍需对 blocked/fail-closed truth 诚实投影，不得静默解释成 `cli_exec` 成功
2. 当前仍不得宣称：
   - external ACP consumer 已完成真实互操作验证
   - adopter-facing ACP execution rollout 已完全 support-ready
   - ACP 可以在 support wording 中被表述成 same-surface execution fallback
3. 因为既有文档已经符合以上边界，本轮 support review 的正确结果是“保持现状”，而不是强行刷新 docs 以制造新的 public wording delta。

## 4. Documentation Disposition

1. 本轮不修改 `docs/local-adoption-playbook*` 与 `docs/support-matrix*`。
2. 理由不是忽略 support truth，而是确认这些文档已经与 sprint-004 的 clean-room evidence、sprint-005 的 optional-rehearsal unavailable 结论以及 ADR 的 deferred boundary 保持一致。
3. 若未来出现真实 external ACP consumer、并完成可回放的 rehearsal evidence，再通过独立 follow-up 窗口评估是否需要 uplift public wording。

## 5. Outputs

1. `.repo-ai-governor/context/dev/project-115-acp-execution-bridge-rollout/sprint-005-external-interoperability-and-rollout-closeout/tasks/DA-1002-support-wording-boundary-review-and-conservative-rollout-disposition.md`
2. `docs/local-adoption-playbook.md` / `docs/local-adoption-playbook.zh-CN.md` / `docs/support-matrix.md` / `docs/support-matrix.zh-CN.md`（复核后保持不变）
