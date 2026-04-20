# Code Review: sprint-005-external-interoperability-and-rollout-closeout

- Status: resolved
- Date: 2026-04-20
- Reviewer: AI-Agent delegated reviewer loop
- Task: `CR-001`
- Review Type: delegated sprint review
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

1. `.repo-ai-governor/context/dev/project-115-acp-execution-bridge-rollout/sprint-005-external-interoperability-and-rollout-closeout/plan.md`
2. `.repo-ai-governor/context/dev/project-115-acp-execution-bridge-rollout/plan.md`
3. `.repo-ai-governor/context/dev/project-115-acp-execution-bridge-rollout/sprint-005-external-interoperability-and-rollout-closeout/tasks/TK-1001-run-optional-external-acp-interoperability-rehearsal.md`
4. `.repo-ai-governor/context/dev/project-115-acp-execution-bridge-rollout/sprint-005-external-interoperability-and-rollout-closeout/tasks/TK-1002-review-support-wording-uplift-and-rollout-claim-boundary.md`
5. `.repo-ai-governor/context/dev/project-115-acp-execution-bridge-rollout/sprint-005-external-interoperability-and-rollout-closeout/tasks/DA-1001-optional-external-acp-consumer-availability-and-rehearsal-disposition.md`
6. `.repo-ai-governor/context/dev/project-115-acp-execution-bridge-rollout/sprint-005-external-interoperability-and-rollout-closeout/tasks/DA-1002-support-wording-boundary-review-and-conservative-rollout-disposition.md`
7. `.repo-ai-governor/context/dev/project-115-acp-execution-bridge-rollout/sprint-005-external-interoperability-and-rollout-closeout/tasks/CR-001.md`
8. `.repo-ai-governor/context/dev/project-115-acp-execution-bridge-rollout/sprint-005-external-interoperability-and-rollout-closeout/tasks/checklist.md`
9. `.repo-ai-governor/context/dev/project-115-acp-execution-bridge-rollout/sprint-005-external-interoperability-and-rollout-closeout/tasks/tasks.csv`

## 2. Findings

### 2.1 [P1] CR-001 has not been synchronized into the sprint ledgers

- 位置: `.repo-ai-governor/context/dev/project-115-acp-execution-bridge-rollout/sprint-005-external-interoperability-and-rollout-closeout/tasks/tasks.csv`
- 问题描述: `CR-001.md` 已经以 `review_pending` 创建，但 `tasks.csv` 与 `checklist.md` 仍只包含 `TK-1001..TK-1003`。reviewer 在当前窗口重跑 `node ./scripts/governance/check-task-ledger-sync.js` 时已得到 `CR-001: missing row in tasks.csv`。
- 影响: ledger-driven review gate 与 closeout 逻辑会看不到 active review state，直接违反 `CS-021`、`CS-026` 与 task-ledger single-write-source contract。
- 建议: 立即把 `CR-001` 同步进 canonical ledger，并重渲染 `tasks.csv` 与 `checklist.md`，之后再推进 review lifecycle。

## 3. Notes

1. reviewer 未发现 ACP support wording 或 optional external-consumer unavailable 结论存在 evidence overstatement；当前 public truth 仍保持在 readiness / host-facing bootstrap boundary。
2. 最终 closeout summary 仍需保留“local external consumer unavailable, optional evidence only”的表述，避免把 `TK-1001` 压缩成“external interoperability rehearsal completed”。

## 4. Verification

1. `node ./scripts/governance/check-task-required-inputs.js --tasks-dir '/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-115-acp-execution-bridge-rollout/sprint-005-external-interoperability-and-rollout-closeout/tasks' --task-id TK-1001`（通过）
2. `node ./scripts/governance/check-task-required-inputs.js --tasks-dir '/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-115-acp-execution-bridge-rollout/sprint-005-external-interoperability-and-rollout-closeout/tasks' --task-id TK-1002`（通过）
3. `node ./scripts/governance/check-task-ledger-sync.js`（失败，缺少 `CR-001` row）
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
5. `command -v paseo || true`（未命中）
6. `command -v a2a || true`（未命中）
7. `command -v acp || true`（未命中）
8. `command -v npx || true`（通过，返回 `/opt/homebrew/bin/npx`）
9. `rg -n "Paseo|paseo|external ACP consumer|interoperability rehearsal|acp consumer" . -g '!node_modules' -g '!dist'`（未发现本地 rehearsal scaffold）

## 复核结论（2026-04-20）

- 整体结论：**认可**

### 逐条复核

1. `2.1`
   - 判定：**认可**
   - 证据：`CR-001.md` 已存在但最初未同步到 sprint ledger；主 agent 在本轮已执行 `node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-115-acp-execution-bridge-rollout/sprint-005-external-interoperability-and-rollout-closeout/tasks" --task-id CR-001 ...`，随后 `check-task-ledger-sync` 已恢复通过。
   - 处理：接受该 finding，并将 review_pending 的 `CR-001` 正式回写到 `tasks.csv` 与 `checklist.md`，消除 open review state 的台账隐形问题。

### 验证命令

1. `node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-115-acp-execution-bridge-rollout/sprint-005-external-interoperability-and-rollout-closeout/tasks" --task-id CR-001 --result "Fresh delegated reviewer round is active for sprint-005 support-boundary closeout review." --verify "Initial reviewer baseline: check-task-required-inputs for TK-1001/TK-1002, check-task-ledger-sync, and check-sprint-plan-status-sync." --review-delta "CR-001 is now review_pending and waiting for main-agent triage of the delegated findings."`（通过）
2. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
3. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）

## 修复执行记录（2026-04-20）

1. `2.1`：已完成
   - 变更文件：`.repo-ai-governor/context/dev/project-115-acp-execution-bridge-rollout/sprint-005-external-interoperability-and-rollout-closeout/tasks/checklist.md`、`.repo-ai-governor/context/dev/project-115-acp-execution-bridge-rollout/sprint-005-external-interoperability-and-rollout-closeout/tasks/tasks.csv`
   - 验证：`node ./scripts/governance/check-code-review-status-sync.js`、`node ./scripts/governance/check-task-ledger-sync.js`、`node ./scripts/governance/check-sprint-plan-status-sync.js`、`node ./scripts/governance/check-worktree-review-target.js`
   - 说明：`CR-001` 已经回写为当前 sprint 的 canonical review_pending / verified lifecycle state，rendered ledger 不再遗漏 open review truth。

## 处置结果与剩余风险

1. 本轮唯一 accepted finding 已完成处理，`CR-001` 现在满足 `resolved` 条件。
2. 本次 accepted fix 仅涉及 review lifecycle 与 task-ledger 派生面对齐，没有新增 `apps/**`、`packages/**`、`bin/**` 或 `test/**` 可执行代码改动，因此 build not required。
3. 剩余仅保留一条 closeout guardrail：`TK-1003` 的最终完成结论必须继续保持“local external consumer unavailable, optional evidence only”的措辞，不得夸大成 external interoperability 已完成。
