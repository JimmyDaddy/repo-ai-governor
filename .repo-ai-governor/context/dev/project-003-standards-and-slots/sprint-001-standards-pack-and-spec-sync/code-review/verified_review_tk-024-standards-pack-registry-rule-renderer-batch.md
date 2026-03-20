# Code Review: TK-024 Standards Pack Registry 与 Rule Renderer 基线（批次交叉审查）

- Status: verified
- Date: 2026-03-20
- Reviewer: AI-Agent (cross-review)
- Task: `TK-024`
- Review Type: batch cross-review
- Normative References:
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`（`§4.2.6 Standards Pack Contract`）
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`（`§5`、`§6.14`、`§6.16`）
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`（`CS-009`、`CS-013`、`CS-016`、`CS-017`、`CS-022`）

## 1. Review Scope

| # | 文件 | 变更类型 |
|---|------|----------|
| 1 | `packages/standards/src/standards-pack-registry.ts` | NEW (360 lines) |
| 2 | `packages/standards/src/rule-renderer.ts` | NEW (327 lines) |
| 3 | `packages/standards/src/constants/standards.constant.ts` | NEW (61 lines) |
| 4 | `packages/standards/src/types/interfaces/standards.interface.ts` | NEW (120 lines) |
| 5 | `packages/standards/src/types/aliases/standards.type.ts` | NEW (14 lines) |
| 6 | `packages/standards/src/index.ts` | NEW (barrel) |
| 7 | `packages/standards/src/constants/index.ts` | NEW (barrel) |
| 8 | `packages/standards/src/types/index.ts` | NEW (barrel) |
| 9 | `packages/standards/src/types/interfaces/index.ts` | NEW (barrel) |
| 10 | `packages/standards/src/types/aliases/index.ts` | NEW (barrel) |
| 11 | `packages/standards/package.json` | NEW |
| 12 | `packages/standards/README.md` | NEW |
| 13 | `packages/shared/src/errors/error-code.constant.ts` | MODIFIED (+3 error codes) |
| 14 | `test/standards-pack.smoke.test.ts` | NEW (190 lines) |
| 15 | Governance docs (task card / checklist / plan / DA-032 etc.) | MODIFIED |

## 2. Findings

### 2.1 [MEDIUM] `normalizeRuleDefinition` 未校验 localizedTemplates render target 完整性

- **位置**: `packages/standards/src/standards-pack-registry.ts` L252–L275（`normalizeRuleDefinition` 内 `localizedTemplates` 验证段）
- **规范依据**: §4.2.6 "三视图语义对齐校验——同一 semantic_key 在 human / ai / agents 三个投影中必须提供可编译输出"
- **问题描述**: 当前验证逻辑只遍历 `localizedTemplates[locale]` 中**已提供**的 target-key 并做 enum + non-empty 校验，但不检查每个 locale 条目是否覆盖了所有三个 `StandardsRenderTarget`（`human / ai / agents`）。因此一个 pack 可以仅注册 `human` 和 `ai` 模板而在注册阶段不报错，直到渲染 `agents` 目标时才抛出 `RULE_RENDER_TEMPLATE_MISSING`。
- **影响**: 将可以在注册阶段早期拦截的"三视图不完整"问题推迟到渲染时才暴露，不符合 fail-fast 原则，且 §4.2.6 明确要求对齐校验。
- **复现**: 测试用例 `standards-pack.smoke.test.ts` L157–L169 中通过 `as Record<StandardsRenderTarget, string>` 强转绕过 TypeScript 类型检查来构造缺失模板 fixture。
- **建议修复**:
  ```ts
  // normalizeRuleDefinition 中，在 normalizedTargetTemplateMap 构建完成后添加：
  const missingTargets = Array.from(STANDARDS_RENDER_TARGET_VALUES).filter(
    (target) => !(target in normalizedTargetTemplateMap),
  );
  if (missingTargets.length > 0) {
    throw new RuntimeError(
      GovernorErrorCode.STANDARDS_PACK_INVALID,
      `Field "${fieldName}.localizedTemplates.${locale}" is missing targets: ${missingTargets.join(", ")}.`,
    );
  }
  ```
  同时将 smoke test 对应 fixture 改为由 `normalizeRuleDefinition` 校验触发（即验证注册阶段即可拦截），而非依赖渲染阶段 `RULE_RENDER_TEMPLATE_MISSING`。

### 2.2 [MEDIUM] `interpolationByRuleId` 以 `ruleId` 为键，precedence merge 后调用方需知道被胜出的 ruleId

- **位置**: `packages/standards/src/rule-renderer.ts` L59（`input.interpolationByRuleId?.[resolvedRule.definition.ruleId]`）; `packages/standards/src/types/interfaces/standards.interface.ts` L97（`interpolationByRuleId` 字段定义）
- **规范依据**: §4.2.6 "同一 semantic_key 跨层覆盖（repository > team > official）——registry 按 merge_precedence 去重"
- **问题描述**: `RuleRendererRenderInput.interpolationByRuleId` 以 `ruleId` 为键查找插值参数。但经过 precedence merge 后，同一 `semanticKey` 的胜出规则可能来自不同 pack（如 repository pack 覆盖了 official pack），其 `ruleId` 与 official 不同。调用方必须事先调用 `resolveRules()` 确认胜出 ruleId 才能正确提供插值，这增加了 API 耦合度。
- **影响**: 基线阶段可接受，但随着 pack 层级增多，`semanticKey` 作为稳定锚点可能更适合做插值查找键。
- **建议**: 在当前 `interpolationByRuleId` 基础上增加 `interpolationBySemanticKey` 备选路径，render 方法中优先匹配 `ruleId`，fallback 到 `semanticKey`。或在 `RuleRendererRenderInput` 中直接使用 `semanticKey` 作为键名。此项可作为后续迭代优化，不阻断基线。

### 2.3 [MINOR] `readRequiredString` 方法在 Registry 与 Renderer 中完全重复

- **位置**: `packages/standards/src/standards-pack-registry.ts` L323–L341; `packages/standards/src/rule-renderer.ts` L305–L327
- **规范依据**: CS-017 (OOP)、DRY 原则
- **问题描述**: 两个类的 `readRequiredString` 实现完全一致（类型检查 → trim → 空串检查 → 抛 `RuntimeError`），只是使用的 error code 不同（`STANDARDS_PACK_INVALID` vs `RULE_RENDER_INVALID`）。
- **影响**: 基线阶段代码量可控，但后续新增 Projector / Spec Sync Guard 等同域模块后，此模式将进一步扩散。
- **建议**: 可抽取为 `packages/standards/src/utils/validation.util.ts` 内的共享函数，接收 error code 作为参数。此项为低优先级，不阻断基线。

### 2.4 [MINOR] `resolveRules` 排序中 ruleId 二次排序为死代码

- **位置**: `packages/standards/src/standards-pack-registry.ts` L145–L155
- **问题描述**: `resolveRules` 先按 `semanticKey` 去重存入 Map，再对结果排序时使用 `semanticKey` 升序 + `ruleId` 作为二次排序。由于 Map 中 `semanticKey` 已经唯一，`semanticComparison !== 0` 永远成立，`ruleId` 对比分支永远不会执行。
- **影响**: 不影响正确性，仅增加认知负担。
- **建议**: 移除 ruleId 二次排序分支，或添加注释说明这是为后续可能的多定义保留。

## 3. 正面观察

1. **依赖方向合规**: `packages/standards` 仅依赖 `packages/shared`，与 §6.14 约束一致；`check-package-dependency-boundary.js` 已正确注册 `standards` 层与 `standards-no-adapter-dependency` 规则。
2. **类型目录结构**: `types/interfaces/` + `types/aliases/` 分层结构符合 CS-013。
3. **标准化错误码**: 新增 `STANDARDS_PACK_INVALID`、`RULE_RENDER_INVALID`、`RULE_RENDER_TEMPLATE_MISSING` 遵循 CS-022，且在 `GovernorErrorCode` enum 中按领域分组插入。
4. **Locale fallback chain**: Renderer 的 `collectLocaleCandidates()` 实现了 `requested → languageBase → default → defaultBase → fallback → fallbackBase` 六级降级，符合 §4.2.7 i18n Runtime Contract。
5. **Enum value set**: 用 `Set<string>(Object.values(...))` 做运行时验证而非仅靠 TypeScript 类型，符合 CS-009 与防御边界要求。
6. **Registry reader 接口解耦**: `RuleRenderer` 仅依赖 `StandardsPackRegistryReader` 接口而非具体 `StandardsPackRegistry` 类，符合 DIP。

## 4. Conclusion

| Severity | Count |
|----------|-------|
| MEDIUM | 2 |
| MINOR | 2 |

`TK-024` 实现整体质量良好，基线契约完整度高。`§2.1`（三视图完整性校验）建议在当前 sprint 内修复以对齐 §4.2.6 fail-fast 要求；`§2.2`（interpolation key）可作为后续迭代优化项记录；`§2.3`、`§2.4` 不阻断基线交付。

## 复核结论（2026-03-20）

- 整体结论：**部分认可**

### 逐条复核

1. `2.1 [MEDIUM] localizedTemplates render target 完整性校验缺失`
   - 判定：**认可**。
   - 证据：`StandardsPackRegistry.normalizeRuleDefinition()` 原实现仅校验“已提供 target 的合法性”，未强制每个 locale 覆盖 `human/ai/agents` 全集。
   - 处理：**已修复**。在注册阶段新增缺失 target 检查，缺失时抛出 `STANDARDS_PACK_INVALID`，实现 fail-fast。
   - 变更位置：`packages/standards/src/standards-pack-registry.ts`。

2. `2.2 [MEDIUM] interpolation 仅按 ruleId 查找`
   - 判定：**认可**。
   - 证据：规则经过 precedence merge 后，稳定锚点是 `semanticKey`；仅支持 `ruleId` 会提高调用耦合。
   - 处理：**已修复**。在保留 `interpolationByRuleId` 兼容性的同时，新增 `interpolationBySemanticKey` 回退路径（`ruleId` 优先，`semanticKey` 回退）。
   - 变更位置：
     - `packages/standards/src/types/interfaces/standards.interface.ts`
     - `packages/standards/src/rule-renderer.ts`

3. `2.3 [MINOR] readRequiredString 重复`
   - 判定：**部分认可**。
   - 证据：重复实现客观存在。
   - 处理：**本轮不做结构性抽取**。当前两处错误码语义不同（`STANDARDS_PACK_INVALID` / `RULE_RENDER_INVALID`），且该项不阻断正确性与契约完整性；优先保证本批次中高优先级行为一致性修复。后续可在 `packages/standards` 内统一抽象校验 helper，再一并收敛。

4. `2.4 [MINOR] resolveRules 二次排序死代码`
   - 判定：**认可**。
   - 证据：`semanticKey` 去重后集合内已唯一，`ruleId` 二次排序不可达。
   - 处理：**已修复**。移除不可达的 `ruleId` 分支，仅保留 `semanticKey` 排序。
   - 变更位置：`packages/standards/src/standards-pack-registry.ts`。

### 测试与验证

- 已执行：`pnpm run typecheck`（通过）
- 已执行：`pnpm run test -- standards-pack.smoke.test.ts`（通过）
- 已执行：`pnpm run check`（通过）

### 修复说明补充

- 原“缺失 target 在渲染阶段报错”的 smoke 用例已改为“注册阶段 fail-fast 报错”，使行为与 `§4.2.6 Standards Pack Contract` 对齐。
- 新增 smoke 覆盖：
  - `semanticKey` 插值回退路径；
  - `ruleId` 与 `semanticKey` 并存时的优先级（`ruleId` 优先）。
