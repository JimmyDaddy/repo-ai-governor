# 边界规则与依赖方向检查策略（TK-002）

- Status: active
- Date: 2026-03-18
- Milestone: `M0`
- Sprint: `sprint-001`
- Task: `TK-002`

## 1. 目标

在重构早期（Step 1）先固化“边界规则 + 依赖方向检查策略”，避免后续拆分为 `apps/*` 与 `packages/*` 时出现反向依赖和架构腐化。

## 2. 事实源与约束来源

1. `docs/repo-ai-governor-architecture-and-repo-layering.md`
   - `§6 模块依赖方向约束`
   - `§7 Step 1~7 迁移路径`
2. `code_standards.md`
   - `CS-014`（monorepo 命名）
   - `Monorepo Version And Dependency Boundary Baseline`
   - `Pending Integration Memo`
3. `docs/governance/long-term-maintenance-guide.md`
   - `Pending Gate Integration Memo`
   - `Documentation Sync Rules`

## 3. Step 1 边界规则（当前阶段）

在未完成完整 monorepo 拆分前，先在现有仓库执行“逻辑边界先行”：

1. 入口边界
   - `apps/cli`（后续）或当前命令入口层只能做路由与参数编排。
2. 配置边界
   - 配置解析、schema 校验、workspace 解析属于配置层，不承载业务执行。
3. 核心边界
   - process/policy/role/session/memory 属于核心运行时，不允许反向依赖具体 adapter/provider。
4. 适配边界
   - adapters/provider 只面向契约层（sdk/adapter），不允许反向依赖 CLI 入口。
5. 观测边界
   - audit/reporting 读取执行事实，不回写核心控制流决策。

## 4. 目标依赖方向（迁移后）

遵循 `architecture-and-repo-layering.md §6`：

1. `apps/*` -> 可依赖 `packages/*`，不得被 `packages/*` 反向依赖。
2. `core-*` -> 只能依赖共享类型、配置与契约层，不依赖具体 provider。
3. `memory-providers/*` -> 只依赖 `memory-store-adapter/shared-*`。
4. `notification-providers/*` -> 只依赖 `notification-dispatcher/shared-*`。
5. `adapters/*` -> 只依赖 `adapter-sdk/shared-*`，不得依赖 `apps/cli`。

## 5. 检查策略（Warning -> Blocking）

### Phase A（当前，M0/TK-002）

1. 产出规则文档（本文件）并建立执行口径。
2. 使用任务台账 + CR 记录人工检查结果。
3. 不启用阻断式门禁。

### Phase B（M1/TK-115）

1. 接入 `scripts/governance/check-package-dependency-boundary.js`。
2. 默认 `warning` 模式：发现违规返回报告，但不阻断主流程。
3. 输出违规清单并追踪到任务台账。

### Phase C（M5/TK-503）

1. 边界检查切换为 `blocking gate`。
2. 违规即非零退出码，阻断 CI/发布门禁。
3. 与版本策略门禁协同执行。

## 6. 违规分级与处置

1. Blocking
   - 跨层反向依赖、CLI 被底层反向引用、provider 直接依赖核心实现。
2. Major
   - 边界穿透但可快速重构修复。
3. Minor
   - 命名/导出面不规范但未形成反向耦合。

处置规则：

1. Blocking/ Major 必须创建任务并在下个 sprint 前关闭。
2. Minor 可进入当 sprint 债务池，但需附带到期时间。
3. 任何豁免必须在白名单中记录 `path + reason + owner + expiry`。

## 7. 产物与落地要求

1. 本任务交付：规则与策略文档（本文件）。
2. 后续任务衔接：
   - `TK-115` 负责 warning 门禁脚本接入。
   - `TK-503` 负责 blocking 门禁切换。
3. 台账要求：
   - checklist 与 tasks.csv 必须记录检查结论与 CR 状态。

## 8. TK-002 验收标准

1. 规则来源、边界定义、依赖方向、门禁节奏均有明确文本。
2. 与 `PRD -> 技术方案 -> 架构蓝图` 术语一致。
3. 已在 `M0/sprint-001` 台账中登记并形成 `verified_review` 记录。
