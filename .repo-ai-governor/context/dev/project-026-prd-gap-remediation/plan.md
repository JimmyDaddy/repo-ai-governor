# project-026-prd-gap-remediation 计划

- Status: active
- Date: 2026-03-28
- Stage Mapping: Post-Stage-9 PRD gap remediation & external productization closure
- Phase Mapping: GA Blocker Fix / P1 Productization Closure / GA Evidence / P2 Staging
- Upstream:
  - `.repo-ai-governor/draft/comprehensive-requirements-gap-analysis.md`
  - `.repo-ai-governor/draft/gap-remediation-execution-order.md`

## 1. 目标

1. 关闭当前 PRD 全量目标与代码实现之间的剩余差距，优先关闭 GA 硬阻断项。
2. 按 4 个 Phase 分阶段推进：GA 阻断修复 → P1 产品化收口 → GA 运营证据 → P2 平台化准备。
3. 在不破坏当前 `project-025` gate execution efficiency 主线的前提下，逐步补齐外部 adopter 产品化缺口。
4. 保持"P0/P1 外部产品化缺口关闭前，P2 和内部治理深化均暂缓"的核心原则。

## 2. Sprint 细化

## 2.1 sprint-001-ga-blocker-notification-provider-implementation

- Status: completed
- Sprint Goal: 关闭唯一 GA 硬阻断 — 实装通知渠道 Provider 并完成 1 主 1 备 HITL rehearsal。
- Task Package: `TK-289`、`TK-290`、`TK-291`、`TK-292`。
- Evidence: `sprint-001-ga-blocker-notification-provider-implementation/hitl-notification-rehearsal-evidence.md`
- Exit Criteria:
  1. `packages/notification-providers/webhook/` 主渠道 provider 已实装并接入 `notification-dispatcher`。
  2. 至少 1 个备选渠道 provider (email 或 chat-im) 已实装。
  3. 1 主 1 备 HITL 通知 rehearsal 通过，通知回执写入审计事件。
  4. PRD §10.2 #8 不再是阻断项。

## 2.2 sprint-002-p1-productization-closure-baseline

- Status: completed
- Sprint Goal: 收口 P1 产品化缺口中工作量最小、确定性最高的一批（三视图验证、i18n 核查、exports 核查、共享包分发路径）。
- Task Package: `TK-293`、`TK-294`、`TK-295`、`TK-296`、`TK-297`。
- Input Constraints:
  1. sprint-001 的通知 provider 已至少有 webhook 基线可用。
  2. 不并行推进大工作量变更，控制变更面。

## 2.3 sprint-003-p1-productization-closure-extended

- Status: completed
- Sprint Goal: 收口 P1 产品化缺口中工作量较大的模板扩展和升级 UX 打磨。
- Task Package: `TK-298`、`TK-299`、`TK-300`。
- Input Constraints:
  1. sprint-002 的 i18n 核查和 exports 核查已完成，避免语言模板和升级 UX 建立在不稳定基础上。

## 2.4 sprint-004-ga-evidence-and-support-matrix

- Status: planned
- Sprint Goal: 沉淀 GA Readiness §10.2 全量运营证据并发布正式支持矩阵。
- Task Package: `TK-301`、`TK-302`、`TK-303`。
- Input Constraints:
  1. sprint-001 ~ sprint-003 的主要缺口已关闭。
  2. 通知渠道、i18n、模板、升级 UX 均已具备稳定基线。

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
|---|---|---|---|---|---|
| TK-289 | sprint-001 | project-026 激活与差距分析 handoff | bootstrap/governance | comprehensive-requirements-gap-analysis.md, gap-remediation-execution-order.md | completed |
| TK-290 | sprint-001 | webhook 通知 provider 实装与 dispatcher 接入 | notification/provider | TK-289, packages/notification-dispatcher | completed |
| TK-291 | sprint-001 | 备选通知渠道 provider (email 或 chat-im) 实装 | notification/provider | TK-290 | completed |
| TK-292 | sprint-001 | HITL 1 主 1 备通知 rehearsal 与审计回链验证 | verification/rehearsal | TK-290, TK-291 | completed |
| TK-293 | sprint-002 | Standards Pack 三视图端到端链路验证 | standards/e2e | TK-292 | completed |
| TK-294 | sprint-002 | i18n zh-CN/en 键集覆盖度核查与补齐 | i18n/quality | TK-292 | completed |
| TK-295 | sprint-002 | 6 个 public 包 package.json exports 系统性核查 | packaging/contract | TK-292 | completed |
| TK-296 | sprint-002 | 团队共享规范包分发路径文档与示例 | standards/docs | TK-293 | completed |
| TK-297 | sprint-002 | sprint-002 出口验收与 sprint-003 输入约束 | acceptance/baseline | TK-293, TK-294, TK-295, TK-296 | completed |
| TK-298 | sprint-003 | Python/Go 最小治理模板实装 | standards/template | TK-297 | completed |
| TK-299 | sprint-003 | upgrade/workspace lifecycle adopter UX 打磨 | cli/ux | TK-297 | completed |
| TK-300 | sprint-003 | sprint-003 出口验收与 sprint-004 输入约束 | acceptance/baseline | TK-298, TK-299 | completed |
| TK-301 | sprint-004 | 正式支持矩阵文档与 clean-room smoke 记录 | docs/support | TK-300 | planned |
| TK-302 | sprint-004 | GA Readiness §10.2 全量量化证据沉淀 | verification/ga | TK-300, TK-301 | planned |
| TK-303 | sprint-004 | project-026 completion closeout 与 P2 staging 建议 | acceptance/closeout | TK-301, TK-302 | planned |

## 4. 依赖产物策略

1. `project-026` 启动默认消费：
   - `.repo-ai-governor/draft/comprehensive-requirements-gap-analysis.md`
   - `.repo-ai-governor/draft/gap-remediation-execution-order.md`
   - `.repo-ai-governor/draft/prd-completion-status-analysis.md`
   - `.repo-ai-governor/draft/repo-ai-governor-current-state-vs-prd-gap-assessment.md`
2. `sprint-001` 只承接通知 provider GA 阻断修复，不跨面扩张。
3. `sprint-002` 承接低风险高确定性的产品化收口项。
4. `sprint-003` 承接模板扩展和 UX 打磨，需前置 sprint 稳定。
5. `sprint-004` 承接运营证据沉淀，需全部产品化缺口已关闭。

## 5. DoD（project-026）

1. PRD §10.2 #8 GA 硬阻断已关闭（通知 provider 已实装）。
2. Standards Pack 三视图端到端链路已验证闭环。
3. i18n zh-CN/en 键集 parity 已通过。
4. 至少 Python 和 Go 有最小治理模板。
5. 6 个 public 包 exports 声明已核查并补全。
6. upgrade/workspace lifecycle adopter UX 已打磨。
7. 正式支持矩阵已发布。
8. GA Readiness §10.2 全量量化证据已沉淀。
