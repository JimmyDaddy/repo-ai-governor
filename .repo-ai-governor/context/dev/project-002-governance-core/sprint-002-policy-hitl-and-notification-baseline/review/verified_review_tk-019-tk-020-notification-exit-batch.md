# Code Review: TK-019 / TK-020 Notification Dispatcher 与出口验收批次交叉复核

- Status: verified
- Date: 2026-03-20
- Reviewer: AI-Agent
- Tasks: `TK-019`, `TK-020`
- Review Type: staged batch cross-review
- Normative References:
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md` `§7.4`、`§7.5`、`§9.3`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md` `§3`、`§4`、`§6`（特别是 `§6.7`）
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`

## 1. Review Scope

1. `packages/notification-dispatcher/` 全部新增文件：常量、类型契约、`NotificationDispatcher` 主流程。
2. `packages/shared/src/errors/error-code.constant.ts` 新增 `NOTIFICATION_DISPATCH_*` / `NOTIFICATION_PROVIDER_NOT_FOUND` 错误码。
3. `scripts/governance/check-package-dependency-boundary.js` 新增 `notification-dispatcher` 层依赖方向规则。
4. `test/notification-dispatcher.smoke.test.ts` smoke 覆盖。
5. `TK-020` 出口验收基线（`DA-030`）与 project-003 输入约束清单（`DA-031`）。
6. 台账同步：`artifacts.csv`、`dependency-artifact-registry.md`、`index.md`、`plan.md`、`checklist.md`、`tasks.csv`。

## 2. Findings

### 2.1 [MEDIUM] `check-package-dependency-boundary.js` 对 `notification-dispatcher` 依赖约束过于宽松

- 位置：`scripts/governance/check-package-dependency-boundary.js`（新增 `notification-dispatcher` 规则块）
- 问题：当前规则允许 `notification-dispatcher` 依赖整个 `core` 层（`targetPackage.layer === "core"`），但架构 `§6.7` 明确约束为 `可依赖 core-policy/core-audit/config/shared`，不含 `core-runtime`、`core-memory`、`core-session`、`core-change-risk` 等。
- 影响：如果后续有人在 `notification-dispatcher` 中引入 `core-runtime` 或 `core-memory` 的依赖，边界脚本不会报错，违反架构治理意图。
- 建议：将 `targetPackage.layer === "core"` 替换为精确包名白名单检查（仅允许 `core-policy`、`core-audit`），与 `§6.7` 保持对齐。

### 2.2 [MEDIUM] `NotificationRiskLevel` 与 `ChangeRiskLevel` 值域隐式耦合

- 位置：`packages/notification-dispatcher/src/constants/notification-dispatcher.constant.ts`（`NotificationRiskLevel` 枚举）
- 问题：`NotificationRiskLevel` 定义了 `LOW/MEDIUM/HIGH/CRITICAL`，与 `ChangeRiskLevel`（`packages/core-change-risk`）值域完全相同但类型独立。`NotificationDispatcher.readRiskLevel()` 从 `PolicyGateEvaluationResult.auditRecord.riskLevel`（类型为 `ChangeRiskLevel`）读取值，然后用 `NOTIFICATION_RISK_LEVEL_VALUES` 校验——这要求两个独立枚举的字符串值始终一致。
- 影响：如果 `ChangeRiskLevel` 新增成员而 `NotificationRiskLevel` 未同步，`readRiskLevel` 会在运行时拒绝合法值；反之则接受非法值。此耦合是隐式的，没有编译时保障。
- 背景：`notification-dispatcher` 按 `§6.7` 不应直接依赖 `core-change-risk`，因此独立枚举的决策本身合理。
- 建议：
  1. 在 `NotificationRiskLevel` 枚举定义处添加说明注释，明确其值域必须与 `ChangeRiskLevel` 保持同步，并标注同步责任方。
  2. 后续可考虑将共享风险等级值域提升到 `packages/shared/src/constants/` 作为唯一值域来源。

### 2.3 [MINOR] `GovernorErrorCode.NOTIFICATION_PROVIDER_NOT_FOUND` 已注册但未使用

- 位置：`packages/shared/src/errors/error-code.constant.ts`
- 问题：新增了 `NOTIFICATION_PROVIDER_NOT_FOUND` 错误码，但 `notification-dispatcher.ts` 中对「provider 未注册」的处理路径（`sendByChannel` 方法中 `if (!provider)`）并未抛出此错误码，而是记录 `attemptedChannels` 并返回 `false`。
- 影响：死代码。不阻断交付，但违反 CS-003 精神（已注册的代码资产应被消费或标记为已知风险）。
- 建议：删除未使用的错误码，或在 `sendByChannel` 中当 provider 缺失时使用该错误码构建 `attemptedChannels.errorMessage`（保持当前不抛出的语义，但让错误码参与诊断字段）。

### 2.4 [MINOR] `sendByChannel` 中 provider 抛出异常的路径在 smoke 测试中未覆盖

- 位置：`test/notification-dispatcher.smoke.test.ts`
- 问题：`createProvider` 支持 `throwMessage` fixture，`resolveUnknownErrorMessage` 也处理了非 `Error` 类型的抛出值，但现有 6 个测试用例中没有任何用例走到 provider `throw` 路径。所有失败场景均通过 `delivered: false` + `errorMessage` 模拟。
- 影响：provider 异常捕获与错误消息解析逻辑未受实际测试保护。
- 建议：补充一条 smoke 测试，模拟 provider 在 `send()` 中抛出异常，验证 `attemptedChannels` 正确记录 `errorMessage` 并且分发流程正常降级。

### 2.5 [MINOR] `normalizeStringList` 静默丢弃数组中的非字符串元素

- 位置：`packages/notification-dispatcher/src/notification-dispatcher.ts`（`normalizeStringList` 方法）
- 问题：该方法使用 `.filter((value): value is string => typeof value === "string")` 静默丢弃非字符串元素。对于 `matchedPolicies`、`requiredReviewerRoles` 等上游结构化字段，静默丢弃可能掩盖数据质量问题。
- 背景：此模式与 TK-017/TK-018 批次复核中 `§2.6` 标注的同类问题一致（当时结论为"部分成立，暂不阻断"）。
- 建议：保持当前行为但补充说明注释，或在后续统一做上游元素类型校验。低优先。

## 3. Positive Checks

1. 分发流程严格对齐技术方案 `§7.5`：仅在 `confirm/escalate` 触发通知，最小载荷覆盖 `executionId/stageId/routeKey/riskLevel/requiredAction/deadlineAt`。
2. 主通道重试 → fallback → 升级通道三段式路径完整，且 `fallbackChannels` 自动去重 `primaryChannel`，避免重复尝试。
3. 异常路径统一使用 `RuntimeError + GovernorErrorCode`，无原生 `Error` 直出，符合 CS-022。
4. 依赖方向实际导入只涉及 `core-policy` 和 `shared`，符合 `§6.7` 运行时约束。
5. 台账同步完整：`DA-027/DA-028` 已清理过时 `dependent_tasks` 引用；`DA-029/DA-030/DA-031` 在 `artifacts.csv`、`dependency-artifact-registry.md`、`index.md` 三处一致登记。
6. sprint-002 `plan.md` / `checklist.md` / `tasks.csv` 状态全部收敛到 `completed`，字段满足 CS-021。
7. project-003 输入约束清单（`DA-031`）覆盖 Stage 4 阻断 / 确认 / 自动三级输入风险分级，可作为 Standards/Slot 启动前的门禁参考。

## 4. Residual Risks

1. provider 仍为包内契约与测试替身，后续接入 `notification-providers/*` 时需补充跨包契约回归（provider 失败语义、重试退避参数、通知回执字段）。
2. 默认通知消息为硬编码英文，后续 i18n 集成时需接入 `packages/shared/src/i18n/` 的 locale 解析与文本格式化能力（当前阶段不阻断）。
3. project-002 项目级完成态审计摘要（里程碑入口）仍建议在项目收口窗口统一补齐，以满足长期维护协议。

## 5. 复核结论（2026-03-20）

- 整体结论：**部分认可**。
- 判定汇总：`成立 3`、`部分成立 2`、`不成立 0`。

### 5.1 逐条判定与处置

1. `§2.1`（依赖边界过宽）：**成立，已修复**。  
   已将 `notification-dispatcher` 的 `core` 依赖从“层级放行”收敛为“包级白名单放行”（`packages/core-policy`、`packages/core-audit`），与架构 `§6.7` 对齐。  
   变更文件：`scripts/governance/check-package-dependency-boundary.js`。

2. `§2.2`（`NotificationRiskLevel` 与 `ChangeRiskLevel` 隐式耦合）：**部分成立，已修复可落地部分**。  
   在 `NotificationRiskLevel` 定义处补充了“值域需与 `ChangeRiskLevel` 同步”的 why 注释，明确同步责任与边界原因（当前包依赖方向不允许直接引用 `core-change-risk`）。  
   变更文件：`packages/notification-dispatcher/src/constants/notification-dispatcher.constant.ts`。

3. `§2.3`（`NOTIFICATION_PROVIDER_NOT_FOUND` 未被消费）：**成立，已修复**。  
   在 provider 缺失路径中消费该错误码并写入 `attemptedChannels.errorMessage` 诊断信息，保持“不中断流程、进入 fallback”的语义不变。  
   变更文件：`packages/notification-dispatcher/src/notification-dispatcher.ts`、`test/notification-dispatcher.smoke.test.ts`。

4. `§2.4`（provider throw 路径缺失测试）：**成立，已修复**。  
   新增 smoke 用例覆盖 `send()` 抛错路径，验证错误信息被记录且分发可继续 fallback。  
   变更文件：`test/notification-dispatcher.smoke.test.ts`。

5. `§2.5`（`normalizeStringList` 静默丢弃非字符串）：**部分成立，已修复可落地部分**。  
   当前保持容错行为不变（避免非关键噪声导致通知链路中断），但已新增 why 注释明确该容错决策与约束。  
   变更文件：`packages/notification-dispatcher/src/notification-dispatcher.ts`。

### 5.2 本次复核执行的验证命令

1. `pnpm run typecheck`（通过）
2. `pnpm run test -- notification-dispatcher.smoke.test.ts`（通过，`Tests 45 passed`）
3. `pnpm run check`（通过）
