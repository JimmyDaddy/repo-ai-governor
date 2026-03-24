# DA-112 project-010 出口验收与后续 rollout 输入约束

- Status: active
- Date: 2026-03-24
- Owner: AI-Agent
- Artifact ID: `DA-112`
- Produced By: `TK-112`
- Scope: `project-010-local-model-and-ide-expansion`

## 1. 目的

汇总 `project-010-local-model-and-ide-expansion` 的全量交付证据，给出项目级 `accept/block` 结论，并冻结后续 rollout 的输入约束、风险边界与交接基线。

## 2. 当前已成立的项目级证据

1. sprint-001 基线
   - `DA-099`：本地模型 adapter 契约与配置扩展基线
   - `DA-100`：Ollama 类 adapter 与 route fallback 基线
   - `DA-101`：本地模型诊断与 restricted-network rehearsal 基线
   - `DA-102`：sprint-001 出口验收与 sprint-002 输入约束
2. sprint-002 主链
   - `DA-103`：task-driven `run` 主链装配
   - `DA-104`：inline review chain 与 ledger backfill 收口
   - `DA-105`：HITL decision receipt 与 `resume/terminate/degrade`
   - `DA-106`：sprint-002 出口验收与 sprint-003 输入约束
3. sprint-003 交付/IDE
   - `DA-107`：受控 delivery rehearsal 与 audit/replay 集成
   - `DA-108`：黑盒 E2E、CI/release gate 与 GA 指标收口
   - `DA-109`：多 IDE surface registry 与 wrapper 契约强化
   - `DA-110`：VS Code/JetBrains 官方模板与 smoke 门禁
   - `DA-111`：Cursor/Claude Code 接入模板与文档一致性
   - `DA-135`：standards injection source ID 与 resolver 收口
4. 支撑 handoff
   - `project-011-cli-package-decomposition-completion-audit-summary.md`
   - `project-012-execution-context-optimization-completion-audit-summary.md`

## 3. 项目级出口判断（最终）

1. 本地模型 + 受限网络路径：`accept`
2. task-driven mainchain + inline review chain：`accept`
3. HITL decision receipt / resume semantics：`accept`
4. controlled delivery rehearsal：`accept`
5. blackbox / GA / release gate：`accept`
6. IDE official surfaces + standards injection baseline：`accept`
7. project-010 总体出口结论：`accept`

说明：
`project-010` 已完成 Stage 9 follow-up backlog 中约定的本地模型、自动主链、HITL、delivery、blackbox/GA 与 IDE official surfaces 收口，不再存在阻断 project 关闭的已知缺口。

## 4. 后续 rollout 输入约束（冻结）

1. release / GA baseline
   - 后续 rollout 必须继续消费 `DA-108` 与 `TK-108-stage9-blackbox-ga-report.json`，不得绕开 `gate:stage9-blackbox-ga`、`release:ga-check` 或 unified gate supporting report。
2. runtime / mainchain baseline
   - 新的自动主链增强必须建立在 `DA-103`、`DA-104`、`DA-105` 已冻结的 task-driven / inline-review / HITL 语义之上，不得回退到固定模板或外部排队 review 消费模式。
3. CLI engineering boundary
   - 继续消费 `project-011` 的 CLI decomposition handoff；新增 CLI runtime 能力优先落在 `commands/*`、`runtime/*`、`runtime/artifacts/*`、`runtime/presentation/*`，不得重新扩写 legacy God object。
4. IDE official surface baseline
   - `REPO_AI_GOVERNOR_ENTRY_SURFACE`、`REPO_AI_GOVERNOR_STANDARDS_PROFILE_ID`、`REPO_AI_GOVERNOR_STANDARDS_SOURCES` 现在是正式 runtime 输入面；后续扩展不得只改 template/contract 而不接 real CLI fail-fast 校验与 diagnostics。
5. standards injection baseline
   - 继续以 stable `source IDs + self-hosted resolver registry` 为唯一产品契约；任何未来扩展都只能 append baseline，不得回退到 repo-internal file path injection。
6. context / stream handoff baseline
   - 由于治理 gate 当前要求存在 active primary stream，`current-context.md` 在下一条正式执行流确定前暂不做“无 active stream”清空；下一个 project/sprint 启动时，必须先将 `project-010 / sprint-003` 移入 `completed-streams-history.md`。

## 5. 遗留风险与非阻断观察

1. 当前已形成 release / blackbox / IDE 的最小 production baseline，但更多外部 provider 路径与更广 IDE surface 覆盖仍属于后续 rollout 扩张，不影响本次 project 关闭。
2. `current-context.md` 的 stream 归档动作被刻意延后到下一条 active stream 明确时处理，这是为了兼容现有 `check-task-ledger-sync` 对 active stream 的前提假设。

## 6. 最终结论

1. 当前结论：`accepted`
2. project-010 已达到完成态，可转入完成态审计与后续 rollout handoff。
3. `DA-112` 与 project completion audit summary 共同构成后续执行流的正式输入基线。
