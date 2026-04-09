# Code Review: project-068 sprint-001 local-model capability ceiling boundary

- Status: resolved
- Date: 2026-04-08
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
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/execution-gate-layering-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`

## 1. Review Scope

1. `packages/adapters/local-model/README.md`
2. `docs/local-adoption-playbook.md`
3. `docs/local-adoption-playbook.zh-CN.md`
4. `docs/support-matrix.md`
5. `docs/support-matrix.zh-CN.md`
6. `docs/maintainer-validation-playbook.md`
7. `docs/maintainer-validation-playbook.zh-CN.md`
8. `.repo-ai-governor/context/dev/project-068-p2-fallback-and-reserved-target-followups/sprint-001-local-model-capability-ceiling-and-promoted-use-case/plan.md`
9. `.repo-ai-governor/context/dev/project-068-p2-fallback-and-reserved-target-followups/sprint-001-local-model-capability-ceiling-and-promoted-use-case/tasks/TK-682-freeze-local-model-capability-ceiling-and-promoted-use-case-contract.md`
10. `.repo-ai-governor/context/dev/project-068-p2-fallback-and-reserved-target-followups/sprint-001-local-model-capability-ceiling-and-promoted-use-case/tasks/TK-683-implement-constrained-local-model-capability-followup-or-explicit-non-goal-guardrails.md`
11. `.repo-ai-governor/context/dev/project-068-p2-fallback-and-reserved-target-followups/sprint-001-local-model-capability-ceiling-and-promoted-use-case/tasks/CR-001.md`

## 2. Findings

### 2.1 [P2] local-model README still leaves a broader local-first interpretation

- 位置: `packages/adapters/local-model/README.md:8`
- 问题描述: sprint-001 已把 `local-model` contract 冻结为 restricted-network 或 operator-selected local fallback only，但 README 仍把该 surface 描述成“本地优先或远端 fallback”的 lane，和 support matrix / playbook 的收口口径不一致。
- 影响: adopter 仍可能把 `local-model` 误读成 promoted primary local-first lane，重新打开本轮要关闭的 capability/scope ambiguity。
- 建议: 将 README 改写为与 support-truth 一致的 restricted-network / explicit local fallback contract，并明确它不是本地优先 lane。

### 2.2 [P3][CS-004] CR task card still lists `pnpm run check` as a verification command

- 位置: `.repo-ai-governor/context/dev/project-068-p2-fallback-and-reserved-target-followups/sprint-001-local-model-capability-ceiling-and-promoted-use-case/tasks/CR-001.md:54`
- 问题描述: `code_standards.md` 的 Notes 明确要求 verification commands 不要使用 `pnpm run check`，但 `CR-001` 的 Development/Delivery Verification 仍保留该 aggregate entry。
- 影响: review task card 会偏离仓库的可回放验证基线，也会把递归 aggregate gate 带回到 review lifecycle 文档。
- 建议: 删除 `pnpm run check`，改为保留具体治理检查与 ledger sync 命令。

## 3. Notes

1. `2.1` 属于 risk-based inference，但它直接影响本轮 frozen support-truth 的公开可读性，应作为 actionable finding 处理。
2. `2.2` 直接对应 `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md -> Notes` 的 verification entry 约束。

## 4. Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
3. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
4. `node ./scripts/governance/check-worktree-review-target.js`（通过）

## 复核结论（2026-04-08）

- 整体结论：**认可**

### 逐条复核

1. `2.1`
   - 判定：**认可**
   - 证据：`docs/support-matrix*.md`、`docs/local-adoption-playbook*.md` 与 `docs/maintainer-validation-playbook*.md` 已把 `local-model` 冻结为 restricted-network / explicit-local-fallback only，但 `packages/adapters/local-model/README.md` 仍残留“本地优先”措辞，和当前 support-truth 不一致。
   - 处理：采用最小修复，把 README 口径收窄到 restricted-network / operator-selected local fallback，并明确它不是本地优先 lane。
2. `2.2`
   - 判定：**认可**
   - 证据：`.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md` Notes 明确要求 verification commands 不使用 `pnpm run check`，而 `CR-001` 的 Development/Delivery Verification 仍包含该 aggregate entry。
   - 处理：删除 `pnpm run check`，保留可回放的具体治理检查与 ledger sync 命令。

### 验证命令

1. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
3. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
4. `node ./scripts/governance/check-worktree-review-target.js`（通过）

## 修复执行记录（2026-04-08）

1. `2.1`：已完成
   - 变更文件：`packages/adapters/local-model/README.md`
   - 验证：`node ./scripts/governance/check-task-ledger-sync.js`、`node ./scripts/governance/check-sprint-plan-status-sync.js`、`node ./scripts/governance/check-code-review-status-sync.js`、`node ./scripts/governance/check-worktree-review-target.js`（通过）
   - 说明：README 现在与 support matrix / playbook 统一收窄为 restricted-network / operator-selected local fallback contract，不再留下“本地优先”解释空间。
2. `2.2`：已完成
   - 变更文件：`.repo-ai-governor/context/dev/project-068-p2-fallback-and-reserved-target-followups/sprint-001-local-model-capability-ceiling-and-promoted-use-case/tasks/CR-001.md`
   - 验证：`node ./scripts/governance/check-task-ledger-sync.js`、`node ./scripts/governance/check-sprint-plan-status-sync.js`、`node ./scripts/governance/check-code-review-status-sync.js`、`node ./scripts/governance/check-worktree-review-target.js`（通过）
   - 说明：`CR-001` 已删除 `pnpm run check` aggregate verification entry，改回仓库允许的具体治理检查与 ledger sync 命令；本轮只改动 docs / task-ledger surfaces，build not required。

## 处置结果与剩余风险

1. 本轮 accepted findings 已完成修复，`project-068` sprint-001 当前 review round 不再残留 blocker。
2. `local-model` 的 support-truth 现已统一到 fallback-only / P2 deferred 口径；后续若要扩张到新的 required-role 或 productization seam，必须在 `sprint-002` 之后另行开新任务与证据窗口。
