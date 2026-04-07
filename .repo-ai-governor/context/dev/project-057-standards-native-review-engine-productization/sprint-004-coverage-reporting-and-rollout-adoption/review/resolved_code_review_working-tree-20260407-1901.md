# Code Review: project-057-standards-native-review-engine-productization

- Status: resolved
- Date: 2026-04-07
- Reviewer: AI-Agent
- Task: `CR-002`
- Review Type: delegated project-final review
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/execution-gate-layering-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`

## 1. Review Scope
1. `apps/cli/src/commands/review-command.ts`
2. `apps/cli/src/constants/cli-review.constant.ts`
3. `apps/cli/src/runtime/review/cli-review-lifecycle-runtime.ts`
4. `apps/cli/test/commands/review-command.test.ts`
5. `apps/cli/test/commands/review-verify-command.test.ts`
6. `.repo-ai-governor/context/dev/project-057-standards-native-review-engine-productization/plan.md`
7. `.repo-ai-governor/context/dev/project-057-standards-native-review-engine-productization/sprint-004-coverage-reporting-and-rollout-adoption/plan.md`
8. `.repo-ai-governor/context/dev/project-057-standards-native-review-engine-productization/sprint-004-coverage-reporting-and-rollout-adoption/tasks/CR-002.md`
9. `.repo-ai-governor/context/dev/project-057-standards-native-review-engine-productization/sprint-004-coverage-reporting-and-rollout-adoption/tasks/checklist.md`
10. `.repo-ai-governor/context/dev/project-057-standards-native-review-engine-productization/sprint-004-coverage-reporting-and-rollout-adoption/tasks/tasks.csv`

## 2. Findings
### 2.1 [P1] sprint-004 plan status drift blocks the release gate while CR-002 is open
- 位置: `.repo-ai-governor/context/dev/project-057-standards-native-review-engine-productization/sprint-004-coverage-reporting-and-rollout-adoption/plan.md`
- 问题描述: `CR-002` reopened the sprint aggregate as `review_pending`, but sprint-004 still declared `Status: completed`, so sprint-plan truth drifted away from the latest `tasks.csv` aggregate.
- 影响: `node ./scripts/governance/check-sprint-plan-status-sync.js` and therefore `pnpm run check` fail before the project-final round can close.
- 建议: keep sprint-004 at `active` while `CR-002` remains `review_pending/verified`, and restore `completed` only after the project-final CR round is fully resolved.

### 2.2 [P1] review can resolve code-affecting scopes without same-window build evidence
- 位置: `apps/cli/src/commands/review-command.ts`
- 问题描述: lifecycle status was derived only from `findings.length`, so a code-affecting review with no emitted findings still produced a `resolved_code_review_*` artifact even when the projected CS-034 build-evidence rule remained uncovered.
- 影响: the CLI could output a false-green resolved review artifact for code-affecting work without the required `pnpm run build` evidence from the same change window.
- 建议: keep the lifecycle open until build evidence is explicitly represented, instead of resolving solely because no finding was emitted by the deterministic pass.

### 2.3 [P2] shared review routing ignores Worktree Review Target overrides
- 位置: `apps/cli/src/runtime/review/cli-review-lifecycle-runtime.ts`
- 问题描述: `resolveStreamContext()` only considered the active primary stream and fallback review directory, so completed-stream CR tails declared through `Worktree Review Target` could still be read or written through the wrong review directory.
- 影响: repo-local review workflows can strand pending or verified artifacts in the wrong stream directory and leave the intended closeout surface stale.
- 建议: honor `Worktree Review Target -> Review records` before falling back to the active primary-stream review path, while preserving active-stream task-ledger paths.

### 2.4 [P2] verified artifact naming diverges from the repo-local CR loop contract
- 位置: `apps/cli/src/constants/cli-review.constant.ts`
- 问题描述: the CLI used `verified_review_*`, but the repo-local scoped CR loop and workspace review workflow expect `verified_code_review_*` as the canonical verified lifecycle prefix.
- 影响: CLI-produced verified artifacts can be skipped by downstream repair/recheck automation and leave verified lifecycle files stranded.
- 建议: emit `verified_code_review_*` as the canonical prefix while keeping legacy `verified_review_*` readable for backward compatibility.

## 3. Notes
1. The reviewer did not report additional actionable findings outside these four items.
2. `CR-002` is a project-final round reusing the sprint-004 surface; sprint/project plan truth therefore has to stay synchronized throughout the round instead of only at the very end.

## 4. Verification
1. `pnpm run build`（通过）
2. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
3. `pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`（通过）
4. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
5. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
6. `node ./scripts/governance/check-worktree-review-target.js`（通过）
7. `node ./scripts/governance/check-technical-solution-delivery-registry.js`（通过）
8. `node ./scripts/governance/check-sprint-plan-status-sync.js`（失败：reviewer review 时 sprint-004 plan 仍保留 `completed`）
9. `pnpm run check`（失败：被 sprint-plan drift 连带阻断）

## 复核结论（2026-04-07）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：`tasks.csv` 已因 `CR-002` 回到 `review_pending`，而 sprint-004 plan 仍保留 `completed`，确实会触发 `check-sprint-plan-status-sync` 失败。
   - 处理：接受该 finding，将 sprint-004 与 project-057 的 sprint-004 聚合状态先恢复到 `active`，等 project-final CR round 真正收口后再恢复 `completed`。
2. `2.2`
   - 判定：**认可**
   - 证据：`review-command` 只按 `findings.length` 推导 lifecycle status，会让 code-affecting scope 在 CS-034 仍未被显式表达时直接产出 `resolved_code_review_*`。
   - 处理：接受该 finding，为 CS-034 build-evidence gap 生成显式 standards-guided actionable finding，并让该 finding 进入 canonical review artifact 与 request payload。
3. `2.3`
   - 判定：**认可**
   - 证据：`CliReviewLifecycleRuntime.resolveStreamContext()` 原先只读 active primary stream，没有先读取 `Worktree Review Target -> Review records`。
   - 处理：接受该 finding，修复 review routing 优先级，同时保持 tasks/checklist/csv 仍跟随 active stream。
4. `2.4`
   - 判定：**认可**
   - 证据：CLI verified prefix 仍是 `verified_review_`，与 repo-local scoped CR loop 期望的 `verified_code_review_` 不一致。
   - 处理：接受该 finding，将 verified lifecycle prefix 切到 `verified_code_review_`，并保留 legacy `verified_review_` 的可读兼容。

### 验证命令
1. `pnpm exec vitest run --config vitest.packages.config.ts apps/cli/test/runtime/cli-review-lifecycle-runtime.test.ts apps/cli/test/commands/review-command.test.ts apps/cli/test/commands/review-verify-command.test.ts`（通过）
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
3. `pnpm run build`（通过）

## 修复执行记录（2026-04-07）

1. `2.1`：已完成
   - 变更文件：`.repo-ai-governor/context/dev/project-057-standards-native-review-engine-productization/sprint-004-coverage-reporting-and-rollout-adoption/plan.md`、`.repo-ai-governor/context/dev/project-057-standards-native-review-engine-productization/plan.md`
   - 验证：`node ./scripts/governance/check-sprint-plan-status-sync.js`、`pnpm run check`（通过）
   - 说明：在 `CR-002` 仍打开时把 sprint-004 和 project-057 的 sprint-004 聚合状态恢复到 `active`，消除 project-final round 打开期间的 sprint-plan drift。
2. `2.2`：已完成
   - 变更文件：`apps/cli/src/commands/review-command.ts`、`apps/cli/test/commands/review-command.test.ts`
   - 验证：`pnpm exec vitest run --config vitest.packages.config.ts apps/cli/test/runtime/cli-review-lifecycle-runtime.test.ts apps/cli/test/commands/review-command.test.ts apps/cli/test/commands/review-verify-command.test.ts`、`pnpm run build`、`pnpm run check`（通过）
   - 说明：对 code-affecting scope 的 CS-034 build-evidence gap 改为显式 standards-guided finding，使 review lifecycle 不会在缺少 build 证据时直接 resolved。
3. `2.3`：已完成
   - 变更文件：`apps/cli/src/runtime/review/cli-review-lifecycle-runtime.ts`、`apps/cli/test/runtime/cli-review-lifecycle-runtime.test.ts`
   - 验证：`pnpm exec vitest run --config vitest.packages.config.ts apps/cli/test/runtime/cli-review-lifecycle-runtime.test.ts apps/cli/test/commands/review-command.test.ts apps/cli/test/commands/review-verify-command.test.ts`、`pnpm run build`、`pnpm run check`（通过）
   - 说明：review routing 现在优先读取 `Worktree Review Target -> Review records`，同时保持 tasks/checklist/csv 继续跟随 active stream。
4. `2.4`：已完成
   - 变更文件：`apps/cli/src/constants/cli-review.constant.ts`、`apps/cli/src/runtime/review/cli-review-lifecycle-runtime.ts`、`apps/cli/test/commands/review-verify-command.test.ts`、`apps/cli/test/runtime/cli-review-lifecycle-runtime.test.ts`
   - 验证：`pnpm exec vitest run --config vitest.packages.config.ts apps/cli/test/runtime/cli-review-lifecycle-runtime.test.ts apps/cli/test/commands/review-command.test.ts apps/cli/test/commands/review-verify-command.test.ts`、`pnpm run build`、`pnpm run check`（通过）
   - 说明：verified lifecycle 前缀已切换到 `verified_code_review_`，同时仍兼容读取 legacy `verified_review_` 产物。
