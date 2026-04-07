# Code Review: sprint-001-review-rule-registry-and-provenance-baseline round 1

- Status: resolved
- Date: 2026-04-07
- Reviewer: AI-Agent
- Task: `CR-001`
- Review Type: sprint scoped review
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/execution-gate-layering-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/adrs/standards-native-review-engine-and-provenance-aware-cr.md`
  - `.repo-ai-governor/draft/standards-native-code-review-engine-follow-up-technical-solution.md`

## 1. Review Scope

1. `packages/standards/src`
2. `packages/standards/test`
3. `packages/shared/src/errors/error-code.constant.ts`
4. `.repo-ai-governor/context/dev/project-057-standards-native-review-engine-productization/sprint-001-review-rule-registry-and-provenance-baseline/tasks`

## 2. Findings

### 2.1 [P2] CS-026 coverage is overstated as fully deterministic

- 位置: `packages/standards/src/examples/phase-a-review-rule-bundle.ts:74`
- 问题描述: `review-rule.cs-026-review-lifecycle-sync` 被定义为 `executionMode=DETERMINISTIC` 且 `currentCoverage=full`，但当前只显式锚定 `gate.check-code-review-status-sync`。该 gate 只验证 review artifact 文件名前缀与 `Status` 元数据，没有覆盖 paired `CR-xxx` task status progression 与 review artifact 的一致性。
- 影响: 后续 hybrid review orchestration 若直接信任这份 projected rule bundle，可能把 `CS-026` 误判为 fully covered，从而漏掉 `CR-xxx` 生命周期 drift。
- 建议: 把 `CS-026` 调整为更诚实的 Phase A coverage truth，至少标记为 partial，并明确当前 deterministic signal 与剩余 reviewer-guided closure gap。

### 2.2 [P2] New registry validation errors bypass package i18n

- 位置: `packages/standards/src/review-rule-registry.ts:34`
- 问题描述: 新增 review-rule registry validation surface 直接抛出英文 `RuntimeError` 文案，附近没有 `I18nRuntime.t()`、`localizeText(...)` 或 `// i18n-deferred:` 标记。
- 影响: 一旦 CLI 或 shell surface 直接暴露这些 validation failures，就会绕过 `CS-033` 的 user-facing i18n baseline，输出 locale-inconsistent diagnostics。
- 建议: 为这批 diagnostics 增加明确的 `i18n-deferred` 说明，或接入 shared/localized validation error path，避免把英文-only 文案作为默认 truth 投入后续 runtime surface。

## 3. Notes

1. 本轮 reviewer 明确认可 `CS-033` 与 `CS-034` 没有被误标为 deterministic；两者仍保持 `standards_guided + partial coverage`。
2. `ReviewRuleRegistry` 的 duplicate-id / unknown-rule / disabled-rule / unsupported-enum 分支目前仍以轻量单测覆盖为主，但本轮暂未将其提升为 actionable finding。

## 4. Verification

1. `pnpm run build`（通过）
2. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
3. `pnpm run check`（通过）
4. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
5. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）

## 修复执行记录（2026-04-07）

1. `2.1 [P2] CS-026 coverage is overstated as fully deterministic`：已完成
   - 变更文件：
     - `packages/standards/src/examples/phase-a-review-rule-bundle.ts`
     - `.repo-ai-governor/context/dev/project-057-standards-native-review-engine-productization/sprint-001-review-rule-registry-and-provenance-baseline/tasks/task-output-tk-622-phase-a-projected-review-rule-subset.md`
     - `packages/standards/test/review-rule-registry.unit.test.ts`
   - 验证：`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`pnpm run check`（通过）
   - 说明：已把 `review-rule.cs-026-review-lifecycle-sync` 调整为 `standards_guided + partial coverage`，并显式保留当前 deterministic signal 与未覆盖的 CR-task progression gap。
2. `2.2 [P2] New registry validation errors bypass package i18n`：已完成
   - 变更文件：
     - `packages/standards/src/review-rule-registry.ts`
   - 验证：`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`pnpm run check`（通过）
   - 说明：已在 review-rule registry validation surface 附近补充 `i18n-deferred` 说明，明确这批内部 English diagnostics 的临时边界，避免把它们伪装成已完成 i18n 收口的用户面真值。

## 复核结论（2026-04-07）

- 整体结论：**认可**

### 逐条复核

1. `2.1 [P2] CS-026 coverage is overstated as fully deterministic`
   - 判定：**认可**
   - 证据：`review-rule.cs-026-review-lifecycle-sync` 当前只有 `check-code-review-status-sync` 这一条 deterministic signal，确实不能覆盖 paired `CR-xxx` task progression；把它宣称为 `full deterministic coverage` 会高估 Phase A 的 closure truth。
   - 处理：接受该 finding，并将 `CS-026` 下调为 `standards_guided + partial coverage`，同时保留当前 deterministic signal 的显式说明。
2. `2.2 [P2] New registry validation errors bypass package i18n`
   - 判定：**认可**
   - 证据：`ReviewRuleRegistry` 新增的 validation error surface 使用英文 `RuntimeError` 文案，当前文件附近没有 `i18n-deferred` 或 localized validation path 说明。
   - 处理：接受该 finding，并在当前 review-rule registry validation surface 附近增加 `i18n-deferred` 标记，显式说明该内部诊断面尚未接入 shared localized validation error factory。

### 验证命令

1. `pnpm run build`（通过）
2. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
3. `pnpm run check`（通过）
4. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
5. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
