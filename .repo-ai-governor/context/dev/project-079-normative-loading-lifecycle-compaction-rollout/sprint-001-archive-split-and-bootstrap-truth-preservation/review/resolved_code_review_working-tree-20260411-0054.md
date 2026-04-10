# Code Review: sprint-001 archive split and bootstrap truth preservation

- Status: resolved
- Date: 2026-04-11
- Reviewer: AI-Agent delegated reviewer
- Task: `CR-001`
- Review Type: sprint boundary review
- Normative References:
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/execution-gate-layering-spec.md`

## 1. Review Scope

1. `.repo-ai-governor/normative_knowledge_sources/governance/normative-loading-manifest-lifecycle-governance.md`
2. `.repo-ai-governor/normative_knowledge_sources/archive/normative-loading-manifest.archive.yaml`
3. `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
4. `.repo-ai-governor/context/current-context.md`
5. `.repo-ai-governor/context/completed-streams-history.md`
6. `.repo-ai-governor/context/dev/project-079-normative-loading-lifecycle-compaction-rollout/plan.md`
7. `.repo-ai-governor/context/dev/project-079-normative-loading-lifecycle-compaction-rollout/sprint-001-archive-split-and-bootstrap-truth-preservation/plan.md`
8. `.repo-ai-governor/context/dev/project-079-normative-loading-lifecycle-compaction-rollout/sprint-001-archive-split-and-bootstrap-truth-preservation/tasks/`

## 2. Findings

### 2.1 [P2] Project plan sprint status is stale

- 位置: `.repo-ai-governor/context/dev/project-079-normative-loading-lifecycle-compaction-rollout/plan.md`
- 问题描述: project plan 的 `## 2.1 sprint-001-archive-split-and-bootstrap-truth-preservation` 仍写成 `Status: planned`，但 `current-context.md` 与 sprint plan 已明确该 sprint 是 active。
- 影响: project-level readers 或依赖 project summary 的状态路由容易把 sprint-001 误判为未启动，形成 truthfulness drift。
- 建议: 将 project plan 中的 sprint-001 status 与已激活的 current-context / sprint plan 对齐，并顺手清理同一区块里已过时的 task-status 描述。

## 3. Notes

1. delegated reviewer 另行指出 `TK-757` 仍为 `planned`，这符合当前“CR 未收口前不进入 sprint closeout”的边界，不构成独立 actionable finding。
2. 本轮只涉及 docs/context/task-ledger surface；`pnpm run build` 当前不要求，待 sprint-002 引入脚本实现时再纳入 build evidence。

## 4. Verification

1. `node ./scripts/governance/check-normative-loading-manifest.js --mode block`（通过）
2. `node ./scripts/governance/check-docs-triad-sync.js`（通过）
3. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）

## 复核结论（2026-04-11）

- 整体结论：**认可**

### 逐条复核

1. `2.1 [P2] Project plan sprint status is stale`
   - 判定：**认可**
   - 证据：`.repo-ai-governor/context/dev/project-079-normative-loading-lifecycle-compaction-rollout/plan.md` 的 `## 2.1` 仍为 `Status: planned`，与已激活的 `current-context.md` / sprint plan 不一致。
   - 处理：已将 project plan 的 sprint-001 子段状态切换到 `active`，并同步修正同一节的 task matrix 状态真值。

### 验证命令

1. `node ./scripts/governance/check-normative-loading-manifest.js --mode block`（通过）
2. `node ./scripts/governance/check-docs-triad-sync.js`（通过）
3. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
5. `node ./scripts/governance/check-code-review-status-sync.js`（通过）

## 修复执行记录（2026-04-11）

1. `2.1 [P2] Project plan sprint status is stale`：已完成
   - 变更文件：`.repo-ai-governor/context/dev/project-079-normative-loading-lifecycle-compaction-rollout/plan.md`
   - 验证：`node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
   - 说明：已将 sprint-001 在 project plan 中的状态修正为 `active`，并同步更新相关 WBS status，消除 project/sprint/context truth drift。
2. `同窗 truthfulness tightening`：已完成
   - 变更文件：`.repo-ai-governor/normative_knowledge_sources/governance/normative-loading-manifest-lifecycle-governance.md`
   - 验证：`node ./scripts/governance/check-normative-loading-manifest.js --mode block`（通过）
   - 说明：将尚未落地的 archive-check / compaction 命令改写为 sprint-002 的 planned entrypoints，避免 sprint-001 文档对可执行入口作出过早承诺。
