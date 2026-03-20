# Code Review: Working Tree Review 2026-03-20 22:21

- Status: review_pending
- Date: 2026-03-20
- Reviewer: AI-Agent
- Task: `n/a`
- Review Type: working tree review
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`

## 1. Review Scope

1. `packages/standards/src/standards-upgrade-planner.ts`
2. `packages/standards/src/constants/standards.constant.ts`
3. `packages/slots/src/slot-engine.ts`
4. `scripts/governance/check-docs-triad-sync.js`
5. `scripts/governance/reconcile-artifact-dependencies.js`
6. `scripts/governance/check-artifact-registry-lifecycle.js`
7. `test/standards-upgrade-ux.smoke.test.ts`
8. `test/slot-engine-security.smoke.test.ts`
9. `test/docs-triad-sync-gate.smoke.test.ts`
10. 相关台账与治理文档变更（用于一致性核对）

## 2. Findings

### 2.1 [P2] `exact_version` pin mode currently has no effect on upgrade decisions

- 位置: `packages/standards/src/standards-upgrade-planner.ts:149`, `packages/standards/src/standards-upgrade-planner.ts:198`, `packages/standards/src/standards-upgrade-planner.ts:220`, `packages/standards/src/constants/standards.constant.ts:80`
- 问题描述: `StandardsVersionPinMode` 对外声明了 `exact_version`，但规划逻辑只在 major 变更时阻断，其余 minor/patch 仍然只看 `allowMinorAutoUpgrade/allowPatchAutoUpgrade`。也就是说，当调用方明确选择 `exact_version` 时，`1.2.3 -> 1.2.4` 或 `1.3.0` 仍会被规划成 `ALLOW`/`AUTO_FIXABLE`，与“精确版本 pin”语义不一致。
- 影响: 上层如果基于 `exact_version` 依赖此 planner 做升级闸口，会在本应冻结的版本线上自动放行变更，削弱版本 pin 策略的治理保证。
- 建议: 在 semver 增量分支前先按 `pinPolicy.mode` 分流；`exact_version` 下任意版本变化都应至少落为 `CONFIRM`，或者直接 `BLOCK`。同时补一条 `exact_version` smoke 用例，覆盖 patch/minor 变化不被自动放行。

### 2.2 [P3] Artifact dependency parser is too strict about the `Depends On` heading shape

- 位置: `scripts/governance/reconcile-artifact-dependencies.js:314`, `scripts/governance/check-artifact-registry-lifecycle.js:243`
- 问题描述: 两个治理脚本都只接受精确的 `## 2. Depends On` 标题，匹配不到就直接返回空依赖。仓库里已经存在历史任务卡使用 `## 2.1 Depends On` 变体（例如 `project-001` 的 `TK-001`），说明这类格式并非理论边界。
- 影响: 一旦后续有仍处于 open 状态的任务卡沿用这种编号变体，脚本会静默漏掉其 `DA-*` 依赖，导致 `dependent_tasks` 被低估，进而把仍被消费的 artifact 误判为“无依赖可淘汰”。
- 建议: 将标题匹配放宽到 `## 2(.x)? Depends On` 一类编号变体，或者复用统一的 task-card section parser，避免在 `reconcile` 和 `check` 两份脚本里各自维护一套易漂移的正则。

## 3. Notes

1. `slot-engine-security`、`standards-upgrade-ux`、`docs-triad-sync` 相关 smoke 均通过，说明当前主路径没有明显回归。
2. 当前 working tree 里还有大量任务台账和文档变更；本次 review 重点放在新增/修改的实现代码和直接相关的治理脚本。
3. 本轮没有对所有文档类 diff 做逐行审校；文档仅用于核对实现契约、命名和执行流一致性。

## 4. Verification

1. `pnpm run test -- standards-upgrade-ux.smoke.test.ts docs-triad-sync-gate.smoke.test.ts slot-engine-security.smoke.test.ts`（通过；Vitest 本次运行共通过 18 个 test files / 68 个 tests）
2. `node ./scripts/governance/check-artifact-registry-lifecycle.js`（通过）
3. `node ./scripts/governance/reconcile-artifact-dependencies.js --dry-run`（通过）
4. `git diff --stat`、`git diff --no-index -- /dev/null packages/standards/src/standards-upgrade-planner.ts`、关键实现文件静态审查（已执行）

## 复核结论（2026-03-20）

- 整体结论：**部分认可**

### 逐条复核

1. `2.1 [P2] exact_version pin mode currently has no effect on upgrade decisions`
   - 判定：**认可**
   - 证据：`packages/standards/src/standards-upgrade-planner.ts` 当前仅在 major 变化分支阻断，随后直接按 `allowMinorAutoUpgrade` / `allowPatchAutoUpgrade` 判定自动放行；未看到基于 `pinPolicy.mode === StandardsVersionPinMode.EXACT_VERSION` 的专用分支，因此 `exact_version` 语义未被执行层强约束。
   - 处理：后续修复应在 minor/patch 判定前先分流 `EXACT_VERSION`，并补充对应 smoke 用例覆盖 `1.2.3 -> 1.2.4` 与 `1.2.3 -> 1.3.0` 的预期行为。

2. `2.2 [P3] Artifact dependency parser is too strict about the Depends On heading shape`
   - 判定：**部分认可**
   - 证据：`scripts/governance/reconcile-artifact-dependencies.js` 与 `scripts/governance/check-artifact-registry-lifecycle.js` 中 `extractDependsOnArtifactIds` 确实仅匹配 `## 2. Depends On`。仓库存在 `## 2.1 Depends On` 历史样式（`project-001` 的 `TK-001`）。
   - 处理：当前样例任务 `TK-001` 状态为 `completed`，脚本会跳过 closed task，因此本轮 dry-run 未出现错误结果；该问题属于前向鲁棒性缺口，建议后续收敛为统一 section parser 或放宽标题匹配策略。

### 验证命令

1. `pnpm run test -- standards-upgrade-ux.smoke.test.ts docs-triad-sync-gate.smoke.test.ts slot-engine-security.smoke.test.ts`（通过）
2. `node ./scripts/governance/check-artifact-registry-lifecycle.js`（通过）
3. `node ./scripts/governance/reconcile-artifact-dependencies.js --dry-run`（通过）

## 修复执行记录（2026-03-20）

1. `2.1 [P2] exact_version pin mode currently has no effect on upgrade decisions`：已完成
   - 变更文件：`packages/standards/src/standards-upgrade-planner.ts`、`test/standards-upgrade-ux.smoke.test.ts`
   - 验证：`pnpm run test -- standards-upgrade-ux.smoke.test.ts`（通过）
   - 说明：在 planner 中新增 `StandardsVersionPinMode.EXACT_VERSION` 分支，任意版本变化统一走 `CONFIRM`，并补充 patch/minor 双场景 smoke 用例，防止自动放行回归。

2. `2.2 [P3] Artifact dependency parser is too strict about the Depends On heading shape`：已完成（部分认可中的可执行子项）
   - 变更文件：`scripts/governance/reconcile-artifact-dependencies.js`、`scripts/governance/check-artifact-registry-lifecycle.js`
   - 验证：`node ./scripts/governance/reconcile-artifact-dependencies.js --dry-run`、`node ./scripts/governance/check-artifact-registry-lifecycle.js`（通过）
   - 说明：`Depends On` 标题匹配放宽为兼容 `## 2. Depends On` 与 `## 2.1 Depends On` 编号变体，降低任务卡编号样式对依赖解析的耦合风险。
