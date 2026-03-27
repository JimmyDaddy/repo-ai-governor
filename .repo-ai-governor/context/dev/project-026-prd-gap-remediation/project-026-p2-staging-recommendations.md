# project-026 P2 staging recommendations

- Status: active
- Date: 2026-03-28
- Source: `TK-303` closeout output
- Project: `project-026-prd-gap-remediation`

## 1. Objective

将 `project-026` 在 P0/P1 阶段已收敛的“外部 adopter 可用性”能力，平滑过渡到 P2 平台化增强，避免一次性跨面扩张。

## 2. Prioritized Backlog

| Priority | Gap ID | Scope | Why now | Suggested entry criteria |
|---|---|---|---|---|
| P2-1 | `GAP-DESKTOP` | Desktop Client 实装 | 现有 sidecar/IPC 与 desktop entry smoke 已具备最小技术底座，用户价值最高 | `project-026` completion 已冻结；desktop sidecar 协议兼容性基线稳定 |
| P2-2 | `GAP-VISUAL` | 可视化配置与执行面板 | 依赖 desktop host surface，能显著降低 adopters 的配置与排障成本 | `GAP-DESKTOP` 至少完成 alpha 交互壳层 |
| P2-3 | `GAP-SLOT-DX` | slot 调试/测试工具链 | 直接提升生态扩展效率，减少插件接入摩擦 | 插槽契约版本冻结，最小 debug trace 合同稳定 |
| P2-4 | `GAP-MARKET` | 插槽共享/分发机制 | 生态价值高，但依赖消费端治理与版本策略先成熟 | package/contract 生命周期治理和签名策略明确 |
| P2-5 | `GAP-ORG` | 组织级审计与指标看板 | 面向企业场景，需明确多租户治理边界 | 至少一个组织级试点需求落地并确认数据边界 |
| P2-6 | `GAP-CLOUD` | 云端同步与策略分发 | 复杂度最高，需最后推进 | 本地单机场景指标稳定，组织级边界明确 |

## 3. Delivery Strategy

1. 每个 P2 主题单独立项为 `project-xxx`，避免在已完成的 `project-026` 上继续隐式扩写。
2. 继续沿用“先证据后扩面”节奏：每个主题先产出最小可验证指标，再推广到广域场景。
3. 所有 P2 项目必须显式继承 `project-026` 的已知条件项：
   - 试点接入耗时统一量化沉淀

## 4. Handoff Notes

1. `project-026` 的 GA 证据快照不是 P2 的长期替代品，P2 项目应重新采集对应主题的运营指标。
2. 若 P2-1（Desktop）启动，建议优先复用现有 `scripts/examples/check-desktop-entry-smoke.js` 作为过渡门禁，再逐步扩成用户级场景验证。
