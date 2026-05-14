# Code Review: sprint-004 clean-room evidence and docs truthfulness delegated review round 1

- Status: resolved
- Date: 2026-05-14
- Reviewer: Maxwell
- Main Verifier: AI-Agent
- Task: `CR-001`
- Review Type: delegated sprint boundary review
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/execution-gate-layering-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/governance-technical-solution-registry/contracts/technical-solution-delivery-registry-contract.md`

## 1. Review Scope
1. `apps/cli/src/runtime/adoption-pack-runtime.ts`
2. `apps/cli/test/adopt-command.integration.test.ts`
3. `README.md`
4. `README.zh-CN.md`
5. `docs/local-adoption-playbook.md`
6. `docs/local-adoption-playbook.zh-CN.md`
7. `docs/support-matrix.md`
8. `docs/support-matrix.zh-CN.md`
9. `.repo-ai-governor/context/dev/project-123-empty-repo-self-host-adoption-rollout/sprint-004-clean-room-evidence-and-docs-truthfulness/**`
10. `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`

## 2. Findings
### 2.1 [P1] Active delivery handoff still points to stale sprint-003 artifact
- 位置: `.repo-ai-governor/context/technical-solution-delivery-registry.yaml:1189`
- 问题描述: `technical-solution.empty-repo-self-host-adoption-follow-up` 当前仍把 `handoff_artifact_path` 指向 `DA-1062`，但 sprint-004 已经产出 `DA-1064` 作为新的 exit-acceptance / project-final handoff packet。
- 影响: canonical delivery-handoff source 仍会把后续 closeout 步骤引向过时的 sprint-003 truth，违背当前 active follow-up stream 的 handoff surface。
- 建议: 在 solution 仍处于 `in_progress` 的阶段，把 delivery entry 的 `handoff_artifact_path` 与当前 sprint-004 artifact 同步到 `DA-1064`，并把 rollout truth 推进到当前真实中间态。

### 2.2 [P2] Completed TK-1063 row still carries pre-completion placeholder evidence
- 位置: `.repo-ai-governor/context/dev/project-123-empty-repo-self-host-adoption-rollout/sprint-004-clean-room-evidence-and-docs-truthfulness/tasks/tasks.csv:5`
- 问题描述: `TK-1063` task card 已记录 clean-room repair、`doctor --adapters` restored pass、以及 vitest/build evidence，但最新 completed CSV row 仍保留 `Preparing deepseekian clean-room rehearsal boundary.` / `Pending clean-room execution.` / `Activated from DA-1062 handoff...` 这组三段占位文本。
- 影响: sprint closeout ledger 的最新完成记录不可回放，completed row 缺少真实完成摘要与验证证据，削弱 audit replayability。
- 建议: 通过显式 `sync-task-ledger` 覆盖 `TK-1063` 的最新 result / verify / review_delta，使 rendered CSV 与 canonical task card completion evidence 对齐。

## 3. Notes
1. reviewer 未在 `adoption-pack-runtime.ts` 与 `adopt-command.integration.test.ts` 中继续发现新的 executable defect；当前问题集中在 delivery/handoff truth 与 completed ledger evidence drift。
2. starter CSV parser 目前只由 repo-controlled template row 覆盖；若未来 starter CSV 扩展到 quoted multiline cells，建议追加专门 parser coverage，但这不构成本轮 closeout 阻断。

## 4. Verification
1. `pnpm exec vitest run apps/cli/test/adopt-command.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `pnpm run build`（通过）
3. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
5. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
6. `node ./scripts/governance/check-technical-solution-delivery-registry.js`（通过）
7. `pnpm run check`（通过）

## 复核结论（2026-05-14）

- 整体结论：**认可**

### 逐条复核
1. `2.1 [P1] Active delivery handoff still points to stale sprint-003 artifact`
   - 判定：**认可**
   - 证据：delivery registry 的 active `technical-solution.empty-repo-self-host-adoption-follow-up` entry 仍把 `handoff_artifact_path` 指向 `DA-1062`，而 sprint-004 已经明确以 `DA-1064` 作为当前 closeout / project-final handoff packet。
   - 处理：接受；需将 active delivery entry 的 handoff truth 推进到 `DA-1064`，并同步当前 rollout 中间态。
2. `2.2 [P2] Completed TK-1063 row still carries pre-completion placeholder evidence`
   - 判定：**认可**
   - 证据：latest `tasks.csv` completed row 仍复用 active-state `Preparing deepseekian... / Pending clean-room execution` 文本，与 `TK-1063` 已记录的 clean-room repair outcome 和 vitest/build evidence 不一致。
   - 处理：接受；需通过显式 `sync-task-ledger` 覆盖 `TK-1063` 的 latest rendered row evidence。

### 验证命令
1. `pnpm exec vitest run apps/cli/test/adopt-command.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `pnpm run build`（通过）
3. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
5. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
6. `node ./scripts/governance/check-technical-solution-delivery-registry.js`（通过）
7. `pnpm run check`（通过）

## 修复执行记录（2026-05-14）

1. `2.1 [P1] Active delivery handoff still points to stale sprint-003 artifact`：已完成
   - 变更文件：`.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
   - 验证：`node ./scripts/governance/check-technical-solution-delivery-registry.js`（通过）；`pnpm run check`（通过）
   - 说明：active `technical-solution.empty-repo-self-host-adoption-follow-up` entry 现已将 `handoff_artifact_path` 推进到 `DA-1064`，并把当前 rollout truth 对齐到 sprint-004 in-progress handoff packet。
2. `2.2 [P2] Completed TK-1063 row still carries pre-completion placeholder evidence`：已完成
   - 变更文件：`.repo-ai-governor/context/dev/project-123-empty-repo-self-host-adoption-rollout/sprint-004-clean-room-evidence-and-docs-truthfulness/tasks/tasks.csv`
   - 验证：`node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-123-empty-repo-self-host-adoption-rollout/sprint-004-clean-room-evidence-and-docs-truthfulness/tasks" --task-id TK-1063 --execution-id exec-sync-20260514-tk-1063-completion-evidence --result "Deepseekian clean-room evidence captured; self-host operator path and canonical ledger seed truth fixed and documented." --verify "pnpm exec vitest run apps/cli/test/adopt-command.integration.test.ts --maxWorkers=1 --maxConcurrency=1; pnpm run build" --review-delta "DA-1063 landed; TK-1064 now owns docs truth sync plus sprint/project closeout follow-through."`（通过）；`node ./scripts/governance/check-task-ledger-sync.js`（待重跑并已纳入本轮复验）
   - 说明：`TK-1063` latest completed row 已改为真实 clean-room repair outcome，并带上 vitest/build evidence 与 closeout ownership delta。
