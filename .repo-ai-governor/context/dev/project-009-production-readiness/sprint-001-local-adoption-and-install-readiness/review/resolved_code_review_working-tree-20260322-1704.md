# Code Review: Working tree review (2026-03-22 17:04)

- Status: resolved
- Date: 2026-03-22
- Reviewer: AI-Agent
- Task: `n/a`
- Review Type: working tree review
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`

## 1. Review Scope
1. `.codex/skills/workspace-code-review-workflow/SKILL.md`
2. `.repo-ai-governor/context/artifact-registry/artifacts.csv`
3. `.repo-ai-governor/context/current-context.md`
4. `.repo-ai-governor/context/dev/index.md`
5. `.repo-ai-governor/context/dev/projects-overview.md`
6. `.repo-ai-governor/context/dev/project-002-governance-core/**/review/*.md`
7. `.repo-ai-governor/context/dev/project-003-standards-and-slots/**/review/*.md`
8. `.repo-ai-governor/context/dev/project-004-agent-adapter-runtime/**/review/*.md`
9. `.repo-ai-governor/context/dev/project-005-observability-and-artifacts/**/review/*.md`
10. `.repo-ai-governor/context/dev/project-006-hardening-and-release/**/review/*.md`
11. `.repo-ai-governor/context/dev/project-009-production-readiness/**`
12. `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
13. `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`
14. `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
15. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`
16. `package.json`
17. `scripts/governance/check-code-standards.js`
18. `scripts/governance/check-code-review-status-sync.js`
19. `turbo.json`

## 2. Findings
### 2.1 [P1] `check-code-review-status-sync` can false-pass files whose header status is missing or stale
- 位置: `scripts/governance/check-code-review-status-sync.js:72`
- 问题描述: `readReviewStatus()` currently does `content.match(/^- Status:\\s*(.+)$/mu)`, which returns the first `- Status:` line anywhere in the file. That means a malformed review artifact can still pass `CS-026` as long as some later body section, note, or copied example contains `- Status: resolved/verified/review_pending`, even when the top-level metadata block is missing or out of sync. The new lifecycle spec explicitly requires the top-level `Status` metadata to match the filename state, so this implementation does not fully enforce the rule it introduces.
- 影响: The new governance gate can silently miss real lifecycle drift, so invalid review artifacts may pass `check-code-review-status-sync.js` and reach the ledger/release flow as if they were compliant.
- 建议: Parse only the leading metadata block (or at minimum the first pre-header lines before body content), and fail when the top-level `- Status:` field is absent or not the first metadata match.

### 2.2 [P2] `projects-overview` reintroduced an unsupported `Phase F` label for Stage 9
- 位置: `.repo-ai-governor/context/dev/projects-overview.md:23`
- 问题描述: This row maps `project-009-production-readiness` to `Phase F + GA Readiness`, but the same change set explicitly adds the opposite rule in `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md:23` and standardizes Stage 9 itself as `Phase E 收口 + GA Readiness overlay` at line 38. `project-009`'s own plan also uses that exact mapping. As written, the dev overview sends readers back to a phase name the master plan just declared invalid until triad docs formally add it.
- 影响: Planning/navigation docs drift again immediately after `TK-089` tightened phase alignment, which makes later project/task updates likely to copy the wrong phase label and weakens the "single source of truth" contract for Stage 9.
- 建议: Update the `project-009` row in `projects-overview.md` to the same `Phase E 收口 + GA Readiness overlay` wording used by the master plan and the project plan.

## 3. Notes
1. `node ./scripts/governance/check-code-review-status-sync.js` currently passes on the working tree, so finding `2.1` is about enforcement completeness rather than a currently failing artifact.
2. `node ./scripts/governance/check-task-ledger-sync.js` and `node ./scripts/governance/check-sprint-plan-status-sync.js` both pass for the current working tree.
3. Residual doc drift still exists in `AGENTS.md` default workflow (`review_*` lifecycle wording) versus the newer `code_review_*`-first guidance; the current gate tolerates legacy prefixes, so I kept this as a note instead of a separate blocking finding.

## 4. Verification
1. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
2. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
3. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）

## 复核结论（2026-03-22）

- 整体结论：**认可**

### 逐条复核
1. `2.1 [P1] check-code-review-status-sync` can false-pass files whose header status is missing or stale
   - 判定：**认可**
   - 证据：`scripts/governance/check-code-review-status-sync.js` 中 `readReviewStatus()` 使用 `content.match(/^- Status:\\s*(.+)$/mu)`，会扫描全文首个匹配行，而不是限定顶部元数据块，无法严格保证 `CS-026` 要求的“顶层 Status 与文件名前缀同步”。
   - 处理：将状态读取逻辑收敛为仅解析标题后的顶层元数据区；当顶层缺失 `- Status:` 时返回 `<missing>` 并触发 gate 失败。
2. `2.2 [P2] projects-overview reintroduced an unsupported Phase F label for Stage 9`
   - 判定：**认可**
   - 证据：`projects-overview.md` 的 `project-009` 行仍为 `Phase F + GA Readiness`，而 `repo-ai-governor-master-execution-plan.md` 与 `project-009/plan.md` 已统一为 `Phase E 收口 + GA Readiness overlay`。
   - 处理：将 `projects-overview.md` 的 `project-009` phase 文案与主计划口径对齐。

### 验证命令
1. `node ./scripts/governance/check-code-review-status-sync.js`（待修复后执行）
2. `node ./scripts/governance/check-task-ledger-sync.js`（待修复后执行）
3. `node ./scripts/governance/check-sprint-plan-status-sync.js`（待修复后执行）

## 修复执行记录（2026-03-22）

1. `2.1 [P1] check-code-review-status-sync` can false-pass files whose header status is missing or stale：已完成
   - 变更文件：`scripts/governance/check-code-review-status-sync.js`
   - 验证：`node ./scripts/governance/check-code-review-status-sync.js`（通过）
   - 说明：状态读取逻辑已限定在标题后的顶层元数据区；缺失顶层 `- Status:` 会返回 `<missing>` 并触发失败。
2. `2.2 [P2] projects-overview reintroduced an unsupported Phase F label for Stage 9`：已完成
   - 变更文件：`.repo-ai-governor/context/dev/projects-overview.md`
   - 验证：`node ./scripts/governance/check-task-ledger-sync.js`（通过），`node ./scripts/governance/check-sprint-plan-status-sync.js`（通过），`node ./scripts/governance/check-docs-triad-sync.js`（通过）
   - 说明：`project-009` 的阶段映射已统一为 `Phase E 收口 + GA Readiness overlay`，与主执行计划和项目计划一致。
