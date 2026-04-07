# Code Review: working-tree-20260406-2013

- Status: resolved
- Date: 2026-04-06
- Reviewer: AI-Agent
- Task: `CR-001`
- Review Type: sprint scoped delegated review
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/execution-gate-layering-spec.md`

## 1. Review Scope
1. `.repo-ai-governor/context/completed-streams-history.md`
2. `.repo-ai-governor/context/current-context.md`
3. `.repo-ai-governor/context/dev/project-052-adopter-truthfulness-and-ga-closeout/plan.md`
4. `.repo-ai-governor/context/dev/project-052-adopter-truthfulness-and-ga-closeout/sprint-001-install-mode-truth-and-playbook-alignment/plan.md`
5. `.repo-ai-governor/context/dev/project-052-adopter-truthfulness-and-ga-closeout/sprint-001-install-mode-truth-and-playbook-alignment/tasks/TK-589-freeze-adopter-install-mode-support-matrix-and-acceptance-contract.md`
6. `.repo-ai-governor/context/dev/project-052-adopter-truthfulness-and-ga-closeout/sprint-001-install-mode-truth-and-playbook-alignment/tasks/TK-590-align-readme-local-adoption-playbook-and-support-matrix-install-mode-truth.md`
7. `.repo-ai-governor/context/dev/project-052-adopter-truthfulness-and-ga-closeout/sprint-001-install-mode-truth-and-playbook-alignment/tasks/TK-591-close-install-mode-truthfulness-with-clean-room-and-dist-binary-rehearsal-evidence.md`
8. `.repo-ai-governor/context/dev/project-052-adopter-truthfulness-and-ga-closeout/sprint-001-install-mode-truth-and-playbook-alignment/tasks/CR-001.md`
9. `.repo-ai-governor/context/dev/project-052-adopter-truthfulness-and-ga-closeout/sprint-001-install-mode-truth-and-playbook-alignment/tasks/checklist.md`
10. `.repo-ai-governor/context/dev/project-052-adopter-truthfulness-and-ga-closeout/sprint-001-install-mode-truth-and-playbook-alignment/tasks/tasks.csv`
11. `.repo-ai-governor/context/dev/project-052-adopter-truthfulness-and-ga-closeout/sprint-001-install-mode-truth-and-playbook-alignment/tasks/DA-589-install-mode-support-matrix-and-acceptance-contract.md`
12. `.repo-ai-governor/context/dev/project-052-adopter-truthfulness-and-ga-closeout/sprint-001-install-mode-truth-and-playbook-alignment/tasks/DA-590-readme-playbook-and-support-matrix-install-mode-truth-sync.md`
13. `.repo-ai-governor/context/dev/project-052-adopter-truthfulness-and-ga-closeout/sprint-001-install-mode-truth-and-playbook-alignment/tasks/DA-591-cleanroom-and-dist-binary-install-mode-evidence-refresh.md`
14. `README.md`
15. `README.zh-CN.md`
16. `docs/local-adoption-playbook.md`
17. `docs/local-adoption-playbook.zh-CN.md`
18. `docs/support-matrix.md`
19. `docs/support-matrix.zh-CN.md`

## 2. Findings
### 2.1 [P2] Canonical task cards are missing explicit `Task ID` metadata
- 位置: `.repo-ai-governor/context/dev/project-052-adopter-truthfulness-and-ga-closeout/sprint-001-install-mode-truth-and-playbook-alignment/tasks/TK-589-freeze-adopter-install-mode-support-matrix-and-acceptance-contract.md:1`, `.repo-ai-governor/context/dev/project-052-adopter-truthfulness-and-ga-closeout/sprint-001-install-mode-truth-and-playbook-alignment/tasks/TK-590-align-readme-local-adoption-playbook-and-support-matrix-install-mode-truth.md:1`, `.repo-ai-governor/context/dev/project-052-adopter-truthfulness-and-ga-closeout/sprint-001-install-mode-truth-and-playbook-alignment/tasks/TK-591-close-install-mode-truthfulness-with-clean-room-and-dist-binary-rehearsal-evidence.md:1`, `.repo-ai-governor/context/dev/project-052-adopter-truthfulness-and-ga-closeout/sprint-001-install-mode-truth-and-playbook-alignment/tasks/CR-001.md:1`
- 问题描述: 本轮改动把 4 张 canonical `TK/CR` 卡上的显式 `- Task ID:` 元数据行删掉了。根据 `task-ledger-single-write-source-contract.md`，`TK/CR` 是任务台账的语义主源，而 `task_id` 是最小必填 canonical 字段之一；仅依赖 H1 解析会让后续 ledger/sync/audit 对身份字段的恢复更脆弱。
- 影响: 当前同步脚本仍能从标题推断任务编号，所以短期不会立刻报错，但 canonical field contract 已被削弱；后续任务卡迁移、审计或更严格的解析器更容易产生漂移。
- 建议: 在 4 张受影响的 canonical 卡片上恢复 `- Task ID:` 字段，并在修复后重跑 `check-task-ledger-sync` 与 `check-sprint-plan-status-sync`。

## 3. Notes
1. 其余 install-mode 文档、support matrix evidence 写回、以及 sprint ledger 状态同步在当前边界内未发现额外 actionable finding。
2. 这是一条 metadata-only finding，不要求重跑 clean-room 或 local distribution evidence 命令。

## 4. Verification
1. `rg -n "dist-binary|tgz|path|link|acceptance contract|Acceptance Contract" README.md README.zh-CN.md docs/local-adoption-playbook.md docs/local-adoption-playbook.zh-CN.md docs/support-matrix.md docs/support-matrix.zh-CN.md`（通过）
2. `node ./scripts/release/verify-cleanroom-local-install.js --modes path,link --iterations 1 --output .tmp/project-052-sprint-001-cleanroom-report.json`（通过）
3. `node ./scripts/release/verify-local-distribution.js --output .tmp/project-052-sprint-001-local-distribution-report.json`（通过）
4. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
5. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
6. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
7. `node ./scripts/governance/check-worktree-review-target.js`（通过）
8. `git diff --check -- README.md README.zh-CN.md docs/local-adoption-playbook.md docs/local-adoption-playbook.zh-CN.md docs/support-matrix.md docs/support-matrix.zh-CN.md .repo-ai-governor/context/current-context.md .repo-ai-governor/context/completed-streams-history.md .repo-ai-governor/context/dev/project-052-adopter-truthfulness-and-ga-closeout`（通过）

## 复核结论（2026-04-06）

- 整体结论：**认可**

### 逐条复核
1. `2.1 [P2] Canonical task cards are missing explicit Task ID metadata`
   - 判定：**认可**
   - 证据：`task-ledger-single-write-source-contract.md` 第 3 节明确要求 `task_id` 为 `TK/CR` 的 minimum canonical field；当前 4 张卡片都删除了显式 `- Task ID:` 行。
   - 处理：恢复 `TK-589`、`TK-590`、`TK-591`、`CR-001` 上的 `Task ID` 元数据，并在修复后重跑 ledger/sprint sync 检查。

### 验证命令
1. `node ./scripts/governance/check-task-ledger-sync.js`（待修复后重跑）
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`（待修复后重跑）
3. `node ./scripts/governance/check-code-review-status-sync.js`（待修复后重跑）

## 修复执行记录（2026-04-06）

1. `2.1 [P2] Canonical task cards are missing explicit Task ID metadata`：已完成
   - 变更文件：`.repo-ai-governor/context/dev/project-052-adopter-truthfulness-and-ga-closeout/sprint-001-install-mode-truth-and-playbook-alignment/tasks/TK-589-freeze-adopter-install-mode-support-matrix-and-acceptance-contract.md`、`.repo-ai-governor/context/dev/project-052-adopter-truthfulness-and-ga-closeout/sprint-001-install-mode-truth-and-playbook-alignment/tasks/TK-590-align-readme-local-adoption-playbook-and-support-matrix-install-mode-truth.md`、`.repo-ai-governor/context/dev/project-052-adopter-truthfulness-and-ga-closeout/sprint-001-install-mode-truth-and-playbook-alignment/tasks/TK-591-close-install-mode-truthfulness-with-clean-room-and-dist-binary-rehearsal-evidence.md`、`.repo-ai-governor/context/dev/project-052-adopter-truthfulness-and-ga-closeout/sprint-001-install-mode-truth-and-playbook-alignment/tasks/CR-001.md`
   - 验证：`node ./scripts/governance/check-task-ledger-sync.js`（通过）；`node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）；`node ./scripts/governance/check-code-review-status-sync.js`（通过）；`git diff --check -- .repo-ai-governor/context/dev/project-052-adopter-truthfulness-and-ga-closeout/sprint-001-install-mode-truth-and-playbook-alignment/tasks/TK-589-freeze-adopter-install-mode-support-matrix-and-acceptance-contract.md .repo-ai-governor/context/dev/project-052-adopter-truthfulness-and-ga-closeout/sprint-001-install-mode-truth-and-playbook-alignment/tasks/TK-590-align-readme-local-adoption-playbook-and-support-matrix-install-mode-truth.md .repo-ai-governor/context/dev/project-052-adopter-truthfulness-and-ga-closeout/sprint-001-install-mode-truth-and-playbook-alignment/tasks/TK-591-close-install-mode-truthfulness-with-clean-room-and-dist-binary-rehearsal-evidence.md .repo-ai-governor/context/dev/project-052-adopter-truthfulness-and-ga-closeout/sprint-001-install-mode-truth-and-playbook-alignment/tasks/CR-001.md`（通过）
   - 说明：恢复了 4 张 canonical task card 的显式 `Task ID` 字段；该修复仅影响 ledger metadata，不需要重跑 install-mode evidence 命令。
