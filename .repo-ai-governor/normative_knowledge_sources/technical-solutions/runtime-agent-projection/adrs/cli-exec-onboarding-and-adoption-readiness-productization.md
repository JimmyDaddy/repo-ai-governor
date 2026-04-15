# CLI Exec Onboarding And Adoption Readiness Productization ADR

- Status: active
- Date: 2026-04-13
- Module ID: `runtime.agent-projection`
- ADR ID: `adr.runtime.agent-projection.cli-exec-onboarding-and-adoption-readiness-productization.v1`

## 1. Context

shared native `cli_exec` runtime、compatibility/stability guidance、launch-authoring ownership guardrail 与 additive launch diagnostics consumer projection 已经先后 formalize，但 adopter-facing readiness 仍缺一条稳定的收口链路：

1. `connect / doctor / verify` 已有 canonical onboarding truth、probe truth 与 additive launch evidence，却还缺少明确的 composition ownership。
2. local adoption 需要的是可执行的 troubleshooting order 与 next actions，而不是把 docs/playbook 自己变成第二套 runtime truth。
3. `docs/local-adoption-playbook.md` 是 operator runbook，`docs/support-matrix.md` 是 formal support truth；二者都不应在 runtime guidance 尚未收敛时被提前 uplift。

如果不先 formalize 这条 readiness evidence chain，后续 promotion 很容易只留下“先 truth、后 wording”的方向口号，却没有把 `verification_status / diagnostic_summary / next_action(s)` 绑定到现有 canonical carrier 上。

## 2. Decision

1. `runtime.agent-projection` 正式拥有 native `cli_exec` onboarding/adoption readiness evidence chain，但 ownership split 固定如下：
   - `adapter-health-and-route-probe-contract`：拥有 layered probe truth、reason codes、selected transport truth 与 probe-visible preserved facts
   - `agent-onboarding-contract`：拥有 `verification_status`、`diagnostic_summary`、`next_action` 与 `next_actions[]` 的 composition responsibility
   - local adoption / support docs：只作为 downstream consumer surface，消费既有 canonical truth，不得反向拥有 runtime facts
2. surface responsibilities 固定为：
   - `connect`：基于 normalized onboarding truth 与 optional last-known probe snapshot 投影 baseline readiness；当缺少 probe/verify evidence 时，不得把状态表达成 `pass`
   - `doctor`：消费 canonical probe truth 与 additive launch evidence，执行 layered diagnosis；只有 `safe_local` 修复可在本 surface 内完成，其余 remediation 必须通过 `next_action(s)` 暴露
   - `verify`：针对当前显式选择的 same-surface path 产出最终 readiness evidence；失败时必须保持 truthful reason，不得静默 fallback 或 transport rewrite
3. local adoption / support boundary 固定为：
   - `docs/local-adoption-playbook.md` 只承接 operator runbook uplift，可重新组织既有 `next_action(s)` 与 diagnostics explain，但不得改写 readiness truth
   - `docs/support-matrix.md` 继续作为 formal support truth，只有在独立 rollout/evidence window clean 后才允许 uplift
4. additive boundary 保持不变：
   - 不新增 onboarding 或 probe minimum fields
   - 不新增 public transport/support wording
   - 不把 docs/playbook wording 升格为新的 runtime truth

## 3. Consequences

1. `connect / doctor / verify` 现在拥有一条明确的 readiness composition chain，能够把 canonical onboarding/probe truth 稳定投影为 next-action-oriented adoption guidance。
2. promotion 只 formalize runtime guidance、contract clarification 与本 ADR；真正的 playbook uplift、consumer rollout 与 support wording evidence 继续交给 `project-104-cli-exec-onboarding-adoption-readiness-rollout`。
3. adopter-facing guidance 不再需要自行发明 success/support truth，从而降低 docs 与 runtime behavior 再次漂移的风险。
