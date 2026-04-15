# Code Review: sprint-002 playbook readback and support evidence prep clean recheck

- Status: resolved
- Date: 2026-04-14
- Reviewer: AI-Agent
- Task: `CR-002`
- Review Type: working tree review
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
1. `docs/local-adoption-playbook.md`
2. `docs/local-adoption-playbook.zh-CN.md`
3. `docs/support-matrix.md`
4. `docs/support-matrix.zh-CN.md`

## 2. Findings
1. 未发现需要修复的点。

## 3. Notes
1. sprint-002 当前 docs boundary 已不再依赖公开 `verify` 命令；readback guidance 只消费受支持的 `connect` / `doctor` surfaces，并把 execution-path evidence 保持为可选 `run --dry-run --trace` artifact。
2. support-refresh guardrail 继续保持 evidence-gated，并未在本轮 uplift support truth。
3. 历史 evidence rows 中仍残留部分旧的 `verify --adapters` 文案，但本轮 clean recheck 未将这些历史记录判定为阻断当前 sprint closeout 的 actionable finding。

## 4. Verification
1. `pnpm run build`（通过）
2. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
3. `pnpm run check`（通过）
4. `node ./dist/bin/repo-ai-governor.js verify --adapters --output json`（按预期失败，用于确认 removed public command 仍未被重新暴露）
5. `node ./dist/bin/repo-ai-governor.js connect --help >/dev/null`（通过）
6. `node ./dist/bin/repo-ai-governor.js doctor --adapters --output json`（通过）
7. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
8. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
9. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
10. `node ./scripts/governance/check-worktree-review-target.js`（通过）

## 复核结论（2026-04-14）

- 整体结论：**认可**
- 最新 fresh reviewer round 未发现新的 actionable finding。

## 修复执行记录（2026-04-14）

1. 无新增修复；本轮为 clean recheck。

## 处置结果与剩余风险（2026-04-14）

1. `CR-002` 已达到 `resolved` 条件，可作为 `sprint-002` clean closeout 的 reviewer 结论。
2. 若后续单独开启 support-matrix 历史 evidence wording 清理窗口，需要重新评估历史 `verify --adapters` 文案是否应统一迁移。
