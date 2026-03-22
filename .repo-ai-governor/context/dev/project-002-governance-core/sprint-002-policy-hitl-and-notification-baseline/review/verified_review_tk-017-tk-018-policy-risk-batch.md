# Code Review: TK-017 + TK-018 批次交叉审查（Change Risk Evaluator + Policy Gate Engine）

- Status: verified
- Date: 2026-03-20
- Reviewer: AI-Agent
- Tasks: `TK-017`, `TK-018`
- Review Type: staged code batch cross-review
- Normative References:
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md` `§7.1` ~ `§7.4`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md` `§4`、`§6`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`

## 1. Review Scope

1. `packages/core-change-risk/`：风险常量体系、契约类型与 `ChangeRiskEvaluator` 主流程。
2. `packages/core-policy/`：策略常量体系、规则契约与 `PolicyGateEngine` 主流程（含 HITL 回灌）。
3. `packages/shared/src/constants/governance-reviewer-role.constant.ts`：新增 `GovernanceReviewerRole` 枚举。
4. `packages/shared/src/errors/error-code.constant.ts`：新增风险与策略错误码。
5. `test/change-risk-evaluator.smoke.test.ts`、`test/policy-gate-engine.smoke.test.ts`：smoke 覆盖。
6. 台账与产物登记同步（`plan.md`、`checklist.md`、`tasks.csv`、`artifacts.csv`、`dependency-artifact-registry.md`）。

## 2. Findings

### §2.1 \[MEDIUM\] 架构 §6 缺少 `core-policy` 依赖方向声明

- 位置：`.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md` `§6`
- 描述：架构 §6 模块依赖方向约束中明确列出了 `core-change-risk`（§6.3）、`core-memory`（§6.8）、`core-session`（§6.9）等核心包的允许依赖方向，但**未列出 `core-policy` 的依赖约束**。当前 `core-policy` 实际依赖 `core-change-risk`（消费 `ChangeRiskLevel`/`ChangeRiskRequiredAction`/`ChangeRiskEvaluationResult`）和 `shared`（消费 `GovernanceReviewerRole`/`GovernorErrorCode`/`RuntimeError`），这两条依赖方向在技术语义上是合理的（策略引擎消费风险评估输出），但缺少架构蓝图层面的显式声明，后续可能导致依赖方向检查脚本遗漏边界校验。
- 建议：在架构 §6 中补充 `core-policy` 条目，建议声明为 `core-policy -> 可依赖 core-change-risk/config/shared/standards，不依赖具体 adapters/* 和 core-runtime`。

### §2.2 \[MEDIUM\] `PolicyGateEngine.normalizeEvaluateInput` 未校验 `riskLevel`

- 位置：`packages/core-policy/src/policy-gate-engine.ts` `normalizeEvaluateInput` 方法
- 描述：`normalizeEvaluateInput` 对 `riskEvaluation.requiredAction` 进行了显式合法值校验（通过 `POLICY_GATE_OUTCOME_VALUES.has()`），但对同层级的 `riskEvaluation.riskLevel` 字段未做任何校验，直接透传到规则匹配（`resolveMatchedRules` 的 `condition.riskLevels.includes()`）和审计记录（`auditRecord.riskLevel`）。如果上游传入非法 `riskLevel` 值，规则匹配会静默失败（无规则命中），审计记录中也会记录非法值，违反结构化审计可靠性原则。
- 建议：在 `normalizeEvaluateInput` 中增加 `riskLevel` 校验，使用已有的 `CHANGE_RISK_LEVEL_VALUES` 集合进行合法值检查，与 `requiredAction` 校验保持对称。

### §2.3 \[MEDIUM\] `readRequiredString` 在 HITL 反馈上下文中使用了不精确的错误码

- 位置：`packages/core-policy/src/policy-gate-engine.ts` `readRequiredString` + `normalizeHitlFeedback`
- 描述：`readRequiredString` 是通用字符串校验方法，始终抛出 `GovernorErrorCode.POLICY_GATE_INPUT_INVALID`。当该方法被 `normalizeHitlFeedback` 调用校验 `feedback.decision` 或 `feedback.reason` 时，错误码应为更精确的 `GovernorErrorCode.POLICY_GATE_HITL_FEEDBACK_INVALID`（该错误码已定义但仅用于对象级和 decision 枚举值校验）。当前行为导致 HITL 反馈字段校验错误（如 `reason` 为空）被归类为通用输入错误，降低了错误诊断精度和下游错误分类可用性。
- 影响：`policy-gate-engine.smoke.test.ts` 中 `throws standardized error for invalid HITL feedback` 用例断言 `POLICY_GATE_INPUT_INVALID`，与当前实现一致但与错误码分类语义不匹配。
- 建议：为 `readRequiredString` 增加可选 `errorCode` 参数，在 `normalizeHitlFeedback` 调用时传入 `POLICY_GATE_HITL_FEEDBACK_INVALID`；同步更新测试断言。

### §2.4 \[MEDIUM\] `resolveHitlFinalOutcome` 将 `REVISE` 映射为 `ESCALATE` — 语义待确认

- 位置：`packages/core-policy/src/policy-gate-engine.ts` `resolveHitlFinalOutcome` 方法
- 描述：技术方案 §7.4 定义人工回灌有 `approve/reject/revise` 三种决策。当前实现将 `REVISE` 映射为 `ESCALATE`（升级），语义上表示"修改请求需进一步上级审查"。另一种合理映射是将 `REVISE` 映射为 `CONFIRM`（重回确认态等待下一轮审查），语义上表示"打回修改后重新确认"。两种映射各有道理：`ESCALATE` 更保守（安全侧），`CONFIRM` 更贴合"revise = 先修后审"的日常开发语义。
- 建议：明确记录该映射决策（当前 `REVISE -> ESCALATE`）的设计意图，如有意保留保守语义则在代码注释或任务卡中补充说明。

### §2.5 \[MINOR\] 缺少 `REVISE` 决策路径的 smoke 覆盖

- 位置：`test/policy-gate-engine.smoke.test.ts`
- 描述：`PolicyHitlDecision` 枚举包含 `APPROVE`、`REJECT`、`REVISE` 三个值。当前 smoke 测试覆盖了 `APPROVE`（→ ALLOW）和 `REJECT`（→ BLOCK）的回灌路径，但 **未覆盖 `REVISE`（→ ESCALATE）路径**。作为基线三条核心 HITL 路径之一，缺少覆盖可能导致 `resolveHitlFinalOutcome` 的 `REVISE` 映射在后续重构中被遗漏。
- 建议：在 `applies HITL feedback` 测试用例中增加 `REVISE` 场景的断言。

### §2.6 \[MINOR\] `normalizeStringList(values: unknown)` 在双场景复用中可能产生误导性错误消息

- 位置：`packages/core-change-risk/src/change-risk-evaluator.ts` + `packages/core-policy/src/policy-gate-engine.ts`
- 描述：两个包各自的 `normalizeStringList` 方法均接受 `unknown` 参数，同时服务于**外部输入校验**（如 `facts.changedPaths`、`riskEvaluation.matchedPolicies`）和**内部数组处理**（如 `createReason` 的 `evidence` 参数、`resolveMatchedPolicies` 的合并结果）。当内部调用路径上数组意外不合法时，错误消息（"Change risk list fields must be arrays" / "Policy gate list fields must be arrays"）会误导为外部输入问题。TypeScript 在编译期保证了内部调用的类型安全，但运行时类型混乱场景下可能降低排查效率。
- 建议：作为低优先级优化，可考虑在后续迭代中将内部处理与外部校验分离。当前 baseline 不构成阻断。

## 3. Positive Checks

1. **风险输出契约与技术方案 §7.1 对齐**：`ChangeRiskEvaluationResult` 完整覆盖 `riskLevel/riskReasons/requiredAction/requiredReviewerRoles/matchedPolicies`，与 §7.1 输出事实最小集一致。
2. **风险输入契约与技术方案 §7.1 对齐**：`ChangeRiskFactsInput` 覆盖 `changedPaths/fileCategories/requestedPermissions/commandClass` 以及 `lockfileDelta/migrationDetected/ciWorkflowChanged/releaseScriptChanged`，与 §7.1 输入事实最小集一致。
3. **策略决策与 §7.3 对齐**：`PolicyGateEngine.evaluate` 输出 `allow/confirm/block/escalate` 四种决策，与 §7.3 完全一致。
4. **HITL 回灌字段与 §7.4 对齐**：`PolicyHitlFeedback` 契约固定为 `decision/reason/constraints`，与 §7.4 一致。
5. **默认规则覆盖 §7.2 三条必触发节点**：`PROPOSAL_APPROVAL_REQUIRED`（方案未通过阻断）、`REVIEW_VERIFY_FAILURE_ESCALATION`（连败升级）、`RISK_ACTION_*`（高风险映射）。
6. **`GovernanceReviewerRole` 放置在 shared 层**：符合架构 §6.15（shared 不依赖业务域模块）。
7. **`core-change-risk` 依赖方向正确**：仅依赖 `shared`，符合架构 §6.3。
8. **风险评估异常路径使用标准化错误模型**：`RuntimeError + GovernorErrorCode`，符合 CS-022。
9. **常量命名与管理符合 CS-009/CS-019**：枚举使用 `PascalCase`，常量使用 `UPPER_SNAKE_CASE`，集中定义在 `constants/` 目录。
10. **类型声明分层符合 CS-013**：`interfaces/` 与 `aliases/` 分离，含 `index.ts` 聚合导出。
11. **审计记录字段完整**：`PolicyGateAuditRecord` 包含 `executionId/stageId/routeKey/policyOutcome/decisionSource/reason/riskLevel/requiredAction/matchedPolicies/matchedRuleIds/requiredReviewerRoles`，可满足后续审计回链需求。
12. **规则选择具备确定性**：`selectRuleByPriority` 先按 `priority` 降序、再按 `POLICY_OUTCOME_SEVERITY` 降序排序，保证相同优先级时严格选取阈值更高的策略。
13. **台账与产物登记同步**：`plan.md`、`checklist.md`、`tasks.csv`、`artifacts.csv`、`dependency-artifact-registry.md` 均已更新，符合 CS-021。

## 4. Residual Risks

1. 权重模型为 baseline 启发式评分，后续需在 Standards Pack 编译输入与策略配置化阶段引入可配置权重。
2. DA-025/DA-026 的 `consumed_by` 字段已被清空（与前批次 CR 决策一致），后续如需产物追溯可在 TK-020 出口验收阶段补齐。

## 5. 复核结论（2026-03-20）

- 整体结论：**部分认可**（6 项中 5 项成立并已修复，1 项为低优先级优化建议，暂不阻断）。

### 5.1 逐条复核结果

1. `§2.1`（架构 §6 缺少 `core-policy` 依赖方向声明）：**成立，已修复**。  
   已在 `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md` `§6` 新增 `core-policy` 依赖约束条目，并同步后续编号。
2. `§2.2`（`normalizeEvaluateInput` 未校验 `riskLevel`）：**成立，已修复**。  
   已在 `packages/core-policy/src/policy-gate-engine.ts` 为 `riskEvaluation.riskLevel` 增加合法值校验（`CHANGE_RISK_LEVEL_VALUES`），非法输入抛出 `POLICY_GATE_INPUT_INVALID`。
3. `§2.3`（HITL 字段错误码不精确）：**成立，已修复**。  
   `readRequiredString` 已支持传入错误码；`normalizeHitlFeedback` 对 `decision/reason/constraints` 统一使用 `POLICY_GATE_HITL_FEEDBACK_INVALID`；同时补充了规则解析场景使用 `POLICY_GATE_RULE_INVALID` 的精确归类。
4. `§2.4`（`REVISE -> ESCALATE` 语义待确认）：**部分成立，已补说明并保留当前策略**。  
   当前实现保持保守语义 `REVISE -> ESCALATE`，已在 `resolveHitlFinalOutcome` 增加 why 注释明确设计意图。
5. `§2.5`（缺少 `REVISE` 路径测试）：**成立，已修复**。  
   已在 `test/policy-gate-engine.smoke.test.ts` 增加 `REVISE -> ESCALATE` 断言。
6. `§2.6`（`normalizeStringList` 双场景复用误导性消息）：**部分成立，暂不阻断**。  
   本轮已在 `core-policy` 中通过可选错误码降低误导风险；`core-change-risk` 的同类结构作为低优先级优化项保留到后续批次，不影响当前交付正确性。

### 5.2 复核修复涉及文件

1. `packages/core-policy/src/policy-gate-engine.ts`
2. `test/policy-gate-engine.smoke.test.ts`
3. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`

### 5.3 复核命令与结果

1. `pnpm run typecheck`：通过。
2. `pnpm run test -- policy-gate-engine.smoke.test.ts`：通过（当前仓库配置下执行全量 smoke，37 tests 全通过）。
3. `pnpm run check`：通过。
