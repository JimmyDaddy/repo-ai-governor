# Code Review: sprint-001-real-target-repo-adopter-pilot round 1

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

## 1. Review Scope

1. `.repo-ai-governor/context/dev/project-055-ga-evidence-and-adopter-pilot-closeout/sprint-001-real-target-repo-adopter-pilot`
2. `.tmp/project-055-sprint-001-pilot-1-rehearsal-summary.json`
3. `.tmp/project-055-sprint-001-pilot-2-rehearsal-summary.json`

## 2. Findings

### 2.1 [P1] Pilot-2 completion evidence referenced deleted repo-local artifacts

- 位置:
  - `.repo-ai-governor/context/dev/project-055-ga-evidence-and-adopter-pilot-closeout/sprint-001-real-target-repo-adopter-pilot/tasks/TK-615-execute-pilot-2-upgrade-workspace-migration-rollback-rehearsal-and-capture-delta-findings.md`
  - `.repo-ai-governor/context/dev/project-055-ga-evidence-and-adopter-pilot-closeout/sprint-001-real-target-repo-adopter-pilot/tasks/DA-615-pilot-2-rehearsal-delta-findings-and-rollback-evidence.md`
- 问题描述: `TK-615` 与 `DA-615` 把 rollback 后已删除的 repo-local `plan/execution` 文件当成最终留存证据，而 summary 明确记录 `repoLocalWorkspaceExistsAfterRollback=false`。
- 影响: 完成态引用不可回放证据，会让 sprint closeout 高估审计完整性。
- 建议: 以仍存在的 `.tmp` stdout/summary 与 tool-managed rollback artifact 作为 canonical evidence，并把 repo-local execute artifacts 标注为 rollback 后的临时产物。
- 规范依据: `CS-004`，`execution-gate-layering-spec.md` 第 5 节。

### 2.2 [P2] Complex pilot success wording overstated what the recovered rerun proved

- 位置:
  - `.repo-ai-governor/context/dev/project-055-ga-evidence-and-adopter-pilot-closeout/sprint-001-real-target-repo-adopter-pilot/tasks/DA-613-adopter-pilot-repository-selection-and-acceptance-rubric-freeze.md`
  - `.repo-ai-governor/context/dev/project-055-ga-evidence-and-adopter-pilot-closeout/sprint-001-real-target-repo-adopter-pilot/tasks/TK-615-execute-pilot-2-upgrade-workspace-migration-rollback-rehearsal-and-capture-delta-findings.md`
  - `.repo-ai-governor/context/dev/project-055-ga-evidence-and-adopter-pilot-closeout/sprint-001-real-target-repo-adopter-pilot/tasks/DA-615-pilot-2-rehearsal-delta-findings-and-rollback-evidence.md`
- 问题描述: 文档在 complex pilot 成功结论上默认沿用了“冻结 working copy 被完整保留”的语气，但任务记录同时说明原路径在预跑失误里被删除后重建，最终 acceptance 证明的是恢复后 baseline 的 rerun。
- 影响: 会把可证明的事实说得比证据更强，削弱 GA closeout 的 truthfulness。
- 建议: 在 freeze artifact 与 task/delivery artifact 中显式加入 execution caveat，把成功结论收紧到“恢复后 baseline rerun 通过”。
- 规范依据: risk-based inference；依据是 `.repo-ai-governor/context/dev/project-055-ga-evidence-and-adopter-pilot-closeout/sprint-001-real-target-repo-adopter-pilot/tasks/DA-613-adopter-pilot-repository-selection-and-acceptance-rubric-freeze.md` 的 rubric 与简版 PRD 对 truthfulness/audit 的要求。

## 3. Notes

1. Pilot-1 evidence chain is self-consistent; no actionable issue was found there.
2. The accepted fixes are docs/ledger truth-surface only, so no `pnpm run build` is required by `CS-034`.

## 4. Verification

1. `pnpm run check` (passed before reviewer findings; rerun required after fixes)
2. `node ./scripts/governance/check-task-ledger-sync.js` (passed before reviewer findings; rerun required after fixes)
3. `node ./scripts/governance/check-sprint-plan-status-sync.js` (passed before reviewer findings; rerun required after fixes)
4. `node ./scripts/governance/check-code-review-status-sync.js` (passed before reviewer findings; rerun required after fixes)

## 复核结论（2026-04-07）

- 整体结论：**认可**

### 逐条复核

1. `2.1 [P1] Pilot-2 completion evidence referenced deleted repo-local artifacts`
   - 判定：**认可**
   - 证据：`TK-615` 与 `DA-615` 已改用 `.tmp/project-055-sprint-001-pilot-2/workspace-execute.stdout.json`、`.tmp/project-055-sprint-001-pilot-2/workspace-rollback.stdout.json` 与 tool-managed rollback artifact 作为可回放 evidence，并明确 repo-local execute artifacts 会随 rollback 清理。
   - 处理：保留为 accepted finding，已进入修复窗口。
2. `2.2 [P2] Complex pilot success wording overstated what the recovered rerun proved`
   - 判定：**认可**
   - 证据：`DA-613` 已新增 execution caveat；`TK-615` 与 `DA-615` 已把结论收紧为“恢复后 baseline 的 acceptance rerun 通过”。
   - 处理：保留为 accepted finding，已进入修复窗口。

### 验证命令

1. `pnpm run check`（通过）
2. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
3. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
4. `node ./scripts/governance/check-code-review-status-sync.js`（通过）

## 修复执行记录（2026-04-07）

1. `2.1 [P1] Pilot-2 completion evidence referenced deleted repo-local artifacts`：已完成
   - 变更文件：
     - `.repo-ai-governor/context/dev/project-055-ga-evidence-and-adopter-pilot-closeout/sprint-001-real-target-repo-adopter-pilot/tasks/TK-615-execute-pilot-2-upgrade-workspace-migration-rollback-rehearsal-and-capture-delta-findings.md`
     - `.repo-ai-governor/context/dev/project-055-ga-evidence-and-adopter-pilot-closeout/sprint-001-real-target-repo-adopter-pilot/tasks/DA-615-pilot-2-rehearsal-delta-findings-and-rollback-evidence.md`
   - 验证：`pnpm run check`、`node ./scripts/governance/check-task-ledger-sync.js`、`node ./scripts/governance/check-sprint-plan-status-sync.js`、`node ./scripts/governance/check-code-review-status-sync.js`（通过）
   - 说明：已改用仍然存在的 `.tmp` stdout/summary 与 tool-managed rollback artifact 作为 canonical evidence，并明确 repo-local execute artifacts 会随 rollback 清理。
2. `2.2 [P2] Complex pilot success wording overstated what the recovered rerun proved`：已完成
   - 变更文件：
     - `.repo-ai-governor/context/dev/project-055-ga-evidence-and-adopter-pilot-closeout/sprint-001-real-target-repo-adopter-pilot/tasks/DA-613-adopter-pilot-repository-selection-and-acceptance-rubric-freeze.md`
     - `.repo-ai-governor/context/dev/project-055-ga-evidence-and-adopter-pilot-closeout/sprint-001-real-target-repo-adopter-pilot/tasks/TK-615-execute-pilot-2-upgrade-workspace-migration-rollback-rehearsal-and-capture-delta-findings.md`
     - `.repo-ai-governor/context/dev/project-055-ga-evidence-and-adopter-pilot-closeout/sprint-001-real-target-repo-adopter-pilot/tasks/DA-615-pilot-2-rehearsal-delta-findings-and-rollback-evidence.md`
   - 验证：`pnpm run check`、`node ./scripts/governance/check-task-ledger-sync.js`、`node ./scripts/governance/check-sprint-plan-status-sync.js`、`node ./scripts/governance/check-code-review-status-sync.js`（通过）
   - 说明：已把 complex pilot 的完成结论收紧为“恢复后 baseline 的 acceptance rerun 通过”，并在 freeze artifact 中补充 execution caveat。
