# Repo AI Governor 工具级总技术方案

- Status: active
- Date: 2026-03-19
- Scope: whole product (tool-level)
- Basis:
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`

## 1. 目标与定位

本方案是 `Repo AI Governor` 的实施总纲，用于统一后续所有迭代、模块实现与架构决策。

产品定位：

1. 不是单一 AI 编码助手，而是“流程化多 Agent 开发治理框架”。
2. 面向“接入本工具的目标仓库”，统一编排 AI 开发流程与质量门禁。
3. 支持接入任意 AI 工具（如 Codex、GitHub Copilot、Claude Code）并保持治理一致性。

## 2. 顶层设计原则

1. `流程先于模型`：先定义可执行流程，再接入具体 AI 能力。
2. `编排统一，执行开放`：编排层统一治理，执行层支持多工具并存。
3. `策略驱动人机协同`：人工只在关键节点介入，不做全流程手工编排。
4. `结构化优先`：配置、产物、审计都应结构化，便于校验与回放。
5. `可降级可恢复`：工具能力不足可降级，执行失败可恢复。
6. `记忆分层治理`：永久记忆与执行记忆分层管理，避免上下文漂移。
7. `共享会话优先`：多 Agent 在同一共享 session 中协作，保持方向一致。
8. `工作区隔离优先`：每个目标仓库必须绑定独立 workspace，避免跨仓库状态污染。
9. `事实链路闭环`：需求、方案、架构三层文档必须同源同步，并由工具门禁自动校验。
10. `共享能力单层收敛`：共享类型、通用工具与 i18n 基础能力统一收敛到 `packages/shared`，避免跨域重复实现。
11. `TypeScript 优先实现`：项目应用与核心包默认使用 TypeScript 开发，统一类型系统与契约表达，降低跨模块协作歧义。

## 3. 系统边界

## 3.1 In Scope

1. 仓库治理初始化、配置加载、规范注入。
2. 多 Agent 流程编排与策略门禁执行。
3. 适配器与技能体系（多入口接入）。
4. 审计、报告、任务台账与 CR 生命周期映射。
5. 本地与 CI 质量门禁、发布前检查与运维流程。
6. workspace 生命周期管理（创建、解析、迁移、归档）。

## 3.2 Out Of Scope

1. 组织级云端控制平面（非当前主线）。
2. 全量可视化编排平台（后续阶段考虑）。
3. 替代现有 CI/CD 或代码托管平台。

## 4. 总体架构

## 4.1 分层视图

1. `CLI & API Entry Layer`
   - 命令入口、参数解析、执行模式切换与输出模式编排。
2. `Config & Schema Layer`
   - 配置加载、Schema 校验、版本兼容与 workspace 根目录解析。
3. `Memory & Context Layer`
   - 永久记忆、执行记忆、共享 session 上下文总线。
4. `Governance Core Layer`
   - 编排引擎、策略引擎、状态管理、执行控制。
5. `Notification & Escalation Layer`
   - HITL 通知分发、升级策略与渠道回退。
6. `Agent Runtime & Adapter Layer`
   - 多角色 Agent 运行时（默认角色 + 用户自定义角色）与 Skill 能力装配，结合跨工具适配、能力矩阵与降级。
7. `Standards & Slot Layer`
   - 官方规范包、团队扩展包、声明式/脚本插槽机制。
8. `Audit & Reporting Layer`
   - 结构化事件日志、执行报告、解释与回放。
9. `Delivery & Operations Layer`
   - 质量门禁、CI smoke、发布流程与升级机制。
10. `Shared Foundation Layer`
   - 统一承接共享类型、通用工具与 i18n 资源/本地化文本构建能力，供 core/adapter/reporting 复用。

## 4.2 核心运行时引擎（Engine）

1. `Process Compiler`
   - 将 DSL 编译为可执行状态机（DAG）。
2. `Process Runtime`
   - 执行 `Sequential/Parallel/Loop/Condition` 节点。
3. `Change Risk Evaluator`
   - 将变更事实归一化为结构化风险结果，供策略引擎与 HITL 复用。
4. `Policy Gate Engine`
   - 决策 `allow/confirm/block/escalate`。
5. `Agent Coordinator`
   - 路由角色 Agent 与 surface，处理降级和接管。
6. `Role Registry`
   - 管理默认角色与用户自定义角色定义、约束与版本。
7. `Shared Session Manager`
   - 管理跨 Agent 共享 session 生命周期、快照与回放。
8. `Notification Dispatcher`
   - 在 HITL 触发与升级场景下统一分发通知，支持多渠道与重试策略。
9. `Audit Recorder`
   - 记录策略命中、人工介入、阶段结果与通知回执。
10. `Memory Manager`
   - 统一管理永久记忆与执行记忆读写策略。
11. `Artifact Registry & Dependency Resolver`
   - 统一登记关键产物元数据，解析任务依赖产物并在执行前注入上下文。
12. `Spec Sync Guard`
    - 校验“需求 -> 方案 -> 架构”三层文档与简版 PRD 的同步一致性，并输出可阻断结果。

## 4.2.1 基础设施组件（Adapter/Provider）

1. `Memory Store Adapter`
   - 屏蔽具体存储实现差异，提供统一 Provider 契约。
2. `Memory Store Providers`
   - 文件/CSV、本地数据库、线上数据库等存储后端实现。
3. `Notification Providers`
   - `email/webhook/chat-im/issue-system` 等通知渠道实现。
4. `Report Builder / Replay`
   - 执行报告构建、可解释输出与回放支持，作为 CLI 输出渲染的数据来源。
5. `CLI Output Presenter`
   - 将执行结果渲染为 `pretty/plain/json` 三种输出模式，负责终端美化与非交互降级策略。
6. `Artifact Index Store`
   - 存储产物注册索引（文件/CSV/数据库），支撑依赖查询与版本校验。

## 4.2.2 Process Compiler IR 契约（Draft v1）

1. IR 根对象最小字段
   - `ir_version`, `process_id`, `execution_id`, `compiled_at`, `entry_node_id`。
   - `compiled_at` 使用 RFC3339 秒级时间戳。
2. 结构字段
   - `nodes[]`, `edges[]`, `globals`, `compile_warnings[]`, `compile_errors[]`。
3. 节点最小字段
   - `node_id`, `stage_id`, `node_type`（sequential/parallel/loop/condition）。
   - `route_key`, `role_profile_id`, `input_schema_ref`, `output_schema_ref`。
   - `retry_policy_ref`, `timeout_policy_ref`, `budget_policy_ref`。
4. 编译错误契约
   - `error_code`, `severity`（warning/error）, `message`, `location`, `suggestion`。
   - 命中 `error` 时禁止进入 runtime；`warning` 允许继续但必须写审计。
5. 持久化与兼容
   - 编译结果快照建议落盘到 `<workspace_root>/context/compiled-ir/<execution_id>.json`。
   - `ir_version` 主版本不兼容时必须阻断执行并提示迁移。

## 4.2.3 Artifact Registry / Dependency Resolver 契约（Draft v1）

1. 注册字段（最小）
   - `artifact_id`, `artifact_type`, `artifact_path`, `artifact_version`, `artifact_status`。
   - `producer_task_id`, `producer_execution_id`, `registered_at`。
2. 依赖解析字段（最小）
   - `consumer_task_id`, `depends_on_artifacts[]`, `resolution_policy`, `resolution_result`。
3. 版本策略
   - 支持 `strict/compatible/latest` 三种解析策略，默认 `compatible`。
4. 失败策略
   - 解析失败按策略触发 `block/escalate/warn`，并写入审计事件。
5. 默认落盘
   - 建议索引路径：`<workspace_root>/context/artifact-registry/artifacts.csv`（或等价后端）。

## 4.2.4 CLI Output Contract（Draft v1）

1. 输出模式字段
   - `output_mode`：`pretty/plain/json`，默认策略为 `TTY -> pretty`、`Non-TTY -> plain`。
2. 控制参数
   - 最小参数集合：`--output`, `--verbosity`, `--no-color`（或等价参数）。
3. 模式语义
   - `pretty`：可读性优先，允许颜色、分段、阶段进度、风险提示与摘要块。
   - `plain`：纯文本稳定输出，不包含 ANSI 控制符。
   - `json`：机器可读稳定 schema，供 CI 与外部系统解析。
4. 错误输出契约
   - 至少包含 `error_code`, `hint`, `next_action`，并保留人类可读描述文本。
5. 兼容与回退
   - 非交互场景必须自动降级为 `plain` 或按显式参数输出 `json`；不得输出不可解析噪声。
6. 审计关联
   - 输出摘要应可回链 `execution_id` 与 `execution_session_id`，便于日志审计与回放定位。

## 4.2.5 Spec Sync Contract（Draft v1）

1. 校验目标文件（最小）
   - `.repo-ai-governor/normative_knowledge_sources/product-requirements.md`
   - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
   - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`
   - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
2. 校验规则（最小）
   - 三层文档元数据日期必须一致（`YYYY-MM-DD`）。
   - 若工作区检测到三层文档任一文件变更，则必须三者同变更。
   - 若 PRD 变更，则简版 PRD 必须同变更。
3. 输出模型
   - 机器可读：`status`, `failures[]`, `changed_files[]`, `missing_sync_files[]`。
   - 人类可读：失败原因摘要 + 补齐建议。
4. 失败策略
   - 默认 `block`；迁移窗口可配置 `warn`（后续阶段）。
5. 接入点
   - 通过治理脚本接入 `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md -> Verification Commands`，纳入统一门禁链路。

## 4.2.6 Standards Pack Contract（Draft v1）

1. Pack Registry 最小字段
   - `pack_id`, `pack_version`, `pack_source`, `scope`, `merge_precedence`, `status`。
2. Render Targets
   - 同一份结构化规则资产必须支持 `human/ai/agents` 三类渲染目标，并保留统一语义 ID。
3. Projection Contract
   - `agents` 渲染目标默认投影到 `AGENTS.md`（或等价入口），并记录 `projection_target`, `projected_at`, `source_pack_refs[]`。
4. Policy Rule Compiler
   - 强约束与建议项应可编译为策略引擎可消费的规则模型，避免手写多份语义。
5. Validation
   - Standards Pack 必须支持语义对齐校验，验证 human/ai/agents 三类视图是否引用同一规则资产与版本来源。

## 4.2.7 i18n Runtime Contract（Draft v1）

1. Locale 基线
   - 第一阶段至少支持 `zh-CN` 与 `en` 两套输出资源。
   - 默认 locale 由 `governor.yaml.i18n.default_locale` 声明，建议默认值为 `zh-CN`。
2. Locale 解析优先级
   - `runtime flags`（如 `--locale`）> `repo config`（`governor.yaml.i18n`）> 工具默认值。
   - 未命中完整 locale 时，按 `locale -> language -> fallback_locale` 回退（例如 `zh-TW -> zh -> en`）。
3. 资源组织与键规范
   - 基础资源统一放置在 `packages/shared/src/i18n/locales/`。
   - 语义键采用稳定命名（如 `domain.stage.message_key`），禁止在业务模块写硬编码文案。
4. 渲染与输出约束
   - `Standards Pack` 的 `human/ai/agents` 三视图应基于同一语义键按 locale 渲染，不维护语义分叉文本。
   - CLI `pretty/plain` 文案可本地化；`json` 模式机器字段保持稳定，不随语言变化。
5. 运行时 API 约束
   - `packages/shared/src/i18n/` 提供统一入口（如 `resolveLocale`, `t`, `formatMessage`），供 core/adapter/reporting 复用。
   - 领域模块仅传递语义键与上下文参数，不自管 locale 映射策略。
6. 验证与门禁
   - 新增 locale 资源时，必须通过键集一致性检查（key parity）与 fallback 可用性检查。
   - i18n 检查结果纳入质量门禁与审计事件，确保可回放定位。
7. 选型与阶段决策（Decision 2026-03-19）
   - 社区方案选型固定为 `i18next`，作为当前仓库 i18n runtime 基线实现。
   - 实现包落位固定为 `packages/shared/src/i18n/`，由 shared 对外暴露统一 API，业务域禁止重复实现 i18n runtime。
   - 阶段落位采用“双阶段分工”：Stage 1 / Phase A 落地 runtime 与 `zh-CN/en` 资源基线；Stage 6 / Phase D 落地 key parity 与 fallback 门禁及审计联动。
   - 由于当前为新仓库起步阶段，i18n 引入采用 `fix-forward` 策略，不额外引入双运行时回滚链路。

## 4.3 记忆与会话模型

1. 永久记忆（标准类记忆）
   - 内容：产品规范、代码规范、架构约束、稳定策略。
   - 特性：长期有效、低频变更、跨 session 共享。
   - 审计要求：规范资产每次变更必须记录 `changed_by`, `changed_at`, `change_reason`, `diff_ref`。
2. 执行记忆（滑动窗口记忆 / 可变记忆）
   - 内容：当前项目、sprint、task、阶段产物、待决策项。
   - 特性：高频更新、与执行阶段强绑定、可归档。
3. 共享 session（跨 Agent）
   - 定义：不同角色 Agent 共享同一 `execution_session_id` 协作。
   - 目标：保证多 Agent 处理同一目标时上下文一致，减少方向漂移。
4. 默认知识源与状态源映射
   - 规范知识源（Normative Knowledge Sources）：统一归档在 `<workspace_root>/normative_knowledge_sources/`。
   - 规范知识源目录内资产建议覆盖：产品约束、代码规范、架构约束、治理策略等（可用文件副本或索引清单方式纳管）。
   - 执行状态源（Operational State Sources）：当前执行状态`<workspace_root>/context/current-context.md` 与任务台账产物(位于 `<workspace_root>/context/dev` 下)。
5. 存储后端抽象（Memory Store Providers）
   - 基线后端：本地文件系统（Markdown/JSON）与 CSV 台账。
   - 可扩展后端：本地数据库（如 SQLite）与线上数据库（如 PostgreSQL / 托管数据库）。
   - 约束：上层仅依赖统一 Provider 契约（`read/write/query/snapshot/archive`），避免与具体存储耦合。
   - 目标：在不改变编排与策略语义的前提下，按部署场景切换存储实现。

## 4.4 Workspace 持久化模型

1. Workspace 绑定规则
   - 一个目标仓库绑定一个独立 workspace（`workspace_id`），作为运行时必要文件与数据的根目录。
2. 持久化模式
   - `tool_managed`（默认）：若未配置，`workspace_root` 解析为工具侧工作区容器中的 `.repo-ai-governor/` 根目录（建议：`~/.repo-ai-governor/workspaces/<repo_fingerprint>/.repo-ai-governor/`）。
   - `repo_local`：用户显式配置后，`workspace_root=<repo>/.repo-ai-governor/`。
3. 解析优先级
   - `runtime flags` > `governor.yaml.workspace` > 默认 `tool_managed`。
4. 仓库标识与目录命名
   - `repo_fingerprint` 建议由 `repo_root_abs_path + remote_origin(optional)` 生成稳定摘要，避免目录冲突。
   - `tool_managed_root` 指工作区容器根；容器内的实际 governor 根目录统一为 `<tool_managed_root>/<repo_fingerprint>/.repo-ai-governor/`。
5. 迁移策略
   - 模式切换必须支持 `copy/verify/switch` 三阶段迁移，失败时可回滚到切换前 workspace。

## 5. 全流程治理模型

## 5.1 标准阶段

1. 需求理解
2. 技术方案生成/评审
3. 任务拆解
4. 实施开发
5. 自测修复
6. Code Review
7. Review Verify
8. 台账回写与交付

## 5.2 流程节点类型

1. `Sequential`：串行阶段。
2. `Parallel`：并行阶段与结果聚合。
3. `Loop`：评审修复循环（必须有 `maxCycles`）。
   - 额外约束：Loop 节点必须同时声明 `maxWallTimeSeconds`，防止长时悬挂循环。
4. `Condition/Policy Route`：条件分支与策略路由。

## 5.3 错误模型与恢复策略

1. 错误分类
   - `transient`：暂时性错误（网络抖动、速率限制、短时依赖不可用）。
   - `permanent`：确定性错误（输入非法、契约不匹配、配置缺失）。
   - `policy_blocked`：策略阻断（命中 `block` 或权限边界）。
   - `timeout`：超时错误（Agent/Stage/Flow 任一超时）。
   - `cancelled`：主动取消（用户取消或系统升级取消）。
   - `concurrency_conflict`：并发冲突（文件或 session 增量写入冲突）。
   - `budget_exceeded`：资源预算超限（token/cost/time budget）。
2. Stage 重试契约
   - 字段：`retryable`, `maxRetries`, `backoffStrategy`, `backoffBaseMs`, `jitter`, `idempotency_required`。
   - `transient` 默认可重试；`permanent/policy_blocked` 默认不可重试。
3. Agent 不可用降级路径
   - 优先按 `routeKey` 能力矩阵切换 fallback surface。
   - fallback 不可用时进入 `escalate`，必要时阻断并请求人工接管。
4. Flow 级 circuit breaker
   - 字段：`failureRateThreshold`, `consecutiveFailureThreshold`, `coolDownMs`。
   - 达阈值后暂停自动推进并触发人工决策。

## 5.4 取消与超时模型

1. 取消语义
   - `cancel()` 可由用户、策略引擎或系统守卫触发，并沿 `Flow -> Stage -> Agent` 传播。
2. 三级超时
   - `agentInvocationTimeoutMs`、`stageTimeoutMs`、`flowTimeoutMs`。
3. 取消/超时后的产物处理
   - 已成功阶段产物保留并标记“中断态”。
   - 未完成阶段不写入完成态，记录中断原因与上下文快照。
   - session 输出终止快照并归档。
4. 审计字段要求
   - 记录 `cancellation_reason`, `timeout_indicator`, `timeout_scope`（agent/stage/flow）。

## 5.5 并发控制与并行聚合策略

1. 文件级并发控制
   - 默认采用乐观并发（版本戳 + 提交前校验），高冲突路径可切换显式锁。
2. Session 增量回写冲突处理
   - 先检测冲突，再按策略 `last-writer-wins` / `manual-resolve` / `merge-patch` 处理。
3. 并行节点聚合策略
   - `allOf`：全部成功才通过。
   - `anyOf`：任一成功即通过。
   - `majority`：多数成功通过，失败分支进入补偿或重试。

## 6. 多 Agent 运行时模型

## 6.1 角色基线（默认）

1. Planner
2. Architect
3. Coder
4. Tester
5. Reviewer
6. Verifier
7. 默认角色是开箱即用基线，用户可在此基础上扩展自定义角色。

## 6.2 Agent 契约

1. `agent_id`, `role`, `surface`
2. `capabilities`（tool_calling / structured_output / parallel_task / streaming）
3. `permission_level`（read/edit/test/commit/pr）
4. `role_source`（default/custom）, `role_profile_id`
5. `input_schema`, `output_schema`, `error_contract`
6. `max_execution_time_seconds`, `stage_timeout_seconds`
7. `token_budget`, `cost_budget`, `time_budget_seconds`
8. `retry_policy_ref`, `timeout_policy_ref`, `budget_policy_ref`
9. `workspace_id`, `workspace_mode`

## 6.3 路由与回退

1. 每个 routeKey 绑定 `primary surface`。
2. 每个 routeKey 绑定 `role_profile_id`（默认角色或用户自定义角色）。
3. primary 不可用时按能力矩阵降级到 fallback。
4. 无可降级路径时进入 `block/escalate` 并要求人工接管。

## 6.4 用户自定义角色模型

1. 角色定义入口
   - 通过结构化配置注册自定义角色（建议入口：`governor.yaml -> roles`）。
2. 自定义角色最小字段
   - `role_profile_id`, `role_profile_version`, `display_name`, `responsibilities`, `capabilities`, `permission_ceiling`, `status`。
   - 生命周期字段建议至少包含：`aliases[]`, `supersedes[]`, `deprecated_at`, `migration_notes`。
3. 绑定方式
   - 流程阶段通过 `routeKey` 绑定 `role_profile_id`，由 `Agent Coordinator` 路由到具体 surface。
4. 治理约束
   - 自定义角色权限不得突破全局策略上限；高风险动作仍受 `Policy Gate Engine` 与 HITL 约束。
5. 兼容性要求
   - 自定义角色必须声明输入/输出契约，确保可审计、可回放、可降级。

## 6.5 共享 Session 协作约束

1. 同一执行链路中的 Agent 必须使用相同 `execution_session_id`。
2. 阶段执行前先拉取 session 快照，执行后回写增量上下文。
3. 策略判定、人工决策、CR 状态变更必须进入 session 事件流。
4. session 结束时输出可回放快照并归档到执行台账。

## 7. Human-in-the-Loop 策略总纲

## 7.1 风险判定契约（Change Risk Evaluator）

1. 输入事实（最小）
   - `changed_paths`, `file_categories`, `requested_permissions`, `command_class`。
   - `lockfile_delta`, `migration_detected`, `ci_workflow_changed`, `release_script_changed`。
2. 输出事实（最小）
   - `risk_level`, `risk_reasons[]`, `required_action`, `required_reviewer_roles[]`, `matched_policies[]`。
3. 执行顺序
   - 先收集变更事实，再由 `Change Risk Evaluator` 归一化风险结果，最后交给 `Policy Gate Engine` 做 `allow/confirm/block/escalate` 决策。
4. 边界约束
   - adapter/surface 只负责采集事实，不负责定义高风险语义。
   - 风险语义来源于结构化配置和 Standards Pack 编译结果，不散落在命令脚本中。

## 7.2 必须触发人工介入的节点

1. 编码前技术方案未通过。
2. Review Verify 连续失败达到阈值。
3. 高权限/高风险变更（依赖、迁移、CI、发布、infra、secrets 等）。

## 7.3 决策结果

1. `allow`
2. `confirm`
3. `block`
4. `escalate`

## 7.4 人工回灌字段

1. `decision`（approve/reject/revise）
2. `reason`
3. `constraints`（可选）

## 7.5 人工介入通知渠道

1. 触发时机
   - 当阶段进入 `confirm`、`escalate` 或达到人工介入阈值时，必须触发通知分发。
2. 通知渠道接入
   - 通过通知适配器接入 `email / webhook / chat-im（如 Slack、Teams、钉钉、飞书）/ issue-system` 等渠道。
3. 最小通知载荷
   - `execution_id`, `stage_id`, `route_key`, `risk_level`, `required_action`, `deadline_at`。
4. 可靠性要求
   - 支持重试、退避与失败升级；主渠道失败时可按策略回退到备用渠道。
5. 治理约束
   - 通知策略由配置驱动（按风险等级映射渠道与接收组），且必须写入审计事件。

## 8. 适配器与技能体系

## 8.1 适配器统一接口

1. `probe()`
2. `invokeStage()`
3. `streamEvents()`（可选）
4. `requestConfirmation()`（可选）

## 8.2 能力矩阵

1. 工具调用支持
2. 结构化输出支持
3. 并行任务支持
4. 流式输出支持
5. 审批回调支持

## 8.3 技能体系定位

1. 技能用于“入口适配与上下文注入”，不替代统一编排层。
2. 技能资产应服务多入口一致行为，而非单工具一次性脚本。

## 8.4 Agent 与 Skill 职责边界

1. Agent（执行主体）
   - Agent 是流程中的责任主体，按 `role_profile_id` 参与阶段执行，对阶段输出、策略命中和审计记录负责。
2. Skill（能力单元）
   - Skill 是可复用能力包（提示词、工具调用模板、文档模板、脚本化动作），用于增强 Agent 在某入口的执行能力。
3. 调度关系
   - 编排层调度的是 Agent，不直接调度 Skill；Agent 在执行阶段按需加载一个或多个 Skill。
4. 治理边界
   - Agent 受角色权限、Policy Gate 和 HITL 约束；Skill 不拥有独立权限，只能在 Agent 权限边界内执行。
5. 生命周期
   - Agent 生命周期绑定执行 session；Skill 生命周期绑定版本与发布，可跨 session 复用。
6. 审计要求
   - 审计必须至少记录 `agent_role/role_profile_id` 与 `skill_id/skill_version`，确保可追溯与可回放。

## 8.5 Slot 脚本安全执行模型（Script Slot Security Model）

1. 默认执行模型
   - Slot 脚本默认在受限沙箱执行，默认最小权限，不继承 Agent 全量权限。
2. 权限白名单
   - 通过声明式字段显式申请 `filesystem/network/command/env` 能力，并由策略引擎审批。
3. 资源限制
   - 必须配置 `max_cpu`, `max_memory_mb`, `max_execution_time_seconds`, `max_output_bytes`。
4. I/O 契约
   - 必须声明 `input_schema`, `output_schema`, `side_effect_manifest`，避免隐式副作用。
5. 隔离与失败处理
   - 脚本异常必须失败隔离，不得污染主流程状态；必要时进入 `escalate` 并请求人工接管。
6. 审计字段
   - 至少记录 `slot_script_id`, `slot_script_version`, `slot_script_hash`, `granted_permissions`, `exit_code`。

## 9. 数据与产物契约

## 9.1 配置事实源

1. 结构化配置是唯一事实源。
2. `AGENTS.md` 是给 AI/IDE 的执行入口投影。
3. Standards Pack 事实源由结构化规范资产与 `governor.yaml.standards` 管理，统一生成 human/ai/agents 三类视图。
4. 角色事实源由 `Role Registry` 与 `governor.yaml.roles` 统一管理，支持默认角色与用户自定义角色并存。
5. workspace 事实源由 `governor.yaml.workspace` 管理，支持 `tool_managed/repo_local`。

## 9.2 执行产物

1. `plan.md`
2. `tasks/checklist.md`
3. `tasks/tasks.csv`
4. `tasks/TK-xxx.md`
5. `code-review/review_*.md -> verified_*.md -> resolved_*.md`
6. `dependency-artifact-registry`（可选文件形态，例如 `dependency-artifact-registry.md/csv`）

## 9.3 审计事件最小字段

1. `execution_id`, `stage_id`, `route_key`
2. `surface`, `agent_role`, `role_profile_id`, `role_source`, `policy_outcome`
3. `risk_level`, `risk_reasons`, `required_action`, `matched_policies`（可选，命中风险判定时记录）
4. `skill_id`, `skill_version`（可为空，未加载 skill 时）
5. `status`, `started_at`, `ended_at`, `started_at_display`, `ended_at_display`, `error`
   - `started_at` / `ended_at`：机器字段，使用 RFC3339 秒级时间戳（例如 `2026-03-18T17:45:30Z`，不使用毫秒）。
   - `started_at_display` / `ended_at_display`：人类可读展示字段，格式 `YYYY-MM-DD HH:mm:ss UTC±HH:MM`（例如 `2026-03-18 17:45:30 UTC+08:00`）。
6. `execution_session_id`, `memory_scope`, `memory_delta`
7. `notification_channel`, `notification_status`, `notified_at_display`（可选，命中 HITL 通知时记录）
8. `token_budget`, `token_used`, `cost_budget`, `cost_used`, `max_execution_time_seconds`, `execution_time_seconds`（可选，命中预算治理时记录）
9. `cancellation_reason`, `timeout_indicator`, `timeout_scope`（可选，命中取消/超时时记录）
10. `workspace_id`, `workspace_mode`, `workspace_root`（用于跨仓库追踪与审计定位）
11. `artifact_id`, `artifact_version`, `producer_task_id`, `consumer_task_id`, `dependency_resolution_status`（可选，命中依赖产物注册/解析时记录）
12. `output_mode`, `is_tty`, `output_locale`（可选，用于输出行为与体验问题回溯）
13. `spec_sync_status`, `spec_sync_failures`（可选，命中文档同步校验时记录）

## 10. 质量与发布总线

1. 日常开发遵循 `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md` 与 `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`。
2. 命令级验证以 `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md -> Verification Commands` 为准。
3. 发布前需通过本地与 CI 双轨验证（质量门禁 + smoke gate）。
4. 关键流程可接入“依赖产物完整性门禁”，在发布前阻断缺失/失效依赖产物。
5. 文档事实链路门禁默认启用，阻断“单层文档变更未同步”的交付。
6. 项目测试框架基线统一为 `Vitest`，用于承接单测、集成测试、契约测试与 E2E 测试执行；命令入口可通过 `npm/pnpm` 脚本封装，但底层 runner 保持一致。
7. 项目开发语言基线统一为 `TypeScript`；`apps/*` 与 `packages/*` 的业务实现默认采用 TypeScript，构建产物按发布需求输出为可运行的 Node.js 目标格式。
8. 多语言基线统一采用 i18n 方案（至少 `zh-CN/en`），并要求本地化文案与机器可读字段解耦，避免 CI 消费受 locale 影响。
   - 当前仓库默认 i18n runtime 基线为 `i18next`（实现位于 `packages/shared/src/i18n/`）。
9. 代码格式化与 lint 基线统一采用 `Biome`，本地可执行自动修复，CI 使用无副作用校验模式并纳入统一质量门禁。

## 11. 实施路线图（总纲级）

1. Phase A: DSL + Compiler（流程表达与编译校验）
2. Phase B: Policy Gate + HITL（策略触发、升级、回灌）
3. Phase C: Adapter Hub + Artifact Registry Foundation（多工具统一协议与产物注册基座）
4. Phase D: Audit + Replay + Dependency Resolver Runtime（可追踪、可解释、可回放、可依赖注入）
5. Phase E: Hardening（稳定性、性能、契约测试、发布治理）

## 11.1 Phase-Priority-Migration 对照矩阵

本矩阵与 `.repo-ai-governor/normative_knowledge_sources/product-requirements.md` 的 `§10.1` 以及 `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md` 的 `§7.1` 保持同步。

| PRD Priority | Delivery Focus | Technical Phases | Architecture Migration Steps |
|---|---|---|---|
| P0（已完成） | 可安装、可初始化、最小治理闭环 | Phase A（最小可用）+ Phase B（最小门禁） | Step 1（边界先行） |
| P1（进行中） | 多 Agent 编排、策略化 HITL、多工具适配 | Phase B + Phase C + Phase D | Step 2 ~ Step 6 |
| P2（规划中） | 平台化能力、组织级可观测与治理强化 | Phase E + 平台扩展阶段 | Step 7 + 平台扩展步骤 |

矩阵使用规则：
1. 新增需求需先标注所属 `P0/P1/P2`，再映射到 `Phase` 与 `Step`。
2. 若映射跨层冲突（例如高优先却依赖后置步骤），必须先补架构前置条件。

## 12. 作为实施方针的使用方式

1. 新需求进入实现前，先检查是否符合本总纲的边界与原则。
2. 若与本总纲冲突，先更新总纲决策，再推进代码实现。
3. sprint 文档只描述阶段性交付，不重复定义主架构。
4. PRD 主线更新时，优先同步本总纲，再同步简版与迭代文档。
5. 架构图与仓库分层工程蓝图见 `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`。
6. 文档元数据日期格式统一使用 `YYYY-MM-DD`，并在跨文档联动更新时同步刷新日期字段。
