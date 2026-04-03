# Code Review: TK-495 Working Tree

- Status: resolved
- Date: 2026-04-03
- Reviewer: AI-Agent
- Task: `TK-495`
- Review Type: working tree review
- Normative References:
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/contracts/cli-session-shell-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/adrs/session-main-supervisor-and-role-subagent-collaboration.md`

## 1. Review Scope

1. `packages/core-orchestration-service/src/constants/session-main-capability.constant.ts`
2. `packages/core-orchestration-service/src/constants/index.ts`
3. `packages/core-orchestration-service/src/index.ts`
4. `packages/core-orchestration-service/src/local-orchestration-service-session-main-capability-catalog.ts`
5. `packages/core-orchestration-service/src/local-orchestration-service-session-main-skill-registry.ts`
6. `packages/core-orchestration-service/src/types/aliases/session-main-capability.type.ts`
7. `packages/core-orchestration-service/src/types/aliases/index.ts`
8. `packages/core-orchestration-service/src/types/interfaces/session-main-capability-catalog.interface.ts`
9. `packages/core-orchestration-service/src/types/interfaces/index.ts`
10. `packages/core-orchestration-service/src/types/index.ts`
11. `packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-catalog.unit.test.ts`
12. `packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts`
13. `packages/shared/src/i18n/locales/en-us.ts`
14. `packages/shared/src/i18n/locales/zh-cn.ts`
15. `apps/cli/src/runtime/interactive-shell/session-slash-command-registry.ts`

## 2. Findings

### 2.1 [P2] Canonical descriptor seeds are exposed as mutable internal references

- 位置: `packages/core-orchestration-service/src/local-orchestration-service-session-main-capability-catalog.ts:110`
- 问题描述: `listDescriptorSeeds()` 直接返回 `this.descriptorSeeds`，`getDescriptorSeed()` 也直接返回内部对象；同时 `SessionMainCapabilityDescriptorSeed` 仍保留可变的 `string[]` 字段。这样任意 consumer 一旦修改返回值中的 `skillId`、`confirmationRequired` 或 `relatedCapabilityIds`，后续 `getDescriptorSeed()`、`getDescriptorView()` 和 skill routing 读到的就会是被污染后的 catalog 真值。当前注释已经把这些返回值描述成 “Frozen descriptor seeds”，但实现并没有兑现这个契约。
- 影响: 新引入的 canonical catalog 会被外部调用方在进程内意外改写，破坏 `runtime.orchestration` 单写源保证，并让后续 help/discoverability consumer 很难定位真值漂移来源。
- 建议: 对 public accessor 返回 clone + readonly 结构，或在内部 deep-freeze descriptor seed；同时补一个 mutation regression test，确保 consumer 无法通过返回值污染内部 catalog。

### 2.2 [P2] “single-source capability catalog” baseline still omits the existing `/workflow` governed bridge

- 位置: `packages/core-orchestration-service/src/constants/session-main-capability.constant.ts:26`
- 问题描述: 新的 `SESSION_MAIN_CAPABILITY_ID` / catalog seed 只覆盖 `help/connect/doctor/verify/plan/review/review_verify/run`，但 session shell 现有 launcher/slash registry 仍把 `/workflow` 作为 governed bridge command 暴露出来，且 ADR 已明确 `workflow` 可以进入 capability catalog。这样 `TK-495` 声称建立的 canonical baseline 在进入 `TK-496` 前就已经不完整，后续 CLI help appendix / governed discoverability 要么继续对 `/workflow` 保留特判，要么再补第二轮 schema 追加。
- 影响: `TK-496` 无法真正把 governed discoverability 切到单一事实源，catalog baseline 也会继续与现有 CLI bridge surface 不一致。
- 建议: 在当前 baseline 中一并纳入 `workflow` capability id/seed/i18n，或至少在任务/计划中显式把 `/workflow` 标记为暂不纳入 single-source catalog 的例外，避免后续任务按“catalog 已完整”前提继续推进。

## 3. Notes

1. 本轮 review 重点放在 `TK-495` 新建的 capability catalog seam，以及它与现有 session shell discoverability contract 的一致性。
2. `pnpm run build` 已在当前工作树通过，因此新增导出、i18n 资源和 package 级类型面至少能完成构建闭环。
3. 定向 `vitest` 在当前沙箱环境启动即因 `getaddrinfo ENOTFOUND localhost` 失败，未拿到针对新增测试的断言结果；这更像环境解析问题，而不是本次改动触发的测试断言失败。

## 4. Verification

1. `PATH="/opt/homebrew/bin:/Users/jimmydaddy/Library/pnpm:$PATH" pnpm run build`（通过）
2. `PATH="/opt/homebrew/bin:/Users/jimmydaddy/Library/pnpm:$PATH" pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-catalog.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts apps/cli/test/runtime/session-main-parity.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（失败：Vitest startup error `getaddrinfo ENOTFOUND localhost`）

## 复核结论（2026-04-03）

- 整体结论：**认可**

### 逐条复核
1. `2.1 [P2] Canonical descriptor seeds are exposed as mutable internal references`
   - 判定：**认可**
   - 证据：`LocalOrchestrationServiceSessionMainCapabilityCatalog` 之前直接返回内部 `descriptorSeeds` 和单个 seed 对象，`relatedCapabilityIds` / `examplePromptKeys` 也都是可变数组，调用方确实可以污染后续 skill routing 和 localized view 读取到的真值。
   - 处理：已把 descriptor seed / view 契约改成 `readonly` 结构；catalog 内部 seed 统一 deep-freeze，并在 public accessor 上返回 clone；同时补了 mutation regression test，确认外部拿到返回值后修改不会污染内部 canonical truth。

2. `2.2 [P2] “single-source capability catalog” baseline still omits the existing /workflow governed bridge`
   - 判定：**认可**
   - 证据：当前 session shell launcher/slash registry 仍把 `/workflow` 作为 governed bridge 暴露，且 execution mode 对 `preview` 已有 direct path；但 `SESSION_MAIN_CAPABILITY_ID` / catalog seed 确实没有把它纳入 baseline。
   - 处理：已将 `workflow` capability 纳入 canonical catalog baseline，补齐 capability id、descriptor seed、localized i18n copy 和 skill-registry metadata bridge，并补测试确认 workflow preview metadata 现在来自同一份 orchestration-owned catalog truth。

### 验证命令
1. `PATH="/Users/jimmydaddy/Library/pnpm:/opt/homebrew/bin:$PATH" pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-catalog.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts apps/cli/test/runtime/session-main-parity.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `PATH="/Users/jimmydaddy/Library/pnpm:/opt/homebrew/bin:$PATH" /opt/homebrew/bin/node ./scripts/governance/check-i18n-parity-fallback.js`（通过）
3. `PATH="/Users/jimmydaddy/Library/pnpm:/opt/homebrew/bin:$PATH" pnpm run build`（通过）
4. `PATH="/Users/jimmydaddy/Library/pnpm:/opt/homebrew/bin:$PATH" pnpm run check`（通过）

## 修复执行记录（2026-04-03）

1. `2.1 [P2] Canonical descriptor seeds are exposed as mutable internal references`：已完成
   - 变更文件：`packages/core-orchestration-service/src/types/interfaces/session-main-capability-catalog.interface.ts`
   - 变更文件：`packages/core-orchestration-service/src/local-orchestration-service-session-main-capability-catalog.ts`
   - 变更文件：`packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-catalog.unit.test.ts`
   - 验证：`pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-catalog.unit.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
   - 说明：catalog 内部 seed 已 freeze，public accessor 返回 clone，consumer 无法再通过返回值污染 canonical truth。

2. `2.2 [P2] “single-source capability catalog” baseline still omits the existing /workflow governed bridge`：已完成
   - 变更文件：`packages/core-orchestration-service/src/constants/session-main-capability.constant.ts`
   - 变更文件：`packages/core-orchestration-service/src/local-orchestration-service-session-main-capability-catalog.ts`
   - 变更文件：`packages/core-orchestration-service/src/local-orchestration-service-session-main-skill-registry.ts`
   - 变更文件：`packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts`
   - 变更文件：`packages/shared/src/i18n/locales/en-us.ts`
   - 变更文件：`packages/shared/src/i18n/locales/zh-cn.ts`
   - 验证：`pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts apps/cli/test/runtime/session-main-parity.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
   - 说明：`workflow` 已进入 governed capability baseline，后续 `TK-496` 可以在不再加例外分支的前提下继续做 single-source discoverability cutover。
