# Code Review: sprint-002-ga-evidence-consolidation-and-closeout round 1

- Status: resolved
- Date: 2026-04-07
- Reviewer: AI-Agent
- Task: `CR-001`
- Review Type: sprint scoped review
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`

## 1. Review Scope

1. `.repo-ai-governor/context/dev/project-055-ga-evidence-and-adopter-pilot-closeout`
2. `docs/support-matrix.md`
3. `docs/support-matrix.zh-CN.md`
4. `docs/ga-readiness-evidence.md`
5. `docs/ga-readiness-evidence.zh-CN.md`
6. `docs/maintainer-validation-playbook.md`
7. `docs/maintainer-validation-playbook.zh-CN.md`

## 2. Findings

### 2.1 [P2] GA signal #6 cites non-clean-room evidence for a clean-room requirement

- 位置: `docs/ga-readiness-evidence.md`, `docs/ga-readiness-evidence.zh-CN.md`
- 问题描述: signal `#6` still requires at least one clean-room `tool_managed -> repo_local -> rollback` workspace switch, but the sprint update replaced the cited evidence with the recovered real-target pilot repo at `react-native-image-marker-1.1.x`. That artifact is useful supplementary evidence, but it is not the clean-room proof required by the signal text.
- 影响: the current `11 / 11 Pass` GA summary is overstated if the signal keeps a requirement/evidence mismatch, and downstream references to the program-level GA signal matrix inherit the same drift.
- 建议: restore the original clean-room artifact as the formal evidence for signal `#6`, and keep the `project-055` pilot as supplementary real-target evidence instead of the primary clean-room proof.

### 2.2 [P3] Support-matrix scope header dropped `project-054 / sprint-002 / TK-610`

- 位置: `docs/support-matrix.md`, `docs/support-matrix.zh-CN.md`
- 问题描述: the header metadata currently says the formal support declaration was refreshed through `project-054 / sprint-001`, but later sections still treat `project-054 / sprint-002 / TK-610` as part of the active provenance chain.
- 影响: provenance drift inside the support matrix makes later audits and truth-surface updates easier to misread or accidentally regress.
- 建议: add `project-054 / sprint-002` (`TK-610`) back into the scope header so the top-level provenance matches the body.

## 3. Notes

1. The recovered-baseline caveat for `react-native-image-marker-1.1.x` is documented consistently and should remain intact after fixes.
2. This sprint window is docs-only and ledger-only; `build` is not required unless a later repair window touches `apps/**`, `packages/**`, `bin/**`, or `test/**`.

## 4. Verification

1. `pnpm run check`（通过）
2. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
3. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
4. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
5. `node ./scripts/governance/check-worktree-review-target.js`（通过）

## 复核结论（2026-04-07）

- 整体结论：**认可**

### 逐条复核

1. `2.1 [P2] GA signal #6 cites non-clean-room evidence for a clean-room requirement`
   - 判定：**认可**
   - 证据：`docs/ga-readiness-evidence*.md` 已恢复为以 `.tmp/project-026-sprint-004/tk302-cleanroom-path-link-report.json` 作为 signal `#6` 的正式 clean-room 证据，同时保留 `.tmp/project-055-sprint-001-pilot-2-rehearsal-summary.json` 仅作为 real-target 补强证据。
   - 处理：保留为 accepted finding，已进入修复窗口。
2. `2.2 [P3] Support-matrix scope header dropped project-054 / sprint-002 / TK-610`
   - 判定：**认可**
   - 证据：`docs/support-matrix*.md` 的 scope header 已补回 `project-054 / sprint-002` (`TK-610`)，与正文 provenance chain 保持一致。
   - 处理：保留为 accepted finding，已进入修复窗口。

### 验证命令

1. `pnpm run check`（通过）
2. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
3. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
4. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
5. `node ./scripts/governance/check-worktree-review-target.js`（通过）

## 修复执行记录（2026-04-07）

1. `2.1 [P2] GA signal #6 cites non-clean-room evidence for a clean-room requirement`：已完成
   - 变更文件：
     - `docs/ga-readiness-evidence.md`
     - `docs/ga-readiness-evidence.zh-CN.md`
   - 验证：`pnpm run check`、`node ./scripts/governance/check-task-ledger-sync.js`、`node ./scripts/governance/check-sprint-plan-status-sync.js`、`node ./scripts/governance/check-code-review-status-sync.js`、`node ./scripts/governance/check-worktree-review-target.js`（通过）
   - 说明：已恢复 clean-room formal proof 与 real-target supplementary proof 的边界，不再用 `project-055` 试点结果替代 signal `#6` 的 clean-room 主证据。
2. `2.2 [P3] Support-matrix scope header dropped project-054 / sprint-002 / TK-610`：已完成
   - 变更文件：
     - `docs/support-matrix.md`
     - `docs/support-matrix.zh-CN.md`
   - 验证：`pnpm run check`、`node ./scripts/governance/check-task-ledger-sync.js`、`node ./scripts/governance/check-sprint-plan-status-sync.js`、`node ./scripts/governance/check-code-review-status-sync.js`、`node ./scripts/governance/check-worktree-review-target.js`（通过）
   - 说明：已补齐 support-matrix header provenance，避免顶部 metadata 与正文来源链继续漂移。
