# Code Review: sprint-003 evidence-gated docs and adopter truth

- Status: resolved
- Date: 2026-04-10
- Reviewer: AI-Agent
- Task: `CR-001`
- Review Type: delegated sprint review
- Normative References:
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md` (`CS-021`, `CS-026`)
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
  - `.codex/skills/workspace-code-review-workflow/SKILL.md`

## 1. Review Scope
1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/context/dev/project-076-transport-selection-authority-rollout/plan.md`
3. `.repo-ai-governor/context/dev/project-076-transport-selection-authority-rollout/sprint-003-evidence-gated-docs-and-adopter-truth/plan.md`
4. `.repo-ai-governor/context/dev/project-076-transport-selection-authority-rollout/sprint-003-evidence-gated-docs-and-adopter-truth/tasks/TK-732-produce-clean-room-and-verify-evidence-for-codex-and-claude-code-remote-api-paths.md`
5. `.repo-ai-governor/context/dev/project-076-transport-selection-authority-rollout/sprint-003-evidence-gated-docs-and-adopter-truth/tasks/TK-733-uplift-adopter-facing-support-wording-only-when-evidence-gate-passes.md`
6. `.repo-ai-governor/context/dev/project-076-transport-selection-authority-rollout/sprint-003-evidence-gated-docs-and-adopter-truth/tasks/DA-732-remote-api-clean-room-and-verify-evidence-summary.md`
7. `.repo-ai-governor/context/dev/project-076-transport-selection-authority-rollout/sprint-003-evidence-gated-docs-and-adopter-truth/tasks/checklist.md`
8. `.repo-ai-governor/context/dev/project-076-transport-selection-authority-rollout/sprint-003-evidence-gated-docs-and-adopter-truth/tasks/tasks.csv`
9. `docs/support-matrix.md`
10. `docs/support-matrix.zh-CN.md`
11. `docs/local-adoption-playbook.md`
12. `docs/local-adoption-playbook.zh-CN.md`

## 2. Findings
### 2.1 [P1] default review routing no longer points at the open project-076 closeout surface
- 位置: `.repo-ai-governor/context/current-context.md`
- 问题描述: `project-076 / sprint-003` still owns the open `CR-001` review lifecycle, but `current-context.md` makes `project-077 / sprint-002` the default primary stream. The repo-local review workflow resolves review output to `explicit path -> Worktree Review Target -> active primary stream`, so further closeout artifacts can land on the wrong stream unless every command keeps passing explicit paths.
- 影响: The remaining `verified/resolved` review lifecycle and closeout write-back for `project-076` can drift into the wrong canonical review directory, which puts the sprint closeout audit trail at risk.
- 建议: Keep `project-076 / sprint-003` as the primary closeout surface until `CR-001` and `TK-734` are complete, while leaving `project-077` as a parallel stream.

### 2.2 [P2] public support truth claims `TK-734` before the closeout task exists in completed truth
- 位置: `docs/support-matrix.md`, `docs/support-matrix.zh-CN.md`
- 问题描述: The support matrix already attributes the refreshed support boundary to `TK-732 ~ TK-734`, but `TK-734` is still `planned` in the sprint ledger. The docs therefore advertise a completed refresh scope that includes work not yet executed.
- 影响: This makes the public support scope less truthful than the current task ledger and weakens the evidence-gated rollout claim.
- 建议: Scope the current support-matrix refresh to `TK-732` and `TK-733` only, then add `TK-734` back after the rollout closeout handoff is actually completed.

## 3. Notes
1. The narrowed reviewer pass did not identify additional substantive over-claims in the new `remote_api` wording; `warn != silent cli_exec fallback` and `fail-closed` are currently expressed consistently across the sprint-003 docs surface.

## 4. Verification
1. `pnpm exec vitest run packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts --reporter=json --outputFile .tmp/project-076-sprint-003-remote-api-vitest.json --maxWorkers=1 --maxConcurrency=1`（已作为现有证据读取）
2. `node ./scripts/release/verify-local-distribution.js --output .tmp/project-076-sprint-003-local-distribution-report.json`（已作为现有证据读取）
3. `node ./scripts/release/verify-cleanroom-local-install.js --modes path,link,tgz --iterations 1 --output .tmp/project-076-sprint-003-cleanroom-report.json`（已作为现有证据读取）
4. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
5. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）

## 复核结论（2026-04-10）

- 整体结论：**认可**

### 逐条复核
1. `2.1 [P1] default review routing no longer points at the open project-076 closeout surface`
   - 判定：**认可**
   - 证据：`.repo-ai-governor/context/current-context.md` 已恢复为 `project-076 / sprint-003` primary closeout surface，`project-077 / sprint-002` 保留为并行 active stream，因此默认 review routing 已重新指向本轮仍未收口的 CR surface。
   - 处理：已修复 `current-context.md` 中的 primary stream 路由漂移，避免 `project-076` 后续 `verified/resolved` review artifact 写到错误 stream。
2. `2.2 [P2] public support truth claims TK-734 before the closeout task exists in completed truth`
   - 判定：**认可**
   - 证据：`docs/support-matrix.md` 与 `docs/support-matrix.zh-CN.md` 已将本轮支持口径回收为 `TK-732`、`TK-733`，不再提前宣称 `TK-734` 已完成。
   - 处理：已把 support-matrix header、verification snapshot 和 closing note 中的 `TK-734` 移出当前正式支持范围，待 `TK-734` 实际完成后再补回。

### 验证命令
1. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
3. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
4. `node ./scripts/governance/check-worktree-review-target.js`（通过）
5. `node ./scripts/governance/check-docs-triad-sync.js`（通过）

### 风险与后续
1. 当前 `verified` 结论下，已接受的两条 finding 均已完成修复，未留下 blocker。
2. `TK-734` 仍是本 sprint 的后续 closeout/delivery 任务；在该任务真正完成前，support-matrix 不应重新把 `TK-734` 计入当前已落地的公开支持边界。
3. 下一步仍需一轮 fresh post-fix reviewer clean verdict，再把本 CR 推进到 `resolved`。

## 修复执行记录（2026-04-10）

1. `2.1 [P1] default review routing no longer points at the open project-076 closeout surface`：已完成
   - 变更文件：`.repo-ai-governor/context/current-context.md`
   - 验证：`node ./scripts/governance/check-task-ledger-sync.js`、`node ./scripts/governance/check-sprint-plan-status-sync.js`、`node ./scripts/governance/check-code-review-status-sync.js`、`node ./scripts/governance/check-worktree-review-target.js`（通过）
   - 说明：已把 `project-076 / sprint-003` 恢复为当前 primary closeout surface，确保后续 review/closeout 默认路由不再漂移到 `project-077`。
2. `2.2 [P2] public support truth claims TK-734 before the closeout task exists in completed truth`：已完成
   - 变更文件：`docs/support-matrix.md`、`docs/support-matrix.zh-CN.md`
   - 验证：`node ./scripts/governance/check-docs-triad-sync.js`（通过）
   - 说明：support-matrix 已将当前公开归因收敛为 `TK-732`、`TK-733`，待 `TK-734` 实际完成后再补回。
3. `post-fix recheck`：已完成
   - 变更文件：`.repo-ai-governor/context/dev/project-076-transport-selection-authority-rollout/sprint-003-evidence-gated-docs-and-adopter-truth/review/resolved_code_review_working-tree-20260410-0315.md`
   - 验证：fresh delegated reviewer `Euclid` returned clean verdict with no actionable findings remaining for the scoped sprint-003 surface.
   - 说明：本轮 CR loop 已完成 findings triage、修复、生命周期补录与 clean recheck。
