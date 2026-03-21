# Code Review: working tree adapter-sdk baseline review

- Status: resolved
- Date: 2026-03-21
- Reviewer: AI-Agent
- Task: `n/a`
- Review Type: working tree review
- Normative References:
  - `.repo-ai-governor/context/current-context.md`
  - `AGENTS.md`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`

## 1. Review Scope

1. `packages/adapter-sdk/package.json`
2. `packages/adapter-sdk/README.md`
3. `packages/adapter-sdk/src/index.ts`
4. `packages/adapter-sdk/src/constants/agent-protocol.constant.ts`
5. `packages/adapter-sdk/src/types/interfaces/agent-protocol.interface.ts`
6. `packages/adapter-sdk/src/types/interfaces/agent-route.interface.ts`
7. `packages/adapter-sdk/src/types/interfaces/index.ts`
8. `packages/adapter-sdk/src/types/index.ts`
9. `packages/adapter-sdk/src/agent-protocol.abstract.ts`
10. `packages/adapter-sdk/src/agent-capability-evaluator.ts`
11. `packages/adapter-sdk/src/agent-route-registry.ts`
12. `packages/adapter-sdk/src/agent-route-runner.ts`
13. `packages/adapter-sdk/src/agent-protocol-error-mapper.ts`
14. `packages/adapter-sdk/test/agent-capability-evaluator.unit.test.ts`
15. `packages/adapter-sdk/test/agent-route-runner.smoke.test.ts`
16. `packages/shared/src/errors/error-code.constant.ts`
17. `tsconfig.json`
18. `vitest.internal-alias.ts`
19. `.repo-ai-governor/context/dev/project-004-agent-adapter-runtime/plan.md`
20. `.repo-ai-governor/context/dev/project-004-agent-adapter-runtime/sprint-001-agent-protocol-and-adapter-sdk/plan.md`
21. `.repo-ai-governor/context/dev/project-004-agent-adapter-runtime/sprint-001-agent-protocol-and-adapter-sdk/tasks/TK-033-agent-protocol-and-capability-matrix-baseline.md`
22. `.repo-ai-governor/context/dev/project-004-agent-adapter-runtime/sprint-001-agent-protocol-and-adapter-sdk/tasks/TK-034-adapter-sdk-and-routekey-fallback-baseline.md`
23. `.repo-ai-governor/context/dev/project-004-agent-adapter-runtime/sprint-001-agent-protocol-and-adapter-sdk/tasks/checklist.md`
24. `.repo-ai-governor/context/dev/project-004-agent-adapter-runtime/sprint-001-agent-protocol-and-adapter-sdk/tasks/tasks.csv`
25. `.repo-ai-governor/context/dev/project-004-agent-adapter-runtime/sprint-001-agent-protocol-and-adapter-sdk/review/verified_review_tk-033-agent-protocol-and-capability-matrix-baseline.md`
26. `.repo-ai-governor/context/dev/project-004-agent-adapter-runtime/sprint-001-agent-protocol-and-adapter-sdk/review/verified_review_tk-034-adapter-sdk-and-routekey-fallback-baseline.md`
27. `.repo-ai-governor/context/artifact-registry/artifacts.csv`
28. `.repo-ai-governor/context/dev/dependency-artifact-registry.md`
29. `.repo-ai-governor/context/dev/index.md`
30. `pnpm-lock.yaml`

## 2. Findings

### 2.1 [P2] `AgentRouteRegistry` 对 `capabilityRequirement` 的嵌套字段没有做标准化校验

- 位置: `packages/adapter-sdk/src/agent-route-registry.ts:184`
- 问题描述: `normalizePolicy()` 只校验了 `routeKey`、`primarySurface` 和 `fallbackSurfaces` 的顶层结构，随后就直接展开 `policy.capabilityRequirement.requiredCapabilities`、`allowDegradedCapabilities` 和 `fallbackRules`。如果调用方传入 `{ capabilityRequirement: {} }`、`fallbackRules: {}` 或其他非数组形态，这里会直接触发原生 `TypeError`，而不是统一抛出 `ADAPTER_ROUTE_CONFIG_INVALID`。这会让“route config 规范化与校验”入口在坏配置场景下漏出非标准错误。
- 影响: Adapter SDK 在加载错误 route policy 时可能绕过统一错误模型，调用方拿不到稳定的错误码，也无法可靠地把错误归类为配置问题。
- 建议: 在 `AgentRouteRegistry` 内补齐 `capabilityRequirement` 的深层校验和规范化，确保 `requiredCapabilities`、`allowDegradedCapabilities`、`fallbackRules` 都在进入展开逻辑前被验证，并为坏输入统一抛出 `RuntimeError(ADAPTER_ROUTE_CONFIG_INVALID)`；同时补一条无效 `capabilityRequirement` 的单测。

### 2.2 [P3] `AgentCapabilityEvaluator` 只校验 `requiredCapabilities`，可选字段仍会漏出非标准失败

- 位置: `packages/adapter-sdk/src/agent-capability-evaluator.ts:166`
- 问题描述: `assertCapabilityRequirement()` 仅检查 `requiredCapabilities` 是否为非空数组，但 `evaluate()` 紧接着会把 `allowDegradedCapabilities` 直接喂给 `Set`，并把 `fallbackRules` 当数组调用 `.find()`。因此像 `fallbackRules: {}`、`allowDegradedCapabilities: "streaming"` 这类坏输入不会被识别为 `AGENT_CAPABILITY_REQUIREMENT_INVALID`，而是会在后续逻辑中触发原生异常或产生错误语义。
- 影响: 运行时对 capability requirement 的失败分类会不稳定，既可能冒出非标准异常，也可能把畸形输入误解释为正常降级策略，削弱协议边界的可靠性。
- 建议: 把 `allowDegradedCapabilities` 和 `fallbackRules` 纳入 `assertCapabilityRequirement()` 的显式校验，并新增一组坏输入测试，确保无效 requirement 始终落到 `AGENT_CAPABILITY_REQUIREMENT_INVALID`。

## 3. Notes

1. 包测、typecheck 和与本次变更相关的治理门禁都通过了；本轮问题主要集中在坏输入场景的契约兜底，而不是主路径功能。
2. 这两个问题都属于 SDK 公共边界的输入规范化缺口，后续在接入真实 adapter/provider 时更容易被放大。

## 4. Verification

1. `pnpm run test:packages -- packages/adapter-sdk/test/agent-capability-evaluator.unit.test.ts packages/adapter-sdk/test/agent-route-runner.smoke.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `pnpm run typecheck`（通过）
3. `node ./scripts/governance/check-standardized-error-usage.js`（通过）
4. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
5. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）

## 复核结论（2026-03-21）

- 整体结论：**认可**

### 逐条复核

1. `2.1 [P2] AgentRouteRegistry 对 capabilityRequirement 的嵌套字段没有做标准化校验`
   - 判定：**认可**
   - 证据：`packages/adapter-sdk/src/agent-route-registry.ts` 已新增 `normalizeOptionalCapabilityRequirement`、`normalizeCapabilityRequirement`、`normalizeCapabilityArray`、`normalizeFallbackRules`，并在 `normalizePolicy` 中统一调用（约 `L140-L341`），同时对枚举值采用集中校验（`readCapability` / `readFallbackAction`，约 `L349-L391`），坏输入会稳定落到 `ADAPTER_ROUTE_CONFIG_INVALID`。
   - 处理：已完成修复，并新增坏输入回归测试 `packages/adapter-sdk/test/agent-route-runner.smoke.test.ts`（约 `L346-L391`）。

2. `2.2 [P3] AgentCapabilityEvaluator 只校验 requiredCapabilities，可选字段仍会漏出非标准失败`
   - 判定：**认可**
   - 证据：`packages/adapter-sdk/src/agent-capability-evaluator.ts` 的 `assertCapabilityRequirement` 已补齐 `allowDegradedCapabilities` 与 `fallbackRules` 的类型与枚举值校验（约 `L195-L239`），并新增 `assertCapabilityValue` / `assertFallbackActionValue`（约 `L247-L268`），坏输入统一抛出 `AGENT_CAPABILITY_REQUIREMENT_INVALID`。
   - 处理：已完成修复，并新增坏输入回归测试 `packages/adapter-sdk/test/agent-capability-evaluator.unit.test.ts`（约 `L198-L238`）。

### 验证命令

1. `pnpm run test:packages -- packages/adapter-sdk/test/agent-capability-evaluator.unit.test.ts packages/adapter-sdk/test/agent-route-runner.smoke.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `pnpm run typecheck`（通过）
3. `node ./scripts/governance/check-standardized-error-usage.js`（通过）
4. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
5. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）

## 修复执行记录（2026-03-21）

1. `2.1`：已完成
   - 变更文件：`packages/adapter-sdk/src/agent-route-registry.ts`、`packages/adapter-sdk/test/agent-route-runner.smoke.test.ts`
   - 验证：`pnpm run test:packages -- packages/adapter-sdk/test/agent-route-runner.smoke.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
   - 说明：对 route policy 的 `capabilityRequirement` 做了深层结构和枚举值校验，避免坏输入触发原生 `TypeError`。

2. `2.2`：已完成
   - 变更文件：`packages/adapter-sdk/src/agent-capability-evaluator.ts`、`packages/adapter-sdk/test/agent-capability-evaluator.unit.test.ts`
   - 验证：`pnpm run test:packages -- packages/adapter-sdk/test/agent-capability-evaluator.unit.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
   - 说明：将可选字段纳入显式校验，统一错误码出口，防止可选字段坏输入绕过标准错误模型。
