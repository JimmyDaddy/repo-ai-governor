# Repo AI Governor 全自动研发 Gap 清单（Draft）

- Status: draft
- Date: 2026-03-24
- Owner: AI-Agent
- Scope: tool-level autonomous R&D closure
- Related Task: `TK-103`

## 1. 目的

将“为什么当前工具仍无法做到全自动研发”的分析收敛为正式 gap 清单，作为 `project-010` 后续任务拆解与 Stage 9 follow-up 的输入约束。

## 2. 本清单采用的“全自动研发”定义

1. 本仓库目标不是“所有变更默认零人工介入”，而是“在治理约束下，尽可能实现无人值守自动推进；命中高风险或策略闸口时按规则暂停”。
2. 因此，本清单的闭环定义是：
   - 至少 1 条 `plan -> run -> review -> review-verify -> report -> ledger backfill` 可在无人值守模式连续通过 rehearsal；
   - 命中 `confirm/escalate` 时，通知回执、人工决策回灌与恢复执行可回链；
   - 至少 1 条受控 delivery rehearsal 覆盖 `commit` 或 `PR draft`；
   - 黑盒 E2E、CI、发布门禁覆盖真实用户路径。

## 3. 当前结论

截至 `2026-03-24`，当前仓库已经具备“本地可接入、可诊断、可最小治理执行、可进行适配器探测和最小路由”的基线，但还不具备“长期稳定、默认可无人值守完成研发交付”的完整能力。

根因不是单点缺失，而是以下 6 类 gap 尚未同时闭环。

## 4. Gap Checklist

### 4.1 G-01 真实适配器执行面未闭环

- Status: open
- Priority: P0
- Current Signal:
  1. 现有 `codex/github-copilot/claude-code/local-model` adapter 仍以 baseline stub 为主，`invokeStage()` 只返回 `echoedInput` 一类协议回显。
  2. `TK-095` 当前也明确限定在“契约与配置扩展基线”，不引入真实调用逻辑。
- Impact:
  1. `run` 即使经过 route selection，也没有真正把研发任务交给外部 AI/provider 执行。
  2. 无法验证鉴权、超时、限流、重试、错误映射、provider outage 等真实生产行为。
- Closure Criteria:
  1. 至少 1 条远端 provider 路径与 1 条本地模型路径具备真实 `invokeStage()`。
  2. 凭据优先级、健康探测、错误映射、超时/重试、限流/backoff、secret redaction 有明确契约与验证。
  3. `doctor --adapters` 与 `verify --adapters` 可区分“命令存在”与“最小真实调用可达”。
- Suggested Landing:
  1. `TK-096`
  2. `TK-097`

### 4.2 G-02 `run` 仍是固定模板而非任务驱动编排

- Status: open
- Priority: P0
- Current Signal:
  1. 当前 `run` 仅包含 `prepare -> execute -> report` 三个固定节点。
  2. `project-010` 仍把“任务驱动动态编排”和“无人值守编排器闭环”列为 P0。
- Impact:
  1. 工具还不能根据任务目标、上下文和依赖产物动态生成研发流程图。
  2. 真实研发常见的 proposal/review/verify/backfill/delivery 阶段仍需外部命令串联。
- Closure Criteria:
  1. `run` 支持从任务目标生成或装配可执行 DAG，而不是仅依赖固定模板。
  2. 执行链路可内联 `review/review-verify/ledger-backfill` 等后续阶段。
  3. 编排层能消费 artifact dependency、role/capability、policy route、fallback 约束。
- Suggested Landing:
  1. `TK-098`
  2. sprint-002 follow-up

### 4.3 G-03 Review 链路仍是异步产物队列而非内联闭环

- Status: open
- Priority: P0
- Current Signal:
  1. `review` 目前只是写 queued artifact 并提示用户再执行 `review-verify`。
  2. `review-verify` 会继续写 `ledger-backfill`，并等待下游台账消费。
- Impact:
  1. 即使前置执行自动化了，评审与台账回填仍会把链路切断。
  2. 无法形成真正的一次触发、整链回放、整链审计。
- Closure Criteria:
  1. `review -> review-verify -> ledger backfill` 可作为 `run` 的受控子链自动推进。
  2. review artifacts 与 ledger 写入语义保持一致，但不再依赖人工手动串命令。
  3. 审计报告可直接展示 review chain 的阶段状态与阻断原因。
- Suggested Landing:
  1. `TK-098`
  2. sprint-002 follow-up

### 4.4 G-04 HITL 回执与决策回灌尚未形成执行闭环

- Status: open
- Priority: P0
- Current Signal:
  1. 策略引擎已能给出 `allow/confirm/block/escalate`，但命中 `confirm/escalate` 后运行时仍转为人工等待。
  2. Stage 9B 仍要求“至少 1 主 1 备通知渠道的 confirm/escalate 演练通过，通知回执与人工决策回灌可回链”。
- Impact:
  1. 高风险变更下，工具会停在“等人确认”，但确认结果还没有统一回灌并自动续跑。
  2. 无法做到“有条件无人值守”，只能做到“自动执行到人工点为止”。
- Closure Criteria:
  1. 至少 1 主 1 备 HITL 通知渠道接通并具备回执审计。
  2. 人工决策可回灌到 policy/runtime，并触发继续执行、终止或降级。
  3. replay/report 可完整解释“为什么停、谁决策、何时恢复”。
- Suggested Landing:
  1. `TK-098`
  2. sprint-002 follow-up

### 4.5 G-05 受控交付链路未进入正式 rehearsal

- Status: open
- Priority: P1
- Current Signal:
  1. 主计划仍把“至少 1 条受控 delivery rehearsal 覆盖 commit 或 PR draft”列为 Hard Exit。
  2. 当前 `run` 与 review chain 尚未与 delivery 动作形成可回放的一体化闭环。
- Impact:
  1. 即便研发过程阶段性自动化，真正的交付动作仍未纳入统一治理闭环。
  2. 无法给出“自动执行已覆盖到交付前/交付时”的可信完成态。
- Closure Criteria:
  1. 至少覆盖 `commit` 或 `PR draft` 的受控 rehearsal。
  2. policy、risk、HITL、audit、report 对 delivery 阶段保持一致语义。
  3. 若某些 delivery 能力暂不开放，必须明确人工接管边界与恢复点。
- Suggested Landing:
  1. sprint-002 follow-up
  2. Stage 9B closure

### 4.6 G-06 稳定性与黑盒门禁还未覆盖“真实无人值守路径”

- Status: open
- Priority: P1
- Current Signal:
  1. Stage 9B 仍要求黑盒 E2E、CI 与发布流水线覆盖真实用户路径。
  2. `project-010` 仍把深度可用性探测、真实调用稳定性门禁列为未完成输入。
- Impact:
  1. 即便实现真实调用，也无法证明在 provider outage、限流、受限网络、fallback 场景下可持续运行。
  2. 发布质量无法稳定说明“全自动研发能力已经达到可运营级别”。
- Closure Criteria:
  1. 黑盒 E2E 覆盖 `plan/run/review/review-verify/report/ledger-backfill` 主路径与降级路径。
  2. CI/release 门禁覆盖 provider outage、timeout、retry exhaustion、fallback、restricted network。
  3. 运营指标至少覆盖成功率、人工介入率、time-to-first-success、失败原因分布。
- Suggested Landing:
  1. `TK-097`
  2. sprint-002 follow-up

## 5. 与当前任务体系的映射

1. `TK-095`：仅解决本地模型契约与配置扩展，不解决真实调用。
2. `TK-096`：优先承接 G-01。
3. `TK-097`：优先承接 G-01/G-06，并补强 deep probe。
4. `TK-098`：优先承接 G-02/G-03/G-04，并将剩余交付链路与稳定性要求整理为 sprint-002 输入约束。

## 6. 建议的执行顺序

1. 先闭环 G-01，否则后续所有“自动执行”都只能停留在协议演示层。
2. 再闭环 G-02/G-03，把 `run` 升级为真正的任务驱动链路并内联 review chain。
3. 然后闭环 G-04，把 HITL 从“人工中断点”升级为“可恢复执行点”。
4. 最后用 G-05/G-06 做交付 rehearsal 与可运营性收口。

## 7. 使用建议

1. 本文档是 draft 级分析输入，不替代 triad 文档或 project plan。
2. 若后续确认这些 gap 已成为正式阶段约束，应在同一变更窗口同步到：
   - `project-010` 的 plan/sprint 计划；
   - Stage 9 follow-up 主执行计划；
   - 对应任务卡与验收标准。
