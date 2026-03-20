# Code Review: TK-025 Agents Projector 与 Projection Parity 基线（批次交叉审查）

- Status: verified
- Date: 2026-03-20
- Reviewer: AI-Agent (cross-review)
- Task: `TK-025`
- Review Type: batch cross-review
- Normative References:
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`（`§4.2.6 Standards Pack Contract`）
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`（`§5`、`§6.14`、`§6.16`）
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`（`CS-009`、`CS-011`、`CS-013`、`CS-016`、`CS-017`、`CS-022`）

## 1. Review Scope

| # | 文件 | 变更类型 |
|---|------|----------|
| 1 | `packages/standards/src/agents-projector.ts` | NEW (330 lines) |
| 2 | `packages/standards/src/providers/agents-projection-now-provider.abstract.ts` | NEW (14 lines) |
| 3 | `packages/standards/src/providers/default-agents-projection-now-provider.ts` | NEW (14 lines) |
| 4 | `packages/standards/src/providers/index.ts` | NEW (barrel) |
| 5 | `packages/standards/src/utils/validation.util.ts` | NEW (25 lines) |
| 6 | `packages/standards/src/utils/index.ts` | NEW (barrel) |
| 7 | `packages/standards/src/rule-renderer.ts` | MODIFIED (readRequiredString 收敛) |
| 8 | `packages/standards/src/standards-pack-registry.ts` | MODIFIED (readRequiredString 收敛) |
| 9 | `packages/standards/src/types/interfaces/standards.interface.ts` | MODIFIED (+80 lines, projector 等新接口) |
| 10 | `packages/standards/src/types/interfaces/index.ts` | MODIFIED (新 exports) |
| 11 | `packages/standards/src/types/index.ts` | MODIFIED (新 exports) |
| 12 | `packages/standards/src/index.ts` | MODIFIED (新 exports) |
| 13 | `packages/standards/src/constants/standards.constant.ts` | MODIFIED (+1 constant) |
| 14 | `packages/standards/src/constants/index.ts` | MODIFIED (新 export) |
| 15 | `packages/standards/README.md` | MODIFIED |
| 16 | `packages/shared/src/errors/error-code.constant.ts` | MODIFIED (+2 error codes) |
| 17 | `test/standards-projection-parity.smoke.test.ts` | NEW (187 lines) |
| 18 | Governance docs (task card / checklist / plan / DA-033 etc.) | MODIFIED |

## 2. Findings

### 2.1 [MEDIUM] `types/interfaces/standards.interface.ts` 导入 `providers/` 层的抽象类，违反 CS-013 类型目录纯净性

- **位置**: `packages/standards/src/types/interfaces/standards.interface.ts` L8（`import type { AgentsProjectionNowProvider } from "../../providers/index.js";`）
- **规范依据**: CS-013（类型目录结构：`types/interfaces/` 存放纯接口定义）、CS-011/CS-012（type vs interface 选型约束）
- **问题描述**: `AgentsProjectorOptions.nowProvider` 的类型引用了 `providers/` 目录下的 `abstract class AgentsProjectionNowProvider`。这在类型层引入了对实现层（providers）的运行时构造（abstract class）依赖，形成 `types/ → providers/` 方向的耦合。当 `providers/` 层逻辑演进或重构时，纯接口定义文件也需跟随变动。
- **影响**: 包内类型层纯净性被破坏。当前无跨包副作用，但若后续 `providers/` 引入更多运行时依赖（如 I/O 工具类），则类型层会连带受影响。
- **建议修复**: 在 `types/interfaces/standards.interface.ts` 中将 `AgentsProjectionNowProvider` 定义为 TypeScript `interface`（例如 `AgentsProjectionNowProviderContract`，仅声明 `now(): Date`），并让 `providers/agents-projection-now-provider.abstract.ts` 的抽象类 `implements` 该接口。`AgentsProjectorOptions.nowProvider` 类型改为引用此接口。这样 `types/ → providers/` 方向依赖消除，抽象类自由演进不影响接口定义。

### 2.2 [MEDIUM] `renderProjectedContent` 投影文本格式构成隐式契约，缺少格式常量或 schema 声明

- **位置**: `packages/standards/src/agents-projector.ts` L280–L328（`renderProjectedContent` 方法）
- **规范依据**: §4.2.6 Projection Contract："`agents` 渲染目标默认投影到 `AGENTS.md`（或等价入口），并记录 `projection_target`, `projected_at`, `source_pack_refs[]`"
- **问题描述**: `renderProjectedContent` 以硬编码字符串拼接生成投影文本，包含元数据头部（`projection_target:` / `projected_at:` / `source_pack_refs:` / `projection_parity:`）和规则列表。此格式在测试中已通过 `toContain` 断言成为事实契约，但缺少以下保护：
  1. 元数据行 key 名无常量化，散落在生成方法和测试断言中。
  2. 下游消费方（如 TK-026 Spec Sync Guard）需解析此格式时，无可引用的 schema 或 key 常量。
  3. 格式变更后无编译时保障提示消费方同步。
- **影响**: 基线阶段格式稳定，但当投影文本被 Spec Sync Guard 或外部工具解析时，格式变更将成为隐式 breaking change。
- **建议**: 将元数据行 key（`projection_target` / `projected_at` / `locale` / `source_pack_refs` / `projection_parity`）提取为 `constants/standards.constant.ts` 中的常量集合（如 `AGENTS_PROJECTION_METADATA_KEYS`），并在 `renderProjectedContent` 与测试中统一引用。此项可在 TK-026 接线时一并落地，不阻断 TK-025 基线。

### 2.3 [MINOR] `readRequiredString` 收敛后调用站点冗长，可考虑 partial-apply 简化

- **位置**: `packages/standards/src/standards-pack-registry.ts` 全文多处；`packages/standards/src/rule-renderer.ts` 全文多处
- **规范依据**: CS-017（OOP / 可读性）
- **问题描述**: 收敛后每个 `readRequiredString` 调用都需传入 3 个参数（`value, fieldName, errorCode`），而同一个类内 `errorCode` 始终相同（registry = `STANDARDS_PACK_INVALID`，renderer = `RULE_RENDER_INVALID`，projector = `AGENTS_PROJECTION_INVALID`）。这导致单次调用从原来的 1 行变为 5 行（参数换行对齐），在 registry 中出现约 10 处，可读性略降。
- **影响**: 不影响正确性和可维护性，仅影响视觉密度。
- **建议**: 可在各类构造器中用 partial application 创建绑定版本（如 `this.readString = (v, f) => readRequiredString(v, f, GovernorErrorCode.STANDARDS_PACK_INVALID)`），在保留共享逻辑的同时恢复调用简洁性。此项为低优先级。

## 3. 正面观察

1. **§4.2.6 Projection Contract 完整落地**: `projection_target`、`projected_at`、`source_pack_refs[]` 三个规定字段均已输出，且 `projected_at` 通过可注入的 `NowProvider` 保证测试确定性。
2. **Parity 校验设计合理**: 以 agents 为基线，对 human/ai 做双向 semanticKey 集合对称差检查 + 规则签名（ruleId / sourcePackId / sourcePackVersion）比对，覆盖了"键缺失"与"签名漂移"两类失对齐场景。
3. **`enforceParity` 可选策略**: 默认 `true`（fail-fast），可设为 `false`（仅报告不阻断），兼顾生产稳健与调试灵活。
4. **`readRequiredString` 技术债收敛**: TK-024 CR §2.3 标记的重复校验已在本任务中统一抽取到 `utils/validation.util.ts`，Registry 与 Renderer 同时复用，错误码语义不变。
5. **依赖方向合规**: `packages/standards` 仅依赖 `packages/shared`，新增的 providers/utils 子目录均在包内闭环，与 §6.14 一致。
6. **`StandardsRuleRendererReader` 接口解耦**: `AgentsProjector` 仅依赖 `StandardsRuleRendererReader` 接口而非具体 `RuleRenderer` 类，与 `StandardsPackRegistryReader` 模式一致，符合 DIP。
7. **标准化错误码**: 新增 `AGENTS_PROJECTION_INVALID` 与 `STANDARDS_PROJECTION_PARITY_FAILED` 遵循 CS-022，领域分组插入 `GovernorErrorCode`。
8. **测试覆盖**: 3 个 smoke 用例分别覆盖了对齐投影、强制 parity 失败抛错、和非强制 parity 返回 violations 路径。

## 4. Conclusion

| Severity | Count |
|----------|-------|
| MEDIUM | 2 |
| MINOR | 1 |

TK-025 实现质量良好，`AgentsProjector` 完整落地了 §4.2.6 的 Projection Contract 与 Parity 校验要求，`readRequiredString` 技术债已成功收敛。`§2.1`（类型层导入抽象类）建议在当前 sprint 内修复以保证包内分层纯净性；`§2.2`（投影格式常量化）可在 TK-026 Spec Sync Guard 接线时一并落地；`§2.3` 不阻断基线。

## 复核结论（2026-03-20）

- 整体结论：**部分认可（已完成可执行修复）**

### 逐条复核

1. `2.1 [MEDIUM] types/interfaces 引入 providers 抽象类`
   - 判定：**认可**。
   - 处理：**已修复**。在 `types/interfaces` 中新增 `AgentsProjectionNowProviderContract`，并将 `AgentsProjectorOptions.nowProvider` 改为依赖该接口；`providers/agents-projection-now-provider.abstract.ts` 改为 `implements AgentsProjectionNowProviderContract`，消除 `types -> providers` 的类型耦合。
   - 变更位置：
     - `packages/standards/src/types/interfaces/standards.interface.ts`
     - `packages/standards/src/providers/agents-projection-now-provider.abstract.ts`
     - `packages/standards/src/types/interfaces/index.ts`
     - `packages/standards/src/types/index.ts`
     - `packages/standards/src/index.ts`

2. `2.2 [MEDIUM] renderProjectedContent 隐式格式契约`
   - 判定：**认可**。
   - 处理：**已修复**。将投影头部 metadata key 常量化为 `AgentsProjectionMetadataKey`，并在 `AgentsProjector` 与 smoke 测试中统一引用，降低格式漂移风险。
   - 变更位置：
     - `packages/standards/src/constants/standards.constant.ts`
     - `packages/standards/src/constants/index.ts`
     - `packages/standards/src/agents-projector.ts`
     - `test/standards-projection-parity.smoke.test.ts`

3. `2.3 [MINOR] readRequiredString 收敛后调用冗长`
   - 判定：**部分认可**。
   - 处理：**本轮不改**。当前实现保持显式 error code 传参，优先保证可读错误语义与低认知跳转；该项不阻断正确性，不影响契约一致性，可在后续可读性收敛窗口再评估 partial-apply 方案。

### 验证命令

1. `pnpm run typecheck`（通过）
2. `pnpm run test -- standards-projection-parity.smoke.test.ts standards-pack.smoke.test.ts`（通过）
3. `pnpm run check`（通过）
